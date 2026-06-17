"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatUaePhoneReadable } from "@/lib/utils";
import { Event, Booking } from "@/lib/db";

interface AdminDashboardClientProps {
  initialEvents: Event[];
  initialBookings: Booking[];
}

const IMAGE_PRESETS = [
  { label: "🎨 Painting & Planting Vibe", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800" },
  { label: "🥂 Champagne & Toast Vibe", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800" },
  { label: "🎸 Cozy Jam Acoustic Vibe", url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800" },
  { label: "🌸 Best Friends Girls Vibe", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800" }
];

export default function AdminDashboardClient({ initialEvents, initialBookings }: AdminDashboardClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<"bookings" | "events" | "create-event">("bookings");
  const router = useRouter();

  // Create Event Form States
  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState(150);
  const [deadline, setDeadline] = useState("");
  const [maxSlots, setMaxSlots] = useState(15);
  const [image, setImage] = useState(IMAGE_PRESETS[0].url);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [status, setStatus] = useState<"active" | "draft" | "completed">("active");
  const [uploading, setUploading] = useState(false);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError("");
    setFormSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image.");
      }

      setImage(data.url);
      setFormSuccess("Image uploaded successfully!");
    } catch (err: any) {
      setFormError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Filters state
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Global calculations
  const totalRevenue = bookings
    .filter((b) => b.status === "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPaidBookings = bookings.filter((b) => b.status === "paid").length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "pending").length;

  const activeEvent = events.find((e) => e.status === "active");
  const activeEventPaidCount = activeEvent
    ? bookings.filter((b) => b.eventId === activeEvent.id && b.status === "paid").length
    : 0;

  // Handles admin logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "GET" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark booking manually paid
  const handleMarkPaid = async (bookingId: string) => {
    if (!confirm("Are you sure you want to manually mark this booking as paid?")) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "paid" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update booking status.");

      // Update state locally
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "paid", paymentId: data.booking.paymentId } : b))
      );
    } catch (err: any) {
      alert(err.message || "Operation failed.");
    }
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking? This action is permanent.")) return;

    try {
      const res = await fetch(`/api/admin/bookings?bookingId=${bookingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to delete booking.");

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      alert(err.message || "Operation failed.");
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Deleting this event will automatically remove all associated bookings permanently. Are you sure you want to proceed?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/events?eventId=${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to delete event.");

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setBookings((prev) => prev.filter((b) => b.eventId !== eventId)); // Cascading sync
    } catch (err: any) {
      alert(err.message || "Operation failed.");
    }
  };

  // Create Event Form Submit
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!title.trim() || !description.trim() || !eventDate.trim() || !eventTime.trim() || !location.trim() || !deadline) {
      setFormError("All event parameters are required.");
      return;
    }

    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId || undefined, // undefined triggers auto Slug creation in API
          title: title.trim(),
          description: description.trim(),
          date: eventDate.trim(),
          time: eventTime.trim(),
          location: location.trim(),
          price: Number(price),
          deadline: new Date(deadline).toISOString(),
          maxSlots: Number(maxSlots),
          image,
          status,
          instagramUrl: instagramUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save event.");

      // Refresh events state
      const eventsRes = await fetch("/api/admin/events");
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        setEvents(eventsData.events);
      }

      setFormSuccess(`Event "${title}" saved successfully!`);
      
      // Reset form
      setEventId("");
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setLocation("");
      setPrice(150);
      setDeadline("");
      setMaxSlots(15);
      setImage(IMAGE_PRESETS[0].url);
      setInstagramUrl("");
      setStatus("active");
      
      // Switch back to events tab
      setTimeout(() => {
        setActiveTab("events");
        setFormSuccess("");
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || "Failed to record event.");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Event trigger: populates create tab with current details
  const handleEditTrigger = (event: Event) => {
    setEventId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setEventDate(event.date);
    setEventTime(event.time);
    setLocation(event.location);
    setPrice(event.price);
    
    // Format ISO string to browser datetime-local format: YYYY-MM-DDTHH:MM
    const dateObj = new Date(event.deadline);
    // Adjust timezones offset
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localISOTime);
    
    setMaxSlots(event.maxSlots);
    setImage(event.image);
    setStatus(event.status);
    setInstagramUrl(event.instagramUrl || "");
    setActiveTab("create-event");
  };

  // Filter Bookings List
  const filteredBookings = bookings.filter((b) => {
    const matchesEvent = selectedEventId === "all" || b.eventId === selectedEventId;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.whatsapp.includes(searchQuery) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEvent && matchesSearch;
  });

  // Dynamic CSV Generation & Downloader
  const handleDownloadCSV = () => {
    if (filteredBookings.length === 0) {
      alert("No booking records to export.");
      return;
    }

    const headers = ["Booking ID", "Event ID", "Guest Name", "Email", "WhatsApp", "Date Created", "Price (AED)", "Status", "Receipt ID"];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.eventId,
      b.name,
      b.email,
      b.whatsapp,
      new Date(b.createdAt).toLocaleString("en-AE"),
      b.amount,
      b.status.toUpperCase(),
      b.paymentId || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `cbb_bookings_export_${selectedEventId}_${Date.now()}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-grid">
      {/* 1. Left Sidebar Panels */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar-logo">
            bae club staff
            <span style={{ display: "block", fontSize: "9px", color: "var(--accent-pink-main)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
              Chai &amp; Bae Control
            </span>
          </div>

          <nav className="admin-nav">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`btn admin-nav-item ${activeTab === "bookings" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", justifyContent: "flex-start" }}
            >
              🎟️ View Bookings
            </button>
            <button
              onClick={() => {
                // Clear any edits
                setEventId("");
                setActiveTab("create-event");
              }}
              className={`btn admin-nav-item ${activeTab === "create-event" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", justifyContent: "flex-start" }}
            >
              ➕ Create Event
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`btn admin-nav-item ${activeTab === "events" ? "active" : ""}`}
              style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", justifyContent: "flex-start" }}
            >
              📅 Manage Events
            </button>
          </nav>
        </div>

        <div style={{ marginTop: "auto" }}>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary" 
            style={{ width: "100%", padding: "10px", fontSize: "13px" }}
          >
            🔒 Staff Log Out
          </button>
        </div>
      </aside>

      {/* 2. Main Dashboard panel */}
      <div className="admin-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "32px" }}>Dashboard Panel</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              Manage event calendars and track secure UAE Ziina bookings registrations.
            </p>
          </div>
          <a href="/" target="_blank" className="btn btn-secondary" style={{ padding: "8px 20px", fontSize: "13px" }}>
            👁️ View Public Site
          </a>
        </header>

        {/* 3. Dashboard Metrics Row */}
        <section className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-val" style={{ color: "var(--accent-sage-dark)" }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Paid Guests</div>
            <div className="admin-stat-val">{totalPaidBookings}</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">Active Event Occupancy</div>
            <div className="admin-stat-val">
              {activeEvent ? (
                <>
                  {activeEventPaidCount} <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: "normal" }}>/ {activeEvent.maxSlots} spots</span>
                </>
              ) : (
                "None Active"
              )}
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">Pending Incomplete</div>
            <div className="admin-stat-val" style={{ color: pendingBookingsCount > 0 ? "var(--accent-pink-main)" : "var(--text-dark)" }}>
              {pendingBookingsCount}
            </div>
          </div>
        </section>

        {/* TAB A: VIEW & FILTER BOOKINGS */}
        {activeTab === "bookings" && (
          <section className="glass-card" style={{ background: "var(--bg-white)", padding: "0" }}>
            <div className="admin-table-header">
              <h3 style={{ fontSize: "20px" }}>Bookings Reservations Tracker</h3>
              
              {/* Controls and Exporter */}
              <div className="admin-controls-row">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="form-input"
                  style={{ width: "200px", padding: "8px 12px", background: "var(--bg-cream)" }}
                >
                  <option value="all">All Events Calendar</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search guest or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: "200px", padding: "8px 12px", background: "var(--bg-cream)" }}
                />

                <button 
                  onClick={handleDownloadCSV}
                  className="btn btn-sage" 
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {filteredBookings.length === 0 ? (
                <div className="text-center" style={{ padding: "60px" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎟️</div>
                  <h4 style={{ color: "var(--text-muted)" }}>No booking records found matching selection.</h4>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Guest Details</th>
                      <th>Event Title</th>
                      <th>UAE WhatsApp Contact</th>
                      <th>Registered At</th>
                      <th>Paid Value</th>
                      <th>Ledger Status</th>
                      <th>Staff Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const associatedEvent = events.find((e) => e.id === b.eventId);
                      return (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: "700" }}>{b.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{b.email}</div>
                            <div style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--accent-berry)", marginTop: "2px" }}>
                              Code: {b.id}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600" }}>
                              {associatedEvent ? associatedEvent.title : b.eventId}
                            </div>
                          </td>
                          <td>
                            {/* Clickable link to WhatsApp Web */}
                            <a
                              href={`https://wa.me/${b.whatsapp.replace(/\+/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: "none", color: "var(--accent-sage-dark)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              💬 {formatUaePhoneReadable(b.whatsapp)}
                            </a>
                          </td>
                          <td>
                            <div style={{ fontSize: "12px" }}>
                              {new Date(b.createdAt).toLocaleDateString("en-AE", {
                                month: "short",
                                day: "numeric"
                              })}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {new Date(b.createdAt).toLocaleTimeString("en-AE", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </td>
                          <td style={{ fontWeight: "700" }}>
                            {formatCurrency(b.amount)}
                          </td>
                          <td>
                            <span className={`admin-badge admin-badge-${b.status}`}>
                              {b.status}
                            </span>
                            {b.paymentId && (
                              <div style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--text-muted)", marginTop: "4px" }}>
                                Tx: {b.paymentId.substring(0, 15)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {b.status === "pending" && (
                                <button
                                  onClick={() => handleMarkPaid(b.id)}
                                  className="btn btn-sage"
                                  style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }}
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBooking(b.id)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", borderColor: "#E6B0AA", color: "#78281F" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* TAB B: VIEW & MANAGE EVENTS */}
        {activeTab === "events" && (
          <section className="glass-card" style={{ background: "var(--bg-white)", padding: "24px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px" }}>Events Schedule Planner</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {events.map((e) => (
                <div 
                  key={e.id} 
                  className="admin-event-card"
                >
                  <img 
                    src={e.image} 
                    alt={e.title} 
                    style={{ width: "90px", height: "90px", borderRadius: "8px", objectFit: "cover" }} 
                  />
                  
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <h4 style={{ fontSize: "18px", fontWeight: "700" }}>{e.title}</h4>
                      <span className={`admin-badge ${e.status === "active" ? "admin-badge-paid" : "admin-badge-pending"}`} style={{ textTransform: "capitalize" }}>
                        {e.status}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4", maxWidth: "600px" }}>
                      {e.description.substring(0, 120)}...
                    </p>

                    <div className="admin-event-card-inner">
                      <span>📅 {e.date} ({e.time})</span>
                      <span>📍 {e.location.split(",")[0]}</span>
                      <span>💸 {formatCurrency(e.price)}</span>
                      <span>🎟️ Max Slots: {e.maxSlots}</span>
                    </div>
                  </div>

                  <div className="admin-event-card-actions">
                    <button
                      onClick={() => handleEditTrigger(e)}
                      className="btn btn-sage"
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      ✏️ Edit Event
                    </button>
                    
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "12px", borderColor: "#E6B0AA", color: "#78281F" }}
                    >
                      🗑️ Delete Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB C: CREATE / EDIT EVENT */}
        {activeTab === "create-event" && (
          <section className="glass-card" style={{ background: "var(--bg-white)", padding: "32px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "6px", fontFamily: "var(--font-serif)" }}>
              {eventId ? "Modify Event Details" : "Schedule New All-Girls Event"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "30px" }}>
              Fill in the parameters below. Standard defaults are pre-configured. Making an event active will 
              automatically archive any previous event to completion status.
            </p>

            {formSuccess && (
              <div style={{ background: "#D4EFDF", border: "1px solid #A9DFBF", color: "#196F3D", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "24px" }}>
                ✓ {formSuccess}
              </div>
            )}

            {formError && (
              <div style={{ background: "#FADBD8", border: "1px solid #E6B0AA", color: "#78281F", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "24px" }}>
                🚨 {formError}
              </div>
            )}

            <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Painting & Planting Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: "100px", resize: "vertical" }}
                  placeholder="Details about what the girlies will do, what is included, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Display Date (Readable)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sunday, June 7"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Time (Readable)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4:00 PM - 6:30 PM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Venue</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Secret Garden Cafe, Jumeirah, Dubai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Ticket Price (AED)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Slots (Capacity)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxSlots}
                    onChange={(e) => setMaxSlots(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Booking Deadline (Date &amp; Time Picker)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              {/* Event banner upload block */}
              <div className="form-group">
                <label className="form-label">Upload Event Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="form-input"
                  style={{ background: "var(--bg-cream)", padding: "10px" }}
                  required={!image}
                  disabled={uploading || formLoading}
                />
                {uploading && <p style={{ fontSize: "11px", color: "var(--accent-pink-main)", marginTop: "4px" }}>Uploading image... Please wait.</p>}
                
                {image && (
                  <div style={{ marginTop: "12px" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current Banner Preview:</p>
                    <img 
                      src={image} 
                      alt="Banner Preview" 
                      style={{ width: "100%", maxHeight: "150px", objectFit: "cover", borderRadius: "8px", marginTop: "4px", border: "1px solid var(--border-light)" }} 
                    />
                  </div>
                )}
              </div>


              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Event Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="form-input"
                    style={{ background: "var(--bg-cream)" }}
                  >
                    <option value="active">Active (Renders on Landing Page)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="completed">Completed (Archives under Past Events)</option>
                  </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Instagram Post URL (Optional)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.instagram.com/..."
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, padding: "14px" }}
                  disabled={formLoading}
                >
                  {formLoading ? "Recording Event..." : "💾 Save Event Calendar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("events");
                    setEventId("");
                    setInstagramUrl("");
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "14px 28px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
