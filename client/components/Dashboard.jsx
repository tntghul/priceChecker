import { useState, useEffect } from "react";
import PriceAlerts from "./PriceAlerts";

const LOGOS = {
  croma: (
    <svg width="14" height="14" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="6" fill="#FF6B00" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="700" fill="white" fontFamily="Arial">C</text>
    </svg>
  ),
  flipkart: (
    <svg width="14" height="14" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="6" fill="#2874F0" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFE500" fontFamily="Arial">F</text>
    </svg>
  ),
  amazon: (
    <svg width="14" height="14" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="6" fill="#232F3E" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="700" fill="#FF9900" fontFamily="Arial">a</text>
    </svg>
  ),
};

const getSiteMeta = (website = "") => {
  const w = website.toLowerCase();
  if (w.includes("croma"))    return { color: "#FF6B00", bg: "#FFF0E6", logo: LOGOS.croma,    label: "Croma" };
  if (w.includes("flipkart")) return { color: "#2874F0", bg: "#EAF1FF", logo: LOGOS.flipkart, label: "Flipkart" };
  if (w.includes("amazon"))   return { color: "#FF9900", bg: "#FFF4E0", logo: LOGOS.amazon,   label: "Amazon" };
  return { color: "#888", bg: "#f3f3f3", logo: null, label: website || "Unknown" };
};

const formatPrice = (p) => Number(p).toLocaleString("en-IN");

const SiteBadge = ({ website }) => {
  const m = getSiteMeta(website);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 6,
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 500,
    }}>
      {m.logo} {m.label}
    </span>
  );
};

const FEATURES = [
  { icon: "🔍", label: "Product Search" },
  { icon: "🌐", label: "Multi-site Scraping" },
  { icon: "💰", label: "Lowest Price Detection" },
  { icon: "🖼️", label: "Product Images & Ratings" },
  { icon: "📜", label: "Search History (MongoDB)" },
  { icon: "🔔", label: "Price Alerts" },
  { icon: "📊", label: "Analytics Dashboard" },
];

const Spinner = () => (
  <div style={{ textAlign: "center", padding: "3rem 0" }}>
    <div style={{
      width: 40, height: 40, margin: "0 auto 16px",
      border: "3px solid #f0f0f0",
      borderTop: "3px solid #111",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
      Searching across Croma, Flipkart &amp; Amazon…
    </p>
    <p style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
      This may take 20–30 seconds
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Dashboard = () => {
  const [query, setQuery]         = useState("");
  const [products, setProducts]   = useState([]);
  const [bestDeal, setBestDeal]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [searched, setSearched]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  const getHistory = async () => {
    try {
      const res  = await fetch("http://localhost:5000/api/products/history");
      const data = await res.json();
      setHistory(data);
    } catch (e) { setHistory([]); }
  };

  const searchProduct = async (searchText = query) => {
    if (!searchText.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res  = await fetch(`http://localhost:5000/api/products/search?name=${encodeURIComponent(searchText)}`);
      const data = await res.json();
      setProducts(data.products || []);
      setBestDeal(data.bestDeal || null);
      setSearched(true);
      getHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (text) => {
    setQuery(text);
    searchProduct(text);
  };

  useEffect(() => { getHistory(); }, []);

  const tabStyle = (tab) => ({
    padding: "8px 18px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    background: activeTab === tab ? "#111" : "transparent",
    color: activeTab === tab ? "#fff" : "#888",
    transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem", fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
          🔍 Best Deal Finder
        </h1>
        <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          Compare prices across Croma, Flipkart &amp; Amazon instantly
        </p>
      </div>

      {/* FEATURES STRIP */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
        justifyContent: "center", marginBottom: "1.75rem",
      }}>
        {FEATURES.map((f, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#f7f7f7", border: "1px solid #ebebeb",
            borderRadius: 20, padding: "5px 12px",
            fontSize: 12, color: "#444", fontWeight: 500,
          }}>
            {f.icon} {f.label}
          </span>
        ))}
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", gap: 4,
        background: "#f5f5f5", borderRadius: 12,
        padding: 4, marginBottom: "1.5rem", width: "fit-content",
      }}>
        <button style={tabStyle("search")}    onClick={() => setActiveTab("search")}>🔎 Search</button>
        <button style={tabStyle("alerts")}    onClick={() => setActiveTab("alerts")}>🔔 Price Alerts</button>
        <button style={tabStyle("analytics")} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
      </div>

      {/* ── SEARCH TAB ── */}
      {activeTab === "search" && (
        <>
          {/* SEARCH BOX */}
          <div style={{
            display: "flex", gap: 8,
            background: "#fff", border: "1px solid #e0e0e0",
            borderRadius: 14, padding: "6px 6px 6px 14px",
            alignItems: "center", marginBottom: "1.5rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <input
              type="text"
              placeholder="Search for a product…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProduct()}
              disabled={loading}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, background: "transparent",
                opacity: loading ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => searchProduct()}
              disabled={loading}
              style={{
                background: loading ? "#888" : "#111",
                color: "#fff", border: "none",
                borderRadius: 10, padding: "9px 20px",
                fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "background 0.15s",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 12, height: 12,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Searching…
                </>
              ) : "Search"}
            </button>
          </div>

          {/* SPINNER */}
          {loading && <Spinner />}

          {/* RESULTS */}
          {!loading && searched && (
            <>
              {/* ✅ BEST DEAL — with image + view details */}
              {bestDeal && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 8 }}>
                    Best deal
                  </p>
                  <div style={{
                    background: "#fff", border: "1px solid #e8e8e8",
                    borderRadius: 16, padding: "1.25rem 1.5rem",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

                      {/* Product Image */}
                      <div style={{
                        width: 90, height: 90, borderRadius: 10,
                        background: "#fafafa", border: "1px solid #ebebeb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, overflow: "hidden",
                      }}>
                        {bestDeal.image ? (
                          <img
                            src={bestDeal.image}
                            alt={bestDeal.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span style={{ fontSize: 32 }}>🛍️</span>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#22a06b", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>
                          Best price
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, maxWidth: 280 }}>
                          {bestDeal.name}
                        </div>
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <SiteBadge website={bestDeal.website} />
                          {bestDeal.url && (
                            <a
                              href={bestDeal.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 12, color: "#2874F0",
                                textDecoration: "none",
                                border: "1px solid #e0e9ff",
                                borderRadius: 8, padding: "3px 10px",
                                display: "inline-flex", alignItems: "center", gap: 4,
                              }}
                            >
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 30, fontWeight: 700 }}>
                        <span style={{ fontSize: 16, verticalAlign: "top", marginTop: 6, display: "inline-block" }}>₹</span>
                        {formatPrice(bestDeal.price)}
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Lowest across 3 sites</div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTS GRID */}
              {products.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 10 }}>
                    All results ({products.length})
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                  }}>
                    {products.map((item, i) => (
                      <div key={i} style={{
                        background: "#fff", border: "1px solid #ebebeb",
                        borderRadius: 14, padding: "1rem",
                        display: "flex", flexDirection: "column", gap: 8,
                      }}>
                        {item.image ? (
                          <img
                            src={item.image} alt={item.name}
                            style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 8, background: "#fafafa" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div style={{
                            width: "100%", height: 120, borderRadius: 8,
                            background: "#f5f5f5", display: "flex",
                            alignItems: "center", justifyContent: "center", fontSize: 32,
                          }}>🛍️</div>
                        )}
                        <SiteBadge website={item.website} />
                        <div style={{
                          fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {item.name}
                        </div>
                        {item.rating && (
                          <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>
                            {"★".repeat(Math.round(item.rating))}
                            {"☆".repeat(5 - Math.round(item.rating))}
                            <span style={{ color: "#888", marginLeft: 4 }}>{item.rating}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: "auto" }}>
                          <span style={{ fontSize: 12, verticalAlign: "top", marginTop: 3, display: "inline-block" }}>₹</span>
                          {formatPrice(item.price)}
                        </div>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" style={{
                            fontSize: 12, color: "#2874F0", textDecoration: "none",
                            border: "1px solid #e0e9ff", borderRadius: 8,
                            padding: "5px 10px", textAlign: "center", marginTop: 4,
                          }}>
                            View Product →
                          </a>
                        ) : (
                          <span style={{
                            fontSize: 12, color: "#bbb",
                            border: "1px solid #f0f0f0", borderRadius: 8,
                            padding: "5px 10px", textAlign: "center", marginTop: 4,
                          }}>
                            Link unavailable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* HISTORY */}
          <div style={{
            background: "#fff", border: "1px solid #ebebeb",
            borderRadius: 14, padding: "1rem 1.25rem",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 12 }}>
              Recent searches
            </p>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "0.75rem 0" }}>No history yet</p>
            ) : (
              history.slice(0, 5).map((item, i, arr) => (
                <div
                  key={i}
                  onClick={() => handleHistoryClick(item.productName)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
                    cursor: "pointer", fontSize: 13, color: "#666",
                  }}
                >
                  🔎 {item.productName}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── PRICE ALERTS TAB ── */}
      {activeTab === "alerts" && <PriceAlerts/>}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Total Searches", value: history.length, icon: "🔍" },
              { label: "Sites Tracked",  value: 3,              icon: "🌐" },
              { label: "Alerts Active",  value: 0,              icon: "🔔" },
            ].map((stat, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #ebebeb",
                borderRadius: 14, padding: "1.25rem", textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 14, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 12 }}>
              Search history
            </p>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "0.75rem 0" }}>No searches yet</p>
            ) : (
              history.slice(0, 5).map((item, i, arr) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
                  fontSize: 13, color: "#444",
                }}>
                  <span>🔎 {item.productName}</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 14, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 12 }}>
              Sites monitored
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["Croma", "Flipkart", "Amazon"].map((site) => (
                <span key={site} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <SiteBadge website={site} />
                  <span style={{ fontSize: 11, color: "#22a06b", fontWeight: 500 }}>● Active</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
