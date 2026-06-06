import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Countdown from "./components/Countdown";
import heroImage from "./assets/hero.jpg";

export default async function Home() {
  const events = await db.getEvents();

  // Find current active event
  const upcomingEvent = events.find((e) => e.status === "active");

  // Filter out completed past events
  const pastEvents = events.filter((e) => e.status === "completed");

  // If there's an active event, compute seats filled
  let paidBookingsCount = 0;
  let isSoldOut = false;
  let isDeadlinePassed = false;

  if (upcomingEvent) {
    const eventBookings = await db.getBookingsByEventId(upcomingEvent.id);
    paidBookingsCount = eventBookings.filter((b) => b.status === "paid").length;
    isSoldOut = paidBookingsCount >= upcomingEvent.maxSlots;
    isDeadlinePassed = new Date(upcomingEvent.deadline).getTime() < Date.now();
  }

  return (
    <main>
      {/* 1. Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-subtitle">✨ ALL GIRLS COMMUNITY EVENT ✨</span>
            <h1 className="hero-title">
              Cozy spaces, <br />
              <span>beautiful connections.</span>
            </h1>
            <p className="hero-description">
              Chai &amp; Bae Club is Dubai&apos;s premier social sanctuary for girls.
              We curate high-aesthetic, comfortable workshops, game nights, and cozy tea-fueled sessions
              designed to build lasting friendships. Baddies only, good vibes guaranteed.
            </p>
            <div className="hero-actions">
              {upcomingEvent ? (
                <a href="#upcoming" className="btn btn-primary">
                  🎟️ Book Next Event
                </a>
              ) : (
                <button className="btn btn-disabled">No Active Event</button>
              )}
              <a href="#past" className="btn btn-secondary">
                ✨ Past Jams
              </a>
            </div>
          </div>

          <div className="hero-visual">
            {/* Soft decorative background circles */}
            <div
              style={{
                position: "absolute",
                width: "110%",
                height: "110%",
                background: "radial-gradient(circle, rgba(255,142,158,0.12) 0%, rgba(143,168,155,0.05) 50%, transparent 80%)",
                borderRadius: "50%",
                filter: "blur(20px)",
                zIndex: -1
              }}
            ></div>

            <div className="hero-frame">
              <img
                src={heroImage.src}
                alt="Chai and Bae Club Vibe"
              />
            </div>

            {/* Floating Glass Badges */}
            <div className="floating-badge badge-right">
              <div className="badge-icon">🍵</div>
              <div className="badge-text">
                <h4>Chai &amp; Chats</h4>
                <p>Curated aesthetic venues</p>
              </div>
            </div>

            <div className="floating-badge badge-left">
              <div className="badge-icon">💖</div>
              <div className="badge-text">
                <h4>All-Girls Vibe</h4>
                <p>A safe space for baddies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Upcoming Featured Event Section */}
      <section id="upcoming" className="section" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <div className="text-center">
            <span className="section-tag">📅 DONT MISS OUT</span>
            <h2 className="section-title">Our Current Event</h2>
            <p className="section-desc">
              Grab your tickets early! Slots are kept strictly limited to maintain a cozy,
              intimate environment where everyone can chat, connect, and relax.
            </p>
          </div>

          {upcomingEvent ? (
            <div className="featured-card">
              <div className="featured-img-container">
                <img src={upcomingEvent.image} alt={upcomingEvent.title} />
                <span className="tag-status">Active Booking</span>
                <span className="tag-spots">
                  {upcomingEvent.maxSlots - paidBookingsCount} spots left
                </span>
              </div>

              <div className="featured-content">
                <h3 className="featured-title">{upcomingEvent.title}</h3>
                <p className="featured-description">{upcomingEvent.description}</p>

                {/* Meta details list */}
                <div className="meta-grid">
                  <div className="meta-item">
                    <div className="meta-icon">📅</div>
                    <div className="meta-text">
                      <h5>When</h5>
                      <p>{upcomingEvent.date}</p>
                      <p style={{ fontSize: "12px", fontWeight: "normal", color: "var(--text-muted)" }}>
                        {upcomingEvent.time}
                      </p>
                    </div>
                  </div>

                  <div className="meta-item">
                    <div className="meta-icon">📍</div>
                    <div className="meta-text">
                      <h5>Where</h5>
                      <p>{upcomingEvent.location.split(",")[0]}</p>
                      <p style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-muted)" }}>
                        Exact venue details shared after booking
                      </p>
                    </div>
                  </div>

                  <div className="meta-item">
                    <div className="meta-icon">💸</div>
                    <div className="meta-text">
                      <h5>Price</h5>
                      <p>{formatCurrency(upcomingEvent.price)}</p>
                    </div>
                  </div>

                  <div className="meta-item">
                    <div className="meta-icon">🌸</div>
                    <div className="meta-text">
                      <h5>Includes</h5>
                      <p style={{ fontSize: "13px", fontWeight: "normal" }}>
                        All materials, high tea, custom desserts, custom goodies bag
                      </p>
                    </div>
                  </div>
                </div>

                {/* Slots progress bar */}
                <div className="slots-progress-wrapper">
                  <div className="slots-label">
                    <span>Community Spots Reserved</span>
                    <span>
                      {paidBookingsCount} / {upcomingEvent.maxSlots} Booked
                    </span>
                  </div>
                  <div className="slots-progress-bar">
                    <div
                      className="slots-progress-fill"
                      style={{ width: `${(paidBookingsCount / upcomingEvent.maxSlots) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Booking Deadline Live Countdown */}
                <Countdown deadline={upcomingEvent.deadline} />

                {/* CTA Action */}
                {isSoldOut ? (
                  <button className="btn btn-disabled btn-full" style={{ width: "100%" }}>
                    🚨 Fully Booked! Follow Instagram for Next Release
                  </button>
                ) : isDeadlinePassed ? (
                  <button className="btn btn-disabled btn-full" style={{ width: "100%" }}>
                    ⌛ Booking Closed (Deadline Passed)
                  </button>
                ) : (
                  <Link
                    href={`/checkout/${upcomingEvent.id}`}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "16px" }}
                  >
                    🎟️ Book My Spot Now
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card text-center" style={{ padding: "60px", maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🌸</div>
              <h3 style={{ marginBottom: "12px" }}>Gathering New Vibes...</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
                We are currently cooking up the next beautiful adventure for our girlies.
                Keep a close eye on our Instagram community for dates, slots, and announcements!
              </p>
              <a
                href="https://www.instagram.com/chaiandbae.byqn/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sage"
              >
                Join Instagram Channel
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 3. Past Events Grid Section */}
      <section id="past" className="section">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">✨ MEMORY ARCHIVE</span>
            <h2 className="section-title">Past Event Jam Sessions</h2>
            <p className="section-desc">
              Here is a look back at our cozy gatherings. Click on any event card below to
              head over to our Instagram page for pictures, reels, reviews, and detailed vibes!
            </p>
          </div>

          <div className="events-grid">
            {pastEvents.map((event) => (
              <a
                key={event.id}
                href={event.instagramUrl || "https://www.instagram.com/chaiandbae.byqn/"}
                target="_blank"
                rel="noopener noreferrer"
                className="event-card"
                style={{ textDecoration: "none" }}
              >
                <div className="event-card-img">
                  <img src={event.image} alt={event.title} />
                  <div className="event-card-overlay">
                    <div className="overlay-icon">📸</div>
                    <div className="overlay-text">See Instagram Post</div>
                  </div>
                </div>

                <div className="event-card-body">
                  <h3 className="event-card-title">{event.title}</h3>
                  <div className="event-card-meta">
                    <span>📅 {event.date}</span>
                    <span>•</span>
                    <span>📍 {event.location.split(",")[0]}</span>
                  </div>
                  <p className="event-card-desc">{event.description}</p>

                  <div className="event-card-footer">
                    <span style={{ fontSize: "12px", color: "var(--accent-sage-dark)", fontWeight: "600" }}>
                      Completed Jam ✓
                    </span>
                    {/* <span className="event-card-price">
                      {formatCurrency(event.price)}
                    </span> */}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
