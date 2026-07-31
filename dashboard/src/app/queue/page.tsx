"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  PhoneCall,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface TriageCase {
  id: string;
  transcript_text: string;
  symptoms_summary: string;
  urgency_level: "emergency" | "soon" | "monitor";
  confidence: number;
  triggered_by: "model" | "keyword_override";
  status: "open" | "contacted" | "resolved";
  audio_url?: string;
  created_at: string;
  conversations?: {
    phone_number: string;
    language: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function QueuePage() {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cases`);
      if (!res.ok) throw new Error("Failed to fetch triage cases");
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to triage API. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const maskPhone = (phone?: string) => {
    if (!phone) return "03XX-XXXXXXX";
    if (phone.length < 6) return phone;
    return `${phone.slice(0, 4)}-***-${phone.slice(-3)}`;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSearch =
      c.transcript_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.conversations?.phone_number?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const emergencyCount = cases.filter((c) => c.urgency_level === "emergency" && c.status === "open").length;

  return (
    <div className="container">
      {/* Header section */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              Clinical Triage Queue
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Real-time incoming voice notes sorted by clinical urgency
            </p>
          </div>

          <button
            onClick={fetchCases}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Urgent alert bar if there are open emergency cases */}
        {emergencyCount > 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--urgency-emergency-bg)",
              border: "1px solid var(--urgency-emergency-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                className="pulse-badge"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "var(--urgency-emergency)",
                }}
              />
              <span style={{ fontWeight: 700, color: "var(--urgency-emergency)" }}>
                {emergencyCount} CRITICAL EMERGENCY CASE{emergencyCount > 1 ? "S" : ""} REQUIRE IMMEDIATE INTAKE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search controls */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["all", "open", "contacted", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                backgroundColor: filterStatus === status ? "var(--border-color)" : "var(--bg-surface)",
                color: filterStatus === status ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
                fontSize: "0.875rem",
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: "280px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search symptoms or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "110px", borderRadius: "var(--radius-md)" }}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <AlertTriangle size={36} color="#ff3b4b" style={{ marginBottom: "0.75rem" }} />
          <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{error}</p>
          <button
            onClick={fetchCases}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--urgency-emergency)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCases.length === 0 && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <ShieldAlert size={48} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            No Triage Cases Found
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Incoming WhatsApp voice notes will appear here in real time.
          </p>
        </div>
      )}

      {/* Cases List */}
      {!loading && !error && filteredCases.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredCases.map((c) => {
            const isEmergency = c.urgency_level === "emergency";
            const isSoon = c.urgency_level === "soon";

            let cardBg = "var(--bg-surface)";
            let cardBorder = "var(--border-color)";
            let badgeBg = "var(--urgency-monitor-bg)";
            let badgeBorder = "var(--urgency-monitor-border)";
            let badgeColor = "var(--urgency-monitor)";

            if (isEmergency) {
              cardBg = "rgba(255, 59, 75, 0.06)";
              cardBorder = "var(--urgency-emergency-border)";
              badgeBg = "var(--urgency-emergency-bg)";
              badgeBorder = "var(--urgency-emergency-border)";
              badgeColor = "var(--urgency-emergency)";
            } else if (isSoon) {
              cardBg = "rgba(255, 159, 28, 0.04)";
              cardBorder = "var(--urgency-soon-border)";
              badgeBg = "var(--urgency-soon-bg)";
              badgeBorder = "var(--urgency-soon-border)";
              badgeColor = "var(--urgency-soon)";
            }

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1.5rem",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                }}
              >
                {/* Left side details */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {/* Urgency Badge */}
                    <span
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "20px",
                        backgroundColor: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      {isEmergency && <span className="pulse-badge" style={{ width: 6, height: 6, borderRadius: "50%", background: badgeColor }} />}
                      {c.urgency_level}
                    </span>

                    {/* Triggered by indicator */}
                    {c.triggered_by === "keyword_override" && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#ff3b4b",
                          fontWeight: 700,
                          backgroundColor: "rgba(255,59,75,0.15)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        KEYWORD OVERRIDE
                      </span>
                    )}

                    {/* Status Pill */}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color:
                          c.status === "resolved"
                            ? "var(--status-resolved)"
                            : c.status === "contacted"
                            ? "var(--status-contacted)"
                            : "var(--status-open)",
                        textTransform: "capitalize",
                      }}
                    >
                      • {c.status}
                    </span>
                  </div>

                  {/* Transcript snippet */}
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                      lineHeight: "1.4",
                    }}
                  >
                    "{c.transcript_text}"
                  </p>

                  {/* Metadata line */}
                  <div
                    style={{
                      display: "flex",
                      gap: "1.25rem",
                      fontSize: "0.825rem",
                      color: "var(--text-muted)",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={14} />
                      {maskPhone(c.conversations?.phone_number)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Clock size={14} />
                      {formatTime(c.created_at)}
                    </span>
                    <span>
                      Confidence: {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Right side CTA link */}
                <Link
                  href={`/cases/${c.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 1.1rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: isEmergency ? "var(--urgency-emergency)" : "var(--bg-surface-hover)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>View Case</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
