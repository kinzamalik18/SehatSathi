import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Activity, ShieldAlert, Building2, User } from "lucide-react";

export const metadata: Metadata = {
  title: "SehatSaathi — Clinical Triage Dashboard",
  description: "Rural Health Triage Voice Agent Intake & Queue Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "rgba(19, 27, 46, 0.8)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "70px",
            }}
          >
            {/* Brand Logo */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontWeight: 800,
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #ff3b4b, #ff9f1c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Activity size={22} />
              </div>
              <span>
                Sehat<span style={{ color: "#ff9f1c" }}>Saathi</span>
              </span>
            </Link>

            {/* Navigation items */}
            <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <Link
                href="/queue"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                <ShieldAlert size={18} color="#ff3b4b" />
                <span>Triage Queue</span>
              </Link>
              <Link
                href="/clinics"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                <Building2 size={18} />
                <span>Clinics</span>
              </Link>
            </nav>

            {/* User profile / demo indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "20px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontWeight: 600,
                }}
              >
                Live Triage Mode
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: "2rem 0 4rem" }}>{children}</main>
      </body>
    </html>
  );
}
