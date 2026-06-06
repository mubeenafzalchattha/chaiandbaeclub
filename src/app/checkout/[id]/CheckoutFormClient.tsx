"use client";

import { useState } from "react";
import { formatCurrency, validateUaePhone } from "@/lib/utils";
import { Event } from "@/lib/db";

interface CheckoutFormClientProps {
  event: Event;
  spotsLeft: number;
}

export default function CheckoutFormClient({ event, spotsLeft }: CheckoutFormClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); // just the 9-digit body
  const [errors, setErrors] = useState<{ name?: string; email?: string; whatsapp?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Clean and format UAE phone as they type: 5X XXX XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ""); // only digits
    
    // Max 9 digits for UAE mobile body
    const limited = raw.slice(0, 9);
    
    // Formatting mask
    let formatted = "";
    if (limited.length > 0) {
      formatted += limited.slice(0, 2); // 5X
    }
    if (limited.length > 2) {
      formatted += " " + limited.slice(2, 5); // XXX
    }
    if (limited.length > 5) {
      formatted += " " + limited.slice(5); // XXXX
    }
    
    setWhatsapp(formatted);
    
    // Clear validation error dynamically
    if (errors.whatsapp) {
      setErrors((prev) => ({ ...prev, whatsapp: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (/[^a-zA-Z\s]/.test(name)) {
      newErrors.name = "Name can only contain letters";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const cleanPhoneDigits = whatsapp.replace(/\D/g, "");
    if (!cleanPhoneDigits) {
      newErrors.whatsapp = "WhatsApp number is required";
    } else if (!validateUaePhone("+971" + cleanPhoneDigits)) {
      newErrors.whatsapp = "Enter a valid UAE mobile number starting with 5 (e.g. 50 123 4567)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const cleanPhone = "+971" + whatsapp.replace(/\D/g, "");
      
      const response = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate payment. Please try again.");
      }

      // Redirect to payment gateway URL (Ziina Live or simulator)
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-grid">
        {/* Form Side */}
        <div>
          <h2 className="checkout-form-title">Secure Event Booking</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "30px", lineHeight: "1.5" }}>
            Hey baddie! Enter your details below to secure your spot for the **{event.title}**. 
            Payments are securely processed via Ziina.
          </p>

          {submitError && (
            <div 
              style={{ 
                background: "#FADBD8", 
                border: "1px solid #E6B0AA", 
                color: "#78281F", 
                padding: "12px 16px", 
                borderRadius: "8px", 
                fontSize: "13px", 
                fontWeight: "600",
                marginBottom: "24px" 
              }}
            >
              🚨 {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Sarah Ahmed"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                disabled={submitting}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. sarah@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={submitting}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">UAE WhatsApp Number</label>
              <div className="phone-lock-wrapper">
                <div className="phone-lock-prefix">
                  {/* Miniature UAE Flag drawing via simple emoji */}
                  <span>🇦🇪</span>
                  <span>+971</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  placeholder="50 123 4567"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  disabled={submitting}
                />
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                WhatsApp validation locked to UAE mobile numbers only (+971 5X-XXX-XXXX).
              </p>
              {errors.whatsapp && <span className="form-error">{errors.whatsapp}</span>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "14px", marginTop: "20px" }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  Processing Secure Checkout
                  <span className="loader-dots">
                    <span className="loader-dot"></span>
                    <span className="loader-dot"></span>
                    <span className="loader-dot"></span>
                  </span>
                </>
              ) : (
                "💳 Secure Checkout via Ziina"
              )}
            </button>
          </form>
        </div>

        {/* Summary Details Side */}
        <div className="summary-side">
          <h3 className="summary-title" style={{ fontFamily: "var(--font-serif)", color: "var(--accent-berry)" }}>
            Booking Summary
          </h3>
          
          <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
            <img 
              src={event.image} 
              alt={event.title} 
              style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover" }} 
            />
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{event.title}</h4>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {event.date}
              </p>
            </div>
          </div>

          <div className="summary-item">
            <span>Ticket Price (1 Spot)</span>
            <span>{formatCurrency(event.price)}</span>
          </div>

          <div className="summary-item">
            <span>Booking Fee</span>
            <span style={{ color: "var(--accent-sage-dark)", fontWeight: "600" }}>AED 0 (Free)</span>
          </div>

          <div className="summary-total">
            <span>Total to Pay</span>
            <span>{formatCurrency(event.price)}</span>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.6)", borderRadius: "8px", padding: "12px", marginTop: "24px", border: "1px solid rgba(224, 109, 125, 0.1)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent-sage-dark)", display: "flex", alignItems: "center", gap: "4px" }}>
              🔒 SECURE TRANSACTION
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", marginTop: "4px" }}>
              Your reservation is held as pending for 10 minutes. Exact venue coordinates in Dubai will be shared upon payment verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
