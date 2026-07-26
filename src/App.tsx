import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  PlusCircle, FileWarning, Send, Clock, AlertCircle,
  Stethoscope, CheckCircle2, XCircle, Lock,
  Search, ChevronRight, Settings, Layers, TriangleAlert,
  X, ChevronDown, Check, MessageSquare, AlertTriangle,
  Download, ExternalLink, FolderOpen, SearchX, Plus, User,
} from "lucide-react";
import {
  getValidTransitions,
  getTransitionGate,
  getPatientMessage,
  type PaStatus,
} from "./backend/statusMachine";
import { supabase } from "./lib/supabase";
import { LoginScreen } from "./components/LoginScreen";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type CaseListItem = {
  id: string;
  patient_name: string;
  drug: string | null;
  status: PaStatus;
  consent_flag: boolean;
  updated_at: string;
};

// ── Design System: Section 7 Badge Config ────────────────────────────────────
const BADGE_CONFIG = {
  new_order:           { label: "New Order",           Icon: PlusCircle,   bg: "var(--pa-badge-new-bg)",        text: "var(--pa-badge-new-text)",       border: "var(--pa-badge-new-border)"       },
  needs_documentation: { label: "Needs Documentation",  Icon: FileWarning,  bg: "var(--pa-badge-needs-doc-bg)",  text: "var(--pa-badge-needs-doc-text)",  border: "var(--pa-badge-needs-doc-border)" },
  submitted:           { label: "Submitted",             Icon: Send,         bg: "var(--pa-badge-submitted-bg)",  text: "var(--pa-badge-submitted-text)",  border: "var(--pa-badge-submitted-border)" },
  pending_review:      { label: "Pending Review",        Icon: Clock,        bg: "var(--pa-badge-pending-bg)",    text: "var(--pa-badge-pending-text)",    border: "var(--pa-badge-pending-border)"   },
  info_request:        { label: "Info Request",          Icon: AlertCircle,  bg: "var(--pa-badge-info-bg)",       text: "var(--pa-badge-info-text)",       border: "var(--pa-badge-info-border)"      },
  peer_to_peer:        { label: "Peer-to-Peer",          Icon: Stethoscope,  bg: "var(--pa-badge-p2p-bg)",        text: "var(--pa-badge-p2p-text)",        border: "var(--pa-badge-p2p-border)"       },
  approved:            { label: "Approved",               Icon: CheckCircle2, bg: "var(--pa-badge-approved-bg)",  text: "var(--pa-badge-approved-text)",   border: "var(--pa-badge-approved-border)"  },
  denied:              { label: "Denied",                 Icon: XCircle,      bg: "var(--pa-badge-denied-bg)",    text: "var(--pa-badge-denied-text)",     border: "var(--pa-badge-denied-border)"    },
  closed:              { label: "Closed",                 Icon: Lock,         bg: "var(--pa-badge-closed-bg)",    text: "var(--pa-badge-closed-text)",     border: "var(--pa-badge-closed-border)"    },
} as const;

type PAStatus = keyof typeof BADGE_CONFIG;

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, size = "default", className: animClass }: { status: PAStatus; size?: "default" | "sm"; className?: string }) {
  const { label, Icon, bg, text, border } = BADGE_CONFIG[status];
  const iconSize = size === "sm" ? 11 : 13;
  const extraClass = status === "needs_documentation" ? " pa-needs-docs-text" : "";
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full whitespace-nowrap font-semibold${extraClass}${animClass ? ` ${animClass}` : ""}`}
      style={{
        backgroundColor: bg,
        color: text,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: border,
        fontSize: "11px",
        lineHeight: 1,
        fontWeight: 600,
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "10px",
        paddingRight: "10px",
        fontFamily: "Inter, sans-serif",
      }}
      aria-label={`Status: ${label}`}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const ALL_STATUSES = Object.keys(BADGE_CONFIG) as PAStatus[];

// ── Filter Chip ───────────────────────────────────────────────────────────────
function FilterChip({
  label,
  status,
  active,
  onClick,
}: {
  label: string;
  status?: PAStatus;
  active: boolean;
  onClick: () => void;
}) {
  const config = status ? BADGE_CONFIG[status] : null;
  const activeBg     = config ? config.bg     : "#2563EB";
  const activeText   = config ? config.text   : "#FFFFFF";
  const activeBorder = config ? config.border : "rgba(37,99,235,0.30)";
  const Icon = config ? config.Icon : null;

  const restBg     = "#F1F5F9";
  const restBorder = "rgba(71,85,105,0.20)";
  const hoverBg     = "#E2E8F0";
  const hoverBorder = "rgba(71,85,105,0.35)";

  function applyHover(el: HTMLButtonElement) {
    if (active) return;
    el.style.backgroundColor = hoverBg;
    el.style.borderColor = hoverBorder;
  }
  function removeHover(el: HTMLButtonElement) {
    if (active) return;
    el.style.backgroundColor = restBg;
    el.style.borderColor = restBorder;
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => applyHover(e.currentTarget)}
      onMouseLeave={(e) => removeHover(e.currentTarget)}
      className="inline-flex items-center gap-[6px] rounded-full whitespace-nowrap transition-colors duration-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563EB]"
      style={{
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1,
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "12px",
        paddingRight: "12px",
        fontFamily: "Inter, sans-serif",
        backgroundColor: active ? activeBg : restBg,
        color: active ? activeText : "#475569",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: active ? activeBorder : restBorder,
        cursor: "pointer",
        minHeight: "32px",
      }}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {label}
    </button>
  );
}

// ── Transition Dropdown ───────────────────────────────────────────────────────
const RETURN_PATHS = new Set([
  "submitted->needs_documentation",
  "info_request->pending_review",
  "peer_to_peer->pending_review",
]);

function TransitionDropdown({
  currentStatus,
  value,
  onChange,
  isDrawerOpen,
}: {
  currentStatus: PaStatus;
  value: PaStatus;
  onChange: (v: PaStatus) => void;
  isDrawerOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = getValidTransitions(currentStatus);

  useEffect(() => {
    if (!isDrawerOpen) setOpen(false);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPortalPos({ top: rect.bottom + window.scrollY + 4, left: rect.left, width: rect.width });
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-left"
        style={{
          borderColor: open ? "#2563EB" : "#CBD5E1",
          boxShadow: open ? "0 0 0 2px #2563EB" : "none",
          backgroundColor: "#FFFFFF",
          height: "36px",
          outline: "none",
          cursor: "pointer",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusBadge status={value} />
        <ChevronDown
          size={16}
          style={{
            color: "#64748B",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 200ms ease-out",
            flexShrink: 0,
          }}
        />
      </button>

      {open && createPortal(
        <ul
          role="listbox"
          className="rounded-md border overflow-hidden"
          style={{
            position: "fixed",
            top: portalPos.top,
            left: portalPos.left,
            width: portalPos.width,
            zIndex: 9999,
            backgroundColor: "#FFFFFF",
            borderColor: "#CBD5E1",
            boxShadow: "0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)",
          }}
        >
          {options.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onClick={() => { onChange(option); setOpen(false); }}
              className="flex items-center justify-between cursor-pointer"
              style={{
                padding: "10px 16px",
                backgroundColor: option === value ? "var(--pa-primary-subtle)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (option !== value)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  option === value ? "var(--pa-primary-subtle)" : "transparent";
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: option === value ? 500 : 400,
                    color: "#1A1F2E",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  {BADGE_CONFIG[option as PAStatus].label}
                </span>
                {RETURN_PATHS.has(`${currentStatus}->${option}`) && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#92400E",
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FCD34D",
                      borderRadius: "9999px",
                      padding: "1px 7px",
                      lineHeight: 1,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    return path
                  </span>
                )}
              </div>
              {option === value && (
                <Check size={14} style={{ color: "#2563EB", flexShrink: 0 }} />
              )}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}

// ── Message Preview Modal ─────────────────────────────────────────────────────

const DS = {
  bgSurface:         "var(--pa-surface-alt)",
  bgCardElevated:    "#FFFFFF",
  bgCardSubtle:      "var(--pa-surface-panel)",
  borderInput:       "#CBD5E1",
  textPrimary:       "#0F172A",
  textMuted:         "#64748B",
  textDisabled:      "#94A3B8",
  brandPrimary:      "#2563EB",
  brandPrimaryHover: "var(--pa-primary-hover)",
  brandOnPrimary:    "#FFFFFF",
  secondaryBg:       "#FFFFFF",
  secondaryText:     "#0F172A",
  secondaryBorder:   "#CBD5E1",
  bgDisabled:        "#F1F5F9",
  borderDisabled:    "#E2E8F0",
  warningBg:         "#FFF3CD",
  warningText:       "#7B4F12",
  warningBorder:     "#B7770D",
  shadowModal:       "0 20px 40px rgba(15,23,42,0.16), 0 4px 8px rgba(15,23,42,0.08)",
};

const MESSAGE_COPY =
  "Your insurance is reviewing your request. We'll contact you when there's a decision.";

function PrimaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: DS.brandPrimary,
        color: DS.brandOnPrimary,
        border: "1px solid transparent",
        borderRadius: 6,
        padding: "7px 16px",
        fontSize: 14,
        fontWeight: 600,
        lineHeight: "1.43",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.45 : 1,
      }}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: disabled ? DS.bgDisabled : DS.secondaryBg,
        color: disabled ? DS.textDisabled : DS.secondaryText,
        border: `1px solid ${disabled ? DS.borderDisabled : DS.secondaryBorder}`,
        borderRadius: 6,
        padding: "7px 16px",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: "1.43",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap",
      }}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 480,
        flexShrink: 0,
        backgroundColor: DS.bgCardElevated,
        borderRadius: 12,
        boxShadow: DS.shadowModal,
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function MessagePreviewModal({
  consentActive,
  messageText,
  onMessageChange,
  onConfirm,
  onLogWithoutSending,
  onClose,
  onRecordConsent,
  isEdited,
}: {
  consentActive: boolean;
  messageText: string;
  onMessageChange: (text: string) => void;
  onConfirm: () => void;
  onLogWithoutSending: () => void;
  onClose: () => void;
  onRecordConsent?: () => void;
  isEdited: boolean;
}) {
  return (
    <ModalShell>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "20px 20px 0",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              lineHeight: "1.35",
              color: DS.textPrimary,
              margin: 0,
            }}
          >
            Patient message preview
          </h2>
          <p style={{ fontSize: 12, fontWeight: 400, color: DS.textMuted, lineHeight: "1.4", margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>
            Status already updated. Confirm or skip the patient notification.
          </p>
        </div>
        <button
          aria-label="Close modal"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: DS.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Channel label */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.textMuted }}>
          <MessageSquare size={14} aria-hidden="true" />
          <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "1.4" }}>SMS</span>
        </div>

        {/* Textarea */}
        <textarea
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            backgroundColor: "#F4F6F8",
            border: `1px solid ${DS.borderInput}`,
            borderLeft: "3px solid #2563EB",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: "1.43",
            color: DS.textPrimary,
            fontFamily: "Inter, sans-serif",
            resize: "none",
            boxSizing: "border-box",
            outline: "none",
          }}
          aria-label="Patient message"
        />

        {isEdited && (
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Edited</span>
        )}

        {/* Audit note */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "1.4",
            color: "#64748B",
            margin: 0,
          }}
        >
          Edited messages are flagged in the audit trail.
        </p>

        {/* Warning banner — consent=FALSE only */}
        {!consentActive && (
          <div
            role="alert"
            style={{
              backgroundColor: DS.warningBg,
              borderLeft:   `3px solid ${DS.warningBorder}`,
              borderTop:    "1px solid rgba(183,119,13,0.25)",
              borderRight:  "1px solid rgba(183,119,13,0.25)",
              borderBottom: "1px solid rgba(183,119,13,0.25)",
              borderRadius: 6,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertTriangle
              size={16}
              aria-hidden="true"
              style={{ color: DS.warningText, flexShrink: 0, marginTop: 1 }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: "1.43",
                  color: DS.warningText,
                  margin: "0 0 8px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Consent required — record consent to enable message delivery.
              </p>
              <SecondaryButton disabled={!onRecordConsent} onClick={onRecordConsent}>Record consent</SecondaryButton>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "0 20px 20px",
        }}
      >
        <SecondaryButton onClick={onLogWithoutSending}>Skip message</SecondaryButton>
        <PrimaryButton disabled={!consentActive} onClick={onConfirm}>Confirm and send</PrimaryButton>
      </div>
    </ModalShell>
  );
}

// ── Status Drawer ─────────────────────────────────────────────────────────────
type TransitionMeta = {
  doc_link: string | null;
  reason_code: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
};

function buildMeta(
  gateField: string | null,
  docLink: string,
  reasonCode: string,
  appointmentLink: string,
  nextStepNote: string,
): TransitionMeta {
  return {
    doc_link:         gateField === "doc_link"         ? (docLink.trim() || null)         : null,
    reason_code:      gateField === "reason_code"      ? (reasonCode.trim() || null)      : null,
    appointment_link: gateField === "appointment_link" ? (appointmentLink.trim() || null) : null,
    next_step_note:   gateField === "next_step_note"   ? (nextStepNote.trim() || null)    : null,
  };
}

const GATE_FIELD_LABELS: Record<string, string> = {
  doc_link: "Documentation",
  reason_code: "Reason code",
  appointment_link: "Appointment link",
  next_step_note: "Next step note",
};

function StatusDrawer({
  onClose,
  onOpenModal,
  onLogOnly,
  currentStatus,
  transitionError,
  onClearError,
  patientName,
  caseNumber,
  drug,
  isDrawerOpen,
  consentFlag,
  onDemoReset,
  onDemoClone,
  onDemoReopen,
  onOpenAudit,
}: {
  onClose: () => void;
  onOpenModal: (text: string, toStatus: PaStatus, meta: TransitionMeta) => void;
  onLogOnly: (toStatus: PaStatus, meta: TransitionMeta) => void;
  currentStatus: PaStatus;
  transitionError: string | null;
  onClearError: () => void;
  patientName: string;
  caseNumber: string;
  drug: string | null;
  isDrawerOpen: boolean;
  consentFlag: boolean;
  onDemoReset: () => Promise<void>;
  onDemoClone: () => Promise<void>;
  onDemoReopen: () => Promise<void>;
  onOpenAudit: () => void;
}) {
  const [selectedTransition, setSelectedTransition] = useState<PaStatus>(
    () => getValidTransitions(currentStatus)[0] ?? "closed",
  );
  const [messageText, setMessageText] = useState(
    () => getPatientMessage(getValidTransitions(currentStatus)[0] ?? "closed"),
  );
  const [gateError,       setGateError]       = useState<string | null>(null);
  const [docLink,         setDocLink]         = useState("");
  const [reasonCode,      setReasonCode]      = useState("");
  const [appointmentLink, setAppointmentLink] = useState("");
  const [nextStepNote,    setNextStepNote]    = useState("");
  const [demoLoading, setDemoLoading] = useState<"reset" | "clone" | "reopen" | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    const first = getValidTransitions(currentStatus)[0] ?? "closed";
    setSelectedTransition(first);
    setMessageText(getPatientMessage(first));
    setGateError(null);
    setDemoError(null);
    setDocLink(""); setReasonCode(""); setAppointmentLink(""); setNextStepNote("");
  }, [currentStatus]);

  useEffect(() => {
    setMessageText(getPatientMessage(selectedTransition));
    setGateError(null);
    setDocLink(""); setReasonCode(""); setAppointmentLink(""); setNextStepNote("");
  }, [selectedTransition]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: "600px",
        backgroundColor: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
        borderRadius: "12px 0 0 12px",
        boxShadow: "-4px 0 24px rgba(15,23,42,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-6 py-5 border-b flex-shrink-0"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="flex flex-col gap-2">
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            Case #{caseNumber} — {patientName}
          </h2>
          <div className="flex items-center gap-2">
            <span
              style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}
            >
              Current status
            </span>
            <StatusBadge key={currentStatus} status={currentStatus} className="pa-chip-animate" />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center rounded-md"
          aria-label="Close drawer"
          style={{
            width: "32px",
            height: "32px",
            color: "#64748B",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#F1F5F9")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
          }
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto p-6 flex flex-col gap-5">
        {/* Case meta */}
        <div
          className="rounded-lg p-4 flex flex-col gap-3 border"
          style={{ backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}>
                Patient
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", lineHeight: 1.43 }}>
                {patientName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}>
                Drug
              </span>
              <span style={{ fontSize: "13px", fontWeight: 400, color: "#64748B", lineHeight: 1.4, fontFamily: "Inter, sans-serif" }}>
                {drug ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Transition selector */}
        <div className="relative flex flex-col gap-1.5">
          <span
            style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", lineHeight: 1.43, display: "block" }}
          >
            Log transition to
          </span>
          <TransitionDropdown
            currentStatus={currentStatus}
            value={selectedTransition}
            onChange={setSelectedTransition}
            isDrawerOpen={isDrawerOpen}
          />
          {gateError && (
            <p
              role="alert"
              style={{
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "1.43",
                color: "#B45309",
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {gateError}
            </p>
          )}
        </div>

        {/* Gate field input — visible only when the selected transition requires it */}
        {(() => {
          const gate = getTransitionGate(currentStatus, selectedTransition);
          if (!gate) return null;
          const label = GATE_FIELD_LABELS[gate.field] ?? gate.field;
          const inputStyle = {
            fontSize: "14px",
            fontWeight: 400 as const,
            color: "#0F172A",
            lineHeight: 1.43,
            fontFamily: "Inter, sans-serif",
            borderColor: "#CBD5E1",
            backgroundColor: "#FFFFFF",
            outline: "none",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            padding: "6px 12px",
            boxSizing: "border-box" as const,
          };
          const onFocus = (e: React.FocusEvent<HTMLElement>) => {
            if (e.target.matches(":focus-visible")) {
              (e.currentTarget as HTMLElement).style.borderColor = "#2563EB";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(37,99,235,0.15)";
            }
          };
          const onBlur = (e: React.FocusEvent<HTMLElement>) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#CBD5E1";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          };
          return (
            <div className="flex flex-col gap-1.5">
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", lineHeight: 1.43, display: "block" }}>
                {label}<span style={{ color: "#B45309", marginLeft: 2 }}>*</span>
              </span>
              {gate.field === "next_step_note" ? (
                <textarea
                  value={nextStepNote}
                  onChange={(e) => setNextStepNote(e.target.value)}
                  placeholder="Required for this transition"
                  rows={3}
                  className="resize-none"
                  style={{ ...inputStyle, height: "auto" }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              ) : (
                <input
                  type="text"
                  value={
                    gate.field === "doc_link" ? docLink
                    : gate.field === "reason_code" ? reasonCode
                    : appointmentLink
                  }
                  onChange={(e) => {
                    if (gate.field === "doc_link") setDocLink(e.target.value);
                    else if (gate.field === "reason_code") setReasonCode(e.target.value);
                    else setAppointmentLink(e.target.value);
                  }}
                  placeholder="Required for this transition"
                  style={{ ...inputStyle, height: "36px" }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              )}
              <span style={{ fontSize: "12px", color: "var(--pa-text-muted)", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                Required to proceed with this transition.
              </span>
            </div>
          );
        })()}

        {/* Message preview card */}
        <div
          className="flex flex-col gap-3 rounded-lg border p-4"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#64748B",
              lineHeight: 1.4,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Patient message
          </span>

          <textarea
            value={messageText}
            readOnly
            rows={4}
            className="w-full rounded-md border px-3 py-2 resize-none"
            style={{
              backgroundColor: "#F1F5F9",
              borderColor: "#CBD5E1",
              fontSize: "14px",
              fontWeight: 400,
              color: "#0F172A",
              lineHeight: 1.43,
              fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
            onFocus={(e) => {
              if (e.target.matches(":focus-visible")) {
                e.currentTarget.style.borderColor = "#2563EB";
                e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <span
            style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}
          >
            Patient-facing edits are completed in the confirmation modal.
          </span>
        </div>

        {/* Consent indicator */}
        <div className="flex items-center gap-3">
          <span
            style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}
          >
            Consent
          </span>
          {consentFlag ? (
            <span
              className="inline-flex items-center gap-1"
              title="Patient has consented to status update messages"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#15803D",
                backgroundColor: "#F0FDF4",
                border: "1px solid rgba(20,83,45,0.20)",
                borderRadius: "9999px",
                padding: "3px 9px",
                lineHeight: 1.4,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <CheckCircle2 size={12} aria-hidden="true" />
              Consent on file
            </span>
          ) : (
            <span title="No consent on file" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <TriangleAlert size={15} style={{ color: "#92400E" }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#92400E", fontFamily: "Inter, sans-serif" }}>Consent required</span>
            </span>
          )}
        </div>

        {/* Demo controls */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--pa-demo-text)",
                backgroundColor: "var(--pa-demo-bg)",
                border: "1px solid var(--pa-demo-border)",
                borderRadius: 9999,
                padding: "2px 8px",
                lineHeight: 1,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Demo only
            </span>
            <span style={{ fontSize: 12, color: "#64748B", fontFamily: "Inter, sans-serif" }}>
              Controls for scenario testing
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--pa-text-muted)", fontFamily: "Inter, sans-serif", lineHeight: 1.4, display: "block", marginBottom: 6 }}>
            Demo controls
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                { key: "reset" as const,  label: "Reset to baseline" },
                { key: "clone" as const,  label: "Clone case"        },
                { key: "reopen" as const, label: "Re-open"           },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                disabled={demoLoading !== null}
                onClick={async () => {
                  if (key === "reset" && !window.confirm("Reset this case to its baseline state?")) return;
                  setDemoLoading(key);
                  setDemoError(null);
                  try {
                    if (key === "reset") await onDemoReset();
                    else if (key === "clone") await onDemoClone();
                    else await onDemoReopen();
                  } catch (err) {
                    setDemoError(err instanceof Error ? err.message : "Action failed.");
                  } finally {
                    setDemoLoading(null);
                  }
                }}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: demoLoading !== null ? "#94A3B8" : "#475569",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: demoLoading !== null ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.4,
                }}
              >
                {demoLoading === key ? "…" : label}
              </button>
            ))}
          </div>
          {demoError && (
            <p
              role="alert"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#BE123C",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.4,
                margin: "8px 0 0",
              }}
            >
              {demoError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAudit}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-semibold leading-[1.4] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#4A5568",
            borderColor: "#CBD5E1",
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            fontFamily: "Inter, sans-serif",
            alignSelf: "flex-start",
          }}
        >
          <Layers size={13} aria-hidden="true" />
          Open audit trail
        </button>
      </div>

      {transitionError && (
        <div
          role="alert"
          style={{
            margin: "0 24px 12px",
            padding: "10px 12px",
            backgroundColor: "#FFF1F2",
            border: "1px solid #FDA4AF",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#BE123C", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
            {transitionError}
          </span>
          <button
            type="button"
            onClick={() => {
              onClearError();
              onLogOnly(
                selectedTransition,
                buildMeta(
                  getTransitionGate(currentStatus, selectedTransition)?.field ?? null,
                  docLink, reasonCode, appointmentLink, nextStepNote,
                ),
              );
            }}
            style={{ fontSize: 13, fontWeight: 500, color: "#BE123C", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Inter, sans-serif", flexShrink: 0 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
        style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}
      >
        <button
          type="button"
          title="Saves the transition without sending a patient update."
          onClick={() => {
            const gate = getTransitionGate(currentStatus, selectedTransition);
            const activeValue = gate?.field === "doc_link" ? docLink
              : gate?.field === "reason_code" ? reasonCode
              : gate?.field === "appointment_link" ? appointmentLink
              : gate?.field === "next_step_note" ? nextStepNote : "";
            if (gate && !activeValue.trim()) { setGateError(gate.message); return; }
            setGateError(null);
            onLogOnly(selectedTransition, buildMeta(gate?.field ?? null, docLink, reasonCode, appointmentLink, nextStepNote));
          }}
          className="px-4 rounded-md border"
          style={{
            height: "36px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            backgroundColor: "#FFFFFF",
            borderColor: "#CBD5E1",
            cursor: "pointer",
            lineHeight: 1.43,
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF")
          }
          onMouseDown={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)")
          }
          onMouseUp={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "scale(1)")
          }
        >
          Log status only
        </button>

        <button
          type="button"
          onClick={() => {
            const gate = getTransitionGate(currentStatus, selectedTransition);
            const activeValue = gate?.field === "doc_link" ? docLink
              : gate?.field === "reason_code" ? reasonCode
              : gate?.field === "appointment_link" ? appointmentLink
              : gate?.field === "next_step_note" ? nextStepNote : "";
            if (gate && !activeValue.trim()) { setGateError(gate.message); return; }
            setGateError(null);
            onOpenModal(messageText, selectedTransition, buildMeta(gate?.field ?? null, docLink, reasonCode, appointmentLink, nextStepNote));
          }}
          className="px-4 rounded-md"
          style={{
            height: "36px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#FFFFFF",
            backgroundColor: "#2563EB",
            border: "1px solid transparent",
            cursor: "pointer",
            lineHeight: 1.43,
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#2563EB")
          }
          onMouseDown={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)")
          }
          onMouseUp={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "scale(1)")
          }
        >
          Confirm and send
        </button>
      </div>
    </div>
  );
}

// ── Audit Trail ──────────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium leading-[1.4] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        style={{
          color: value ? "#2563EB" : "#4A5568",
          borderColor: value ? "#2563EB" : "#CBD5E1",
          backgroundColor: "#FFFFFF",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {value ?? label}
        <ChevronDown
          size={13}
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
        />
      </button>
      {open && (
        <ul className="absolute left-0 top-full mt-1 z-50 min-w-max rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={{
                color: opt === value ? "#2563EB" : "#0F172A",
                fontWeight: opt === value ? 500 : 400,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {opt}
            </li>
          ))}
          {value !== null && (
            <li
              onClick={() => { onChange(null); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 border-t border-gray-100"
              style={{ color: "#64748B", fontFamily: "Inter, sans-serif" }}
            >
              Clear
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

interface MetadataCardProps {
  reasonCode?: string;
  docLink?: string;
  messageSent: boolean;
  messageCustom: boolean;
  messageText?: string;
}

function MetadataCard({ reasonCode, docLink, messageSent, messageCustom, messageText }: MetadataCardProps) {
  return (
    <div
      className="rounded-md p-3 mt-2"
      style={{
        backgroundColor: "var(--pa-surface-panel)",
        border: "1px solid #E2E8F0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {reasonCode !== undefined && (
          <>
            <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Reason code</dt>
            <dd style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 400, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
              {reasonCode || "—"}
            </dd>
          </>
        )}
        {docLink !== undefined && (
          <>
            <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Doc link</dt>
            <dd style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", lineHeight: "1.4" }}>
              <a
                href="#"
                style={{ color: "#2563EB", textDecoration: "underline", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                View document
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </dd>
          </>
        )}
        <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Message sent</dt>
        <dd style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 400, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
          {messageSent ? "Yes" : "No"}
          {messageSent && messageText && (
            <span style={{ color: "#4A5568", fontFamily: "Inter, sans-serif", marginLeft: 4 }}>— "{messageText}"</span>
          )}
        </dd>
        <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Message custom</dt>
        <dd style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 400, fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
          {messageCustom ? "Yes" : "No"}
        </dd>
      </dl>
    </div>
  );
}

interface TimelineNode {
  id: string;
  timestamp: string;
  actor: string;
  type: "transition" | "demo";
  from?: PAStatus;
  to?: PAStatus;
  demoLabel?: string;
  metadata?: MetadataCardProps;
}



function TimelineNodeRow({ node, isLast }: { node: TimelineNode; isLast: boolean }) {
  const isDemo = node.type === "demo";
  return (
    <div className="flex gap-3">
      {/* Connector column */}
      <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
        {isDemo ? (
          <div
            className="mt-1 shrink-0"
            style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px dashed #718096", backgroundColor: "transparent" }}
          />
        ) : (
          <div
            className="mt-1 shrink-0"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#2563EB",
              border: "2px solid #FFFFFF",
              boxShadow: "0 0 0 1.5px #2563EB",
            }}
          />
        )}
        {!isLast && (
          <div
            className="flex-1 mt-1"
            style={{ width: 1, minHeight: 16, borderLeft: isDemo ? "1px dashed #E2E8F0" : "1px solid #E2E8F0" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[12px] font-normal leading-[1.4]" style={{ color: "#718096", fontFamily: "JetBrains Mono, monospace" }}>
            {node.timestamp}
          </span>
          <span className="text-[12px] font-medium leading-[1.4]" style={{ color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
            {node.actor}
          </span>
        </div>

        <div className="mt-1.5">
          {isDemo ? (
            <div className="flex flex-col" style={{ gap: 4 }}>
              <span className="text-[13px] font-normal leading-[1.5]" style={{ color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
                {node.demoLabel}
              </span>
              <span
                className="inline-flex items-center rounded-full font-semibold self-start"
                style={{
                  backgroundColor: "var(--pa-demo-bg)",
                  color: "var(--pa-demo-text)",
                  border: "1px solid var(--pa-demo-border)",
                  fontSize: "10px",
                  fontWeight: 600,
                  lineHeight: 1,
                  paddingLeft: "9px",
                  paddingRight: "9px",
                  paddingTop: "3px",
                  paddingBottom: "3px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Demo event
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {node.from && <StatusBadge status={node.from} size="sm" />}
              <span style={{ color: "#718096", fontSize: 12 }}>→</span>
              {node.to && <StatusBadge status={node.to} size="sm" />}
            </div>
          )}
        </div>

        {node.metadata && <MetadataCard {...node.metadata} />}
      </div>
    </div>
  );
}

// IMMUTABLE: no edit or delete controls rendered per audit trail spec
function AuditDrawer({ onClose, selectedCase, refreshToken }: {
  onClose: () => void;
  selectedCase: CaseListItem | null;
  refreshToken: number;
}) {
  const [filterActionType, setFilterActionType] = useState<string | null>("Status change");
  const [filterActor, setFilterActor] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<TimelineNode[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const auditCaseId = selectedCase?.id ?? null;

  useEffect(() => {
    if (!auditCaseId) { setAuditRows([]); return; }
    let ignore = false;
    setAuditLoading(true);
    setAuditError(null);
    fetch(`/api/cases/${auditCaseId}/audit`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        setAuditRows(
          (data.audit ?? []).map((row: {
            id: string;
            from_status: PaStatus | null;
            to_status: PaStatus;
            actor_label: string;
            timestamp: string;
            reason_code: string | null;
            doc_link: string | null;
            message_sent: boolean;
            message_text: string | null;
            message_custom: boolean;
          }) => {
            const d = new Date(row.timestamp);
            const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            return {
              id: row.id,
              timestamp: `${date} · ${time}`,
              actor: row.actor_label,
              type: "transition" as const,
              from: row.from_status ?? undefined,
              to: row.to_status,
              metadata: {
                reasonCode: row.reason_code ?? undefined,
                docLink: row.doc_link ?? undefined,
                messageSent: row.message_sent,
                messageText: row.message_text ?? undefined,
                messageCustom: row.message_custom,
              },
            };
          }),
        );
      })
      .catch(() => { if (!ignore) setAuditError("Failed to load audit trail. Try closing and reopening the case."); })
      .finally(() => { if (!ignore) setAuditLoading(false); });
    return () => { ignore = true; };
  }, [auditCaseId, refreshToken]);

  const actorOptions = [...new Set(auditRows.map((r) => r.actor))];

  const activeParts: string[] = [];
  if (filterActionType) activeParts.push(filterActionType);
  if (filterActor) activeParts.push(filterActor);
  if (filterDateRange) activeParts.push(filterDateRange);

  const caseIdDisplay = (() => {
    const id = selectedCase?.id ?? "—";
    return id.length > 20 ? id.slice(0, 20) + "…" : id;
  })();

  const filteredNodes = auditRows.filter((node) => {
    if (filterActionType === "Status change" && node.type !== "transition") return false;
    if (filterActor !== null && node.actor !== filterActor) return false;
    // TODO: filter by filterDateRange when date-range picker is wired
    return true;
  });

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 600,
        backgroundColor: "#FFFFFF",
        boxShadow: "-4px 0 24px rgba(15,23,42,0.12)",
        borderTopLeftRadius: "12px",
        borderBottomLeftRadius: "12px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid #E2E8F0" }}
      >
        <h2 className="text-[16px] font-semibold leading-[1.35]" style={{ color: "#1A1F2E" }}>
          Audit trail
        </h2>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Lock size={16} style={{ color: "#718096" }} aria-hidden="true" />
            <span className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>
              Permanent record
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <button
              type="button"
              disabled={selectedCase === null}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium leading-[1.4] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "#4A5568", borderColor: "#CBD5E1", backgroundColor: "transparent" }}
              aria-label="Export CSV"
              onClick={async () => {
                if (!selectedCase) return;
                const res = await fetch(`/api/cases/${selectedCase.id}/audit/export`, { method: "GET" });
                if (!res.ok) {
                  setExportError("Export failed — try again.");
                  return;
                }
                setExportError(null);
                const disposition = res.headers.get("Content-Disposition") ?? "";
                const match = disposition.match(/filename="?([^";\n]+)"?/);
                const filename = match?.[1] ?? `audit_${selectedCase.id}_${new Date().toISOString().slice(0, 10)}.csv`;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={13} aria-hidden="true" />
              Export CSV
            </button>
            {exportError && (
              <span role="alert" style={{ fontSize: 11, color: "#BE123C", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                {exportError}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md w-8 h-8 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            style={{ color: "#718096" }}
            aria-label="Close audit trail"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Case summary card */}
        <div className="rounded-lg p-4" style={{ backgroundColor: "var(--pa-surface-panel)", border: "1px solid #E2E8F0" }}>
          <dl className="grid gap-x-6 gap-y-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Patient</dt>
              <dd className="text-[14px] font-medium leading-[1.43]" style={{ color: "#1A1F2E" }}>{selectedCase?.patient_name ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Case ID</dt>
              <dd style={{ fontFamily: "JetBrains Mono, monospace", color: "#475569", fontWeight: 400, fontSize: "12px", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {caseIdDisplay}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Drug</dt>
              <dd style={{ fontFamily: "JetBrains Mono, monospace", color: "#475569", fontWeight: 400, fontSize: "12px", lineHeight: "1.4" }}>
                {selectedCase?.drug ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Status</dt>
              <dd><StatusBadge key={selectedCase?.status ?? "closed"} status={selectedCase?.status ?? "closed"} className="pa-chip-animate" /></dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Consent</dt>
              <dd>
                {selectedCase?.consent_flag ? (
                  <span
                    className="inline-flex items-center rounded-full font-semibold"
                    style={{
                      backgroundColor: "#D5F5E3",
                      color: "#1E8449",
                      border: "1px solid rgba(30,132,73,0.25)",
                      fontSize: "11px",
                      fontWeight: 600,
                      lineHeight: 1,
                      paddingLeft: "9px",
                      paddingRight: "9px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                    }}
                  >
                    Consent on file
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <TriangleAlert size={15} style={{ color: "#92400E" }} aria-hidden="true" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#92400E", fontFamily: "Inter, sans-serif" }}>Consent required</span>
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown
              label="Action type"
              value={filterActionType}
              options={["Status change", "Message suppressed", "Custom message"]}
              onChange={setFilterActionType}
            />
            <FilterDropdown
              label="Actor"
              value={filterActor}
              options={actorOptions}
              onChange={setFilterActor}
            />
            <FilterDropdown
              label="Date range"
              value={filterDateRange}
              options={["Last 24h", "Last 7 days", "All time"]}
              onChange={setFilterDateRange}
            />
          </div>
          {activeParts.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium leading-[1.4]" style={{ color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
                Filtered by:{" "}
                <span style={{ color: "#1A1F2E" }}>{activeParts.join(" · ")}</span>
              </span>
              <button
                type="button"
                onClick={() => { setFilterActionType(null); setFilterActor(null); setFilterDateRange(null); }}
                className="text-[12px] font-medium leading-[1.4] underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
                style={{ color: "#2563EB" }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex flex-col">
          {auditLoading ? (
            <span style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif" }}>Loading audit trail…</span>
          ) : auditError ? (
            <span role="alert" style={{ fontSize: 13, color: "#BE123C", fontFamily: "Inter, sans-serif" }}>{auditError}</span>
          ) : (
            filteredNodes.map((node, i) => (
              <TimelineNodeRow key={node.id} node={node} isLast={i === filteredNodes.length - 1} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// ── Empty States ─────────────────────────────────────────────────────────────

function EmptyBodyNoCases({ onCreateCase }: { onCreateCase: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <FolderOpen size={40} style={{ color: "#64748B", marginBottom: 12 }} aria-hidden="true" />
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "1.35",
          color: "#0F172A",
          marginBottom: 8,
        }}
      >
        No cases yet — add your first case to get started.
      </span>
      <button
        onClick={onCreateCase}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 36,
          padding: "0 16px",
          backgroundColor: "#2563EB",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary-hover)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#2563EB")}
      >
        <Plus size={15} aria-hidden="true" />
        Create case
      </button>
    </div>
  );
}

function EmptyBodyNoResults() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <SearchX size={40} style={{ color: "#64748B", marginBottom: 12 }} aria-hidden="true" />
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "1.35",
          color: "#0F172A",
          marginBottom: 8,
        }}
      >
        No cases match your search.
      </span>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "1.43",
          color: "#475569",
        }}
      >
        Try a different name, drug, or case ID.
      </span>
    </div>
  );
}

function EmptyBodyNoStatusMatch() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <SearchX size={40} style={{ color: "var(--pa-text-muted)", marginBottom: 12 }} aria-hidden="true" />
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "1.35",
          color: "var(--pa-text-primary)",
        }}
      >
        No cases with this status.
      </span>
    </div>
  );
}

// ── Create Case Modal ─────────────────────────────────────────────────────────
function CreateCaseModal({
  onSubmit,
  onClose,
  submitError,
  isSubmitting,
}: {
  onSubmit: (patientName: string, consentFlag: boolean) => void;
  onClose: () => void;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  const [patientName, setPatientName] = useState("");
  const [consentFlag, setConsentFlag] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const nameEmpty = patientName.trim() === "";
  const showNameError = nameTouched && nameEmpty;

  return (
    <ModalShell>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 0",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "1.35",
            color: DS.textPrimary,
            margin: 0,
          }}
        >
          Create case
        </h2>
        <button
          aria-label="Close modal"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: DS.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Patient name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="create-patient-name"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: DS.textPrimary,
              lineHeight: "1.4",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Patient name
          </label>
          <input
            id="create-patient-name"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Full name"
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              border: `1px solid ${showNameError ? "#DC2626" : DS.borderInput}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 14,
              fontWeight: 400,
              lineHeight: "1.43",
              color: DS.textPrimary,
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB"; }}
            onBlur={(e) => {
              setNameTouched(true);
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {showNameError && (
            <span
              role="alert"
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#DC2626",
                lineHeight: "1.4",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Patient name is required.
            </span>
          )}
        </div>

        {/* Consent toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="create-consent-flag"
            checked={consentFlag}
            onChange={(e) => setConsentFlag(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2563EB" }}
          />
          <label
            htmlFor="create-consent-flag"
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: DS.textPrimary,
              lineHeight: "1.43",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
            }}
          >
            Patient has given consent
          </label>
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          style={{
            margin: "0 20px 12px",
            padding: "10px 12px",
            backgroundColor: "#FFF1F2",
            border: "1px solid #FDA4AF",
            borderRadius: 6,
            fontSize: 13,
            color: "#BE123C",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.4,
          }}
        >
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "0 20px 20px",
        }}
      >
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton
          disabled={nameEmpty || isSubmitting}
          onClick={() => onSubmit(patientName.trim(), consentFlag)}
        >
          {isSubmitting ? "Creating…" : "Create case"}
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) { setAuthed(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
  }, []);

  const [activeFilter, setActiveFilter] = useState<PAStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessageText, setModalMessageText] = useState(MESSAGE_COPY);
  const [pendingToStatus, setPendingToStatus] = useState<PaStatus | null>(null);
  const [pendingMeta, setPendingMeta] = useState<TransitionMeta>({ doc_link: null, reason_code: null, appointment_link: null, next_step_note: null });
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditCaseId, setAuditCaseId] = useState<string | null>(null);
  const [auditRefreshToken, setAuditRefreshToken] = useState(0);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [createCaseError, setCreateCaseError] = useState<string | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  async function fetchCases() {
    if (!supabase) {
      console.warn("Supabase env vars are not configured; skipping case fetch.");
      return;
    }
    const { data, error } = await supabase
      .from('cases')
      .select('id, patient_name, drug, current_status, consent_flag, updated_at')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('fetch cases error:', error.message);
      return;
    }
    if (data) setCases(data.map(({ id, patient_name, drug, current_status, consent_flag, updated_at }) => ({
      id, patient_name, drug: drug ?? null, status: current_status as PaStatus, consent_flag, updated_at,
    })));
  }

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (drawerOpen) return;
    const t = setTimeout(() => setSelectedCaseId(null), 200);
    return () => clearTimeout(t);
  }, [drawerOpen]);

  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successToast])

  useEffect(() => {
    if (!document.querySelector('link[data-pa-font]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-pa-font", "1");
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const filtered = cases.filter((c) => {
    const matchStatus = activeFilter === "all" || c.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.patient_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openDrawer(id: string) {
    setSelectedCaseId(id);
    setDrawerOpen(true);
  }

  function openModal(text: string, toStatus: PaStatus, meta: TransitionMeta) {
    setModalMessageText(text);
    setPendingToStatus(toStatus);
    setPendingMeta(meta);
    setModalOpen(true);
  }

  async function postTransition(
    toStatus: PaStatus,
    meta: TransitionMeta,
    messageSent: boolean,
    messageText: string | null,
    messageCustom: boolean,
  ): Promise<boolean> {
    setTransitionError(null);
    if (!selectedCaseId) return false;
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status: toStatus, ...meta, message_sent: messageSent, message_text: messageText, message_custom: messageCustom }),
      });
      if (res.status === 401 || res.status === 403) {
        setTransitionError("Session expired — please sign in again.");
        return false;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("transition failed:", err.error, err.message);
        setTransitionError(err.message ?? "Status update failed. Check your connection and try again.");
        return false;
      }
      const data = await res.json();
      setCases((prev) => prev.map((c) => c.id === selectedCaseId ? { ...c, status: data.case.status } : c));
      setSuccessToast(`Status updated to ${BADGE_CONFIG[data.case.status as PAStatus]?.label ?? data.case.status}.`);
      if (auditOpen && auditCaseId === selectedCaseId) setAuditRefreshToken((t) => t + 1);
      return true;
    } catch (err) {
      console.error("transition error:", err);
      setTransitionError("Connection error — changes weren't saved. Try again.");
      return false;
    }
  }

  async function handleLogOnly(toStatus: PaStatus, meta: TransitionMeta) {
    const ok = await postTransition(toStatus, meta, false, null, false);
    if (ok) setDrawerOpen(false);
  }

  function handleCreateCase() {
    setShowCreateCase(true);
  }

  async function handleCreateCaseSubmit(patientName: string, consentFlag: boolean) {
    setIsCreatingCase(true);
    setCreateCaseError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_name: patientName, consent_flag: consentFlag }),
      });
      if (res.status === 401 || res.status === 403) {
        setCreateCaseError("Session expired — please sign in again.");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCreateCaseError(err.message ?? "Failed to create case. Please try again.");
        return;
      }
      setShowCreateCase(false);
      setCreateCaseError(null);
      await fetchCases();
      setSuccessToast("Case created successfully.");
    } catch {
      setCreateCaseError("Connection error — case wasn't created. Try again.");
    } finally {
      setIsCreatingCase(false);
    }
  }

  async function handleConsentUpdate(id: string) {
    try {
      const res = await fetch(`/api/cases/${id}/consent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_flag: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error(err.error, err.message);
        return;
      }
      const data = await res.json();
      setCases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, consent_flag: data.case.consent_flag as boolean } : c)),
      );
    } catch (err) {
      console.error("consent update failed", err);
    }
  }

  async function handleDemoReset() {
    if (!selectedCaseId) return;
    const res = await fetch(`/api/cases/${selectedCaseId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Reset failed.");
    }
    const data = await res.json();
    setCases((prev) => prev.map((c) =>
      c.id === selectedCaseId ? { ...c, status: data.case.status, updated_at: data.case.updated_at } : c
    ));
    setSuccessToast("Case reset to baseline.");
  }

  async function handleDemoClone() {
    if (!selectedCaseId) return;
    const res = await fetch(`/api/cases/${selectedCaseId}/clone`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Clone failed.");
    }
    await fetchCases();
    setDrawerOpen(false);
    setSuccessToast("Case cloned successfully.");
  }

  async function handleDemoReopen() {
    if (!selectedCaseId) return;
    const res = await fetch(`/api/cases/${selectedCaseId}/reopen`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Re-open failed.");
    }
    const data = await res.json();
    setCases((prev) => prev.map((c) =>
      c.id === selectedCaseId ? { ...c, status: data.case.status, updated_at: data.case.updated_at } : c
    ));
    setSuccessToast("Case re-opened.");
  }

  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;
  const auditCase = cases.find((c) => c.id === auditCaseId) ?? null;

  if (authed === null) return null;
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  return (
    <div
      className="relative flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "row", height: "100vh", width: "100%", overflow: "hidden", position: "relative" }}
    >
      <style>{`
        .pa-mono {
          font-family: 'JetBrains Mono', 'Courier New', Courier, monospace !important;
        }
        .pa-needs-docs-text {
          color: #C2410C !important;
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 h-full"
        style={{
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100%",
          width: 220,
          backgroundColor: "#F8FAFC",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-4"
          style={{ height: 56, borderBottom: "1px solid #E2E8F0" }}
        >
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

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {/* Cases — active */}
          <button
            className="flex items-center gap-2 w-full rounded-md text-left transition-colors duration-100 focus:outline-none"
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--pa-surface-panel)",
              color: "#2563EB",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid rgba(37,99,235,0.12)",
            }}
          >
            <Layers size={15} aria-hidden="true" />
            Cases
          </button>
          {/* Settings */}
          <button
            className="flex items-center gap-2 w-full rounded-md text-left transition-colors duration-100 hover:bg-[#F1F5F9] focus:outline-none"
            style={{
              padding: "8px 12px",
              color: "#475569",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <Settings size={15} aria-hidden="true" />
            Settings
          </button>
        </nav>

        {/* Bottom user row */}
        <div
          style={{
            borderTop: "1px solid #E2E8F0",
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <User size={16} aria-hidden="true" style={{ color: "#64748B", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#475569",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            Demo Coordinator
          </span>
          <button
            type="button"
            onClick={async () => {
              if (supabase) await supabase.auth.signOut();
              setAuthed(false);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#94A3B8",
              fontFamily: "Inter, sans-serif",
              padding: "2px 4px",
              borderRadius: 4,
              lineHeight: 1.4,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="relative flex flex-col flex-1 min-w-0 h-full overflow-hidden" style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minWidth: 0, height: "100%", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
        {/* Top Bar */}
        <div
          className="flex items-center gap-4 px-6 shrink-0"
          style={{ display: "flex", alignItems: "center", gap: 16, paddingLeft: 24, paddingRight: 24, flexShrink: 0, height: 56, borderBottom: "1px solid #E2E8F0" }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "#0F172A",
              flex: 1,
            }}
          >
            Cases
          </h1>

          {/* Search */}
          <div className="relative" style={{ width: 240 }}>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94A3B8" }}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search cases…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md focus:outline-none"
              style={{
                height: 34,
                paddingLeft: 32,
                paddingRight: 12,
                fontSize: 13,
                fontWeight: 400,
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontFamily: "Inter, sans-serif",
              }}
              onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB"; }}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          {/* New Case Button */}
          <button
            className="flex items-center gap-1.5 rounded-md transition-colors duration-100 focus:outline-none whitespace-nowrap"
            style={{
              height: 34,
              paddingLeft: 14,
              paddingRight: 14,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--pa-primary-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
            onClick={handleCreateCase}
            onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB, 0 0 0 4px rgba(37,99,235,0.2)"; }}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <PlusCircle size={14} aria-hidden="true" />
            New case
          </button>
        </div>

        {/* Filter Chip Bar */}
        <div
          className="pa-chip-bar flex items-center gap-2 px-6 shrink-0"
          style={{
            height: 48,
            borderBottom: "1px solid #E2E8F0",
            flexWrap: "wrap",
            rowGap: 8,
          }}
        >
          <FilterChip
            label="All"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          {ALL_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={BADGE_CONFIG[s].label}
              status={s}
              active={activeFilter === s}
              onClick={() => setActiveFilter(activeFilter === s ? "all" : s)}
            />
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: "#F1F5F9" }}>
                <th
                  className="text-left"
                  style={{ width: 40, padding: "12px 16px" }}
                >
                  <span className="sr-only">Select</span>
                </th>
                <th
                  className="text-left"
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Patient / Drug
                </th>
                <th
                  className="text-left"
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Status
                </th>
                <th
                  className="text-left"
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: "#475569",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Last Updated
                </th>
                <th style={{ width: 32, padding: "12px 12px 12px 0" }}>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c, idx) => {
                const isSelected = c.id === selectedCaseId && drawerOpen;
                const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";

                return (
                  <tr
                    key={c.id}
                    style={{
                      backgroundColor: isSelected ? "#EFF6FF" : rowBg,
                      borderBottom: "1px solid #E2E8F0",
                      minHeight: 48,
                      cursor: "pointer",
                    }}
                    className="transition-colors duration-75 group"
                    onClick={() => openDrawer(String(c.id))}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--pa-surface-alt)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isSelected ? "#EFF6FF" : rowBg;
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "12px 16px", width: 40 }}>
                      <button
                        className="flex items-center justify-center focus:outline-none rounded"
                        style={{ width: 16, height: 16, color: checked.has(String(c.id)) ? "#2563EB" : "#CBD5E1" }}
                        onClick={(e) => { e.stopPropagation(); toggleCheck(String(c.id)); }}
                        aria-label={`Select ${c.patient_name}`}
                        onFocus={(e) => { if (e.target.matches(":focus-visible")) e.currentTarget.style.boxShadow = "0 0 0 2px #2563EB"; }}
                        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                      >
                        {checked.has(String(c.id))
                          ? <CheckCircle2 size={16} aria-hidden="true" />
                          : <div style={{ width: 16, height: 16, border: "1.5px solid #CBD5E1", borderRadius: 3 }} />
                        }
                      </button>
                    </td>

                    {/* Patient + Drug */}
                    <td style={{ padding: "12px 16px" }}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center" style={{ gap: 6 }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: 1.43,
                              color: "#0F172A",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            {c.patient_name}
                          </span>
                          {!c.consent_flag && (
                            <span aria-label="Consent required" title="Patient has not consented to status updates">
                              <TriangleAlert size={15} style={{ color: "#92400E" }} aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <span
                          className="pa-mono"
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            lineHeight: 1.4,
                            color: "#475569",
                          }}
                        >
                          {c.drug ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge key={c.status} status={c.status} className="pa-chip-animate" />
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className="pa-mono"
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          lineHeight: 1.4,
                          color: "#64748B",
                        }}
                      >
                        {formatDate(c.updated_at)}
                      </span>
                    </td>

                    {/* Chevron */}
                    <td style={{ width: 32, padding: "12px 12px 12px 0", textAlign: "right" }}>
                      <ChevronRight
                        size={16}
                        style={{ color: "#94A3B8", display: "inline-block" }}
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
                      {search !== ""
                        ? <EmptyBodyNoResults />
                        : activeFilter !== "all"
                          ? <EmptyBodyNoStatusMatch />
                          : <EmptyBodyNoCases onCreateCase={handleCreateCase} />}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Drawer — right-hand slide-over */}
        <div
          className="absolute top-0 right-0 bottom-0 z-20"
          style={{
            width: "600px",
            transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 200ms ease-out",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Log status"
        >
          <StatusDrawer
            onClose={() => { setDrawerOpen(false); setTransitionError(null); }}
            onOpenModal={openModal}
            onLogOnly={handleLogOnly}
            currentStatus={(selectedCase?.status as PaStatus) ?? "new_order"}
            transitionError={transitionError}
            onClearError={() => setTransitionError(null)}
            patientName={selectedCase?.patient_name ?? ""}
            caseNumber={selectedCase?.id?.replace("case-", "") ?? ""}
            drug={selectedCase?.drug ?? null}
            isDrawerOpen={drawerOpen}
            consentFlag={selectedCase?.consent_flag ?? false}
            onDemoReset={handleDemoReset}
            onDemoClone={handleDemoClone}
            onDemoReopen={handleDemoReopen}
            onOpenAudit={() => { setAuditCaseId(selectedCaseId); setAuditOpen(true); }}
          />
        </div>

        {/* Audit drawer — right-hand slide-over */}
        <div
          className="absolute top-0 right-0 bottom-0 z-20"
          style={{
            width: "600px",
            transform: auditOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 200ms ease-out",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Audit trail"
        >
          <AuditDrawer onClose={() => { setAuditOpen(false); setAuditCaseId(null); }} selectedCase={auditCase} refreshToken={auditRefreshToken} />
        </div>

      </main>

      {/* Overlay — covers full viewport including sidebar */}
      {drawerOpen && !modalOpen && !auditOpen && (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Audit overlay */}
      {auditOpen && (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
          onClick={() => setAuditOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Create case modal overlay */}
      {showCreateCase && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
        >
          <CreateCaseModal
            onSubmit={handleCreateCaseSubmit}
            onClose={() => { setShowCreateCase(false); setCreateCaseError(null); }}
            submitError={createCaseError}
            isSubmitting={isCreatingCase}
          />
        </div>
      )}

      {/* Modal overlay — above drawer */}
      {modalOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
        >
          <MessagePreviewModal
            consentActive={selectedCase?.consent_flag ?? true}
            messageText={modalMessageText}
            onMessageChange={setModalMessageText}
            onConfirm={async () => {
              if (!pendingToStatus) return;
              const template = getPatientMessage(pendingToStatus);
              const ok = await postTransition(pendingToStatus, pendingMeta, true, modalMessageText, modalMessageText !== template);
              if (ok) {
                setModalOpen(false);
                setDrawerOpen(false);
              }
            }}
            onLogWithoutSending={async () => {
              if (!pendingToStatus) return;
              const ok = await postTransition(pendingToStatus, pendingMeta, false, null, false);
              if (ok) {
                setModalOpen(false);
                setDrawerOpen(false);
              }
            }}
            onClose={() => setModalOpen(false)}
            onRecordConsent={selectedCaseId !== null ? () => handleConsentUpdate(selectedCaseId) : undefined}
            isEdited={modalMessageText !== getPatientMessage(pendingToStatus ?? "new_order")}
          />
        </div>
      )}

      {successToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: "#F0FDF4",
            borderLeft: "3px solid #86EFAC",
            borderRadius: 6,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            fontFamily: "Inter, sans-serif",
            minWidth: 240,
            maxWidth: 360,
          }}
        >
          <CheckCircle2 size={16} aria-hidden="true" style={{ color: "#15803D", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#15803D", lineHeight: 1.4, flex: 1 }}>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#15803D", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
