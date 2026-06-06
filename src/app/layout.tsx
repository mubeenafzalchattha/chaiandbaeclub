import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chai & Bae Club | UAE's Boutique Girls' Community & Events",
  description: "Dubai's premier social space for girls. Join us for cozy game nights, painting workshops, unplugged jams, and beautiful creative connections. Baddies only.",
  keywords: "girls community dubai, girls events uae, dubai game night, painting workshop dubai, girls night out sharjah, sukkar cafe events, all girls social club",
  openGraph: {
    title: "Chai & Bae Club | Curated Events for Baddies in Dubai",
    description: "Cozy spaces, beautiful connections. Join our next workshop or girls night out.",
    locale: "en_AE",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Ambient background blur elements for aesthetic glow */}
        <div className="ambient-glow" style={{ top: "-10%", left: "5%" }}></div>
        <div className="ambient-glow-2" style={{ top: "40%", right: "10%" }}></div>
        <div className="ambient-glow" style={{ bottom: "-5%", left: "15%" }}></div>

        {/* Global Navigation Header */}
        <header className="navbar">
          <div className="container nav-container">
            <a href="/" className="brand-logo">
              {/* Fallback text logo styled beautifully with cups/hearts if image not loaded */}
              <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
                <span>bae club</span>
                <span className="logo-tag">chai &amp; bae</span>
              </div>
            </a>
            <nav>
              <ul className="nav-links">
                <li><a href="/#upcoming" className="nav-link">Upcoming Event</a></li>
                <li><a href="/#past" className="nav-link">Past Events</a></li>
                <li><a href="https://www.instagram.com/chaiandbaeclub/" target="_blank" rel="noopener noreferrer" className="nav-link">Instagram</a></li>
                <li><a href="/admin" className="btn btn-secondary" style={{ padding: "8px 20px", fontSize: "13px" }}>Admin Portal</a></li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Dynamic page content */}
        {children}

        {/* Global Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <a href="/" className="brand-logo" style={{ color: "#FFFFFF" }}>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
                    <span>bae club</span>
                    <span className="logo-tag" style={{ color: "#FF8E9E" }}>chai &amp; bae</span>
                  </div>
                </a>
                <p className="footer-desc">
                  Chai &amp; Bae Club is Dubai's boutique all-girls community. We curate cozy spaces, creative workshops, game nights, and calming journeys to foster genuine friendships and unforgettable memories for every baddie.
                </p>
              </div>
              
              <div>
                <h4 className="footer-title">Quick Links</h4>
                <ul className="footer-links">
                  <li><a href="/#upcoming">Next Event Booking</a></li>
                  <li><a href="/#past">Past Events Archives</a></li>
                  <li><a href="https://www.instagram.com/chaiandbaeclub/" target="_blank" rel="noopener noreferrer">Our Instagram Community</a></li>
                  <li><a href="/admin/login">Staff Login</a></li>
                </ul>
              </div>

              <div>
                <h4 className="footer-title">Community Vibes</h4>
                <p className="footer-desc" style={{ fontSize: "13px" }}>
                  Join us this Sunday in Dubai! Exact venue and timing details are revealed upon payment confirmation. Limited slots to keep events cozy &amp; intimate.
                </p>
                <div style={{ marginTop: "20px", fontStyle: "italic", fontSize: "14px", color: "#FF8E9E" }}>
                  &ldquo;for all my baddies&rdquo;
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} Chai &amp; Bae Club. All rights reserved.</p>
              <p>Made with ❤️ in Dubai, UAE</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
