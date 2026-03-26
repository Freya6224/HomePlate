import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_LISTINGS = [
  { id: 1, seller: "Maria's Kitchen", dish: "Homemade Lasagna", price: 12, rating: 4.9, tags: ["Italian", "Comfort Food"], emoji: "🍝", distance: "0.4 mi" },
  { id: 2, seller: "Priya's Tiffin", dish: "Dal Makhani + Rice", price: 9, rating: 4.8, tags: ["Indian", "Vegetarian"], emoji: "🍛", distance: "0.9 mi" },
  { id: 3, seller: "Grandma Rosa", dish: "Tamales (3 pack)", price: 10, rating: 5.0, tags: ["Mexican", "Traditional"], emoji: "🫔", distance: "1.2 mi" },
  { id: 4, seller: "Seoul Bites", dish: "Kimchi Fried Rice", price: 8, rating: 4.7, tags: ["Korean", "Spicy"], emoji: "🍚", distance: "1.5 mi" },
  { id: 5, seller: "Baba's Hummus", dish: "Mezze Platter", price: 14, rating: 4.9, tags: ["Middle Eastern", "Vegan"], emoji: "🧆", distance: "0.7 mi" },
  { id: 6, seller: "Nonna's Sweets", dish: "Tiramisu (2 pcs)", price: 7, rating: 4.8, tags: ["Italian", "Dessert"], emoji: "🍮", distance: "2.0 mi" },
];

const CATEGORIES = ["All", "Italian", "Indian", "Mexican", "Korean", "Vegetarian", "Vegan", "Dessert"];

const BuyerPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<number[]>([]);

  const filtered = MOCK_LISTINGS.filter((item) => {
    const matchSearch = item.dish.toLowerCase().includes(search.toLowerCase()) || item.seller.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || item.tags.includes(activeCategory);
    return matchSearch && matchCat;
  });

  const toggleCart = (id: number) => {
    setCart((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 24 }}>🍽️</span>
          <span style={styles.logo}>HomePlate</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.cartBadgeWrap}>
            <button style={styles.cartBtn} onClick={() => alert("Cart coming soon!")}>🛒 Cart</button>
            {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
          </div>
          <button style={styles.signOutBtn} onClick={() => { sessionStorage.clear(); navigate("/"); }}>Sign Out</button>
        </div>
      </header>

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>What are you craving today?</h1>
        <p style={styles.heroSub}>Homemade food, made with love, near you</p>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input type="text" placeholder="Search dishes, sellers…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
      </div>

      <div style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button key={cat} style={{
            ...styles.catBtn,
            background: activeCategory === cat ? "#ff7043" : "#fff",
            color: activeCategory === cat ? "#fff" : "#555",
            border: activeCategory === cat ? "1.5px solid #ff7043" : "1.5px solid #e0e0e0",
          }} onClick={() => setActiveCategory(cat)}>{cat}</button>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{filtered.length} listings nearby</h2>
        <div style={styles.grid}>
          {filtered.map((item) => {
            const inCart = cart.includes(item.id);
            return (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardEmoji}>{item.emoji}</div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTags}>
                    {item.tags.map((t) => <span key={t} style={styles.tag}>{t}</span>)}
                  </div>
                  <h3 style={styles.dishName}>{item.dish}</h3>
                  <p style={styles.sellerName}>by {item.seller}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.rating}>⭐ {item.rating}</span>
                    <span style={styles.distance}>📍 {item.distance}</span>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.price}>${item.price}</span>
                    <button style={{
                      ...styles.addBtn,
                      background: inCart ? "#e8f5e9" : "#ff7043",
                      color: inCart ? "#388e3c" : "#fff",
                      border: inCart ? "1.5px solid #a5d6a7" : "none",
                    }} onClick={() => toggleCart(item.id)}>
                      {inCart ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={styles.empty}><span style={{ fontSize: 48 }}>🍽️</span><p>No listings found.</p></div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: { minHeight: "100vh", background: "#fafafa", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  logo: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #e64a19, #f57f17)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Georgia', serif" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  cartBadgeWrap: { position: "relative" },
  cartBtn: { background: "#fff3ee", border: "1.5px solid #ffccbc", borderRadius: 50, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#e64a19" },
  badge: { position: "absolute", top: -6, right: -6, background: "#e53935", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  signOutBtn: { background: "none", border: "1.5px solid #e0e0e0", borderRadius: 50, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#888" },
  hero: { background: "linear-gradient(135deg, #ff7043 0%, #ffb74d 100%)", padding: "48px 32px 60px", textAlign: "center", color: "#fff" },
  heroTitle: { fontSize: 34, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Georgia', serif" },
  heroSub: { fontSize: 16, opacity: 0.9, margin: "0 0 28px" },
  searchWrap: { display: "flex", alignItems: "center", background: "#fff", borderRadius: 50, padding: "12px 20px", maxWidth: 500, margin: "0 auto", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
  searchIcon: { fontSize: 18 },
  searchInput: { border: "none", outline: "none", fontSize: 15, flex: 1, fontFamily: "'Segoe UI', sans-serif", color: "#333" },
  categories: { display: "flex", gap: 10, padding: "20px 32px", overflowX: "auto" as const, background: "#fff", borderBottom: "1px solid #f0f0f0" },
  catBtn: { borderRadius: 50, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 0.2s ease" },
  section: { padding: "28px 32px", maxWidth: 1100, margin: "0 auto" },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#555", margin: "0 0 20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  cardEmoji: { fontSize: 64, textAlign: "center", padding: "24px 0 16px", background: "linear-gradient(160deg, #fff8f5, #ffe8df)", display: "block" },
  cardBody: { padding: "16px 18px 18px" },
  cardTags: { display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 8 },
  tag: { background: "#fff3e0", color: "#e65100", borderRadius: 50, padding: "2px 10px", fontSize: 11, fontWeight: 600 },
  dishName: { fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#2d2d2d" },
  sellerName: { fontSize: 13, color: "#888", margin: "0 0 10px" },
  cardMeta: { display: "flex", gap: 14, marginBottom: 14 },
  rating: { fontSize: 13, color: "#555", fontWeight: 600 },
  distance: { fontSize: 13, color: "#888" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 20, fontWeight: 700, color: "#e64a19" },
  addBtn: { padding: "8px 16px", borderRadius: 50, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" },
  empty: { textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 16 },
};

export default BuyerPage;