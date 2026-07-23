import { useState, useEffect } from "react";
import {
  PlusCircle, FileWarning, Send, Clock, AlertCircle,
  Stethoscope, CheckCircle2, XCircle, Lock,
  Search, ChevronRight, Settings, Layers, ShieldAlert,
  X, ChevronDown, Check, MessageSquare, AlertTriangle,
  Download, ExternalLink, FolderOpen, SearchX, Plus,
} from "lucide-react";
import {
  getValidTransitions,
  getTransitionGate,
  getPatientMessage,
  type PaStatus,
} from "./backend/statusMachine";
import { supabase } from "./lib/supabase";

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
function StatusBadge({ status, size = "default" }: { status: PAStatus; size?: "default" | "sm" }) {
  const { label, Icon, bg, text, border } = BADGE_CONFIG[status];
  const iconSize = size === "sm" ? 11 : 13;
  const extraClass = status === "needs_documentation" ? " pa-needs-docs-text" : "";
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full whitespace-nowrap font-semibold${extraClass}`}
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
const CASES_SEED = [
  { id: "1", name: "Marcus Okafor",     drug: "Pembrolizumab", status: "approved"           as PAStatus, updated: "Jul 18, 2026 9:14 AM",  consent_flag: true  },
  { id: "2", name: "Tanya Hargrove",    drug: "Rituximab",     status: "peer_to_peer"        as PAStatus, updated: "Jul 19, 2026 2:30 PM",  consent_flag: true  },
  { id: "3", name: "Rafael Castellano", drug: "Bevacizumab",   status: "denied"              as PAStatus, updated: "Jul 20, 2026 8:02 AM",  consent_flag: true  },
  { id: "4", name: "Linh Nguyen",       drug: "Nivolumab",     status: "submitted"           as PAStatus, updated: "Jul 20, 2026 10:45 AM", consent_flag: false },
  { id: "5", name: "David Mbeki",       drug: "Trastuzumab",   status: "pending_review"      as PAStatus, updated: "Jul 19, 2026 11:20 AM", consent_flag: false },
  { id: "6", name: "Anna Kowalski",     drug: "Ipilimumab",    status: "needs_documentation" as PAStatus, updated: "Jul 17, 2026 3:55 PM",  consent_flag: false },
  { id: "7", name: "Pedro Reyes",       drug: "Atezolizumab",  status: "info_request"        as PAStatus, updated: "Jul 20, 2026 7:30 AM",  consent_flag: true  },
  { id: "8", name: "Sara Johansson",    drug: "Durvalumab",    status: "closed"              as PAStatus, updated: "Jul 15, 2026 4:00 PM",  consent_flag: true  },
];

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
  const activeBg     = config ? config.bg     : "var(--pa-primary)";
  const activeText   = config ? config.text   : "#FFFFFF";
  const activeBorder = config ? config.border : "rgba(27,79,114,0.30)";
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
      className="inline-flex items-center gap-[6px] rounded-full whitespace-nowrap transition-colors duration-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pa-primary)]"
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
}: {
  currentStatus: PaStatus;
  value: PaStatus;
  onChange: (v: PaStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = getValidTransitions(currentStatus);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-left"
        style={{
          borderColor: open ? "var(--pa-primary)" : "#CBD5E1",
          boxShadow: open ? "0 0 0 2px var(--pa-primary)" : "none",
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

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 mt-1 rounded-md border overflow-hidden z-10"
          style={{
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
              className="flex items-center justify-between px-3 py-2 cursor-pointer"
              style={{
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
                <StatusBadge status={option} />
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
                <Check size={14} style={{ color: "var(--pa-primary)", flexShrink: 0 }} />
              )}
            </li>
          ))}
        </ul>
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
  brandPrimary:      "var(--pa-primary)",
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
}: {
  consentActive: boolean;
  messageText: string;
  onMessageChange: (text: string) => void;
  onConfirm: () => void;
  onLogWithoutSending: () => void;
  onClose: () => void;
  onRecordConsent?: () => void;
}) {
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
          Patient message preview
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
            backgroundColor: DS.bgCardSubtle,
            border: `1px solid ${DS.borderInput}`,
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
              <SecondaryButton onClick={onRecordConsent}>Record consent</SecondaryButton>
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
        <SecondaryButton onClick={onLogWithoutSending}>Log without sending</SecondaryButton>
        <PrimaryButton disabled={!consentActive} onClick={onConfirm}>Confirm and send</PrimaryButton>
      </div>
    </ModalShell>
  );
}

// ── Status Drawer ─────────────────────────────────────────────────────────────
function StatusDrawer({
  onClose,
  consentActive,
  onOpenModal,
  currentStatus,
}: {
  onClose: () => void;
  consentActive: boolean;
  onOpenModal: (text: string) => void;
  currentStatus: PaStatus;
}) {
  const [selectedTransition, setSelectedTransition] = useState<PaStatus>(
    () => getValidTransitions(currentStatus)[0] ?? "closed",
  );
  const [messageText, setMessageText] = useState(
    () => getPatientMessage(getValidTransitions(currentStatus)[0] ?? "closed"),
  );
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    setMessageText(getPatientMessage(selectedTransition));
    setGateError(null);
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
            Case #1042 — Linh Nguyen
          </h2>
          <div className="flex items-center gap-2">
            <span
              style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}
            >
              Current status
            </span>
            <StatusBadge status="submitted" />
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
                Linh Nguyen
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748B", lineHeight: 1.4 }}>
                Drug
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", lineHeight: 1.43 }}>
                Nivolumab
              </span>
            </div>
          </div>
        </div>

        {/* Transition selector */}
        <div className="flex flex-col gap-1.5">
          <span
            style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", lineHeight: 1.43, display: "block" }}
          >
            Log transition to
          </span>
          <TransitionDropdown
            currentStatus={currentStatus}
            value={selectedTransition}
            onChange={setSelectedTransition}
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
              e.currentTarget.style.borderColor = "var(--pa-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--pa-primary)";
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
          <span
            className="inline-flex items-center gap-1"
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
            Active
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
        style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={() => {
            const gate = getTransitionGate(currentStatus, selectedTransition);
            if (gate) { setGateError(gate.message); return; }
            setGateError(null);
            onClose();
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
          disabled={!consentActive}
          title={!consentActive ? "Record patient consent to enable message delivery" : undefined}
          onClick={() => {
            const gate = getTransitionGate(currentStatus, selectedTransition);
            if (gate) { setGateError(gate.message); return; }
            setGateError(null);
            if (consentActive) onOpenModal(messageText);
          }}
          className="px-4 rounded-md"
          style={{
            height: "36px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#FFFFFF",
            backgroundColor: "var(--pa-primary)",
            border: "1px solid transparent",
            cursor: consentActive ? "pointer" : "not-allowed",
            lineHeight: 1.43,
            fontFamily: "Inter, sans-serif",
            opacity: consentActive ? 1 : 0.45,
          }}
          onMouseEnter={(e) => {
            if (consentActive)
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (consentActive)
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary)";
          }}
          onMouseDown={(e) => {
            if (consentActive)
              (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            if (consentActive)
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          Confirm and send
        </button>
      </div>
    </div>
  );
}

// ── Audit Trail ──────────────────────────────────────────────────────────────

function FilterDropdown({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-medium leading-[1.4] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)]"
      style={{
        color: "#4A5568",
        borderColor: "#CBD5E1",
        backgroundColor: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {label}
      <ChevronDown size={13} aria-hidden="true" />
    </button>
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
                style={{ color: "var(--pa-primary)", textDecoration: "underline", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
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

const TIMELINE_NODES: TimelineNode[] = [
  {
    id: "n1",
    timestamp: "Jul 20, 2026 · 9:14 AM",
    actor: "Demo Coordinator",
    type: "transition",
    from: "submitted",
    to: "approved",
    metadata: {
      reasonCode: "",
      messageSent: true,
      messageCustom: false,
      messageText: "Your treatment is approved. Scheduling will contact you next.",
    },
  },
  {
    id: "n2",
    timestamp: "Jul 20, 2026 · 8:55 AM",
    actor: "Demo Coordinator",
    type: "transition",
    from: "pending_review",
    to: "submitted",
    metadata: {
      docLink: "intake-docs.example.com/okafor-1041",
      messageSent: true,
      messageCustom: false,
    },
  },
  {
    id: "n3",
    timestamp: "Jul 19, 2026 · 3:40 PM",
    actor: "Demo Coordinator",
    type: "transition",
    from: "pending_review",
    to: "pending_review",
    metadata: {
      reasonCode: "clinical_notes_complete",
      messageSent: true,
      messageCustom: false,
    },
  },
  {
    id: "n4",
    timestamp: "Jul 19, 2026 · 3:38 PM",
    actor: "Demo Coordinator",
    type: "demo",
    demoLabel: "Case reset to baseline",
  },
];

function NeedsDocsBadge() {
  return (
    <span
      className="inline-flex items-center gap-[5px] font-semibold rounded-full whitespace-nowrap"
      style={{
        backgroundColor: "var(--pa-badge-needs-doc-bg)",
        color: "var(--pa-badge-needs-doc-text)",
        border: "1px solid var(--pa-badge-needs-doc-border)",
        fontSize: "10px",
        fontWeight: 600,
        lineHeight: 1,
        paddingLeft: "10px",
        paddingRight: "10px",
        paddingTop: "4px",
        paddingBottom: "4px",
        fontFamily: "Inter, sans-serif",
      }}
      aria-label="Status: Needs Documentation"
    >
      <FileWarning size={12} aria-hidden="true" />
      Needs Documentation
    </span>
  );
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
              backgroundColor: "var(--pa-primary)",
              border: "2px solid #FFFFFF",
              boxShadow: "0 0 0 1.5px var(--pa-primary)",
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
              {node.id === "n3" ? (
                <>
                  <NeedsDocsBadge />
                  <span style={{ color: "#718096", fontSize: 12 }}>→</span>
                  <StatusBadge status="pending_review" size="sm" />
                </>
              ) : (
                <>
                  {node.from && <StatusBadge status={node.from} size="sm" />}
                  <span style={{ color: "#718096", fontSize: 12 }}>→</span>
                  {node.to && <StatusBadge status={node.to} size="sm" />}
                </>
              )}
            </div>
          )}
        </div>

        {node.metadata && <MetadataCard {...node.metadata} />}
      </div>
    </div>
  );
}

// IMMUTABLE: no edit or delete controls rendered per audit trail spec
function AuditDrawer({ onClose }: { onClose: () => void }) {
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
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium leading-[1.4] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)]"
            style={{ color: "#4A5568", borderColor: "#CBD5E1", backgroundColor: "transparent" }}
            aria-label="Export CSV"
          >
            <Download size={13} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md w-8 h-8 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)]"
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
              <dd className="text-[14px] font-medium leading-[1.43]" style={{ color: "#1A1F2E" }}>Marcus Okafor</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Case</dt>
              <dd className="text-[14px] font-normal leading-[1.43]" style={{ color: "#1A1F2E", fontFamily: "JetBrains Mono, monospace" }}>
                #1041
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Drug</dt>
              <dd style={{ fontFamily: "JetBrains Mono, monospace", color: "#475569", fontWeight: 400, fontSize: "12px", lineHeight: "1.4" }}>
                Pembrolizumab IV Infusion / Buy-and-Bill
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Status</dt>
              <dd><StatusBadge status="approved" /></dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-medium leading-[1.4]" style={{ color: "#718096" }}>Consent</dt>
              <dd>
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
                  Active
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown label="Action type" />
            <FilterDropdown label="Actor" />
            <FilterDropdown label="Date range" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium leading-[1.4]" style={{ color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
              Filtered by:{" "}
              <span style={{ color: "#1A1F2E" }}>Status change · Today</span>
            </span>
            <button
              type="button"
              className="text-[12px] font-medium leading-[1.4] underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)] rounded"
              style={{ color: "var(--pa-primary)" }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col">
          {TIMELINE_NODES.map((node, i) => (
            <TimelineNodeRow key={node.id} node={node} isLast={i === TIMELINE_NODES.length - 1} />
          ))}
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
        No cases yet
      </span>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "1.43",
          color: "#475569",
          marginBottom: 16,
        }}
      >
        Add your first case to get started.
      </span>
      <button
        onClick={onCreateCase}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 36,
          padding: "0 16px",
          backgroundColor: "var(--pa-primary)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary-hover)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--pa-primary)")}
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

// ── Create Case Modal ─────────────────────────────────────────────────────────
function CreateCaseModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (patientName: string, consentFlag: boolean) => void;
  onClose: () => void;
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
            onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--pa-primary)")}
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
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--pa-primary)" }}
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
          disabled={nameEmpty}
          onClick={() => onSubmit(patientName.trim(), consentFlag)}
        >
          Create case
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeFilter, setActiveFilter] = useState<PAStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessageText, setModalMessageText] = useState(MESSAGE_COPY);
  const [auditOpen, setAuditOpen] = useState(false);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [cases, setCases] = useState<typeof CASES_SEED>([]);

  useEffect(() => {
    const fetchCases = async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, patient_name, status, consent_flag, updated_at')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('fetch cases error:', error.message)
        return
      }
      if (data) setCases(data)
    }
    fetchCases()
  }, [])

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
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.drug.toLowerCase().includes(q);
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

  function openModal(text: string) {
    setModalMessageText(text);
    setModalOpen(true);
  }

  function handleCreateCase() {
    setShowCreateCase(true);
  }

  function handleCreateCaseSubmit(patientName: string, consentFlag: boolean) {
    console.log("create case", { patientName, consentFlag });
    setShowCreateCase(false);
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

  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

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
            style={{ width: 28, height: 28, backgroundColor: "var(--pa-primary)" }}
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
              color: "var(--pa-primary)",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid rgba(27,79,114,0.12)",
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
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--pa-primary)")}
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
              backgroundColor: "var(--pa-primary)",
              color: "#FFFFFF",
              border: "none",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--pa-primary-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--pa-primary)")}
            onClick={handleCreateCase}
            onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--pa-primary), 0 0 0 4px rgba(27,79,114,0.2)")}
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
                  Consent
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
                <th style={{ width: 40, padding: "12px 16px" }}>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c, idx) => {
                const isHover = c.id === "2";
                const isEven = idx % 2 === 1;
                const rowBg = isHover ? "#F1F5F9" : isEven ? "#F1F5F9" : "#FFFFFF";

                return (
                  <tr
                    key={c.id}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: "1px solid #E2E8F0",
                      minHeight: 48,
                      cursor: "pointer",
                    }}
                    className="transition-colors duration-75 group"
                    onClick={() => openDrawer(String(c.id))}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowBg;
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "12px 16px", width: 40 }}>
                      <button
                        className="flex items-center justify-center focus:outline-none rounded"
                        style={{ width: 16, height: 16, color: checked.has(String(c.id)) ? "var(--pa-primary)" : "#CBD5E1" }}
                        onClick={(e) => { e.stopPropagation(); toggleCheck(String(c.id)); }}
                        aria-label={`Select ${c.name}`}
                        onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--pa-primary)")}
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
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: 1.43,
                            color: "#0F172A",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {c.name}
                        </span>
                        <span
                          className="pa-mono"
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            lineHeight: 1.4,
                            color: "#475569",
                          }}
                        >
                          {c.drug}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Consent */}
                    <td style={{ padding: "12px 16px" }}>
                      {!c.consent_flag && (
                        <ShieldAlert size={15} style={{ color: "#B7770D" }} aria-label="Consent required" />
                      )}
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
                        {c.updated}
                      </span>
                    </td>

                    {/* Chevron */}
                    <td style={{ padding: "12px 16px", width: 40 }}>
                      <ChevronRight
                        size={16}
                        style={{ color: "#94A3B8" }}
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
                      {search !== "" ? <EmptyBodyNoResults /> : <EmptyBodyNoCases onCreateCase={handleCreateCase} />}
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
            onClose={() => setDrawerOpen(false)}
            consentActive={selectedCase?.consent_flag ?? true}
            onOpenModal={openModal}
            currentStatus={(selectedCase?.status as PaStatus) ?? "new_order"}
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
          <AuditDrawer onClose={() => setAuditOpen(false)} />
        </div>

        {/* Demo affordance buttons */}
        {!drawerOpen && !auditOpen && (
          <div className="absolute bottom-6 right-6 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => setAuditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-semibold leading-[1.4] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)]"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#4A5568",
                borderColor: "#CBD5E1",
                boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Layers size={13} aria-hidden="true" />
              Open audit trail
            </button>
            <button
              type="button"
              onClick={() => { setSelectedCaseId("1"); setDrawerOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-semibold leading-[1.4] transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-primary)]"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#4A5568",
                borderColor: "#CBD5E1",
                boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Settings size={13} aria-hidden="true" />
              Open status drawer
            </button>
          </div>
        )}
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
            onClose={() => setShowCreateCase(false)}
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
            onConfirm={() => {
              console.log("message_sent=TRUE");
              setModalOpen(false);
              setDrawerOpen(false);
            }}
            onLogWithoutSending={() => {
              setModalOpen(false);
              setDrawerOpen(false);
            }}
            onClose={() => setModalOpen(false)}
            onRecordConsent={selectedCaseId !== null ? () => handleConsentUpdate(selectedCaseId) : undefined}
          />
        </div>
      )}
    </div>
  );
}
