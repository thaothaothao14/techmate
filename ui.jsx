import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bed,
  Bell,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Info,
  Pill,
  Plus,
  Stethoscope,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react';
import { STATUS, STATUS_KEYS, MANAGE_STATUS_KEYS } from '../store/utils';
import defaultAvatar from '../assets/avatar-default.svg';
import { useApp } from '../store/AppContext';

// ===== Ảnh đại diện =====
export function Avatar({ src, size = 56, alt = 'Ảnh đại diện', className = '' }) {
  return (
    <img
      src={src || defaultAvatar}
      alt={alt}
      width={size}
      height={size}
      className={`avatar ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ===== Biểu tượng theo loại mục =====
const KIND_ICONS = {
  medicine: Pill,
  exercise: Dumbbell,
  rest: Bed,
  checkup: Stethoscope,
  meal: UtensilsCrossed,
  other: ClipboardList,
};

export function KindIcon({ kind, size = 20 }) {
  const Icon = KIND_ICONS[kind] || ClipboardList;
  return (
    <span className={`kind-icon kind-${kind}`}>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

// ===== Trạng thái =====
export function StatusBadge({ status, variant = 'schedule' }) {
  const meta = STATUS[status] || STATUS.todo;
  return <span className={`badge tone-${meta.tone}`}>{meta[variant]}</span>;
}

/** Ô chọn trạng thái có màu theo trạng thái, dễ chạm trên điện thoại */
export function StatusSelect({ value, onChange, variant = 'schedule', label = 'Cập nhật trạng thái' }) {
  const keys = variant === 'manage' ? (value === 'missed' ? STATUS_KEYS : MANAGE_STATUS_KEYS) : STATUS_KEYS;
  return (
    <select
      className={`status-select tone-${STATUS[value]?.tone || 'todo'}`}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      {keys.map((k) => (
        <option key={k} value={k}>
          {STATUS[k][variant]}
        </option>
      ))}
    </select>
  );
}

// ===== Bộ lọc dạng chip =====
export function FilterChips({ options, value, onChange, ariaLabel }) {
  return (
    <div className="chips" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`chip ${value === o.value ? 'active' : ''} ${o.tone ? `chip-${o.tone}` : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="chip-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ===== Modal / Bottom sheet =====
export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Xác nhận', message, confirmText = 'Xoá', onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <span className="confirm-icon">
          <AlertTriangle size={22} />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}

// ===== Trạng thái rỗng =====
export function EmptyState({ icon: Icon = ClipboardList, title, text, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

// ===== Nhập thẻ (tag) =====
export function TagInput({ value = [], onChange, placeholder, tone = 'blue' }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v) return;
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setText('');
  };
  return (
    <div className="tag-input">
      {value.length > 0 && (
        <div className="tags">
          {value.map((t) => (
            <span key={t} className={`tag tag-${tone}`}>
              {t}
              <button type="button" aria-label={`Xoá ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="tag-row">
        <input
          className="input"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn-soft btn-icon-only" onClick={add} aria-label="Thêm">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

// ===== Toast =====
const TOAST_ICONS = { info: Bell, success: CheckCircle2, danger: XCircle, neutral: Info };

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.tone] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon size={20} />
            <span>{t.message}</span>
            <button type="button" className="icon-btn sm" onClick={() => dismissToast(t.id)} aria-label="Đóng thông báo">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Field({ label, children, hint, required }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <em> *</em>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
