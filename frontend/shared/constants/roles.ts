export const ROLE = {
  Admin: { text: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-600', ring: 'ring-violet-600' },
  Teacher: { text: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-600', ring: 'ring-teal-600' },
  Student: { text: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-600', ring: 'ring-sky-600' },
} as const;

export type RoleType = keyof typeof ROLE;
