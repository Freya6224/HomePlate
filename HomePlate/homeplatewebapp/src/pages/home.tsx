import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type Step = "pick-role" | "pick-auth";

const Home = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("pick-role");
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleRoleSelect = (r: "buyer" | "seller") => {
    setRole(r);
    sessionStorage.setItem("role", r);
    setStep("pick-auth");
  };

  const handleAuth = (type: "signin" | "signup") => {
    navigate(`/${type}`);
  };

  const isBuyer = role === "buyer";
  const accent = isBuyer ? "#ff7043" : "#43a047";
  const accentLight = isBuyer ? "#fff8f5" : "#f5fff6";

  return (
    <div style={styles.page}>
      <div style={styles.blobTopRight} />
      <div style={styles.blobBottomLeft} />

      <div style={styles.container}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🍽️</span>
          <h1 style={styles.brandName}>HomePlate</h1>
        </div>

        {step === "pick-role" && (
          <>
            <p style={styles.tagline}>Real food. Real kitchens. Real people.</p>
            <p style={styles.subTagline}>
              Connect with homemade food vendors in your neighborhood or share your own cooking with the world.
            </p>
            <div style={styles.cardRow}>
              {/* Buyer */}
              <div
                style={{
                  ...styles.card,
                  ...(hovered === "buyer" ? styles.cardHovered : {}),
                  background: hovered === "buyer"
                    ? "linear-gradient(145deg, #ff7043, #ff8a65)"
                    : "linear-gradient(145deg, #fff8f5, #ffe8df)",
                }}
                onMouseEnter={() => setHovered("buyer")}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleRoleSelect("buyer")}
              >
                <div style={styles.cardEmoji}>🛒</div>
                <h2 style={{ ...styles.cardTitle, color: hovered === "buyer" ? "#fff" : "#bf360c" }}>I'm a Buyer</h2>
                <p style={{ ...styles.cardDesc, color: hovered === "buyer" ? "rgba(255,255,255,0.9)" : "#5d4037" }}>
                  Discover local homemade meals near you.
                </p>
                <div style={{ ...styles.cardBtn, background: hovered === "buyer" ? "#fff" : "#ff7043", color: hovered === "buyer" ? "#ff7043" : "#fff" }}>
                  Find Food →
                </div>
              </div>

              <div style={styles.divider}><span style={styles.dividerText}>or</span></div>

              {/* Seller */}
              <div
                style={{
                  ...styles.card,
                  ...(hovered === "seller" ? styles.cardHovered : {}),
                  background: hovered === "seller"
                    ? "linear-gradient(145deg, #388e3c, #66bb6a)"
                    : "linear-gradient(145deg, #f5fff6, #dff5e1)",
                }}
                onMouseEnter={() => setHovered("seller")}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleRoleSelect("seller")}
              >
                <div style={styles.cardEmoji}>👨‍🍳</div>
                <h2 style={{ ...styles.cardTitle, color: hovered === "seller" ? "#fff" : "#1b5e20" }}>I'm a Seller</h2>
                <p style={{ ...styles.cardDesc, color: hovered === "seller" ? "rgba(255,255,255,0.9)" : "#33691e" }}>
                  List your dishes and grow your food business.
                </p>
                <div style={{ ...styles.cardBtn, background: hovered === "seller" ? "#fff" : "#43a047", color: hovered === "seller" ? "#43a047" : "#fff" }}>
                  Start Selling →
                </div>
              </div>
            </div>
          </>
        )}

        {step === "pick-auth" && (
          <div style={styles.authStep}>
            <button style={styles.backBtn} onClick={() => setStep("pick-role")}>← Back</button>
            <div style={{ ...styles.authIcon, background: accentLight }}>
              {isBuyer ? "🛒" : "👨‍🍳"}
            </div>
            <h2 style={{ ...styles.authTitle, color: accent }}>
              {isBuyer ? "Welcome, Buyer!" : "Welcome, Seller!"}
            </h2>
            <p style={styles.authSubtitle}>How would you like to continue?</p>

            <div style={styles.authButtons}>
              <button
                style={{ ...styles.authBtn, background: accent, color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                onClick={() => handleAuth("signup")}
              >
                Create an Account
              </button>
              <button
                style={{ ...styles.authBtnOutline, borderColor: accent, color: accent }}
                onMouseEnter={(e) => (e.currentTarget.style.background = accentLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                onClick={() => handleAuth("signin")}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #fffde7 0%, #fff3e0 50%, #fce4ec 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Georgia', serif", position: "relative", overflow: "hidden",
  },
  blobTopRight: { position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,112,67,0.12)", filter: "blur(60px)", pointerEvents: "none" },
  blobBottomLeft: { position: "absolute", bottom: -100, left: -100, width: 350, height: 350, borderRadius: "50%", background: "rgba(102,187,106,0.12)", filter: "blur(60px)", pointerEvents: "none" },
  container: { textAlign: "center", padding: "40px 24px", maxWidth: 780, width: "100%", position: "relative", zIndex: 1 },
  brand: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 },
  brandIcon: { fontSize: 42 },
  brandName: { fontSize: 48, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #e64a19, #f57f17)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px" },
  tagline: { fontSize: 22, color: "#4e342e", fontStyle: "italic", margin: "8px 0 6px" },
  subTagline: { fontSize: 15, color: "#8d6e63", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6, fontFamily: "'Segoe UI', sans-serif" },
  cardRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" as const },
  card: { width: 280, borderRadius: 20, padding: "36px 28px", cursor: "pointer", transition: "all 0.25s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" as const, border: "1.5px solid rgba(255,255,255,0.6)" },
  cardHovered: { transform: "translateY(-6px)", boxShadow: "0 16px 40px rgba(0,0,0,0.18)" },
  cardEmoji: { fontSize: 52, marginBottom: 16, display: "block" },
  cardTitle: { fontSize: 24, fontWeight: 700, margin: "0 0 12px", fontFamily: "'Georgia', serif" },
  cardDesc: { fontSize: 14, lineHeight: 1.6, margin: "0 0 24px", fontFamily: "'Segoe UI', sans-serif" },
  cardBtn: { display: "inline-block", padding: "10px 22px", borderRadius: 50, fontSize: 14, fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" },
  divider: { display: "flex", alignItems: "center", justifyContent: "center" },
  dividerText: { fontSize: 15, color: "#bcaaa4", fontStyle: "italic", fontFamily: "'Segoe UI', sans-serif" },
  // Auth step
  authStep: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 0, position: "relative" },
  backBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, alignSelf: "flex-start", marginBottom: 24, fontFamily: "'Segoe UI', sans-serif", padding: 0 },
  authIcon: { fontSize: 56, width: 100, height: 100, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  authTitle: { fontSize: 30, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Georgia', serif" },
  authSubtitle: { fontSize: 15, color: "#888", margin: "0 0 32px", fontFamily: "'Segoe UI', sans-serif" },
  authButtons: { display: "flex", flexDirection: "column" as const, gap: 12, width: "100%", maxWidth: 320 },
  authBtn: { padding: "14px", borderRadius: 50, border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s ease", fontFamily: "'Segoe UI', sans-serif" },
  authBtnOutline: { padding: "14px", borderRadius: 50, border: "2px solid", fontSize: 16, fontWeight: 600, cursor: "pointer", background: "#fff", transition: "background 0.2s ease", fontFamily: "'Segoe UI', sans-serif" },
};

export default Home;