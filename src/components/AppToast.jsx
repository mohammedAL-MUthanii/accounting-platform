import { CheckCircle2, AlertCircle, X } from "lucide-react";

function AppToast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";

  return (
    <div
      className={
        isError
          ? "app-toast error"
          : isWarning
          ? "app-toast warning"
          : "app-toast success"
      }
    >
      <div className="app-toast-icon">
        {isError || isWarning ? (
          <AlertCircle size={22} />
        ) : (
          <CheckCircle2 size={22} />
        )}
      </div>

      <div>
        <strong>
          {isError ? "تنبيه" : isWarning ? "ملاحظة" : "تم بنجاح"}
        </strong>
        <p>{toast.message}</p>
      </div>

      <button type="button" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}

export default AppToast;