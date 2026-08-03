import { request } from '@/lib/api';

export async function getAssignments() {
  return request<any[]>(`/api/assignments`);
}
