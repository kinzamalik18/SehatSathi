"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Clock,
  ShieldAlert,
  CheckCircle,
  PhoneCall,
  Volume2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface TriageCaseDetail {
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

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<TriageCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cases/${caseId}`);
      if (!res.ok) throw new Error("Case not found");
      const data = await res.json();
      setCaseData(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load case details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchCaseDetail();
  }, [caseId]);

  const handleStatusUpdate = async (newStatus: "open" | "contacted" | "resolved") => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/cases/${caseId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      const updated = await res.json();
      setCaseData((prev) => (prev ? { ...prev, status: updated.status } : null));
    } catch (err) {
      alert("Failed to update case status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "3rem 0" }}>
        <div className="skeleton" style={{ height: "400px", borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container" style={{ padding: "3rem 0", textAlign: "center" }}>
        <AlertCircle size={48} color="#ff3b4b" style={{ marginBottom: "1rem" }} />
        <h2>Case Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          The requested triage case could not be retrieved.
        </p>
        <Link
          href="/queue"
          style={{
            padding: "0.6rem 1.25rem",
            backgroundColor: "var(--bg-surface-hover)",
            color: "#fff",
            borderRadius: "var(--radius-sm)",
            fontWeight: 600,
          }}
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  const isEmergency = caseData.urgency_level === "emergency";
  const isSoon = caseData.urgency_level === "soon";

  let headerBg = "var(--urgency-monitor-bg)";
  let headerBorder = "var(--urgency-monitor-border)";
  let badgeColor = "var(--urgency-monitor)";

  if (isEmergency) {
    headerBg = "var(--urgency-emergency-bg)";
    headerBorder = "var(--urgency-emergency-border)";
    badgeColor = "var(--urgency-emergency)";
  } else if (isSoon) {
    headerBg = "var(--urgency-soon-bg)";
    headerBorder = "var(--urgency-soon-border)";
    badgeColor = "var(--urgency-soon)";
  }

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      {/* Back button */}
      <Link
        href="/queue"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Triage Queue</span>
      </Link>

      {/* Case Header Card */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: `1px solid ${headerBorder}`,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        {/* Top Urgency Banner */}
        <div
          style={{
            backgroundColor: headerBg,
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${headerBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isEmergency && <ShieldAlert size={24} color={badgeColor} />}
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: badgeColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {caseData.urgency_level} URGENCY LEVEL
            </span>
          </div>

          <span
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              backgroundColor: "rgba(0,0,0,0.3)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            Status: {caseData.status}
          </span>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.75rem" }}>
          {/* Transcript Section */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Transcribed Voice Note (Symptom Description)
            </h3>
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "rgba(0,0,0,0.25)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                fontSize: "1.1rem",
                lineHeight: "1.6",
                fontWeight: 500,
              }}
            >
              "{caseData.transcript_text}"
            </div>
          </div>

          {/* Audio Playback Player (if audio_url exists) */}
          {caseData.audio_url && (
            <div style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                Original Audio Voice Note
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Volume2 size={20} color="var(--text-secondary)" />
                <audio controls src={caseData.audio_url} style={{ width: "100%" }} />
              </div>
            </div>
          )}

          {/* Triage Decision Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                DECISION MECHANISM
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {caseData.triggered_by === "keyword_override"
                  ? "🚨 Safety Keyword Override"
                  : "🤖 ML Classifier Inference"}
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                MODEL CONFIDENCE SCORE
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {(caseData.confidence * 100).toFixed(1)}%
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                PATIENT PHONE
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Phone size={14} />
                {caseData.conversations?.phone_number || "Unknown"}
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                RECEIVED TIME
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Clock size={14} />
                {new Date(caseData.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Clinical Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => handleStatusUpdate("contacted")}
              disabled={updating || caseData.status === "contacted"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--status-contacted)",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                opacity: caseData.status === "contacted" ? 0.5 : 1,
              }}
            >
              <PhoneCall size={18} />
              <span>Mark as Contacted</span>
            </button>

            <button
              onClick={() => handleStatusUpdate("resolved")}
              disabled={updating || caseData.status === "resolved"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--status-resolved)",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                opacity: caseData.status === "resolved" ? 0.5 : 1,
              }}
            >
              <CheckCircle size={18} />
              <span>Mark as Resolved</span>
            </button>

            {caseData.status !== "open" && (
              <button
                onClick={() => handleStatusUpdate("open")}
                disabled={updating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface-hover)",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={18} />
                <span>Re-open Case</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
