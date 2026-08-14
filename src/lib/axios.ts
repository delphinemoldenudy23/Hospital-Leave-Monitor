import axios from 'axios';

const API_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://hospital-leave-monitor-production.up.railway.app/api'
    : 'http://localhost:5001/api';

// Simple in-memory cache with size limit
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory bloat

// Cache invalidation patterns
const INVALIDATE_PATTERNS = [
  { pattern: '/leaves', invalidate: ['/leaves', '/reports/dashboard-stats', '/leaves/employee'] },
  { pattern: '/employees', invalidate: ['/employees', '/reports/dashboard-stats'] },
  { pattern: '/departments', invalidate: ['/departments', '/employees', '/reports/dashboard-stats'] },
  { pattern: '/holidays', invalidate: ['/holidays'] },
  { pattern: '/notifications', invalidate: ['/notifications'] },
  { pattern: '/auth/admins', invalidate: ['/auth/admins'] },
  { pattern: '/system-settings', invalidate: ['/system-settings', '/system-settings/approval-permission'] },
];

const instance = axios.create({
  baseURL: API_URL,
});

// Add token to requests
instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Add caching for GET requests
instance.interceptors.request.use((config) => {
  if (config.method === 'get' && typeof window !== 'undefined') {
    const cacheKey = `${config.url}-${JSON.stringify(config.params)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      config.adapter = () =>
        Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
    }
  }

  return config;
});

// Cache responses with size limit
instance.interceptors.response.use((response) => {
  if (response.config.method === 'get' && typeof window !== 'undefined') {
    const cacheKey = `${response.config.url}-${JSON.stringify(response.config.params)}`;

    // Evict oldest entry if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
  } else if (
    ['post', 'put', 'patch', 'delete'].includes(response.config.method || '') &&
    typeof window !== 'undefined'
  ) {
    // Invalidate cache on write operations
    const url = response.config.url || '';

    INVALIDATE_PATTERNS.forEach(({ pattern, invalidate }) => {
      if (url.includes(pattern)) {
        invalidate.forEach((invalidatePattern) => {
          Array.from(cache.keys()).forEach((key) => {
            if (key.includes(invalidatePattern)) {
              cache.delete(key);
            }
          });
        });
      }
    });
  }

  return response;
});

// Handle 401 responses
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('employeeId');

      // Clear cache on logout
      cache.clear();

      // Redirect to appropriate login based on current path
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    }

    return Promise.reject(error);
  }
);

// Export cache clear function for manual invalidation
export const clearCache = (pattern?: string) => {
  if (pattern) {
    Array.from(cache.keys()).forEach((key) => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    cache.clear();
  }
};

export default instance;