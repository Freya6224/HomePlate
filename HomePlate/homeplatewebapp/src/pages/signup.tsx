import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

const SignUp = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedRole = sessionStorage.getItem("role") as "buyer" | "seller" | null;
    if (savedRole) setRole(savedRole);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      // const { error: authError } = await supabase.auth.signUp({
      //   email: formData.email, password: formData.password,
      //   options: { data: { full_name: formData.name, role } },
      // });
      // if (authError) throw authError;
      setSuccess(true);
      setTimeout(() => { sessionStorage.setItem("role", role); navigate("/signin"); }, 2000);
    } catch (err: any) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = role === "buyer";
  const accent = isBuyer ? "#ff7043" : "#43a047";

  return (
    <div style={styles.page}>
      <div style={styles.blobTop} />
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>← Back</button>

        <div style={styles.brand}>
          <span>🍽️</span>
          <span style={styles.brandName}>HomePlate</span>
        </div>

        <h2 style={styles.title}>Create an account</h2>
        <p style={styles.subtitle}>Join the HomePlate community</p>

        <div style={styles.roleToggle}>
          <button style={{ ...styles.roleBtn, background: isBuyer ? accent : "transparent", color: isBuyer ? "#fff" : "#888" }}
            onClick={() => { setRole("buyer"); sessionStorage.setItem("role", "buyer"); }}>
            🛒 Buyer
          </button>
          <button style={{ ...styles.roleBtn, background: !isBuyer ? accent : "transparent", color: !isBuyer ? "#fff" : "#888" }}
            onClick={() => { setRole("seller"); sessionStorage.setItem("role", "seller"); }}>
            👨‍🍳 Seller
          </button>
        </div>

        {success ? (
          <div style={styles.successBox}>
            <span style={{ fontSize: 32 }}>🎉</span>
            <p style={{ margin: "8px 0 0", fontWeight: 600, color: "#2e7d32" }}>Account created! Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Jane Smith" required style={{ ...styles.input, outlineColor: accent }} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@example.com" required style={{ ...styles.input, outlineColor: accent }} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Min. 6 characters" required style={{ ...styles.input, outlineColor: accent }} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••" required style={{ ...styles.input, outlineColor: accent }} />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, background: accent }}>
              {loading ? "Creating account…" : `Sign Up as ${isBuyer ? "Buyer" : "Seller"}`}
            </button>
          </form>
        )}

        <p style={styles.switchText}>
          Already have an account?{" "}
          <span style={{ ...styles.link, color: accent }} onClick={() => navigate("/signin")}>Sign in</span>
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh", background: "linear-gradient(160deg, #fffde7 0%, #fff3e0 60%, #fce4ec 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden", padding: "24px 16px",
  },
  blobTop: {
    position: "absolute", bottom: -150, left: -100, width: 400, height: 400,
    borderRadius: "50%", background: "rgba(102, 187, 106, 0.1)", filter: "blur(80px)", pointerEvents: "none",
  },
  card: {
    background: "#fff", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 420,
    boxShadow: "0 8px 40px rgba(0,0,0,0.1)", position: "relative", zIndex: 1,
  },
  backBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 20, fontFamily: "'Segoe UI', sans-serif" },
  brand: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 20 },
  brandName: { fontWeight: 700, background: "linear-gradient(135deg, #e64a19, #f57f17)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Georgia', serif" },
  title: { fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: "#2d2d2d", fontFamily: "'Georgia', serif" },
  subtitle: { fontSize: 14, color: "#999", margin: "0 0 24px" },
  roleToggle: { display: "flex", background: "#f5f5f5", borderRadius: 50, padding: 4, marginBottom: 28 },
  roleBtn: { flex: 1, border: "none", borderRadius: 50, padding: "10px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", fontFamily: "'Segoe UI', sans-serif" },
  form: { display: "flex", flexDirection: "column" as const, gap: 14 },
  field: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  input: { padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 15, outline: "none", fontFamily: "'Segoe UI', sans-serif" },
  error: { color: "#e53935", fontSize: 13, margin: 0, padding: "8px 12px", background: "#ffeaea", borderRadius: 8 },
  successBox: { textAlign: "center", padding: "32px 0", fontFamily: "'Segoe UI', sans-serif" },
  submitBtn: { padding: "13px", borderRadius: 50, border: "none", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4, fontFamily: "'Segoe UI', sans-serif" },
  switchText: { textAlign: "center", marginTop: 20, fontSize: 14, color: "#888" },
  link: { cursor: "pointer", fontWeight: 600, textDecoration: "underline" },
};

export default SignUp;