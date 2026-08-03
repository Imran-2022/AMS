export const ROLE = {
  Admin: { text: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-600", ring: "ring-violet-600" },
  Teacher: { text: "text-teal-700", bg: "bg-teal-50", dot: "bg-teal-600", ring: "ring-teal-600" },
  Student: { text: "text-sky-700", bg: "bg-sky-50", dot: "bg-sky-600", ring: "ring-sky-600" },
} as const;

export const ASSIGN_STATUS = {
  Draft: "bg-slate-100 text-slate-600",
  Published: "bg-emerald-50 text-emerald-700",
} as const;

export const SUB_STATUS = {
  "Not submitted": "bg-slate-100 text-slate-500",
  Submitted: "bg-sky-50 text-sky-700",
  Late: "bg-amber-50 text-amber-700",
  Graded: "bg-emerald-50 text-emerald-700",
  "Resubmission requested": "bg-rose-50 text-rose-700",
} as const;

export const USERS = [
  { id: 1, name: "Nusrat Jahan", email: "admin@ams.edu", role: "Admin", status: "Active" },
  { id: 2, name: "Rafiul Islam", email: "r.islam@ams.edu", role: "Teacher", status: "Active" },
  { id: 3, name: "Farzana Karim", email: "f.karim@ams.edu", role: "Teacher", status: "Active" },
  { id: 4, name: "Tanvir Ahmed", email: "tanvir@ams.edu", role: "Student", status: "Active" },
  { id: 5, name: "Sadia Rahman", email: "sadia@ams.edu", role: "Student", status: "Active" },
  { id: 6, name: "Imran Kabir", email: "imran@ams.edu", role: "Student", status: "Inactive" },
] as const;

export const CLASSES = [
  { id: 1, name: "Class 9", section: "A", year: "2026", subjects: 4, students: 32 },
  { id: 2, name: "Class 10", section: "B", year: "2026", subjects: 5, students: 29 },
] as const;

export const SUBJECTS = [
  { id: 1, name: "Mathematics", code: "MTH-101", cls: "Class 9 - A", teacher: "Rafiul Islam" },
  { id: 2, name: "Physics", code: "PHY-101", cls: "Class 9 - A", teacher: "Farzana Karim" },
  { id: 3, name: "English", code: "ENG-101", cls: "Class 10 - B", teacher: "Farzana Karim" },
] as const;

export const ASSIGNMENTS = [
  { id: 1, title: "Algebraic Expressions — Set 4", subject: "Mathematics", cls: "Class 9 - A", teacher: "Rafiul Islam", deadline: "2026-08-10 23:59", maxMarks: 20, status: "Published", submissions: 24, total: 32 },
  { id: 2, title: "Newton's Laws — Problem Sheet", subject: "Physics", cls: "Class 9 - A", teacher: "Farzana Karim", deadline: "2026-08-08 23:59", maxMarks: 25, status: "Published", submissions: 18, total: 32 },
  { id: 3, title: "Essay: Climate and Community", subject: "English", cls: "Class 10 - B", teacher: "Farzana Karim", deadline: "2026-08-14 23:59", maxMarks: 30, status: "Draft", submissions: 0, total: 29 },
  { id: 4, title: "Quadratic Equations — Quiz", subject: "Mathematics", cls: "Class 9 - A", teacher: "Rafiul Islam", deadline: "2026-07-28 23:59", maxMarks: 15, status: "Published", submissions: 31, total: 32 },
] as const;

export const SUBMISSIONS = [
  { id: 1, student: "Tanvir Ahmed", submittedAt: "2026-08-05 21:14", status: "Submitted", marks: null, isLate: false },
  { id: 2, student: "Sadia Rahman", submittedAt: "2026-08-06 08:02", status: "Late", marks: null, isLate: true },
  { id: 3, student: "Imran Kabir", submittedAt: "2026-08-04 19:40", status: "Graded", marks: 17, isLate: false },
  { id: 4, student: "Mahin Chowdhury", submittedAt: "2026-08-05 22:51", status: "Resubmission requested", marks: null, isLate: false },
] as const;

export const STUDENT_ASSIGNMENTS = [
  { id: 1, title: "Algebraic Expressions — Set 4", subject: "Mathematics", deadline: "2026-08-10 23:59", maxMarks: 20, status: "Not submitted" },
  { id: 2, title: "Newton's Laws — Problem Sheet", subject: "Physics", deadline: "2026-08-08 23:59", maxMarks: 25, status: "Submitted" },
  { id: 3, title: "Quadratic Equations — Quiz", subject: "Mathematics", deadline: "2026-07-28 23:59", maxMarks: 15, status: "Graded" },
] as const;

export const STUDENT_GRADES = [
  { id: 1, title: "Quadratic Equations — Quiz", subject: "Mathematics", marks: 13, maxMarks: 15, feedback: "Good grasp of the formula method — watch your sign errors in step 3.", gradedAt: "2026-07-30" },
  { id: 2, title: "Cell Structure — Worksheet", subject: "Biology", marks: 22, maxMarks: 25, feedback: "Clear diagrams. Add labels for the mitochondria next time.", gradedAt: "2026-07-22" },
] as const;

export type RoleType = keyof typeof ROLE;
