import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL for API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const createAPIInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('climate_champion_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle common errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('climate_champion_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Main API instance
export const api = createAPIInstance(BASE_URL);

// Auth API (no auth required for login/register)
export const authAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// File upload API with different content type
export const uploadAPI = createAPIInstance(BASE_URL);
uploadAPI.defaults.headers['Content-Type'] = 'multipart/form-data';

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    participantLogin: '/auth/participant/login',
    participantRegister: '/auth/participant/register',
    adminLogin: '/auth/admin/login',
    participantProfile: '/auth/participant/me',
    adminProfile: '/auth/admin/me',
    refreshToken: '/auth/refresh-token',
  },

  // Participants
  participants: {
    profile: '/participants/profile',
    events: '/participants/events',
    workshops: '/participants/workshops',
    dashboard: '/participants/dashboard',
    timeline: '/participants/timeline',
    stats: '/participants/stats',
    changePassword: '/participants/change-password',
    deactivate: '/participants/deactivate',
  },

  // File Upload
  upload: {
    submit: '/upload/submit',
    submitMultiple: '/upload/submit-multiple',
    mySubmissions: '/upload/my-submissions',
    submission: (id: string) => `/upload/submission/${id}`,
    download: (id: string) => `/upload/download/${id}`,
  },

  // Leaderboard
  leaderboard: {
    overall: '/leaderboard/overall',
    schools: '/leaderboard/schools',
    states: '/leaderboard/states',
    categories: '/leaderboard/categories',
    myPosition: '/leaderboard/my-position',
    recentAchievements: '/leaderboard/recent-achievements',
    stats: '/leaderboard/stats',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    participants: '/admin/participants',
    participantDetails: (id: string) => `/admin/participants/${id}`,
    approveParticipant: (id: string) => `/admin/participants/${id}/approve`,
    rejectParticipant: (id: string) => `/admin/participants/${id}/reject`,
    submissions: '/admin/submissions',
    submissionDetails: (id: string) => `/admin/submissions/${id}`,
    reviewSubmission: (id: string) => `/admin/submissions/${id}/review`,
    bulkApprove: '/admin/submissions/bulk-approve',
    downloadSubmission: (id: string) => `/admin/submissions/${id}/download`,
    admins: '/admin/admins',
    createAdmin: '/admin/admins',
    updateAdmin: (id: string) => `/admin/admins/${id}`,
    reports: '/admin/reports/export',
  },
};

// API helper functions
export const apiHelpers = {
  // Get with query parameters
  get: (endpoint: string, params?: Record<string, any>) => {
    return api.get(endpoint, { params });
  },

  // Post with data
  post: (endpoint: string, data?: any) => {
    return api.post(endpoint, data);
  },

  // Put with data
  put: (endpoint: string, data?: any) => {
    return api.put(endpoint, data);
  },

  // Delete
  delete: (endpoint: string) => {
    return api.delete(endpoint);
  },

  // Upload file
  uploadFile: (endpoint: string, formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    return uploadAPI.post(endpoint, formData, {
      onUploadProgress,
    });
  },

  // Download file
  downloadFile: (endpoint: string, filename?: string) => {
    return api.get(endpoint, {
      responseType: 'blob',
    }).then(response => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && !filename) {
        const filenameFallback = contentDisposition.split('filename=')[1]?.replace(/"/g, '');
        if (filenameFallback) {
          filename = filenameFallback;
        }
      }
      
      link.setAttribute('download', filename || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
};

// Custom hooks for API calls (using React Query)
export const queryKeys = {
  // Participant keys
  participantProfile: ['participant', 'profile'],
  participantDashboard: ['participant', 'dashboard'],
  participantSubmissions: (params?: any) => ['participant', 'submissions', params],
  participantEvents: ['participant', 'events'],
  participantWorkshops: ['participant', 'workshops'],
  participantTimeline: ['participant', 'timeline'],
  participantStats: ['participant', 'stats'],

  // Leaderboard keys
  leaderboardOverall: (params?: any) => ['leaderboard', 'overall', params],
  leaderboardSchools: (params?: any) => ['leaderboard', 'schools', params],
  leaderboardStates: ['leaderboard', 'states'],
  leaderboardCategories: ['leaderboard', 'categories'],
  leaderboardMyPosition: ['leaderboard', 'myPosition'],
  leaderboardRecentAchievements: ['leaderboard', 'recentAchievements'],
  leaderboardStats: ['leaderboard', 'stats'],

  // Admin keys
  adminDashboard: ['admin', 'dashboard'],
  adminParticipants: (params?: any) => ['admin', 'participants', params],
  adminParticipantDetails: (id: string) => ['admin', 'participant', id],
  adminSubmissions: (params?: any) => ['admin', 'submissions', params],
  adminSubmissionDetails: (id: string) => ['admin', 'submission', id],
  adminAdmins: (params?: any) => ['admin', 'admins', params],
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'An error occurred';
    return message;
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Validation helpers
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, PNG, GIF, PPT, PPTX, XLS, or XLSX files.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
};

// Format utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};