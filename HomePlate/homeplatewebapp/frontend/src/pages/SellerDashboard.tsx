import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_ORDERS = [
  { id: "ORD-001", buyer: "Alex M.", dish: "Homemade Lasagna x2", total: 24, status: "New", time: "2 min ago" },
  { id: "ORD-002", buyer: "Sarah K.", dish: "Tiramisu x3", total: 21, status: "Preparing", time: "18 min ago" },
  { id: "ORD-003", buyer: "James L.", dish: "Homemade Lasagna x1", total: 12, status: "Ready", time: "35 min ago" },
  { id: "ORD-004", buyer: "Priya N.", dish: "Tiramisu x2", total: 14, status: "Delivered", time: "1 hr ago" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  New:       { bg: "#fff3e0", color: "#e65100" },
  Preparing: { bg: "#e3f2fd", color: "#1565c0" },
  Ready:     { bg: "#e8f5e9", color: "#2e7d32" },
  Delivered: { bg: "#f3e5f5", color: "#6a1b9a" },
};

const NEXT_STATUS: Record<string, string> = {
  New: "Preparing", Preparing: "Ready", Ready: "Delivered",
};

const SellerPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "stats">("orders");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", price: "", description: "" });

  const advanceOrder = (id: string) => {
    setOrders((prev) => prev.map((o) =>
      o.id === id && NEXT_STATUS[o.status] ? { ...o, status: NEXT_STATUS[o.status] } : o
    ));
  };

  const activeOrders = orders.filter((o) => o.status !== "Delivered");
  const revenue = orders.filter((o) => o.status === "Delivered").reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 24 }}>🍽️</span>
          <span style={styles.logo}>HomePlate</span>
          <span style={styles.sellerBadge}>Seller</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.addDishBtn} onClick={() => setShowAddModal(true)}>+ Add Dish</button>
          <button style={styles.signOutBtn} onClick={() => { sessionStorage.clear(); navigate("/"); }}>Sign Out</button>
        </div>
      </header>

      <div style={styles.statsBar}>
        {[
          { value: activeOrders.length, label: "Active Orders" },
          { value: `$${revenue}`, label: "Today's Revenue" },
          { value: "4.9 ⭐", label: "Rating" },
          { value: 24, label: "Total Orders" },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.statValue}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.tabs}>
        {(["orders", "menu", "stats"] as const).map((tab) => (
          <button key={tab} style={{
            ...styles.tab,
            borderBottom: activeTab === tab ? "3px solid #43a047" : "3px solid transparent",
            color: activeTab === tab ? "#43a047" : "#888",
            fontWeight: activeTab === tab ? 700 : 400,
          }} onClick={() => setActiveTab(tab)}>
            {tab === "orders" ? "📋 Orders" : tab === "menu" ? "🍽️ My Menu" : "📊 Stats"}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === "orders" && (
          <>
            <h2 style={styles.sectionTitle}>Order Queue</h2>
            <div style={styles.orderList}>
              {orders.map((order) => {
                const s = STATUS_COLORS[order.status];
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <span style={styles.orderId}>{order.id}</span>
                      <span style={{ ...styles.statusBadge, background: s.bg, color: s.color }}>{order.status}</span>
                    </div>
                    <p style={styles.orderDish}>{order.dish}</p>
                    <div style={styles.orderFooter}>
                      <div>
                        <p style={styles.orderBuyer}>👤 {order.buyer}</p>
                        <p style={styles.orderTime}>🕐 {order.time}</p>
                      </div>
                      <div style={styles.orderRight}>
                        <span style={styles.orderTotal}>${order.total}</span>
                        {NEXT_STATUS[order.status] && (
                          <button style={styles.advanceBtn} onClick={() => advanceOrder(order.id)}>
                            Mark as {NEXT_STATUS[order.status]} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {activeTab === "menu" && (
          <div style={styles.placeholder}>
            <span style={{ fontSize: 56 }}>🍳</span>
            <h3 style={{ margin: "16px 0 8px", color: "#333" }}>Your Menu</h3>
            <p style={{ color: "#888", marginBottom: 24 }}>Add dishes to start receiving orders.</p>
            <button style={styles.addDishBtnLarge} onClick={() => setShowAddModal(true)}>+ Add Your First Dish</button>
          </div>
        )}
        {activeTab === "stats" && (
          <div style={styles.placeholder}>
            <span style={{ fontSize: 56 }}>📊</span>
            <h3 style={{ margin: "16px 0 8px", color: "#333" }}>Analytics</h3>
            <p style={{ color: "#888" }}>Detailed analytics will appear here once Supabase is connected.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add a New Dish</h3>
            {["name", "price", "description"].map((field) => (
              <div key={field} style={styles.field}>
                <label style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input style={styles.input}
                  placeholder={field === "name" ? "e.g. Grandma's Lasagna" : field === "price" ? "e.g. 12" : "A short description"}
                  type={field === "price" ? "number" : "text"}
                  value={(newDish as any)[field]}
                  onChange={(e) => setNewDish({ ...newDish, [field]: e.target.value })} />
              </div>
            ))}
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={() => {
                alert(`"${newDish.name}" saved! (Wire up Supabase to persist)`);
                setNewDish({ name: "", price: "", description: "" });
                setShowAddModal(false);
              }}>Save Dish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: { minHeight: "100vh", background: "#f5f7f5", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #e64a19, #f57f17)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Georgia', serif" },
  sellerBadge: { background: "#e8f5e9", color: "#2e7d32", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 50 },
  headerRight: { display: "flex", gap: 10 },
  addDishBtn: { background: "#43a047", color: "#fff", border: "none", borderRadius: 50, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  signOutBtn: { background: "none", border: "1.5px solid #e0e0e0", borderRadius: 50, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#888" },
  statsBar: { display: "flex", gap: 16, padding: "20px 32px", background: "linear-gradient(135deg, #388e3c, #66bb6a)", flexWrap: "wrap" as const },
  statCard: { flex: 1, minWidth: 120, background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 4 },
  statValue: { fontSize: 26, fontWeight: 700, color: "#fff" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 },
  tabs: { display: "flex", background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 32px" },
  tab: { padding: "16px 20px", background: "none", border: "none", borderBottom: "3px solid transparent", cursor: "pointer", fontSize: 14, fontFamily: "'Segoe UI', sans-serif", transition: "all 0.2s ease" },
  content: { padding: "28px 32px", maxWidth: 900, margin: "0 auto" },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#444", margin: "0 0 20px" },
  orderList: { display: "flex", flexDirection: "column" as const, gap: 14 },
  orderCard: { background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderId: { fontSize: 13, fontWeight: 700, color: "#888" },
  statusBadge: { padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 700 },
  orderDish: { fontSize: 16, fontWeight: 600, color: "#2d2d2d", margin: "0 0 12px" },
  orderFooter: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  orderBuyer: { fontSize: 13, color: "#555", margin: "0 0 4px" },
  orderTime: { fontSize: 12, color: "#aaa", margin: 0 },
  orderRight: { display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 8 },
  orderTotal: { fontSize: 20, fontWeight: 700, color: "#2e7d32" },
  advanceBtn: { background: "#43a047", color: "#fff", border: "none", borderRadius: 50, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  placeholder: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  addDishBtnLarge: { background: "#43a047", color: "#fff", border: "none", borderRadius: 50, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 },
  modal: { background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 24px", color: "#2d2d2d", fontFamily: "'Georgia', serif" },
  field: { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  input: { padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 15, outline: "none", fontFamily: "'Segoe UI', sans-serif" },
  modalBtns: { display: "flex", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: "12px", borderRadius: 50, border: "1.5px solid #e0e0e0", background: "none", cursor: "pointer", fontSize: 14, color: "#888" },
  saveBtn: { flex: 1, padding: "12px", borderRadius: 50, border: "none", background: "#43a047", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 },
};

export default SellerPage;