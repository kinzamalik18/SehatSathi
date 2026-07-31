"use client";

import { useEffect, useState } from "react";
import { Building2, Phone, MapPin, Clock, Plus, ShieldCheck } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  phone: string;
  address: string;
  open_hours: string;
  lat?: number;
  lng?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/clinics`);
        if (!res.ok) throw new Error("Failed to fetch clinics");
        const data = await res.json();
        setClinics(data.clinics || []);
      } catch (err: any) {
        console.error(err);
        setError("Unable to load clinic listings.");
      } finally {
        setLoading(false);
      }
    }
    fetchClinics();
  }, []);

  return (
    <div className="container">
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            Referral Clinics & Hospitals
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Registered healthcare facilities mapped to triage response routing
          </p>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: "180px", borderRadius: "var(--radius-md)" }} />
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
          <p style={{ color: "#ff3b4b", fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* Clinics Grid */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--urgency-monitor)",
                    }}
                  >
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{clinic.name}</h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#10b981",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <ShieldCheck size={12} /> Active Triage Destination
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <MapPin size={16} color="var(--text-muted)" />
                    <span>{clinic.address || "Address not listed"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Phone size={16} color="var(--text-muted)" />
                    <span>{clinic.phone || "Phone not listed"}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Clock size={16} color="var(--text-muted)" />
                    <span>{clinic.open_hours || "24 Hours"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
