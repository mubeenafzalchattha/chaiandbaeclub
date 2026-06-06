"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

// A fallback component for Suspense when query parameters are loading
function SimulatorFallback() {
  return (
    <div className="ziina-sim-bg">
      <div className="ziina-sim-card text-center" style={{ padding: "40px 20px" }}>
        <div className="loader-dots" style={{ scale: "1.5", marginBottom: "20px" }}>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
        </div>
        <p style={{ color: "#8E8D91", fontSize: "14px" }}>Securing connection to Ziina...</p>
      </div>
    </div>
  );
}

// Inner client content that uses search params
function SimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Interactive payment states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirming" | "success" | "failed">("idle");
  const [processingText, setProcessingText] = useState("Securing gateway connection...");
  const [showApplePaySheet, setShowApplePaySheet] = useState(false);
  const [applePayState, setApplePayState] = useState<"idle" | "paying" | "complete">("idle");

  useEffect(() => {
    if (!bookingId) {
      setError("No booking reference provided.");
      setLoading(false);
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/checkout/confirm?bookingId=${bookingId}&check=true`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Failed to load transaction details.");
        }
        
        setBooking(data.booking);
        setEvent(data.event);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to fetch payment details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Formatting Card Number: XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = "";
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += raw[i];
    }
    setCardNumber(formatted);
  };

  // Formatting Expiry: MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    setExpiry(formatted);
  };

  // Formatting CVV: XXX
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvv(raw);
  };

  const handleApplePaySubmit = () => {
    setShowApplePaySheet(true);
  };

  const confirmApplePay = () => {
    setApplePayState("paying");
    setTimeout(() => {
      setApplePayState("complete");
      setTimeout(() => {
        setShowApplePaySheet(false);
        processFinalPayment();
      }, 1500);
    }, 2000);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !cardName) {
      alert("Please fill in all credit card details to simulate payment.");
      return;
    }
    processFinalPayment();
  };

  const processFinalPayment = async () => {
    setPaymentStatus("processing");
    
    // Simulate payment sequence steps
    setTimeout(() => {
      setProcessingText("Authorizing with UAE Central Bank...");
      setTimeout(() => {
        setProcessingText("Confirming ledger allocation...");
        setTimeout(async () => {
          setPaymentStatus("confirming");
          try {
            // Call API confirm endpoint to record payment in JSON database
            const confirmRes = await fetch("/api/checkout/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId, status: "paid" })
            });

            if (!confirmRes.ok) {
              throw new Error("Unable to save ledger details.");
            }

            setPaymentStatus("success");
            
            // Redirect to Success Page after showing success status
            setTimeout(() => {
              router.push(`/checkout/success?bookingId=${bookingId}`);
            }, 1800);

          } catch (err) {
            console.error(err);
            setPaymentStatus("failed");
          }
        }, 1500);
      }, 1200);
    }, 1000);
  };

  if (loading) {
    return <SimulatorFallback />;
  }

  if (error) {
    return (
      <div className="ziina-sim-bg">
        <div className="ziina-sim-card text-center" style={{ borderColor: "#78281F" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#FADBD8" }}>
            Payment Intent Error
          </h3>
          <p style={{ color: "#8E8D91", fontSize: "13px", lineHeight: "1.5", marginBottom: "24px" }}>
            {error}
          </p>
          <button 
            className="ziina-btn-submit" 
            style={{ background: "#78281F", color: "#FADBD8" }}
            onClick={() => router.push("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ziina-sim-bg">
      {/* Confetti celebration shown on mock completion */}
      {paymentStatus === "success" && (
        <div className="confetti-wrapper" style={{ background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: "70px", animation: "bounce 1s infinite alternate" }}>🎉</div>
          <h1 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: "800", fontSize: "28px", marginTop: "16px", color: "#FFFFFF" }}>
            Payment Secured!
          </h1>
          <p style={{ color: "#B386FF", fontSize: "14px", marginTop: "8px" }}>
            Ledger recorded. Redirecting to ticket stub...
          </p>
        </div>
      )}

      {/* Payment Processing HUD Screen */}
      {(paymentStatus === "processing" || paymentStatus === "confirming") && (
        <div className="confetti-wrapper" style={{ background: "rgba(15,14,15,0.92)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div className="loader-dots" style={{ scale: "2", marginBottom: "30px" }}>
            <span className="loader-dot" style={{ background: "#B386FF" }}></span>
            <span className="loader-dot" style={{ background: "#B386FF" }}></span>
            <span className="loader-dot" style={{ background: "#B386FF" }}></span>
          </div>
          <h2 style={{ fontFamily: "sans-serif", fontWeight: "600", fontSize: "18px", color: "#FFFFFF" }}>
            {processingText}
          </h2>
          <p style={{ color: "#8E8D91", fontSize: "12px", marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Ziina Secure Link ID: {bookingId}
          </p>
        </div>
      )}

      {/* Main Ziina Interface Wrapper */}
      <div className="ziina-sim-card">
        <div className="ziina-sim-header">
          <div className="ziina-sim-logo">
            ziina<span>.</span>
          </div>
          <span className="ziina-sim-secure-badge">
            ✓ Secure link
          </span>
        </div>

        <div className="ziina-sim-amount">
          <div className="ziina-sim-amount-label">Chai &amp; Bae Club Events</div>
          <div className="ziina-sim-amount-val">{formatCurrency(booking?.amount || 0)}</div>
          <div style={{ color: "#8E8D91", fontSize: "12px", marginTop: "4px" }}>
            Billed to: <span style={{ color: "#FFFFFF" }}>{booking?.name}</span> ({booking?.email})
          </div>
        </div>

        {/* Apple Pay Visual simulation button */}
        <button className="apple-pay-btn" onClick={handleApplePaySubmit}>
          Pay with <span className="apple-pay-logo"> Pay</span>
        </button>

        <div className="ziina-sim-separator">or pay with card</div>

        {/* Credit Card Input Form */}
        <form onSubmit={handleCardSubmit}>
          <div className="ziina-form-group">
            <input
              type="text"
              className="ziina-form-input"
              placeholder="Cardholder Name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
          </div>

          <div className="ziina-form-group" style={{ position: "relative" }}>
            <input
              type="text"
              className="ziina-form-input"
              placeholder="Card Number (XXXX XXXX XXXX XXXX)"
              value={cardNumber}
              onChange={handleCardNumberChange}
              required
            />
            <span style={{ position: "absolute", right: "14px", top: "14px", fontSize: "16px" }}>💳</span>
          </div>

          <div className="ziina-form-row">
            <div className="ziina-form-group">
              <input
                type="text"
                className="ziina-form-input"
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                required
              />
            </div>
            <div className="ziina-form-group">
              <input
                type="password"
                className="ziina-form-input"
                placeholder="CVV"
                value={cvv}
                onChange={handleCvvChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="ziina-btn-submit">
            Pay {formatCurrency(booking?.amount || 0)}
          </button>
        </form>

        <p style={{ color: "#555357", fontSize: "10px", textAlign: "center", marginTop: "24px", lineHeight: "1.4" }}>
          By completing payment, you authorize Ziina to charge your card. 
          Processed securely in compliance with Central Bank of the UAE regulatory frameworks.
        </p>
      </div>

      {/* Simulated Apple Pay Bottom Sheet overlay */}
      {showApplePaySheet && (
        <div style={{ position: "fixed", bottom: "0", left: "0", width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "flex-end" }}>
          {/* Back click dismisses Apple Pay */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "60%" }} onClick={() => setShowApplePaySheet(false)}></div>
          
          <div style={{ width: "100%", background: "#1C1C1E", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "24px", fontFamily: "-apple-system, sans-serif", color: "#FFFFFF", zIndex: 10001, boxShadow: "0 -10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #2C2C2E", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "20px" }}></span>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>Pay</span>
              </div>
              <button 
                onClick={() => setShowApplePaySheet(false)}
                style={{ background: "#2C2C2E", border: "none", color: "#AEAEB2", padding: "6px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderBottom: "1px solid #2C2C2E", paddingBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#8E8E93" }}>MERCHANT</span>
                <span style={{ fontWeight: "500" }}>Chai &amp; Bae Club Events</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#8E8E93" }}>CARD</span>
                <span style={{ fontWeight: "500" }}>💳 Apple Gold Card (Visa •••• 8822)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "#8E8E93" }}>CONTACT</span>
                <span style={{ fontWeight: "500" }}>{booking?.email}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "700", marginTop: "8px" }}>
                <span>TOTAL</span>
                <span style={{ color: "#34C759" }}>{formatCurrency(booking?.amount || 0)}</span>
              </div>
            </div>

            {/* Apple Pay Action button */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {applePayState === "idle" && (
                <button 
                  onClick={confirmApplePay}
                  style={{ width: "100%", background: "#FFFFFF", color: "#000000", border: "none", borderRadius: "12px", padding: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                >
                  <span> Pay with Touch ID / Password</span>
                </button>
              )}

              {applePayState === "paying" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div className="loader-dots">
                    <span className="loader-dot" style={{ background: "#FFFFFF" }}></span>
                    <span className="loader-dot" style={{ background: "#FFFFFF" }}></span>
                    <span className="loader-dot" style={{ background: "#FFFFFF" }}></span>
                  </div>
                  <span style={{ color: "#AEAEB2", fontSize: "13px" }}>Authenticating secure FaceID...</span>
                </div>
              )}

              {applePayState === "complete" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ background: "#34C759", color: "#FFFFFF", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", alignContent: "center", fontSize: "24px", fontWeight: "bold" }}>✓</div>
                  <span style={{ color: "#34C759", fontSize: "14px", fontWeight: "600" }}>Apple Pay Approved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap Content in Suspense to safely use search parameters in Next.js App Router
export default function ZiinaSimulatorPage() {
  return (
    <Suspense fallback={<SimulatorFallback />}>
      <SimulatorContent />
    </Suspense>
  );
}
