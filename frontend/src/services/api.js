const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function clearSession() {
  localStorage.removeItem("unipulse_token");
  localStorage.removeItem("unipulse_user");
  sessionStorage.setItem("unipulse_login_notice", "Your session expired. Please sign in again.");
  window.dispatchEvent(new Event("unipulse:session-expired"));
}

async function request(path, options = {}) {
  const token = localStorage.getItem("unipulse_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const authApi = {
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};

export const dashboardApi = {
  overview: () => request("/dashboard/overview"),
  deletePost: (postId) =>
    request(`/dashboard/posts/${postId}`, {
      method: "DELETE",
    }),
};

export const universityApi = {
  get: (universityId) => request(`/universities/${universityId}`),
  create: (university) =>
    request("/universities/", {
      method: "POST",
      body: JSON.stringify(university),
    }),
  update: (universityId, university) =>
    request(`/universities/${universityId}`, {
      method: "PUT",
      body: JSON.stringify(university),
    }),
  toggle: (universityId) =>
    request(`/universities/${universityId}/toggle`, {
      method: "PATCH",
    }),
  delete: (universityId) =>
    request(`/universities/${universityId}`, {
      method: "DELETE",
    }),
};

export const userApi = {
  list: () => request("/users/"),
  create: (user) =>
    request("/users/", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  updateRole: (userId, role) =>
    request(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  delete: (userId) =>
    request(`/users/${userId}`, {
      method: "DELETE",
    }),
};
