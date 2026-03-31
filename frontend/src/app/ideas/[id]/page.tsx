"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getIdea, getIdeaHistory, advanceIdea, deleteIdea, updateResearch, updateValidation, updateBusinessPlan, updateExecution } from "@/lib/api";
import { ToastContainer, toast } from "@/components/ui/Toast";
import { ArrowLeft, ChevronRight, Archive, Zap } from "lucide-react";

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  raw:           { label: "RAW",           color: "#ffb347" },
  research:      { label: "RESEARCH",      color: "#00e5ff" },
  validation:    { label: "VALIDATION",    color: "#bf5fff" },
  business_plan: { label: "BUSINESS PLAN", color: "#39ff14" },
  execution:     { label: "EXECUTION",     color: "#e8eaed" },
  launched:      { label: "LAUNCHED",      color: "#ffd700" },
  archived:      { label: "ARCHIVED",      color: "#445566" },
};

const EVENT_ICONS: Record<string, string> = {
  stage_advanced:  "→",
  stage_blocked:   "✗",
  idea_created:    "⚡",
  idea_archived:   "◻",
  agent_assigned:  "◈",
  comment_added:   "·",
  score_updated:   "▲",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono mb-1" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8899aa" }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = "" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 rounded font-mono text-sm outline-none"
      style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.78rem" }}
    />
  );
}

function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-1.5 rounded font-mono text-sm outline-none resize-none"
      style={{ background: "#111820", border: "1px solid #1e2d3d", color: "#e8eaed", fontSize: "0.75rem", lineHeight: 1.5 }}
    />
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className="px-4 py-1.5 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
      style={{ background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.3)", fontSize: "0.65rem", letterSpacing: "0.08em" }}
    >
      {saving ? "SAVING..." : "SAVE"}
    </button>
  );
}

// Stage-specific form sections
function ResearchForm({ idea, onSave }: { idea: any; onSave: (data: any) => Promise<void> }) {
  const r = idea.research || {};
  const [marketSize, setMarketSize] = useState(r.market_size || "");
  const [competitors, setCompetitors] = useState((r.competitors || []).join(", "));
  const [audience, setAudience] = useState(r.target_audience || "");
  const [notes, setNotes] = useState(r.notes || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        market_size: marketSize,
        competitors: competitors.split(",").map((s: string) => s.trim()).filter(Boolean),
        target_audience: audience,
        notes,
      });
      toast("Research saved", "success");
    } catch { toast("Failed to save research", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="MARKET SIZE"><TextInput value={marketSize} onChange={setMarketSize} placeholder="e.g. $5B global" /></Field>
      <Field label="COMPETITORS (comma-separated)"><TextInput value={competitors} onChange={setCompetitors} placeholder="CompA, CompB, CompC" /></Field>
      <Field label="TARGET AUDIENCE"><TextInput value={audience} onChange={setAudience} placeholder="Who needs this?" /></Field>
      <Field label="NOTES"><TextArea value={notes} onChange={setNotes} rows={4} /></Field>
      <div className="flex justify-end"><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

function ValidationForm({ idea, onSave }: { idea: any; onSave: (data: any) => Promise<void> }) {
  const v = idea.validation || {};
  const [score, setScore] = useState(v.score?.toString() || "");
  const [verdict, setVerdict] = useState(v.verdict || "");
  const [goNoGo, setGoNoGo] = useState<boolean | null>(v.go_no_go ?? null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({ score: score ? parseInt(score) : null, verdict, go_no_go: goNoGo });
      toast("Validation saved", "success");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label={`SCORE: ${score || "—"}/100`}>
        <input type="range" min={0} max={100} value={score || 0} onChange={e => setScore(e.target.value)}
          className="w-full" style={{ accentColor: "#bf5fff" }} />
      </Field>
      <Field label="VERDICT"><TextInput value={verdict} onChange={setVerdict} placeholder="Summarize the verdict" /></Field>
      <Field label="GO / NO-GO">
        <div className="flex gap-2">
          {[{ v: true, label: "GO", color: "#39ff14" }, { v: false, label: "NO-GO", color: "#ff2052" }].map(opt => (
            <button key={String(opt.v)} onClick={() => setGoNoGo(opt.v)}
              className="flex-1 py-2 rounded font-mono text-xs font-bold transition-all"
              style={{
                background: goNoGo === opt.v ? `${opt.color}20` : "transparent",
                color: goNoGo === opt.v ? opt.color : "#445566",
                border: `1px solid ${goNoGo === opt.v ? opt.color : "#1e2d3d"}`,
                fontSize: "0.65rem", letterSpacing: "0.1em",
              }}
            >{opt.label}</button>
          ))}
        </div>
      </Field>
      <div className="flex justify-end"><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

function BusinessPlanForm({ idea, onSave }: { idea: any; onSave: (data: any) => Promise<void> }) {
  const b = idea.business_plan || {};
  const [revModel, setRevModel] = useState(b.revenue_model || "");
  const [mvp, setMvp] = useState(b.mvp_description || "");
  const [effort, setEffort] = useState(b.estimated_effort_days?.toString() || "");
  const [revenue, setRevenue] = useState(b.estimated_revenue_monthly?.toString() || "");
  const [milestones, setMilestones] = useState((b.milestones || []).join("\n"));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        revenue_model: revModel,
        mvp_description: mvp,
        estimated_effort_days: effort ? parseInt(effort) : null,
        estimated_revenue_monthly: revenue ? parseFloat(revenue) : null,
        milestones: milestones.split("\n").map((s: string) => s.trim()).filter(Boolean),
      });
      toast("Business plan saved", "success");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="REVENUE MODEL"><TextInput value={revModel} onChange={setRevModel} placeholder="SaaS, one-time, ads..." /></Field>
      <Field label="MVP DESCRIPTION"><TextArea value={mvp} onChange={setMvp} rows={3} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="EFFORT (days)"><TextInput value={effort} onChange={setEffort} placeholder="30" /></Field>
        <Field label="EST. REVENUE/MO ($)"><TextInput value={revenue} onChange={setRevenue} placeholder="2000" /></Field>
      </div>
      <Field label="MILESTONES (one per line)"><TextArea value={milestones} onChange={setMilestones} rows={4} /></Field>
      <div className="flex justify-end"><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

function ExecutionForm({ idea, onSave }: { idea: any; onSave: (data: any) => Promise<void> }) {
  const e = idea.execution || {};
  const [tasks, setTasks] = useState((e.tasks || []).join("\n"));
  const [repo, setRepo] = useState(e.github_repo || "");
  const [url, setUrl] = useState(e.live_url || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        tasks: tasks.split("\n").map((s: string) => s.trim()).filter(Boolean),
        github_repo: repo,
        live_url: url,
      });
      toast("Execution updated", "success");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="TASKS (one per line)"><TextArea value={tasks} onChange={setTasks} rows={5} /></Field>
      <Field label="GITHUB REPO"><TextInput value={repo} onChange={setRepo} placeholder="https://github.com/..." /></Field>
      <Field label="LIVE URL"><TextInput value={url} onChange={setUrl} placeholder="https://..." /></Field>
      <div className="flex justify-end"><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [idea, setIdea]       = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [advancing, setAdvancing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [ideaData, hist] = await Promise.all([getIdea(id), getIdeaHistory(id)]);
      setIdea(ideaData);
      setHistory(hist);
    } catch { toast("Failed to load idea", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAdvance() {
    setAdvancing(true);
    try {
      const res = await advanceIdea(id, "Manual advance from detail page");
      toast(res.message || "Advanced!", "success");
      load();
    } catch (err: any) {
      toast(err.body?.detail || err.message || "Cannot advance — check required fields", "error");
    } finally { setAdvancing(false); }
  }

  async function handleArchive() {
    if (!confirm("Archive this idea?")) return;
    try {
      await deleteIdea(id);
      toast("Idea archived", "info");
      router.push("/ideas");
    } catch { toast("Failed to archive", "error"); }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <span className="font-mono text-xs" style={{ color: "#445566", letterSpacing: "0.12em", animation: "pulse 1.5s ease-in-out infinite" }}>
        LOADING...
      </span>
    </div>
  );

  if (!idea) return (
    <div className="p-8">
      <span className="font-mono text-xs" style={{ color: "#ff2052" }}>IDEA NOT FOUND</span>
    </div>
  );

  const sc = STAGE_CONFIG[idea.stage] || STAGE_CONFIG.raw;

  return (
    <div className="p-4">
      <ToastContainer />

      {/* Back */}
      <button
        onClick={() => router.push("/ideas")}
        className="flex items-center gap-2 font-mono text-xs mb-4 transition-colors hover:opacity-80"
        style={{ color: "#445566", fontSize: "0.65rem", letterSpacing: "0.06em" }}
      >
        <ArrowLeft size={12} /> BACK TO PIPELINE
      </button>

      <div className="flex flex-col lg:grid gap-6" style={{ gridTemplateColumns: "1fr 360px" }}>
        {/* LEFT — Content */}
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
              style={{ background: `${sc.color}15`, border: `1px solid ${sc.color}40`, color: sc.color }}
            >
              <span className="font-mono font-bold" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
                {sc.label}
              </span>
            </div>
            <h1
              className="font-mono font-bold"
              style={{ color: "#e8eaed", fontSize: "1.3rem", lineHeight: 1.3, letterSpacing: "-0.01em" }}
            >
              {idea.title}
            </h1>
            {idea.description && (
              <p className="mt-2" style={{ color: "#8899aa", fontSize: "0.85rem", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
                {idea.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {idea.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 rounded" style={{ background: `${sc.color}10`, color: sc.color, border: `1px solid ${sc.color}25`, fontSize: "0.65rem", fontFamily: "JetBrains Mono" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stage-specific form */}
          <div
            className="rounded-lg p-4"
            style={{ background: "#0d1117", border: `1px solid ${sc.color}20` }}
          >
            <div className="mono-label mb-4" style={{ color: sc.color, fontSize: "0.65rem" }}>
              ◈ {sc.label} FIELDS
            </div>

            {idea.stage === "research" && (
              <ResearchForm idea={idea} onSave={data => updateResearch(id, data).then(load)} />
            )}
            {idea.stage === "validation" && (
              <ValidationForm idea={idea} onSave={data => updateValidation(id, data).then(load)} />
            )}
            {idea.stage === "business_plan" && (
              <BusinessPlanForm idea={idea} onSave={data => updateBusinessPlan(id, data).then(load)} />
            )}
            {idea.stage === "execution" && (
              <ExecutionForm idea={idea} onSave={data => updateExecution(id, data).then(load)} />
            )}
            {["raw", "launched", "archived"].includes(idea.stage) && (
              <div className="font-mono text-xs" style={{ color: "#445566", fontSize: "0.65rem" }}>
                {idea.stage === "raw" && "Add description, then advance to RESEARCH to unlock research fields."}
                {idea.stage === "launched" && "Idea is live. 🚀"}
                {idea.stage === "archived" && "Idea is archived."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Actions + History */}
        <div className="flex flex-col gap-4">
          {/* Actions */}
          <div className="rounded-lg p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
            <div className="mono-label mb-3" style={{ color: "#8899aa", fontSize: "0.6rem" }}>◈ ACTIONS</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAdvance} disabled={advancing}
                className="flex items-center justify-center gap-2 py-2.5 rounded font-mono text-xs font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,179,71,0.12)",
                  color: "#ffb347",
                  border: "1px solid rgba(255,179,71,0.35)",
                  boxShadow: "0 0 10px rgba(255,179,71,0.1)",
                  fontSize: "0.65rem", letterSpacing: "0.1em",
                }}
              >
                <Zap size={11} />
                {advancing ? "ADVANCING..." : "ADVANCE STAGE"}
                <ChevronRight size={11} />
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center justify-center gap-2 py-2 rounded font-mono text-xs transition-all hover:opacity-80"
                style={{ background: "rgba(255,32,82,0.06)", color: "#ff2052", border: "1px solid rgba(255,32,82,0.2)", fontSize: "0.65rem", letterSpacing: "0.08em" }}
              >
                <Archive size={11} /> ARCHIVE
              </button>
            </div>
          </div>

          {/* Stage history */}
          <div className="rounded-lg p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
            <div className="mono-label mb-3" style={{ color: "#8899aa", fontSize: "0.6rem" }}>◈ STAGE HISTORY</div>
            <div className="flex flex-col gap-2">
              {(idea.stage_history || []).slice().reverse().map((sh: any, i: number) => {
                const shsc = STAGE_CONFIG[sh.stage];
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: shsc?.color || "#445566" }} />
                      {i < (idea.stage_history || []).length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: "#1e2d3d", minHeight: 12 }} />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="font-mono font-bold" style={{ color: shsc?.color || "#445566", fontSize: "0.65rem" }}>
                        {shsc?.label || sh.stage.toUpperCase()}
                      </div>
                      <div className="font-mono" style={{ color: "#445566", fontSize: "0.58rem" }}>
                        {new Date(sh.entered_at).toLocaleDateString()}
                        {sh.notes && ` · ${sh.notes}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event log */}
          {history?.events?.length > 0 && (
            <div className="rounded-lg p-4" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
              <div className="mono-label mb-3" style={{ color: "#8899aa", fontSize: "0.6rem" }}>◈ AUDIT LOG</div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {history.events.slice().reverse().map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <span style={{ color: "#ffb347", fontSize: "0.65rem", flexShrink: 0, marginTop: 1 }}>
                      {EVENT_ICONS[ev.event_type] || "·"}
                    </span>
                    <div>
                      <div className="font-mono" style={{ color: "#8899aa", fontSize: "0.65rem" }}>
                        {ev.notes || ev.event_type}
                      </div>
                      <div className="font-mono" style={{ color: "#445566", fontSize: "0.55rem" }}>
                        {new Date(ev.timestamp).toLocaleTimeString()} · {ev.triggered_by}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
