import React, { useState } from "react";
import {
  Avatar,
  Divider,
  Layout,
  Menu,
  Button,
  Typography,
  Tooltip,
  Space,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  StarOutlined,
  SettingOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  MedicineBoxOutlined,
  BookOutlined,
  BankOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  ToolOutlined,
  AuditOutlined,
  SafetyOutlined,
  BugOutlined,
  DatabaseOutlined,
  EditOutlined,
  CheckCircleOutlined,
  SendOutlined,
  SwapOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../components/provider/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({
  collapsed,
  onCollapse,
  selectedMenu,
  onMenuSelect,
  userRole,
}) => {
  const { user, logoutAction } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Xử lý đăng xuất
  const handleLogout = () => {
    logoutAction();
    navigate("/login");
  };

  // Menu items cho từng role
  const getMenuItems = (role) => {
    switch (role) {
      case "Consultant":
        return [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to={"/consultant/dashboard"}>Tổng quan</Link>,
          },
          {
            key: "profile",
            icon: <UserOutlined />,
            label: (
              <Link to={"/consultant/dashboard/consultant-profile"}>
                Hồ sơ tư vấn viên
              </Link>
            ),
          },
          {
            key: "appointments",
            icon: <CalendarOutlined />,
            label: (
              <Link to={"/consultant/dashboard/consultant-schedule"}>
                Lịch hẹn tư vấn
              </Link>
            ),
          },
          {
            key: "questions",
            icon: <MessageOutlined />,
            label: (
              <Link to={"/consultant/dashboard/consultant-answer"}>
                Câu hỏi chuyên môn
              </Link>
            ),
          },
          {
            key: "reviews",
            icon: <StarOutlined />,
            label: (
              <Link to={"/consultant/dashboard/manage-feedback"}>
                Quản lý đánh giá
              </Link>
            ),
          },
          {
            key: "blog-management",
            icon: <EditOutlined />,
            label: (
              <Link to={"/consultant/dashboard/manage-blog"}>Quản lý Blog</Link>
            ),
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
            children: [
              {
                key: "account-settings",
                label: (
                  <Link to={"/consultant/dashboard/account-settings"}>
                    Cài đặt tài khoản
                  </Link>
                ),
              },
              {
                key: "profile",
                label: (
                  <Link to={"/consultant/dashboard/profile"}>
                    Hồ sơ cá nhân
                  </Link>
                ),
              },
            ],
          },
        ];

      case "Staff":
        return [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to={"/staff/dashboard"}>Tổng quan</Link>,
          },
          {
            key: "appointments",
            icon: <CalendarOutlined />,
            label: (
              <Link to={"/staff/dashboard/manage-booking-consultant"}>
                Quản lý lịch hẹn tư vấn
              </Link>
            ),
          },
          {
            key: "sti-test-management",
            icon: <MedicineBoxOutlined />,
            label: (
              <Link to={"/staff/dashboard/manage-booking-stis"}>
                Quản lý xét nghiệm STI
              </Link>
            ),
          },
          {
            key: "reports",
            icon: <FileTextOutlined />,
            label: <Link to={"/staff/dashboard/report"}>Báo cáo</Link>,
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
            children: [
              {
                key: "account-settings",
                label: (
                  <Link to={"/staff/dashboard/account-settings"}>
                    Cài đặt tài khoản
                  </Link>
                ),
              },
              {
                key: "profile",
                label: (
                  <Link to={"/staff/dashboard/profile"}>Hồ sơ cá nhân</Link>
                ),
              },
            ],
          },
        ];

      case "Manager":
        return [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to={"/manager/dashboard"}>Tổng quan</Link>,
          },
          {
            key: "staff-management",
            icon: <TeamOutlined />,
            label: (
              <Link to={"/manager/dashboard/manage-users"}>
                Quản lý nhân sự
              </Link>
            ),
          },
          {
            key: "service-management",
            icon: <MedicineBoxOutlined />,
            label: (
              <Link to={"/manager/dashboard/manage-service"}>
                Quản lý dịch vụ xét nghiệm
              </Link>
            ),
          },
          {
            key: "feedback-management",
            icon: <StarOutlined />,
            label: "Quản lý đánh giá",
            children: [
              {
                key: "manage-feedback-service",
                label: (
                  <Link to={"/manager/dashboard/manage-feedback-service"}>
                    Quản lý đánh giá dịch vụ
                  </Link>
                ),
              },
              {
                key: "manage-feedback-consultant",
                label: (
                  <Link to={"/manager/dashboard/manage-feedback-consultant"}>
                    Quản lý đánh giá tư vấn viên
                  </Link>
                ),
              },
            ],
          },
          {
            key: "blog-oversight",
            icon: <BookOutlined />,
            label: (
              <Link to={"/manager/dashboard/manage-blog"}>Giám sát Blog</Link>
            ),
          },
          {
            key: "booking-management",
            icon: <CalendarOutlined />,
            label: "Quản lý đặt lịch",
            children: [
              {
                key: "manage-booking-stis",
                label: (
                  <Link to={"/manager/dashboard/manage-booking-stis"}>
                    Quản lý đặt lịch xét nghiệm STI
                  </Link>
                ),
              },
              {
                key: "manage-booking-consultant",
                label: (
                  <Link to={"/manager/dashboard/manage-booking-consultant"}>
                    Quản lý đặt lịch tư vấn
                  </Link>
                ),
              },
            ],
          },
          {
            key: "reports",
            icon: <FileTextOutlined />,
            label: <Link to={"/manager/dashboard/report"}>Báo cáo</Link>,
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
            children: [
              {
                key: "account-settings",
                label: (
                  <Link to={"/manager/dashboard/account-settings"}>
                    Cài đặt tài khoản
                  </Link>
                ),
              },
              {
                key: "profile",
                label: (
                  <Link to={"/manager/dashboard/profile"}>Hồ sơ cá nhân</Link>
                ),
              },
            ],
          },
        ];

      case "Admin":
        return [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to={"/admin/dashboard"}>Tổng quan</Link>,
          },
          {
            key: "user-management",
            icon: <TeamOutlined />,
            label: (
              <Link to={"/admin/dashboard/manage-users"}>
                Quản lý người dùng
              </Link>
            ),
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
            children: [
              {
                key: "account-settings",
                label: (
                  <Link to={"/admin/dashboard/account-settings"}>
                    Cài đặt tài khoản
                  </Link>
                ),
              },
              {
                key: "profile",
                label: (
                  <Link to={"/admin/dashboard/profile"}>Hồ sơ cá nhân</Link>
                ),
              },
            ],
          },
        ];

      default:
        return [
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
          },
        ];
    }
  };

  const siderStyle = {
    overflow: "auto",
    height: "100vh",
    position: "sticky",
    insetInlineStart: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: "thin",
    scrollbarGutter: "able",
    msOverFlowStyle: "none",
    display: "flex",
    flexDirection: "column", // Thêm flexDirection để dễ dàng định vị phần footer
  };

  const menuItems = getMenuItems(userRole);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      width={280}
      style={siderStyle}
      className="shadow-sm"
      breakpoint="md"
      onBreakpoint={(broken) => setIsMobile(broken)}
    >
      {/* Header with User Info */}
      <div
        className={`p-6 border-b border-gray-200 transition-all duration-300 py-4`}
      >
        {collapsed ? (
          <div className="text-center">
            <Tooltip title={user?.fullName || "User"} placement="right">
              <Avatar
                src={user?.userImageUrl}
                icon={<UserOutlined />}
                size="large"
              />
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center">
            <Avatar
              src={user?.userImageUrl}
              icon={<UserOutlined />}
              size="large"
            />
            <div className="ml-3 overflow-hidden">
              <div className="font-bold text-gray-800 truncate">
                {user?.fullName || "User"}
              </div>
              <Text type="secondary" className="capitalize text-sm">
                {userRole?.toLowerCase()}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Menu - thêm style flex-grow để đẩy footer xuống dưới cùng */}
      <div style={{ flexGrow: 1, overflow: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onClick={({ key }) => onMenuSelect(key)}
          className="border-r-0"
          style={{
            fontSize: "14px",
          }}
        />
      </div>

      {/* User Profile & Logout button ở footer */}
      <div className="border-t border-gray-200 mt-auto">
        <div className={`p-4 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? (
            // Hiển thị khi sidebar thu gọn - chỉ hiển thị icon
            <Tooltip title="Đăng xuất" placement="right">
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="middle"
              />
            </Tooltip>
          ) : (
            // Hiển thị khi sidebar mở rộng - hiển thị đầy đủ nút
            <div>
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                block
              >
                Đăng xuất
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
