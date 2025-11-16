import React, { useState, useEffect, use } from "react";
import {
  Table,
  Space,
  Button,
  Popconfirm,
  message,
  Input,
  Tag,
  Typography,
  Tooltip,
  Card,
  Avatar,
} from "antd";
import { formatDateTime, getTagColor } from "../../../components/utils/format";
import BlogModal from "../../components/modal/BlogModal";
import ViewBlogModal from "../../components/modal/ViewBlogModal";
import { useAuth } from "../../../components/provider/AuthProvider";
import {
  approveBlogAPI,
  deleteBlogAPI,
  rejectBlogAPI,
  viewAllBlogsAPI,
  viewMyBlogsAPI,
} from "../../../components/api/Blog.api";
import { useSearchParams, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const ManageMyBlog = () => {
  const { user } = useAuth(); // Lấy thông tin user hiện tại
  const isConsultant = user?.role === "Consultant";

  const [blogList, setBlogList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewBlogModalVisible, setViewBlogModalVisible] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Danh sách tags
  const tagOptions = [
    { value: "Sức khỏe", label: "Sức khỏe", color: "green" },
    { value: "Giới tính", label: "Giới tính", color: "blue" },
    { value: "Tư vấn", label: "Tư vấn", color: "purple" },
    { value: "STIs", label: "STIs", color: "red" },
    { value: "Kinh nguyệt", label: "Kinh nguyệt", color: "pink" },
  ];

  // Cấu hình trạng thái bài viết
  const statusConfig = {
    PENDING: {
      status: "pending",
      text: "Chờ duyệt",
      color: "#1890ff",
      badgeColor: "blue",
      description: "Bài viết đang chờ phê duyệt từ quản trị viên",
    },
    PUBLISHED: {
      status: "success",
      text: "Đã duyệt",
      color: "#52c41a",
      badgeColor: "green",
      description: "Bài viết đã được phê duyệt và hiển thị công khai",
    },
    Rejected: {
      status: "error",
      text: "Bị từ chối",
      color: "#f5222d",
      badgeColor: "red",
      description: "Bài viết đã bị từ chối",
    },
    DELETED: {
      status: "deleted",
      text: "Đã xóa",
      color: "#f5222d",
      badgeColor: "red",
      description: "Bài viết đã bị xóa và không còn hiển thị",
    },

  };

  // Danh sách status options để lọc
  const statusOptions = [
    { value: "PENDING", label: "Chờ duyệt", color: "blue" },
    { value: "PUBLISHED", label: "Đã duyệt", color: "green" },
    { value: "Rejected", label: "Bị từ chối", color: "red" },
  ];

  // Fetch danh sách blog
  useEffect(() => {
    !isInitialLoad && fetchBlogList();
  }, [
    pagination.current,
    searchText,
    selectedTags,
    statusFilter,
    isInitialLoad,
  ]);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    navigate(window.location.pathname, { replace: true });
    setIsInitialLoad(false);
  }, []);

  const fetchBlogList = async () => {
    setLoading(true);
    try {
      const response = isConsultant
        ? await viewMyBlogsAPI({
            page: pagination.current - 1,
            size: pagination.pageSize,
            title: searchText,
            tag: selectedTags.join(", "),
            status: statusFilter,
          })
        : await viewAllBlogsAPI({
            page: pagination.current - 1,
            size: pagination.pageSize,
            title: searchText,
            tag: selectedTags.join(", "),
            status: statusFilter,
          });
      if (response && response.data) {
        setTimeout(() => {
          const formattedPosts = response.data.data.content.map((post) => {
            // Chuyển đổi trường tags từ chuỗi thành mảng objects
            const tagArray = post.tags
              ? post.tags.split(",").map((tag) => ({
                  text: tag.trim(),
                  color: getTagColor(tag.trim()), // Hàm helper để gán màu cho tag
                }))
              : [];

            return {
              ...post,
              tags: tagArray,
              // Đặt URL hình ảnh mặc định nếu thumbnailUrl không hợp lệ
              thumbnailUrl:
                post.thumbnailUrl && !post.thumbnailUrl.includes("example.com")
                  ? post.thumbnailUrl
                  : "https://placehold.co/600x400/0099CF/white?text=Gender+Healthcare",
            };
          });
          setBlogList(formattedPosts);
          setPagination({
            ...pagination,
            total: response.data.data.totalElements,
          });
          setLoading(false);
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching blog list:", error);
      message.error("Không thể tải danh sách bài viết");
      setLoading(false);
    }
  };

  // Mở modal xem chi tiết blog
  const handleViewBlog = (blog) => {
    if (blog) {
      setSelectedBlog(blog);
      setViewBlogModalVisible(true);
    } else {
      message.error("Không tìm thấy thông tin bài viết");
    }
  };

  // Mở modal thêm blog mới
  const handleAddNew = () => {
    setCurrentBlog(null);
    setModalVisible(true);
  };

  // Mở modal chỉnh sửa blog
  const handleEdit = (blog) => {
    setCurrentBlog(blog);
    setModalVisible(true);
  };

  // Xử lý khi modal thành công (thêm hoặc cập nhật)
  const handleModalSuccess = () => {
    setModalVisible(false);
    fetchBlogList();
  };

  // Xử lý xóa blog
  const handleDelete = async (blogId) => {
    try {
      setLoading(true);
      await deleteBlogAPI(blogId);
      setTimeout(() => {
        fetchBlogList();
        message.success("Xóa bài viết thành công!");
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error deleting blog:", error);
      message.error("Xóa bài viết thất bại");
      setLoading(false);
    }
  };

  // Hàm xử lý duyệt bài viết
  const handleApprove = async (blogId) => {
    try {
      setLoading(true);
      await approveBlogAPI(blogId);
      setTimeout(() => {
        fetchBlogList();
        message.success("Duyệt bài viết thành công!");
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error approving blog:", error);
      message.error("Duyệt bài viết thất bại");
      setLoading(false);
    }
  };

  // Hàm xử lý từ chối bài viết
  const handleReject = async (blogId) => {
    try {
      setLoading(true);
      await rejectBlogAPI(blogId);
      setTimeout(() => {
        fetchBlogList();
        message.success("Đã từ chối bài viết");
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error rejecting blog:", error);
      message.error("Từ chối bài viết thất bại");
      setLoading(false);
    }
  };

  // Xử lý phân trang
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Xử lý tìm kiếm
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  // Xử lý lọc theo tag
  const handleTagFilter = (tag) => {
    const nextSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(nextSelectedTags);
    setPagination({ ...pagination, current: 1 });
  };

  // Xử lý lọc theo trạng thái - chỉ cho phép chọn 1
  const handleStatusFilter = (status) => {
    if (statusFilter === status) {
      setStatusFilter("");
      return;
    } else {
      setStatusFilter(status);
    }
    setPagination({ ...pagination, current: 1 });
  };

  // Cột của bảng với các thao tác đã được thay đổi từ icon sang text
  const columns = [
    {
      title: "ID",
      dataIndex: "postId",
      key: "postId",
    },
    ...(!isConsultant
      ? [
          {
            title: "Người đăng",
            dataIndex: "consultantName",
            key: "consultantName",
            render: (text, record) => (
              <Tooltip title={text}>
                <Avatar
                  src={
                    record.consultantImageUrl ||
                    "https://placehold.co/40x40/0099CF/white?text=Consultant"
                  }
                  size="medium"
                  className="mr-2"
                />
                <span className="font-medium ml-2">{text}</span>
              </Tooltip>
            ),
          },
        ]
      : []),
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 300,
      render: (text, record) => (
        <div className="font-medium text-blue-500">{text}</div>
      ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: 200,
      render: (tags) => (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Tag
              color={tag.color}
              key={tag.text}
              className="cursor-pointer"
              onClick={() => handleTagFilter(tag.text)}
            >
              {tag.text}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const config = statusConfig[status];

        return (
          <div className="flex flex-wrap gap-2">
            <div
              className="inline-flex items-center"
              title={config.description}
            >
              <span style={{ color: config.color }}>{config.text}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Ngày đăng",
      dataIndex: "publishedAt",
      key: "publishedAt",
      render: (date) => formatDateTime(date),
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
    },
    {
      title: "Lượt thích",
      dataIndex: "likeCount",
      key: "likeCount",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          {/* Thay thế icon bằng text */}
          <Button size="small" onClick={() => handleViewBlog(record)}>
            Xem
          </Button>

          {/* Chỉ hiển thị chức năng duyệt/từ chối cho người không phải Consultant */}
          {!isConsultant && record.status === "PENDING" && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleApprove(record.postId)}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleReject(record.postId)}
              >
                Từ chối
              </Button>
            </>
          )}

          {/* Chỉ hiển thị chức năng sửa/xóa cho Consultant */}
          {isConsultant && (
            <>
              <Button size="small" onClick={() => handleEdit(record)}>
                Sửa
              </Button>
              <Popconfirm
                title="Xóa bài viết"
                description="Bạn có chắc chắn muốn xóa bài viết này?"
                onConfirm={() => handleDelete(record.postId)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger size="small">
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title level={4} className="mb-1">
              Quản lý bài viết {isConsultant ? "của tôi" : ""}
            </Title>
            <Text type="secondary">
              {isConsultant
                ? "Thêm và quản lý nội dung blog của bạn"
                : "Quản lý và phê duyệt nội dung blog"}
            </Text>
          </div>

          {/* Chỉ hiển thị nút "Tạo bài viết mới" cho Consultant - đã bỏ icon */}
          {isConsultant && (
            <Button type="primary" onClick={handleAddNew}>
              Tạo bài viết mới
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <Search
            placeholder="Tìm kiếm theo tiêu đề"
            allowClear
            enterButton="Tìm kiếm" // Đã thay icon bằng text
            onSearch={handleSearch}
            style={{ maxWidth: 400 }}
          />

          <div className="flex flex-col gap-4 sm:items-end">
            {/* Lọc theo trạng thái */}
            <div className="flex flex-wrap gap-2 items-center">
              <Text strong>Trạng thái:</Text>
              {statusOptions.map((status) => (
                <Tag
                  color={
                    statusFilter === status.value ? status.color : "default"
                  }
                  key={status.value}
                  className="cursor-pointer"
                  onClick={() => handleStatusFilter(status.value)}
                >
                  {status.label}
                </Tag>
              ))}
              {statusFilter && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setStatusFilter("")}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {/* Lọc theo tag */}
            <div className="flex flex-wrap gap-2 items-center">
              <Text strong>Chủ đề:</Text>
              {tagOptions.map((tag) => (
                <Tag
                  color={
                    selectedTags.includes(tag.value) ? tag.color : "default"
                  }
                  key={tag.value}
                  className="cursor-pointer"
                  onClick={() => handleTagFilter(tag.value)}
                >
                  {tag.label}
                </Tag>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSelectedTags([])}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={blogList}
          rowKey="postId"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal đa năng cho cả thêm và chỉnh sửa blog - chỉ hiển thị cho Consultant */}
      {isConsultant && (
        <BlogModal
          visible={modalVisible}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSuccess={handleModalSuccess}
          blog={currentBlog}
        />
      )}

      {/* Modal xem chi tiết blog */}
      <ViewBlogModal
        visible={viewBlogModalVisible}
        open={viewBlogModalVisible}
        onClose={() => setViewBlogModalVisible(false)}
        blog={selectedBlog}
      />
    </div>
  );
};

export default ManageMyBlog;
