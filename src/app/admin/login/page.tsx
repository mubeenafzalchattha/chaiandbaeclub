"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please fill in both username and password fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid authentication credentials.");
      }

      // Successful redirect to the admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main 
      style={{ 
        minHeight: "85vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        padding: "40px 24px",
        position: "relative" 
      }}
    >
      <div 
        className="glass-card" 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          padding: "36px", 
          background: "var(--bg-white)", 
          zIndex: 2 
        }}
      >
        <div className="text-center" style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "36px" }}>🌸</span>
          <h1 
            style={{ 
              fontFamily: "var(--font-serif)", 
              fontSize: "26px", 
              color: "var(--accent-berry)",
              marginTop: "8px" 
            }}
          >
            bae club staff
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
            Administrative Gate
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              background: "#FADBD8", 
              border: "1px solid #E6B0AA", 
              color: "#78281F", 
              padding: "10px 14px", 
              borderRadius: "8px", 
              fontSize: "12px", 
              fontWeight: "600",
              marginBottom: "20px" 
            }}
          >
            🚨 {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              disabled={submitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "12px" }}
            disabled={submitting}
          >
            {submitting ? "Verifying Credentials..." : "🔓 Login to Portal"}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: "24px" }}>
          <a href="/" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: "13px", fontWeight: "500" }}>
            ← Back to Landing Page
          </a>
        </div>
      </div>
    </main>
  );
}
