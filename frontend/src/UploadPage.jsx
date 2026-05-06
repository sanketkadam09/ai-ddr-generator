import React, { useState, useRef } from "react";
import { uploadFiles, generateDDR } from "./api/api";

const STEPS = [
  { id: "upload", label: "Uploading files to server" },
  { id: "analyze", label: "Analyzing inspection report" },
  { id: "thermal", label: "Processing thermal data" },
  { id: "generate", label: "Generating DDR with AI" },
  { id: "done", label: "Report ready" },
];

/* ── Severity badge ── */
const SeverityBadge = ({ level }) => {
  const map = {
    high:   { bg: "#fff2f2", border: "#f5c0c0", color: "#b02020", label: "High" },
    medium: { bg: "#fffbf2", border: "#f5dfa0", color: "#8a5a00", label: "Medium" },
    low:    { bg: "#f2faf4", border: "#b0dfc0", color: "#1e6b38", label: "Low" },
  };
  const s = map[level?.toLowerCase()] || map.low;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 600, background: s.bg,
      border: `1px solid ${s.border}`, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

/* ── Timeline badge ── */
const TimelineBadge = ({ label }) => {
  const lower = label.toLowerCase();
  let s = { bg: "#f2faf4", color: "#1e6b38", border: "#b0dfc0" };
  if (lower.includes("immediate")) s = { bg: "#fff2f2", color: "#b02020", border: "#f5c0c0" };
  else if (lower.includes("short")) s = { bg: "#fffbf2", color: "#8a5a00", border: "#f5dfa0" };
  else if (lower.includes("long"))  s = { bg: "#f0f6ff", color: "#1a4f9c", border: "#bcd4f5" };
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 600, background: s.bg,
      border: `1px solid ${s.border}`, color: s.color,
    }}>
      {label}
    </span>
  );
};

/* ── Render inline bold (**text**) ── */
const renderInline = (text) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "#1e1e1c", fontWeight: 600 }}>{p}</strong>
      : p
  );
};

/* ── Parse DDR text into sections using ### headings ── */
const parseDDR = (text) => {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip the top-level ## title and --- dividers
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      continue;
    }
    if (trimmed === "---") continue;

    // ### heading = new section
    if (trimmed.startsWith("### ")) {
      if (current) sections.push(current);
      current = { title: trimmed.replace(/^###\s*/, "").trim(), items: [] };
      continue;
    }

    if (current && trimmed) {
      current.items.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
};

/* ── Render section items as clean content ── */
const renderItems = (items, sectionTitle) => {
  const title = sectionTitle.toLowerCase();
  const isSeverity = title.includes("severity");
  const isActions  = title.includes("action") || title.includes("recommended");

  if (isSeverity) return <SeveritySection items={items} />;
  if (isActions)  return <ActionsSection  items={items} />;
  return <DefaultSection items={items} />;
};

/* ── Default section: bullets + sub-headings ── */
const DefaultSection = ({ items }) => {
  const elements = [];
  let i = 0;

  while (i < items.length) {
    const line = items[i];

    // Bold sub-heading like **2.1. Terrace Slab**
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      const label = line.replace(/\*\*/g, "");
      elements.push(
        <div key={i} style={{
          background: "#1e1e1c", borderRadius: "6px",
          padding: "8px 14px", margin: "14px 0 8px",
        }}>
          <span style={{ fontWeight: 600, fontSize: "13px", color: "#fff" }}>{label}</span>
        </div>
      );
    }
    // Bullet item
    else if (line.startsWith("*") || line.startsWith("-")) {
      const clean = line.replace(/^\*\s*/, "").replace(/^-\s*/, "");
      elements.push(
        <div key={i} style={{
          display: "flex", gap: "10px", alignItems: "flex-start",
          padding: "6px 0", borderBottom: "0.5px solid #f0eeea",
          fontSize: "13px", lineHeight: "1.65", color: "#3a3a38",
        }}>
          <span style={{ color: "#e8a020", flexShrink: 0, fontSize: "9px", marginTop: "5px" }}>◆</span>
          <span>{renderInline(clean)}</span>
        </div>
      );
    }
    // Numbered item
    else if (/^\d+\./.test(line)) {
      const clean = line.replace(/^\d+\.\s*/, "");
      elements.push(
        <div key={i} style={{
          display: "flex", gap: "10px", alignItems: "flex-start",
          padding: "6px 0", borderBottom: "0.5px solid #f0eeea",
          fontSize: "13px", lineHeight: "1.65", color: "#3a3a38",
        }}>
          <span style={{ color: "#e8a020", flexShrink: 0, fontSize: "9px", marginTop: "5px" }}>◆</span>
          <span>{renderInline(clean)}</span>
        </div>
      );
    }
    // Plain paragraph
    else {
      elements.push(
        <p key={i} style={{ fontSize: "13px", lineHeight: "1.7", color: "#3a3a38", margin: "6px 0" }}>
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }
  return <>{elements}</>;
};

/* ── Severity section: card per item ── */
const SeveritySection = ({ items }) => {
  const entries = [];
  let cur = null;

  for (const line of items) {
    const clean = line.replace(/\*\*/g, "").replace(/^\*\s*/, "").trim();
    const m = clean.match(/^(.+?):\s*(High|Medium|Low)$/i);
    if (m) {
      if (cur) entries.push(cur);
      cur = { area: m[1].trim(), severity: m[2], reasons: [] };
    } else if (cur) {
      const r = clean.replace(/^Reason:\s*/i, "").replace(/^\*\s*/, "").trim();
      if (r) cur.reasons.push(r);
    }
  }
  if (cur) entries.push(cur);

  // Fallback if parsing fails
  if (!entries.length) return <DefaultSection items={items} />;

  return (
    <>
      {entries.map((e, i) => (
        <div key={i} style={{
          border: "1px solid #e2e0dc", borderRadius: "8px",
          padding: "14px 16px", marginBottom: "10px", background: "#fafaf8",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontWeight: 600, fontSize: "13px", color: "#1e1e1c" }}>{e.area}</span>
            <SeverityBadge level={e.severity} />
          </div>
          {e.reasons.map((r, j) => (
            <p key={j} style={{ fontSize: "12.5px", color: "#555452", margin: "2px 0", lineHeight: "1.6" }}>{r}</p>
          ))}
        </div>
      ))}
    </>
  );
};

/* ── Actions section: timeline groups ── */
const ActionsSection = ({ items }) => {
  const groups = [];
  let cur = null;

  for (const line of items) {
    const timelineMatch = line.match(/^\*\*(Immediate|Short-?term|Long-?term|Ongoing|Follow-?up)[^*]*\*\*/i);
    if (timelineMatch) {
      if (cur) groups.push(cur);
      cur = { label: timelineMatch[1], actions: [] };
    } else if (cur) {
      const clean = line.replace(/^\*\s*/, "").replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim();
      if (clean) cur.actions.push(clean);
    }
  }
  if (cur) groups.push(cur);

  if (!groups.length) return <DefaultSection items={items} />;

  return (
    <>
      {groups.map((g, i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "10px" }}>
            <TimelineBadge label={g.label} />
          </div>
          {g.actions.map((a, j) => (
            <div key={j} style={{
              display: "flex", gap: "10px", alignItems: "flex-start",
              padding: "8px 0", borderBottom: "0.5px solid #f0eeea",
              fontSize: "13px", lineHeight: "1.6", color: "#3a3a38",
            }}>
              <span style={{
                minWidth: "22px", height: "22px", borderRadius: "50%",
                background: "#1e1e1c", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "1px",
              }}>{j + 1}</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

/* ── Full DDR Report renderer ── */
const DDRReport = ({ text, inspectionFile, thermalFile, generatedAt }) => {
  // Extract the ## title at the top
  const titleMatch = text.match(/^##\s+(.+)/m);
  const reportTitle = titleMatch ? titleMatch[1].trim() : "Detailed Diagnostic Report";

  // Extract metadata lines like **Site:** ...
  const metaLines = [];
  for (const line of text.split("\n").slice(0, 10)) {
    const m = line.trim().match(/^\*\*(.+?):\*\*\s*(.+)/);
    if (m) metaLines.push({ key: m[1], value: m[2] });
  }

  const sections = parseDDR(text);

  return (
    <div className="card">
      {/* Dark header */}
      <div style={{
        background: "#1e1e1c", borderRadius: "8px 8px 0 0",
        margin: "-24px -24px 24px -24px", padding: "20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span style={{ fontSize: "22px" }}>🏗️</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{reportTitle}</div>
            <div style={{ fontSize: "12px", color: "#999896", marginTop: "2px" }}>
              AI-Generated · BuildSafe Engineering
            </div>
          </div>
        </div>

        {/* Meta chips from report */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: metaLines.length ? "10px" : 0 }}>
          {metaLines.map((m, i) => (
            <span key={i} style={{ background: "#2e2e2c", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#ccc" }}>
              <span style={{ color: "#999896" }}>{m.key}:</span> {m.value}
            </span>
          ))}
        </div>

        {/* File + timestamp chips */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {inspectionFile && (
            <span style={{ background: "#2e2e2c", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#ccc" }}>
              📋 {inspectionFile.name}
            </span>
          )}
          {thermalFile && (
            <span style={{ background: "#2e2e2c", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#ccc" }}>
              🌡️ {thermalFile.name}
            </span>
          )}
          {generatedAt && (
            <span style={{ background: "#2e2e2c", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#ccc" }}>
              🕐 {generatedAt}
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: "28px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "14px", paddingBottom: "10px",
            borderBottom: "2px solid #e8a020",
          }}>
            <span style={{
              background: "#e8a020", color: "#fff",
              width: "24px", height: "24px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</span>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e1e1c", margin: 0 }}>
              {section.title.replace(/^\d+\.\s*/, "")}
            </h3>
          </div>
          {renderItems(section.items, section.title)}
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════
   UploadPage
══════════════════════════════ */
const UploadPage = () => {
  const [inspectionFile, setInspectionFile] = useState(null);
  const [thermalFile, setThermalFile]       = useState(null);
  const [ddr, setDdr]                       = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [activeStep, setActiveStep]         = useState(-1);
  const [doneSteps, setDoneSteps]           = useState([]);
  const [generatedAt, setGeneratedAt]       = useState(null);
  const reportRef = useRef(null);

  const advanceTo = (idx) => {
    setActiveStep(idx);
    setDoneSteps(() => Array.from({ length: idx }, (_, i) => i));
  };

  const handleSubmit = async () => {
    setError(""); setDdr(""); setLoading(true);
    setDoneSteps([]); setActiveStep(0);
    try {
      advanceTo(0);
      const uploadRes = await uploadFiles(inspectionFile, thermalFile);
      advanceTo(1); await new Promise(r => setTimeout(r, 600));
      advanceTo(2); await new Promise(r => setTimeout(r, 600));
      advanceTo(3);
      const ddrRes = await generateDDR(uploadRes.inspection_path, uploadRes.thermal_path);
      advanceTo(4);
      setDoneSteps([0,1,2,3,4]); setActiveStep(-1);
      setDdr(ddrRes.ddr);
      setGeneratedAt(new Date().toLocaleString());
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = inspectionFile && thermalFile && !loading;
  const showProgress = loading || doneSteps.length > 0;

  return (
    <>
      {/* Upload card */}
      <div className="card">
        <h2 className="card-title"><span className="icon">📂</span>Upload Files</h2>
        <div className="file-grid">
          <label className={`file-slot ${inspectionFile ? "selected" : ""}`} htmlFor="inspection-input">
            <input id="inspection-input" type="file" accept=".pdf,.docx,.txt,.csv"
              onChange={e => setInspectionFile(e.target.files[0] || null)} />
            <span className="file-slot-icon">{inspectionFile ? "✅" : "📋"}</span>
            <div className="file-slot-label">Inspection Report</div>
            <div className="file-slot-hint">PDF, DOCX, TXT, CSV</div>
            {inspectionFile && <div className="file-slot-name">{inspectionFile.name}</div>}
          </label>
          <label className={`file-slot ${thermalFile ? "selected" : ""}`} htmlFor="thermal-input">
            <input id="thermal-input" type="file" accept=".pdf,.csv,.jpg,.png"
              onChange={e => setThermalFile(e.target.files[0] || null)} />
            <span className="file-slot-icon">{thermalFile ? "✅" : "🌡️"}</span>
            <div className="file-slot-label">Thermal Data</div>
            <div className="file-slot-hint">PDF, CSV, JPG, PNG</div>
            {thermalFile && <div className="file-slot-name">{thermalFile.name}</div>}
          </label>
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "16px" }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}
        <button className={`btn-generate ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={!canGenerate}>
          {loading
            ? <><span className="spinner" style={{ marginRight: "8px" }} />Generating Report…</>
            : "Generate DDR"}
        </button>
      </div>

      {/* Progress card */}
      {showProgress && (
        <div className="card">
          <h2 className="card-title"><span className="icon">⚙️</span>Processing</h2>
          <ul className="progress-list">
            {STEPS.map((step, i) => {
              const isDone   = doneSteps.includes(i);
              const isActive = activeStep === i;
              return (
                <li key={step.id} className={`progress-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                  <div className="progress-dot">
                    {isDone ? "✓" : isActive ? <span className="spinner" /> : ""}
                  </div>
                  {step.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Structured report */}
      {ddr && (
        <div ref={reportRef}>
          <DDRReport
            text={ddr}
            inspectionFile={inspectionFile}
            thermalFile={thermalFile}
            generatedAt={generatedAt}
          />
        </div>
      )}
    </>
  );
};

export default UploadPage;