import { request } from '@/lib/api';

export async function getSubmissions() {
  return request<any[]>(`/api/submissions`);
}
