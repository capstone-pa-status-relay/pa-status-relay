import { useState } from "react";
import { Layers } from "lucide-react";
import { supabase } from "../lib/supabase";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("Incorrect email or password. Try again.");
    } else {
      onSuccess();
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 6,
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.43,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: 24,
      }}
    >
      {/* Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 40,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2" style={{ marginBottom: 32 }}>
          <div
            className="flex items-center justify-center rounded-md shrink-0"
            style={{ width: 28, height: 28, backgroundColor: "#2563EB" }}
          >
            <Layers size={15} color="#FFFFFF" aria-hidden="true" />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0F172A",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            PA Status Relay
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="login-email"
                style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", lineHeight: 1.43 }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB"; }}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="login-password"
                style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", lineHeight: 1.43 }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB"; }}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                style={inputStyle}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "9px 16px",
                marginTop: 4,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                color: "#FFFFFF",
                backgroundColor: loading ? "#93C5FD" : "#2563EB",
                border: "none",
                borderRadius: 6,
                cursor: loading ? "not-allowed" : "pointer",
                lineHeight: 1.43,
                transition: "background-color 100ms ease",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#1D4ED8"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#2563EB"; }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Inline error */}
            {error && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#DC2626",
                  lineHeight: 1.4,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: 24,
          fontSize: 13,
          color: "#94A3B8",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        Demo access only — contact your administrator for credentials.
      </p>
    </div>
  );
}
