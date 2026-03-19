import { useState, useRef, useEffect } from "react";

const PRODUCTS = [
  { id: 1, name: "Blue Dream", type: "flower", category: "recreational", thc: "22%", cbd: "1%", price: 45, weight: "3.5g", effect: "Euphoric & Creative", strain: "Sativa-dominant Hybrid", desc: "A classic West Coast strain with a sweet berry aroma. Perfect for daytime creativity.", img: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&q=80" },
  { id: 2, name: "CBD Relief Tincture", type: "tincture", category: "medical", thc: "0.3%", cbd: "25%", price: 65, weight: "30ml", effect: "Calm & Pain Relief", strain: "Hemp CBD", desc: "High-potency CBD tincture for anxiety, inflammation, and chronic pain management.", img: "https://images.unsplash.com/photo-1556928045-16f7f50be0f3?w=400&q=80" },
  { id: 3, name: "OG Kush", type: "flower", category: "recreational", thc: "26%", cbd: "0.5%", price: 55, weight: "3.5g", effect: "Relaxing & Sleepy", strain: "Indica", desc: "A legendary indica with earthy pine notes. Great for evening wind-down.", img: "/og_kush.jpeg" },
  { id: 4, name: "1:1 Balance Capsules", type: "capsule", category: "medical", thc: "10mg", cbd: "10mg", price: 40, weight: "30 caps", effect: "Balanced & Therapeutic", strain: "Balanced Hybrid", desc: "Precisely dosed capsules for consistent, long-lasting medical relief.", img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" },
  { id: 5, name: "Mango Haze Vape", type: "vape", category: "recreational", thc: "85%", cbd: "2%", price: 50, weight: "0.5g", effect: "Uplifting & Focused", strain: "Sativa", desc: "Tropical mango flavor with an energizing, clear-headed high.", img: "/mango_haze.jpeg" },
  { id: 6, name: "Sleep & Restore Gummies", type: "edible", category: "medical", thc: "5mg", cbd: "15mg", price: 35, weight: "20 pcs", effect: "Sedating & Restful", strain: "Indica Blend", desc: "Nighttime formula with melatonin and calming terpenes for deep sleep.", img: "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=400&q=80" },
  { id: 7, name: "Strawberry Cough", type: "flower", category: "recreational", thc: "20%", cbd: "0.8%", price: 48, weight: "3.5g", effect: "Social & Happy", strain: "Sativa", desc: "Sweet strawberry flavor with an uplifting social buzz. Perfect for gatherings.", img: "/Strawberry_cough_strain.jpeg" },
  { id: 8, name: "Pain Relief Balm", type: "topical", category: "medical", thc: "100mg", cbd: "200mg", price: 55, weight: "60ml", effect: "Localized Relief", strain: "Full Spectrum", desc: "Targeted topical for muscle soreness, joint pain, and inflammation.", img: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80" },
  { id: 9, name: "Gelato #33", type: "flower", category: "recreational", thc: "25%", cbd: "0.6%", price: 60, weight: "3.5g", effect: "Euphoric & Relaxed", strain: "Hybrid", desc: "Dessert-like sweetness with a powerful, balanced high for experienced users.", img: "/Gelato_ice_cream.jpeg" },
];

const CATEGORIES = ["all", "recreational", "medical"];
const TYPES = ["all", "flower", "vape", "edible", "tincture", "capsule", "topical", "accessory"];
const INITIAL_MESSAGES = [{ role: "assistant", content: "Welcome! I'm your AI Budtender 🌿 Tell me what you're looking for — relaxation, pain relief, creativity, sleep — and I'll find the perfect product for you." }];
const INVITE_CODE = "BUDT2024";
const API = "http://localhost:8000";

const imgStyle = { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "contrast(1.1) saturate(1.15) brightness(1.04)", transition: "transform 0.4s" };

export default function Budtender() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", mode: "login", fullName: "", inviteCode: "" });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;
    if (loginForm.mode === "signup") {
      if (!loginForm.fullName) { showToast("❌ Please enter your full name"); return; }
      if (loginForm.inviteCode.toUpperCase() !== INVITE_CODE) { showToast("❌ Invalid invite code"); return; }
    }
    try {
      const endpoint = loginForm.mode === "login" ? "/auth/login" : "/auth/register";
      const body = loginForm.mode === "login"
        ? { email: loginForm.email, password: loginForm.password }
        : { email: loginForm.email, password: loginForm.password, full_name: loginForm.fullName };
      const resp = await fetch(`${API}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("budtender_token", data.access_token);
      setUser({ name: data.user.full_name, email: data.user.email, type: data.user.user_type });
      setPage("dashboard");
      showToast(`Welcome, ${data.user.full_name}! 🌿`);
    } catch (err) { showToast(`❌ ${err.message}`); }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.name} added to cart ✓`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === "all" || p.category === category;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.effect.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchType && matchSearch;
  });

  const sendMessage = async () => {
    if (!inputMsg.trim() || loading) return;
    const userMsg = inputMsg.trim();
    setInputMsg("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const token = localStorage.getItem("budtender_token");
      const resp = await fetch(`${API}/ai/chat`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await resp.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Try asking again!" }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Having trouble connecting. Please try again!" }]);
    }
    setLoading(false);
  };

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Lato', sans-serif", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/cannabis.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(20,40,20,0.93) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", overflow: "hidden", margin: "0 auto 14px", border: "2px solid #c9a84c" }}>
            <img src="/cannabis.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} alt="" />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "2px" }}>Budtender</div>
          <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "4px", textTransform: "uppercase", marginTop: 6 }}>Premium Cannabis Dispensary</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "36px 36px 32px" }}>
          <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4 }}>
            {["login", "signup"].map(mode => (
              <button key={mode} onClick={() => setLoginForm(f => ({ ...f, mode }))} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", transition: "all 0.2s", background: loginForm.mode === mode ? "#c9a84c" : "transparent", color: loginForm.mode === mode ? "#0a0a0a" : "rgba(255,255,255,0.5)", fontFamily: "'Lato', sans-serif" }}>
                {mode === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <form onSubmit={handleLogin}>
            {loginForm.mode === "signup" && (
              <input style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "'Lato', sans-serif" }} placeholder="Full name" value={loginForm.fullName} onChange={e => setLoginForm(f => ({ ...f, fullName: e.target.value }))} />
            )}
            <input style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "'Lato', sans-serif" }} placeholder="Email address" type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
            <input style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "'Lato', sans-serif" }} placeholder="Password" type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
            {loginForm.mode === "signup" && (
              <input style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12, fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "'Lato', sans-serif" }} placeholder="🔑 Invite code" value={loginForm.inviteCode} onChange={e => setLoginForm(f => ({ ...f, inviteCode: e.target.value }))} />
            )}
            <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#0a0a0a", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Lato', sans-serif", marginTop: 6 }}>
              {loginForm.mode === "login" ? "Enter the Store" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#c9a84c", color: "#0a0a0a", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999 }}>{toast}</div>}
    </div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "'Lato', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "rgba(15,15,15,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(201,168,76,0.15)", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: "1px solid #c9a84c" }}>
            <img src="/cannabis.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} alt="" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, letterSpacing: "1px" }}>Budtender</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setChatOpen(o => !o)} style={{ padding: "8px 18px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, color: "#c9a84c", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🤖 AI Budtender</button>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>👤 {user?.name}</span>
          <button onClick={() => setCartOpen(true)} style={{ padding: "8px 20px", background: "#c9a84c", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0a0a0a", display: "flex", alignItems: "center", gap: 8 }}>
            🛒 Cart {cartCount > 0 && <span style={{ background: "#0a0a0a", color: "#c9a84c", borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{cartCount}</span>}
          </button>
          <button onClick={() => { localStorage.removeItem("budtender_token"); setPage("login"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>Sign Out</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
        <img src="/cannabis.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.96) 35%, rgba(10,10,10,0.2) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 60px" }}>
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Welcome back, {user?.name}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>Premium Cannabis<br /><span style={{ color: "#c9a84c" }}>Hand Curated</span> For You</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setCategory("recreational")} style={{ padding: "11px 24px", background: "#c9a84c", border: "none", borderRadius: 25, color: "#0a0a0a", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🎉 Recreational</button>
              <button onClick={() => setCategory("medical")} style={{ padding: "11px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 25, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>⚕️ Medical</button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px" }}>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search products..." style={{ flex: 1, minWidth: 200, padding: "11px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 25, fontSize: 14, color: "#fff", outline: "none", fontFamily: "'Lato', sans-serif" }} />
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: "9px 20px", borderRadius: 25, border: "1px solid", borderColor: category === c ? "#c9a84c" : "rgba(255,255,255,0.1)", background: category === c ? "#c9a84c" : "transparent", color: category === c ? "#0a0a0a" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
              {c === "all" ? "All" : c === "recreational" ? "🎉 Recreational" : "⚕️ Medical"}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "7px 15px", borderRadius: 25, border: "1px solid", borderColor: typeFilter === t ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.08)", background: typeFilter === t ? "rgba(201,168,76,0.1)" : "transparent", color: typeFilter === t ? "#c9a84c" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {filtered.map((p, index) => index % 2 === 0 ? (

            // ── DESIGN A: Gold theme ──
            <div key={p.id} onClick={() => setSelectedProduct(p)}
              style={{ background: "#1a1a1a", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.3s", display: "flex", flexDirection: "column" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              <div style={{ position: "relative", height: 220, overflow: "hidden", background: "#111" }}>
                <img src={p.img} alt={p.name} style={{ ...imgStyle }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.07)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                  onError={e => { e.target.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,26,0.9) 0%, transparent 55%)" }} />
                <span style={{ position: "absolute", top: 14, left: 14, padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", background: p.category === "medical" ? "rgba(59,130,246,0.9)" : "rgba(201,168,76,0.9)", color: p.category === "medical" ? "#fff" : "#0a0a0a" }}>
                  {p.category === "medical" ? "⚕️ Medical" : "🎉 Rec"}
                </span>
                <div style={{ position: "absolute", bottom: 14, left: 18 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{p.strain}</div>
                </div>
              </div>
              <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600, marginBottom: 12 }}>✦ {p.effect}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>THC {p.thc}</span>
                  <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>CBD {p.cbd}</span>
                  <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{p.weight}</span>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#c9a84c" }}>${p.price}</div>
                  <button onClick={e => { e.stopPropagation(); addToCart(p); }} style={{ padding: "10px 22px", background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", borderRadius: 25, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0a0a0a", letterSpacing: "1px", textTransform: "uppercase" }}>Add to Cart</button>
                </div>
              </div>
            </div>

          ) : (

            // ── DESIGN B: Green theme ──
            <div key={p.id} onClick={() => setSelectedProduct(p)}
              style={{ background: "#141414", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.3s", display: "flex", flexDirection: "column" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(74,197,94,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              <div style={{ position: "relative", height: 200, overflow: "hidden", background: "#111" }}>
                <img src={p.img} alt={p.name} style={{ ...imgStyle }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.07)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                  onError={e => { e.target.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(20,60,20,0.6) 0%, transparent 60%)" }} />
                <span style={{ position: "absolute", top: 12, right: 12, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", background: p.category === "medical" ? "rgba(59,130,246,0.9)" : "rgba(74,197,94,0.9)", color: "#fff" }}>
                  {p.category === "medical" ? "⚕️ Medical" : "🎉 Rec"}
                </span>
                <div style={{ position: "absolute", bottom: 12, right: 14, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>${p.price}</div>
              </div>
              <div style={{ padding: "18px 20px 20px", borderLeft: "3px solid #4ac55e", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{p.strain} · {p.weight}</div>
                <div style={{ fontSize: 12, color: "#4ac55e", fontWeight: 600, marginBottom: 14 }}>● {p.effect}</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  <span style={{ padding: "3px 10px", background: "rgba(74,197,94,0.08)", border: "1px solid rgba(74,197,94,0.2)", borderRadius: 20, fontSize: 11, color: "#4ac55e", fontWeight: 600 }}>THC {p.thc}</span>
                  <span style={{ padding: "3px 10px", background: "rgba(74,197,94,0.08)", border: "1px solid rgba(74,197,94,0.2)", borderRadius: 20, fontSize: 11, color: "#4ac55e", fontWeight: 600 }}>CBD {p.cbd}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); addToCart(p); }} style={{ marginTop: "auto", width: "100%", padding: "11px", background: "transparent", border: "1px solid #4ac55e", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#4ac55e", letterSpacing: "1px", textTransform: "uppercase", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.background = "#4ac55e"; e.target.style.color = "#0a0a0a"; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#4ac55e"; }}>
                  + Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>No products found</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Try adjusting your filters</div>
          </div>
        )}
      </div>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div onClick={() => setSelectedProduct(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a1a", borderRadius: 24, width: "100%", maxWidth: 540, overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ position: "relative", height: 260, background: "#111" }}>
              <img src={selectedProduct.img} alt={selectedProduct.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", filter: "contrast(1.1) saturate(1.15) brightness(1.04)" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,26,1) 0%, transparent 55%)" }} />
              <button onClick={() => setSelectedProduct(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{selectedProduct.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>{selectedProduct.strain} · {selectedProduct.weight}</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 18 }}>{selectedProduct.desc}</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
                <span style={{ padding: "5px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>THC {selectedProduct.thc}</span>
                <span style={{ padding: "5px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>CBD {selectedProduct.cbd}</span>
                <span style={{ padding: "5px 12px", background: "rgba(201,168,76,0.1)", borderRadius: 20, fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>✦ {selectedProduct.effect}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#c9a84c" }}>${selectedProduct.price}</div>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} style={{ padding: "13px 30px", background: "#c9a84c", border: "none", borderRadius: 25, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#0a0a0a", letterSpacing: "1px" }}>Add to Cart 🛒</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 390, background: "#111", borderLeft: "1px solid rgba(201,168,76,0.15)", display: "flex", flexDirection: "column", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>Your Cart</div>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Your cart is empty</div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", background: "#222", flexShrink: 0 }}>
                        <img src={item.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} onError={e => e.target.style.display = "none"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>${item.price} · {item.weight}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, background: "none", color: "#fff", cursor: "pointer" }}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, background: "none", color: "#fff", cursor: "pointer" }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 18 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 18, borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Total</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#c9a84c", fontWeight: 700 }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={() => { showToast("Order placed! 🎉"); setCart([]); setCartOpen(false); }} style={{ width: "100%", padding: "15px", background: "#c9a84c", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#0a0a0a", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Checkout · ${cartTotal.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI CHAT */}
      {chatOpen && (
        <div style={{ position: "fixed", bottom: 100, right: 28, width: 350, height: 490, background: "#1a1a1a", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 150, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a0a, #2a2010)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "1px solid #c9a84c" }}>
              <img src="/cannabis.png" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} alt="" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display', serif" }}>AI Budtender</div>
              <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "1px" }}>ONLINE · READY TO HELP</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#111" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "#c9a84c" : "#1a1a1a", color: m.role === "user" ? "#0a0a0a" : "#fff", alignSelf: m.role === "user" ? "flex-end" : "flex-start", fontSize: 13, lineHeight: 1.6, border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                {m.content}
              </div>
            ))}
            {loading && <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: "16px 16px 16px 4px", background: "#1a1a1a", color: "rgba(255,255,255,0.4)", fontSize: 13, border: "1px solid rgba(255,255,255,0.08)" }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#1a1a1a" }}>
            <input style={{ flex: 1, padding: "9px 13px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13, color: "#fff", outline: "none", fontFamily: "'Lato', sans-serif" }} placeholder="Ask about products..." value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} style={{ padding: "9px 14px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>➤</button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setChatOpen(o => !o)} style={{ position: "fixed", bottom: 28, right: 28, width: 58, height: 58, borderRadius: "50%", background: "#c9a84c", border: "none", cursor: "pointer", fontSize: 24, boxShadow: "0 8px 32px rgba(201,168,76,0.4)", zIndex: 150 }}>🌿</button>

      {/* TOAST */}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#c9a84c", color: "#0a0a0a", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}
