import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  // Security authorization check
  const isAuthenticated = !!session && session.startsWith("authenticated_");
  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  // Load events and bookings directly from local JSON database on server
  const events = await db.getEvents();
  const bookings = await db.getBookings();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-cream)" }}>
      <AdminDashboardClient initialEvents={events} initialBookings={bookings} />
    </main>
  );
}
