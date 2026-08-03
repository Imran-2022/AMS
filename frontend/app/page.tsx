import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="section-row">
          <div>
            <h1 className="section-title">Assignment Management, polished.</h1>
            <p>Welcome to AMS. Choose your role to manage users, assignments, and submissions with a clean, professional interface.</p>
          </div>
          <div>
            <Link href="/login" className="button">
              Login now
            </Link>
          </div>
        </div>
      </section>

      <section className="card card-grid grid-3">
        <Link href="/roles/admin/dashboard" className="link-card">
          <h2>Admin dashboard</h2>
          <p>Manage users, assignments, and submissions from a centralized admin console.</p>
        </Link>
        <Link href="/roles/teacher/dashboard" className="link-card">
          <h2>Teacher dashboard</h2>
          <p>Create assignments, review submissions, and grade student work with confidence.</p>
        </Link>
        <Link href="/roles/student/dashboard" className="link-card">
          <h2>Student dashboard</h2>
          <p>Submit assignments, check statuses, and keep track of your grades.</p>
        </Link>
      </section>
    </main>
  );
}
