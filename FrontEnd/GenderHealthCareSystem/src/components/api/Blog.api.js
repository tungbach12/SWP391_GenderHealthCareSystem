
import apiClient from "./apiClient";

export const blogHomeAPI = async () => {
  return apiClient.get("/blog-posts/latest");
};

export const blogSearchAPI = async ({
  title = "",
  page = 0,
  size = 8,
  tag = "",
  sort = "",
}) => {
  const query = new URLSearchParams({
    title,
    page,
    size,
    tag,
    sort,
  }).toString();
  return apiClient.get(`/blog-posts/search?${query}`);
};

export const blogDetailAPI = async (id) => {
  return apiClient.get(`/blog-posts/${id}`);
};

export const postBlogAPI = async (values) => {
  const formData = new FormData();
  formData.append("title", values.title);
  formData.append("content", values.content);
  formData.append("tags", values.tags.join(", "));
  if (values.image) {
    formData.append("image", values.image);
  }

  return apiClient.post("/blog-posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const viewMyBlogsAPI = async ({
  page = 0,
  size = 10,
  title = "",
  tag = "",
  sort = "",
  orderBy = "",
  status = "",
}) => {
  const query = new URLSearchParams({
    page,
    size,
    title,
    tag,
    sort,
    orderBy,
    status
  }).toString();
  return apiClient.get(`/blog-posts/my-posts?${query}`);
};

export const viewAllBlogsAPI = async ({
  page = 0,
  size = 10,
  title = "",
  tag = "",
  sort = "",
  orderBy = "",
  status = "",
}) => {
  const query = new URLSearchParams({
    page,
    size,
    title,
    tag,
    sort,
    orderBy,
    status,
  }).toString();
  return apiClient.get(`/blog-posts/manager/search?${query}`);
};

export const approveBlogAPI = async (postId) => {
  return apiClient.put(`/blog-posts/${postId}/approve`);
};

export const rejectBlogAPI = async (postId) => {
  return apiClient.put(`/blog-posts/${postId}/reject`);
}

export const deleteBlogAPI = async (postId) => {
  return apiClient.put(`/blog-posts/${postId}/delete`);
};

export const updateBlogAPI = async (postId, values) => {
  const formData = new FormData();
  formData.append("title", values.title);
  formData.append("content", values.content);
  formData.append("tags", values.tags.join(", "));
  if (values.image) {
    formData.append("image", values.image);
  }

  return apiClient.put(`/blog-posts/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getCommentsBlogAPI = async (postId) => {
  return apiClient.get(`/comments/${postId}`);
};

export const postCommentBlogAPI = async (postId, content) => {
  const values = {
    blogPostId: postId,
    content,
  };
  return apiClient.post(`/comments`, values);
};

export const editCommentBlogAPI = async (commentId, content) => {
  const values = {
    blogPostId: commentId,
    content,
  };
  return apiClient.put(`/comments/${commentId}`, values);
};

export const deleteCommentBlogAPI = async (commentId) => {
  return apiClient.put(`/comments/${commentId}/hide`);
};

export const likeBlogAPI = async (postId) => {
  return apiClient.put(`/blog-posts/${postId}/like`);
};

export const relatedBlogsByIdAPI = async (postId) => {
  return apiClient.get(`/blog-posts/${postId}/related`);
}

export const relatedBlogsByTagAPI = async (tag) => {
  return apiClient.get(`/blog-posts/${tag}/related-tags`);
};