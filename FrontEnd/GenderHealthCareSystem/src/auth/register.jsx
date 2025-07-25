import { Form, Input, Button, Divider, Select, DatePicker , message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import imgLogin from "../assets/login.png";
import { useNavigate } from "react-router-dom";
import { useState} from "react";
import { useAuth } from "../components/provider/AuthProvider";

const Register = () => {
  const { Option } = Select;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleConfirmPassword = (value) => {
    const password = form.getFieldValue("password");
    if (value && value !== password) {
      return Promise.reject("Mật khẩu xác nhận không khớp!");
    }
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await auth.registerAction(values);
      if (response.success) {
        message.success(response.message);
        navigate("/login");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      message.error("Đăng ký không thành công, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${imgLogin})` }}
    >
      <div className="fixed top-6 left-6">
        <Button
          type="primary"
          shape="round"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/home")}
          className="flex items-center shadow-md"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "transparent",
            color: "#0099CF",
          }}
        >
          Quay lại trang chủ
        </Button>
      </div>

      {/* Form đăng ký */}
      <div className="mt-16 mb-12 bg-opacity-95 mx-auto w-full md:max-w-lg overflow-hidden rounded-xl bg-white shadow-lg backdrop-blur-sm max-w-md">
        <div className="bg-[#0099CF] px-8 py-6">
          <h2 className="text-center text-2xl font-bold text-white">
            Đăng ký tài khoản
          </h2>
        </div>

        <div className="p-8">
          <Form 
            form={form}
            onFinish={onFinish}
          layout="vertical" size="large">
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="fullName"
              label="Họ Tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="0123456789" />
            </Form.Item>
            <div className="flex justify-between gap-4">
              <Form.Item
                className="w-1/2"
                name="birthDate"
                label="Ngày sinh"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày sinh!" },
                ]}
              >
                <DatePicker
                  className="w-full"
                  placeholder="Chọn ngày sinh"
                  format="DD/MM/YYYY"
                  suffixIcon={<CalendarOutlined className="text-gray-400" />}
                  disabledDate={(current) =>
                    current && current >= new Date()
                  }
                />
              </Form.Item>
              <Form.Item
                className="w-1/2"
                name="gender"
                label="Giới tính"
                rules={[
                  { required: true, message: "Vui lòng chọn giới tính!" },
                ]}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="Male">Nam</Option>
                  <Option value="Female">Nữ</Option>
                  <Option value="Other">Khác</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Vui lòng nhập email!" }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="example@gmail.com"
              />
            </Form.Item>

            <Form.Item name="address" label="Địa chỉ">
              <Input
                prefix={<HomeOutlined />}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item
              dependencies={["password"]}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return handleConfirmPassword(value);
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
              />
            </Form.Item>

            <div className="mt-4">
              <Button
                loading={loading}
                type="primary"
                htmlType="submit"
                className="h-12 w-full rounded-md bg-[#7AC943] font-bold text-white hover:bg-[#6BB234]"
              >
                ĐĂNG KÝ
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              Đã có tài khoản?
              <a
                onClick={() => navigate("/login")}
                className="ml-1 font-medium text-[#7AC943] hover:text-[#6BB234] cursor-pointer"
              >
                Đăng nhập
              </a>
            </div>

            <Divider plain className="text-gray-400">
              Hoặc
            </Divider>

            <div className="flex justify-center gap-4">
              <Button
                icon={<GoogleOutlined />}
                className="flex-1 border border-gray-300 hover:border-gray-400"
              >
                Đăng nhập với Google
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
