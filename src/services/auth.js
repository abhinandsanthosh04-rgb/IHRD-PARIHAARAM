const AUTH_KEY = 'ihrd_parathi_auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const normalizeRole = (role) => {
  const value = String(role || '').toUpperCase();
  if (value === 'STUDENT') return 'student';
  if (value === 'ADMIN') return 'admin';
  if (value === 'CENTRAL_ADMIN') return 'central_admin';
  return value.toLowerCase();
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email || '').trim(), password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.message || 'Invalid credentials.' };
    }

    const user = {
      ...data.user,
      role: normalizeRole(data.user?.role),
      token: data.token,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Unable to reach the backend server. Please start the backend on port 5000.' };
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const isStudent = () => {
  const user = getCurrentUser();
  return user?.role === 'student';
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const isCentralAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'central_admin';
};

export const getDemoCredentials = () => [
  { label: 'Student Demo', id: 'student@ihrd.ac.in', pass: 'student123', role: 'Student' },
  { label: 'College Admin Demo', id: 'admin@ihrd.ac.in', pass: 'admin123', role: 'Admin' },
  { label: 'Central Admin Demo', id: 'central@ihrd.ac.in', pass: 'admin123', role: 'Central Admin' },
];
