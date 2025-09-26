import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Unexpected error';
    return Promise.reject(new Error(message));
  }
);

export const get = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((res) => res.data);

export const post = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((res) => res.data);

export const patch = <T>(url: string, data?: unknown) =>
  api.patch<T>(url, data).then((res) => res.data);

export const del = <T>(url: string) =>
  api.delete<T>(url).then((res) => res.data);
