import React, { useState, useEffect } from "react";
import {
  Button,
  Steps,
  Form,
  message,
  Modal,
  Result,
  Typography,
  Spin,
} from "antd";
import { MedicineBoxOutlined, CheckOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/provider/AuthProvider";
import BookingForm from "./BookingForm";
import ConfirmBooking from "./ConfirmBooking";
import dayjs from "dayjs";
import {
  paymentVNPayAPI,
  paymentPayPalAPI,
} from "../../components/api/Payment.api";
import { convertVndToUsd, formatPrice } from "../../components/utils/format";
import { bookStisAPI } from "../../components/api/BookingTesting.api";
import {
  getServiceCombosAPI,
  getServiceSingleAPI,
} from "../../components/api/ServiceTesting.api";

const { Title, Text } = Typography;

const STIBooking = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [testingPackages, setTestingPackages] = useState([]);
  const [singlePackages, setSinglePackages] = useState([]);
  const [cashPayment, setCashPayment] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await getServiceCombosAPI();
        const packages = response.data.data.map((pkg) => ({
          ...pkg,
          tests: pkg.tests.split(", "),
        }));
        setTestingPackages(packages);
        const res = await getServiceSingleAPI();
        const singleTests = res.data.data.map((pkg) => ({
          ...pkg,
          tests: [pkg.tests],
        }));
        setSinglePackages(singleTests);
      } catch (error) {
        console.error("Error fetching testing packages:", error);
        message.error("Không thể tải gói xét nghiệm. Vui lòng thử lại sau.");
      }
    };
    fetchPackages();
  }, []);

  // Thêm các state để lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    package: null,
    appointmentDate: null,
    appointmentTime: null,
    paymentMethod: null,
    notes: "",
  });

  // Các bước đặt lịch
  const steps = [
    {
      title: "Chọn gói & thông tin",
      icon: <MedicineBoxOutlined />,
    },
    {
      title: "Xác nhận & thanh toán",
      icon: <CheckOutlined />,
    },
  ];

  // Thông tin khách hàng
  const userInfo = {
    id: user?.id,
    fullName: user?.fullName,
    phone: user?.phone,
    email: user?.email,
    birthDate: dayjs(user.birthDate),
    gender: user?.gender,
  };

  // Khung giờ làm việc
  const workingHours = [
    { value: "08:00", label: "08:00 - 09:00" , disabled: false },
    { value: "09:00", label: "09:00 - 10:00" , disabled: false },
    { value: "10:00", label: "10:00 - 11:00" , disabled: false },
    { value: "13:30", label: "13:30 - 14:30" , disabled: false },
    { value: "14:30", label: "14:30 - 15:30" , disabled: false },
    { value: "15:30", label: "15:30 - 16:30" , disabled: false },
    { value: "16:30", label: "16:30 - 17:30" , disabled: false },
  ];

  // Disable các ngày trong quá khứ
  const disabledDate = (current) => {
    // Không cho chọn ngày trong quá khứ và ngày hiện tại
    if (current && current < dayjs().endOf("day")) {
      return true;
    }
  };

  // Xử lý chọn gói dịch vụ
  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    form.setFieldsValue({
      package: pkg.serviceId,
      packageName: pkg.serviceName,
      packagePrice: pkg.price,
      packageDetails: JSON.stringify(pkg),
    });
    setTotalPrice(pkg.price * (1 - pkg.discount / 100));
  };

  // Chuyển sang bước tiếp theo
  const nextStep = () => {
    form.setFieldsValue({
      package: selectedPackage?.serviceId,
      packageDetails: JSON.stringify(selectedPackage),
    });

    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }).catch((errorInfo) => {
      console.error("Validation failed:", errorInfo);
      message.error("Vui lòng kiểm tra lại thông tin đã nhập.");
    });
  };

  // Quay lại bước trước
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Xử lý submit form - Đặt lịch
  const handleBooking = async () => {
    try {
      // Kết hợp dữ liệu đã lưu với dữ liệu hiện tại
      const currentValues = form.getFieldsValue(true);
      const allValues = { ...formData, ...currentValues };

      setIsSubmitting(true);

      // Data chuẩn bị gửi cho API
      const bookingData = {
        packageId: allValues.package,
        appointmentDate: allValues.appointmentDate.format("YYYY-MM-DD"),
        appointmentTime: allValues.appointmentTime,
        paymentMethod: allValues.paymentMethod === "online" ? allValues.onlinePaymentMethod : allValues.paymentMethod,
        notes: allValues.notes,
      };
      const response = await bookStisAPI(bookingData);

      if (allValues.paymentMethod === "cash") {
        setIsConfirmModalOpen(false);
        setCashPayment(true);
      } else {
        await handlePayment(
          response.data.data.bookingId,
          bookingData.paymentMethod
        );
      }
    } catch (error) {
      console.error("Error during booking:", error);
      message.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi đặt lịch, vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (bookingID, paymentMethod) => {
    try {
      const usd = await convertVndToUsd(totalPrice);
      const response =
        paymentMethod === "vnpay"
          ? await paymentVNPayAPI(
              totalPrice,
              `${bookingID} Đặt lịch xét nghiệm STI`,
              bookingID
            )
          : await paymentPayPalAPI(usd, bookingID);

      localStorage.setItem("bookingID", bookingID);
      localStorage.setItem("amount", totalPrice);
      localStorage.setItem("orderInfo", `${bookingID} Đặt lịch xét nghiệm STI`);

      setIsConfirmModalOpen(false);
      message.success("Đang chuyển hướng đến trang thanh toán ...");

      setTimeout(() => {
        window.location.href = response.data;
      }, 500);
    } catch (error) {
      console.error(error.response.data.message);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi thanh toán"
      );
    }
  };

  // Xử lý hủy xác nhận
  const handleCancel = () => {
    setIsConfirmModalOpen(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BookingForm
            form={form}
            comboPackages={testingPackages}
            singlePackages={singlePackages}
            workingHours={workingHours}
            disabledDate={disabledDate}
            handlePackageSelect={handlePackageSelect}
            formatPrice={formatPrice}
          />
        );
      case 1:
        return (
          <ConfirmBooking
            form={form}
            userInfo={userInfo}
            selectedPackage={selectedPackage}
            totalPrice={totalPrice}
            formatPrice={formatPrice}
          />
        );
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between pt-6 border-t">
        <Button onClick={prevStep} disabled={currentStep === 0} size="large">
          Quay lại
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="primary" onClick={nextStep} size="large">
            Tiếp tục
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => setIsConfirmModalOpen(true)}
            size="large"
            className="bg-green-600 hover:bg-green-700"
          >
            Xác nhận đặt lịch và thanh toán
          </Button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (bookingSuccess) {
      navigate("/booking-result");
    }
  }, [bookingSuccess]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <Title level={2} className="mb-2">
          Đặt lịch xét nghiệm STI
        </Title>
        <Text className="text-gray-500">
          Giữ gìn sức khỏe tình dục bằng việc kiểm tra định kỳ các bệnh lây
          nhiễm qua đường tình dục
        </Text>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        <Steps
          current={currentStep}
          items={steps.map((step) => ({
            title: step.title,
            icon: step.icon,
          }))}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <Form
          form={form}
          layout="vertical"
          size="large"
          initialValues={{
            fullName: user?.fullName || "",
            email: user?.email || "",
            phone: user?.phone || "",
            gender: user?.gender || "male",
            birthDate: user?.birthDate ? dayjs(user.birthDate) : null,
          }}
        >
          {renderStepContent()}
          {renderNavigationButtons()}
        </Form>
      </div>

      {/* Modal xác nhận đặt lịch */}
      <Modal
        title={
          <div className="text-xl font-semibold">
            Xác nhận đặt lịch xét nghiệm
          </div>
        }
        open={isConfirmModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
      >
        <div className="py-2">
          <p className="mb-4">
            Bạn xác nhận đặt lịch xét nghiệm STI với thông tin đã cung cấp?
          </p>

          <div className="flex items-center p-3 bg-blue-50 rounded mb-6">
            <div className="mr-3 text-blue-500">
              <CheckOutlined className="text-lg" />
            </div>
            <div>
              <p className="font-medium mb-0">
                Phương thức thanh toán:{" "}
                <span className="font-bold">
                  {form.getFieldValue("paymentMethod") === "cash"
                    ? "Tiền mặt tại cơ sở"
                    : "Thanh toán trực tuyến"}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4 flex justify-end gap-3">
            <Button size="large" onClick={handleCancel} disabled={isSubmitting}>
              Quay lại chỉnh sửa
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleBooking}
              loading={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </div>
        </div>
      </Modal>

      {paymentUrl && (
        <Modal
          title="Đang chuyển hướng đến cổng thanh toán"
          open={paymentUrl !== ""}
          footer={null}
          closable={false}
          centered
        >
          <div className="text-center py-6">
            <Spin size="large" />
            <div className="mt-4">
              <p>Đang chuyển hướng đến cổng thanh toán...</p>
              <p className="text-gray-500 text-sm mt-2">
                Vui lòng không đóng trình duyệt trong quá trình thanh toán
              </p>
            </div>
          </div>
        </Modal>
      )}

      {cashPayment && (
        <Modal open={cashPayment} footer={null} closable={false} centered>
          <Result
            status="success"
            title="Đặt lịch thành công!"
            subTitle="Cảm ơn bạn đã đặt lịch xét nghiệm STI. Chúng tôi sẽ liên hệ với bạn sớm nhất."
            extra={[
              <Button
                key="history"
                onClick={() => navigate("/user/history-testing")}
              >
                Xem lịch sử xét nghiệm
              </Button>,
              <Button type="primary" key="home" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>,
            ]}
          />
        </Modal>
      )}
    </div>
  );
};

export default STIBooking;
