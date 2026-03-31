"use client";
import { useState } from "react";
import { createWebsiteProject } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { X, Rocket } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewWebsiteModal({ onClose, onCreated }: Props) {
  const [clientName, setClientName]     = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry]         = useState("");
  const [needs, setNeeds]               = useState("");
  const [competitors, setCompetitors]   = useState("");
  const [budget, setBudget]             = useState("");
  const [timeline, setTimeline]         = useState("");
  const [saving, setSaving]             = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { toast("Client name is required", "error"); return; }
    if (!needs.trim()) { toast("Describe what the client needs", "error"); return; }
    setSaving(true);
    try {
      await createWebsiteProject({
        client_name: clientName.trim(),
        business_type: businessType.trim() || undefined,
        industry: industry.trim() || undefined,
        needs: needs.trim(),
        competitors: competitors.trim() || undefined,
        budget: budget.trim() || undefined,
        timeline: timeline.trim() || undefined,
      });
      toast(`"${clientName}" added to intake`, "success");
      onCreated();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to create project", "error");
    } finally {
      setSaving(false);
    }
  }

  const accentColor = "#00e5ff";

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(8,11,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6 font-mono"
        style={{
          background: "#0d1117",
          border: `1px solid ${accentColor}35`,
          boxShadow: `0 0 40px ${accentColor}10`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              style={{
                fontFamily: "Orbitron, monospace",
                color: accentColor,
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textShadow: `0 0 10px ${accentColor}40`,
              }}
            >
              🌐 NEW WEBSITE PROJECT
            </h2>
            <p style={{ color: "#445566", fontSize: "0.6rem", letterSpacing: "0.1em", marginTop: 2 }}>
              ENTER PIPELINE AT INTAKE STAGE
            </p>
          </div>
          <button onClick={onClose} style={{ color: "#445566" }} className="hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Client Name */}
          <Field label="CLIENT NAME *" value={clientName} onChange={setClientName} placeholder="Acme Corp" accent={accentColor} />

          {/* Two columns: Business Type + Industry */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="BUSINESS TYPE" value={businessType} onChange={setBusinessType} placeholder="SaaS, Agency, E-commerce..." accent={accentColor} />
            <Field label="INDUSTRY" value={industry} onChange={setIndustry} placeholder="Tech, Health, Finance..." accent={accentColor} />
          </div>

          {/* Needs */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>WHAT DO THEY NEED? *</label>
            <textarea
              value={needs}
              onChange={e => setNeeds(e.target.value)}
              placeholder="Landing page, full website, e-commerce store..."
              rows={3}
              className="w-full px-3 py-2 rounded font-mono text-sm outline-none resize-none"
              style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
              onFocus={e => e.target.style.borderColor = accentColor}
              onBlur={e => e.target.style.borderColor = "#1e2d3d"}
            />
          </div>

          {/* Competitors */}
          <Field label="COMPETITOR URLS" value={competitors} onChange={setCompetitors} placeholder="competitor1.com, competitor2.com" accent={accentColor} />

          {/* Two columns: Budget + Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="BUDGET" value={budget} onChange={setBudget} placeholder="$2000-5000" accent={accentColor} />
            <Field label="TIMELINE" value={timeline} onChange={setTimeline} placeholder="2 weeks" accent={accentColor} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded font-mono text-xs font-semibold transition-all"
              style={{ background: "transparent", color: "#445566", border: "1px solid #1e2d3d", letterSpacing: "0.08em" }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: saving ? `${accentColor}10` : `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
                boxShadow: `0 0 12px ${accentColor}15`,
                letterSpacing: "0.08em",
              }}
            >
              <Rocket size={12} />
              {saving ? "CREATING..." : "CREATE PROJECT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, accent }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent: string;
}) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: "0.6rem", color: "#8899aa" }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded font-mono text-sm outline-none"
        style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.8rem" }}
        onFocus={e => e.target.style.borderColor = accent}
        onBlur={e => e.target.style.borderColor = "#1e2d3d"}
      />
    </div>
  );
}
