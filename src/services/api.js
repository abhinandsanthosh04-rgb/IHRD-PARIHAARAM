const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const normalizeComplaint = (complaint) => ({
  ...complaint,
  id: complaint.complaintId || String(complaint.id),
  collegeId: String(complaint.collegeCode || complaint.collegeId || '').toLowerCase(),
  submittedDate: complaint.createdAt || complaint.submittedDate,
  status: String(complaint.status || '').toUpperCase(),
  hasPhoto: Boolean(complaint.image),
  photos: complaint.image ? [`http://localhost:5000${complaint.image}`] : [],
  resolution: complaint.resolution ? { text: complaint.resolution, resolvedDate: complaint.resolvedAt } : null,
  timeline: complaint.history || complaint.timeline || [],
});

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('ihrd_parathi_auth') || 'null');
  return {
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
  };
};

const request = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message || 'Request failed';
    throw new Error(message);
  }

  return data;
};

export const fetchComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await request(`${BASE_URL}/complaints?${params.toString()}` , {
    headers: getAuthHeaders(),
  });

  return { data: (response.data || []).map(normalizeComplaint), total: (response.data || []).length };
};

export const fetchComplaintById = async (id) => {
  const response = await request(`${BASE_URL}/complaints/${id}`, { headers: getAuthHeaders() });
  return { data: normalizeComplaint(response.data) };
};

export const submitComplaint = async (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    }
  });

  const user = JSON.parse(localStorage.getItem('ihrd_parathi_auth') || 'null');
  const response = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
  if (!response.ok || !data.success) throw new Error(data.message || 'Unable to submit complaint');
  return data;
};

export const updateComplaintStatus = async (id, status, note = '') => {
  const response = await request(`${BASE_URL}/complaints/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, note }),
  });
  return { ...response, data: normalizeComplaint(response.data) };
};

export const fetchAdminDashboardStats = async () => {
  const response = await request(`${BASE_URL}/admin/dashboard`, { headers: getAuthHeaders() });
  return response.data;
};

export const uploadComplaintPhotos = async (id, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('image', file));

  const response = await request(`${BASE_URL}/complaints/${id}/photos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return response;
};

export const fetchColleges = async () => {
  const response = await request(`${BASE_URL}/colleges`);
  return { data: response.data || [] };
};

export const fetchCollegeById = async (id) => {
  const response = await request(`${BASE_URL}/colleges/${id}`);
  return { data: response.data || null };
};

export const fetchDashboardStats = async () => {
  const response = await request(`${BASE_URL}/admin/dashboard`, { headers: getAuthHeaders() });
  return { data: response.data };
};

export const fetchLeaderboard = async () => {
  return { data: [] };
};

export const fetchStudentComplaints = async () => {
  const response = await request(`${BASE_URL}/complaints/my`, { headers: getAuthHeaders() });
  return { data: (response.data || []).map(normalizeComplaint) };
};

export const fetchAdminComplaints = async () => {
  const response = await request(`${BASE_URL}/admin/complaints`, { headers: getAuthHeaders() });
  return { data: (response.data || []).map(normalizeComplaint) };
};

export const resolveComplaint = async (id, resolution) => {
  const response = await request(`${BASE_URL}/complaints/${id}/resolve`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ resolution }),
  });
  return response;
};

export const fetchCategories = async () => {
  const response = await fetch('https://dummyjson.com/products?limit=1');
  if (!response.ok) return { data: [] };
  return { data: [] };
};
