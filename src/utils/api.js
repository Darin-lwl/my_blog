const API = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
    throw new Error('未登录或登录已过期');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '请求失败');
  }

  return res.json();
}

// Public
export const getAllPosts = () => request('/posts');
export const getPostBySlug = (slug) => request(`/posts/${slug}`);
export const getAllCategories = () => request('/categories');
export const getAllTags = () => request('/tags');
export const getStats = () => request('/stats');
export const getAllLinks = () => request('/links');

// Auth
export const login = async (password) => {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  localStorage.setItem('admin_token', data.token);
  return data;
};

export const logout = () => localStorage.removeItem('admin_token');
export const isLoggedIn = () => !!getToken();

// Admin
export const getAdminPosts = () => request('/admin/posts');
export const createPost = (post) => request('/admin/posts', { method: 'POST', body: JSON.stringify(post) });
export const updatePost = (slug, post) => request(`/admin/posts/${slug}`, { method: 'PUT', body: JSON.stringify(post) });
export const deletePost = (slug) => request(`/admin/posts/${slug}`, { method: 'DELETE' });

// Links (admin)
export const getAdminLinks = () => request('/admin/links');
export const createLink = (link) => request('/admin/links', { method: 'POST', body: JSON.stringify(link) });
export const updateLink = (id, link) => request(`/admin/links/${id}`, { method: 'PUT', body: JSON.stringify(link) });
export const deleteLink = (id) => request(`/admin/links/${id}`, { method: 'DELETE' });

// Categories (admin)
export const getAdminCategories = () => request('/admin/categories');
export const createCategory = (category) => request('/admin/categories', { method: 'POST', body: JSON.stringify(category) });
export const updateCategory = (id, category) => request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) });
export const deleteCategory = (id) => request(`/admin/categories/${id}`, { method: 'DELETE' });

// Comments (public)
export const getComments = (slug) => request(`/comments?slug=${encodeURIComponent(slug)}`);
export const submitComment = (data) => request('/comments', { method: 'POST', body: JSON.stringify(data) });

// Comments (admin)
export const getAdminComments = () => request('/admin/comments');
export const updateCommentStatus = (id, status) => request(`/admin/comments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteComment = (id) => request(`/admin/comments/${id}`, { method: 'DELETE' });
