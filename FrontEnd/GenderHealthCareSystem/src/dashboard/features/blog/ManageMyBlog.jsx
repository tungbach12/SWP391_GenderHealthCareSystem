import React, { useState, useEffect } from "react";
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
  Badge,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "../../../components/utils/formatTime";
import BlogModal from "../../components/modal/BlogModal";
import { viewMyBlogsAPI } from "../../../components/utils/api";
import { deleteBlogAPI } from "../../../components/utils/api";

const { Title, Text } = Typography;
const { Search } = Input;

const ManageMyBlog = () => {
  const [blogList, setBlogList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);

  // Danh sách tags
  const tagOptions = [
    { value: "Sức khỏe", label: "Sức khỏe", color: "green" },
    { value: "Giới tính", label: "Giới tính", color: "blue" },
    { value: "Tư vấn", label: "Tư vấn", color: "purple" },
    { value: "STIs", label: "STIs", color: "red" },
    { value: "Kinh nguyệt", label: "Kinh nguyệt", color: "pink" },
  ];

  // Cấu hình trạng thái bài viết - Đã bỏ trạng thái "draft"
  const statusConfig = {
    pending: {
      status: "processing",
      text: "Chờ duyệt",
      color: "#1890ff",
      badgeColor: "blue",
      description: "Bài viết đang chờ phê duyệt từ quản trị viên",
    },
    approved: {
      status: "success",
      text: "Đã duyệt",
      color: "#52c41a",
      badgeColor: "green",
      description: "Bài viết đã được phê duyệt và hiển thị công khai",
    },
    rejected: {
      status: "error",
      text: "Bị từ chối",
      color: "#f5222d",
      badgeColor: "red",
      description: "Bài viết đã bị từ chối, vui lòng chỉnh sửa nội dung",
    },
  };

  // Danh sách status options để lọc - Đã bỏ "draft"
  const statusOptions = [
    { value: "pending", label: "Chờ duyệt", color: "blue" },
    { value: "approved", label: "Đã duyệt", color: "green" },
    { value: "rejected", label: "Bị từ chối", color: "red" },
  ];

  // Lấy màu tương ứng cho tag
  const getTagColor = (tagName) => {
    const tag = tagOptions.find((t) => t.value === tagName);
    return tag ? tag.color : "default";
  };

  // Fetch danh sách blog
  useEffect(() => {
    fetchBlogList();
  }, [pagination.current, searchText, selectedTags, statusFilter]);

  const fetchBlogList = async () => {
    setLoading(true);
    try {
      const response = await viewMyBlogsAPI({
        page: pagination.current - 1,
        size: pagination.pageSize,
        title: searchText,
        tag: selectedTags.join(", "),
        //status: statusFilter.join(', ')
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
          console.log(">>> Formatted Posts:", formattedPosts);
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

  // Xử lý lọc theo trạng thái
  const handleStatusFilter = (status) => {
    const nextStatusFilter = statusFilter.includes(status)
      ? statusFilter.filter((s) => s !== status)
      : [...statusFilter, status];

    setStatusFilter(nextStatusFilter);
    setPagination({ ...pagination, current: 1 });
  };

  // Xử lý xem lý do từ chối
  const handleViewRejectionReason = (reason) => {
    message.info({
      content: (
        <div>
          <strong>Lý do từ chối:</strong>
          <p>{reason || "Không có lý do cụ thể được cung cấp."}</p>
        </div>
      ),
      duration: 5,
    });
  };

  // Cột của bảng
  const columns = [
    {
      title: "ID",
      dataIndex: "postId",
      key: "postId",
      width: 60,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: "300px",
      render: (text, record) => (
        <div className="">
          <Tooltip title={text}>
            {" "}
            {/* Tooltip hiển thị toàn bộ tiêu đề khi hover */}
            <a
              href={`/blog/${record.postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-blue-500"
            >
              {text}
            </a>
          </Tooltip>
        </div>
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
      title: "Ngày đăng",
      dataIndex: "publishedAt",
      key: "publishedAt",
      width: 160,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt),
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 100,
      sorter: (a, b) => a.views - b.views,
    },
    // {
    //   title: "Trạng thái",
    //   dataIndex: "status",
    //   key: "status",
    //   width: 150,
    //   render: (status, record) => {
    //     const config = statusConfig[status];

    //     return (
    //       <div className="flex items-center flex-wrap">
    //         <Tooltip title={config.description}>
    //           <Badge
    //             status={config.status}
    //             text={
    //               <span style={{ color: config.color }}>{config.text}</span>
    //             }
    //           />
    //         </Tooltip>

    //         {/* Hiện nút xem lý do nếu bài viết bị từ chối */}
    //         {status === "rejected" && record.rejectionReason && (
    //           <Button
    //             type="link"
    //             size="small"
    //             className="ml-2 p-0"
    //             onClick={() =>
    //               handleViewRejectionReason(record.rejectionReason)
    //             }
    //           >
    //             Xem lý do
    //           </Button>
    //         )}
    //       </div>
    //     );
    //   },
    //   filters: [
    //     { text: "Chờ duyệt", value: "pending" },
    //     { text: "Đã duyệt", value: "approved" },
    //     { text: "Bị từ chối", value: "rejected" },
    //   ],
    //   onFilter: (value, record) => record.status === value,
    //   sorter: (a, b) => {
    //     // Thứ tự ưu tiên: Chờ duyệt -> Bị từ chối -> Đã duyệt
    //     const order = { pending: 0, rejected: 1, approved: 2 };
    //     return order[a.status] - order[b.status];
    //   },
    // },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === "approved" && (
            <Tooltip title="Xem bài viết">
              <Button
                icon={<EyeOutlined />}
                href={`/blog/${record.id}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            </Tooltip>
          )}
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bài viết"
            description="Bạn có chắc chắn muốn xóa bài viết này?"
            onConfirm={() => handleDelete(record.postId)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
              Quản lý bài viết của tôi
            </Title>
            <Text type="secondary">Thêm và quản lý nội dung blog của bạn</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            Tạo bài viết mới
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <Search
            placeholder="Tìm kiếm theo tiêu đề"
            allowClear
            enterButton={<SearchOutlined />}
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
                    statusFilter.includes(status.value)
                      ? status.color
                      : "default"
                  }
                  key={status.value}
                  className="cursor-pointer"
                  onClick={() => handleStatusFilter(status.value)}
                >
                  {status.label}
                </Tag>
              ))}
              {statusFilter.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setStatusFilter([])}
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
          //tableLayout="fixed"
          size="middle"
          scroll={{ x: "max-content" }} // Cho phép cuộn ngang nếu cần
          className="break-words"
        />
      </Card>

      {/* Modal đa năng cho cả thêm và chỉnh sửa blog */}
      <BlogModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        blog={currentBlog}
      />
    </div>
  );
};

export default ManageMyBlog;
