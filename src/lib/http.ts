import axios from 'axios';
import type { ApiErrorBody } from './types';
export const api = axios.create({
  baseURL: '/api',
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});
export function errorMessage(error: unknown) {
  return axios.isAxiosError<ApiErrorBody>(error)
    ? error.response?.data?.error?.message || 'We couldn’t connect. Please try again.'
    : 'Something went wrong. Please try again.';
}
