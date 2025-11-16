import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllConsultants } from "../../components/api/Consultant.api";
import { 
  Modal, Form, Input, DatePicker, Select, Radio, Button, 
  Avatar, Card, Space, Typography 
} from "antd";
import { 
  BankOutlined, 
  CreditCardOutlined, 
  CheckCircleFilled 
} from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export default function ConsultationBooking() {
  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await getAllConsultants();
        const mappedExperts = data.map((e, index) => ({
          ...e,
          id: e.id ?? e.consultantId ?? e.userId ?? index + 1,
        }));
        console.log("Fetched consultants:", mappedExperts);
        setExperts(mappedExperts);
        localStorage.setItem("consultants", JSON.stringify(mappedExperts));
      } catch (err) {
        console.error("Failed to fetch consultants", err);
      }
    };
    fetchExperts();
  }, []);

  const handleSelect = (expert) => {
    setSelectedExpert(expert);
    form.setFieldsValue({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || "",
    });
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedExpert(null);
    form.resetFields();
  };

  const handleSubmitBooking = (values) => {
    const normalizedMethod = values.paymentMethod.toLowerCase() === "bank" ? "VNPAY" : "PAYPAL";

    const bookingData = {
      name: values.fullName,
      phone: values.phone,
      email: values.email,
      date: values.date.format("YYYY-MM-DD"),
      timeSlot: values.timeSlot,
      notes: values.notes || "",
      paymentMethod: normalizedMethod,
      expertName: selectedExpert.fullName,
      consultantId: selectedExpert.consultantId || selectedExpert.id,
    };

    navigate("/confirm-consultant", { state: bookingData });
  };

  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "13:30 - 14:30",
    "15:00 - 16:00",
    "16:30 - 17:30"
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-[#E6F7FB] p-6 lg:p-8 rounded-xl shadow mb-10 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-[#0077aa] mb-2">
          Dịch vụ tư vấn sức khỏe cá nhân
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Bạn đang gặp khó khăn hay cần người lắng nghe? Hãy chọn chuyên gia phù hợp để được tư vấn tận tâm và bảo mật.
        </p>
      </div>

      <h2 className="text-3xl font-bold text-center text-[#0099CF] mb-10">
        Đặt lịch tư vấn sức khỏe giới tính
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {experts.length === 0 ? (
          <p className="text-center col-span-full">Đang tải danh sách tư vấn viên...</p>
        ) : (
          experts.map((expert, index) => (
            <div key={index} className="bg-white p-4 shadow rounded-xl">
              {expert.userImageUrl ? (
                <img
                  src={expert.userImageUrl}
                  alt={expert.fullName}
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 mx-auto rounded-full bg-[#f0f0f0] flex items-center justify-center text-xl font-bold text-[#0099CF]">
                  {expert.fullName?.charAt(0) || "?"}
                </div>
              )}
              <h3 className="text-center mt-4 font-semibold">{expert.fullName}</h3>
              <p className="text-center text-sm text-gray-500">{expert.jobTitle}</p>
              <p
                className="text-[#0099CF] hover:text-[#0077aa] text-sm underline text-center cursor-pointer mt-3"
                onClick={() => navigate(`/expert/${expert.id}`, { state: expert })}
              >
                Xem thông tin chi tiết
              </p>

              <button
                onClick={() => handleSelect(expert)}
                className="mt-4 w-full bg-[#0099CF] hover:bg-[#0077aa] text-white font-semibold py-2 rounded-lg"
              >
                Tư vấn ngay
              </button>
            </div>
          ))
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            {selectedExpert && (
              <>
                <Avatar 
                  size={48}
                  src={selectedExpert?.userImageUrl} 
                  style={{ backgroundColor: '#0099CF' }}
                >
                  {selectedExpert?.fullName?.charAt(0) || "?"}
                </Avatar>
                <div>
                  <div className="text-lg font-medium">{selectedExpert?.fullName}</div>
                  <div className="text-sm text-gray-500">{selectedExpert?.jobTitle}</div>
                </div>
              </>
            )}
          </div>
        }
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        centered
        style={{ top: 20 }} 
      >
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-4">Đặt lịch tư vấn</h3>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitBooking}
            initialValues={{
              fullName: user?.fullName || "",
              phone: user?.phone || "",
              email: user?.email || "",
              paymentMethod: ""  
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ tên của bạn" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: "email", message: "Email không hợp lệ" }
              ]}
            >
              <Input placeholder="Nhập email (không bắt buộc)" />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="date"
                label="Ngày tư vấn"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn ngày tư vấn"
                  format={"DD/MM/YYYY"}
                  disabledDate={(current) => {
                    return current && current.valueOf() < Date.now() - 24 * 60 * 60 * 1000;
                  }}
                />
              </Form.Item>

              <Form.Item
                name="timeSlot"
                label="Khung giờ"
                rules={[{ required: true, message: "Vui lòng chọn khung giờ" }]}
              >
                <Select placeholder="Chọn khung giờ tư vấn">
                  {timeSlots.map(slot => (
                    <Option key={slot} value={slot}>{slot}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item 
              name="paymentMethod"
              label="Phương thức thanh toán"
              rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán" }]}
            >
              <Radio.Group className="w-full">
                <Space direction="vertical" className="w-full">
                  <Radio value="bank" className="w-full">
                    <Card 
                      className={`w-full border ${form.getFieldValue('paymentMethod') === 'vnpay' ? 'border-blue-500' : 'border-gray-200'}`}
                      bodyStyle={{ padding: '12px' }}
                      hoverable
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <img 
                            src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" 
                            alt="VNPAY" 
                            className="h-10 w-auto"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">VNPAY</div>
                          <Text type="secondary" className="text-xs">
                            Thẻ ATM / Internet Banking / Visa / MasterCard / QR Code
                          </Text>
                        </div>
                        {form.getFieldValue('paymentMethod') === 'vnpay' && (
                          <CheckCircleFilled className="text-blue-500 text-lg" />
                        )}
                      </div>
                    </Card>
                  </Radio>
                  
                  <Radio value="paypal" className="w-full">
                    <Card 
                      className={`w-full border ${form.getFieldValue('paymentMethod') === 'paypal' ? 'border-blue-500' : 'border-gray-200'}`}
                      bodyStyle={{ padding: '12px' }}
                      hoverable
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <img 
                            src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                            alt="PayPal" 
                            className="h-8 w-auto"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">PayPal</div>
                          <Text type="secondary" className="text-xs">
                            Thanh toán an toàn với tài khoản PayPal hoặc thẻ quốc tế
                          </Text>
                        </div>
                        {form.getFieldValue('paymentMethod') === 'paypal' && (
                          <CheckCircleFilled className="text-blue-500 text-lg" />
                        )}
                      </div>
                    </Card>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="notes"
              label="Ghi chú"
            >
              <TextArea 
                rows={2}
                placeholder="Nhập ghi chú (nếu có)"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex justify-end gap-3">
                <Button onClick={handleCancel}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0099CF' }}>
                  Xác nhận đặt lịch
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
