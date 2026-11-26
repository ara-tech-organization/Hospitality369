import axios from 'axios';

/** Single axios instance. Session is an httpOnly cookie, so no token handling in JS. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Blob responses (file downloads) carry JSON errors inside the blob
    if (error.response?.data instanceof Blob && error.response.data.type?.includes('json')) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        /* ignore */
      }
    }
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from an axios error */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and retry.';
  if (!err?.response) return 'Unable to reach the server. Please check your connection.';
  return err.response.data?.message || fallback;
};

/** Field-level errors returned by the API validator */
export const fieldErrors = (err) => err?.response?.data?.details?.fields || {};

/** Download a protected file through the API and trigger a browser save */
export async function downloadFile(url, params, fallbackName = 'download') {
  const res = await api.get(url, { params, responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1] || match[2]) : fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return filename;
}

export default api;
