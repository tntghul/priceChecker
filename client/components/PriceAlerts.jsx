import { useState, useEffect } from "react";

const SiteBadge = ({ website = "" }) => {
  const w = website.toLowerCase();
  const meta = w.includes("croma")
    ? { color: "#FF6B00", bg: "#FFF0E6", label: "Croma" }
    : w.includes("flipkart")
    ? { color: "#2874F0", bg: "#EAF1FF", label: "Flipkart" }
    : w.includes("amazon")
    ? { color: "#FF9900", bg: "#FFF4E0", label: "Amazon" }
    : { color: "#888", bg: "#f3f3f3", label: website || "Unknown" };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6,
      background: meta.bg, color: meta.color,
      fontSize: 11, fontWeight: 500,
    }}>
      {meta.label}
    </span>
  );
};

const STATUS_META = {
  active:    { label: "Active",    color: "#2874F0", bg: "#EAF1FF" },
  triggered: { label: "Triggered", color: "#22a06b", bg: "#E6F9F0" },
  deleted:   { label: "Deleted",   color: "#888",    bg: "#f3f3f3" },
};

const formatPrice = (p) => Number(p).toLocaleString("en-IN");

const PriceAlerts = () => {
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]           = useState({ productName: "", targetPrice: "", email: "" });
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [filter, setFilter]       = useState("all"); // all | active | triggered

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/alerts");
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.productName.trim() || !form.targetPrice || !form.email.trim()) {
      setError("Sabhi fields fill karo.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Valid email daalo.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productName: form.productName.trim(),
          targetPrice: Number(form.targetPrice),
          email:       form.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setSuccess(`Alert set! Jab price ₹${formatPrice(form.targetPrice)} se neeche aayega, email milega.`);
      setForm({ productName: "", targetPrice: "", email: "" });
      fetchAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/alerts/${id}`, { method: "DELETE" });
      fetchAlerts();
    } catch {}
  };

  const handleTestRun = async () => {
    try {
      await fetch("http://localhost:5000/api/alerts/test-run", { method: "POST" });
      setSuccess("Test run complete! Check console for results.");
      fetchAlerts();
    } catch {}
  };

  const filtered = alerts.filter((a) =>
    filter === "all" ? true : a.status === filter
  );

  const activeCount    = alerts.filter((a) => a.status === "active").length;
  const triggeredCount = alerts.filter((a) => a.status === "triggered").length;

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #e0e0e0", borderRadius: 10,
    fontSize: 13, outline: "none",
    boxSizing: "border-box", background: "#fff",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── SET ALERT FORM ── */}
      <div style={{
        background: "#fff", border: "1px solid #ebebeb",
        borderRadius: 14, padding: "1.25rem 1.5rem",
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", marginBottom: 14, marginTop: 0 }}>
          Set new alert
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inputStyle}
            placeholder="Product name (e.g. iPhone 15)"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: "#888",
              }}>₹</span>
              <input
                style={{ ...inputStyle, paddingLeft: 24 }}
                type="number"
                placeholder="Target price"
                value={form.targetPrice}
                onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
              />
            </div>

            <input
              style={{ ...inputStyle, flex: 2 }}
              type="email"
              placeholder="Email for notification"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {error   && <p style={{ fontSize: 12, color: "#e24b4a", margin: 0 }}>{error}</p>}
          {success && <p style={{ fontSize: 12, color: "#22a06b", margin: 0 }}>{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? "#888" : "#111",
              color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 0",
              fontSize: 13, fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {submitting ? (
              <>
                <div style={{
                  width: 12, height: 12,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                Setting alert…
              </>
            ) : "🔔 Set Alert"}
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          background: "#EAF1FF", borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2874F0" }}>{activeCount}</div>
            <div style={{ fontSize: 11, color: "#5a8ad4" }}>Active alerts</div>
          </div>
        </div>
        <div style={{
          background: "#E6F9F0", borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#22a06b" }}>{triggeredCount}</div>
            <div style={{ fontSize: 11, color: "#3d8f6a" }}>Triggered</div>
          </div>
        </div>
      </div>

      {/* ── ALERTS LIST ── */}
      <div style={{
        background: "#fff", border: "1px solid #ebebeb",
        borderRadius: 14, padding: "1.25rem 1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: "#888", margin: 0 }}>
            Your alerts
          </p>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f5f5f5", borderRadius: 8, padding: 3 }}>
            {["all", "active", "triggered"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "none",
                  fontSize: 11, fontWeight: 500, cursor: "pointer",
                  background: filter === f ? "#fff" : "transparent",
                  color: filter === f ? "#111" : "#888",
                  boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "1rem 0" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
            <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>No alerts yet. Set one above!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((alert) => {
              const s = STATUS_META[alert.status] || STATUS_META.active;
              return (
                <div key={alert._id} style={{
                  border: "1px solid #f0f0f0", borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 12,
                  opacity: alert.status === "triggered" ? 0.75 : 1,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                        {alert.productName}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 500,
                        padding: "2px 7px", borderRadius: 20,
                        background: s.bg, color: s.color,
                      }}>
                        {s.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>
                        Target: <strong style={{ color: "#111" }}>₹{formatPrice(alert.targetPrice)}</strong>
                      </span>
                      {alert.lowestPrice && (
                        <span style={{ fontSize: 12, color: "#22a06b" }}>
                          Found: ₹{formatPrice(alert.lowestPrice)} on {alert.lowestSite}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>
                      {alert.email} · {new Date(alert.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  {/* Delete button */}
                  {alert.status === "active" && (
                    <button
                      onClick={() => handleDelete(alert._id)}
                      style={{
                        background: "#fff0f0", border: "1px solid #fdd",
                        color: "#e24b4a", borderRadius: 8,
                        padding: "6px 12px", fontSize: 12,
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEV: TEST RUN ── */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleTestRun}
          style={{
            background: "transparent", border: "1px dashed #ddd",
            color: "#aaa", borderRadius: 10, padding: "8px 20px",
            fontSize: 12, cursor: "pointer",
          }}
        >
          ⚙ Dev: Run price check now
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PriceAlerts;
