import { AlertTriangle, X } from "lucide-react";

function AppConfirm({
  open,
  title,
  message,
  confirmText = "موافق",
  cancelText = "إلغاء",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="app-confirm-overlay">
      <div className="app-confirm-card">
        <button type="button" className="app-confirm-close" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className={danger ? "app-confirm-icon danger" : "app-confirm-icon"}>
          <AlertTriangle size={30} />
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="app-confirm-actions">
          <button type="button" className="secondary-btn" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            type="button"
            className={danger ? "danger-btn" : "primary-btn"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppConfirm;