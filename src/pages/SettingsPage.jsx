import { useMemo, useRef, useState } from "react";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Database,
  RefreshCcw,
  AlertCircle,
  Package,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const STORAGE_KEYS = [
  "accounts",
  "products",
  "journalEntries",
  "salesInvoices",
  "mohasbti_sales_invoices",
  "purchaseInvoices",
  "vouchers",
  "placementResult",
  "scenariosResult",
  "mohasbti_current_user",
];

const demoAccounts = [
  { id: 1, name: "الصندوق", type: "asset", isDefault: true },
  { id: 2, name: "البنك", type: "asset", isDefault: true },
  { id: 3, name: "العملاء", type: "asset", isDefault: true },
  { id: 4, name: "المخزون", type: "asset", isDefault: true },
  { id: 5, name: "الأثاث", type: "asset", isDefault: true },
  { id: 6, name: "معدات", type: "asset", isDefault: true },
  { id: 7, name: "الموردون", type: "liability", isDefault: true },
  { id: 8, name: "رأس المال", type: "equity", isDefault: true },
  { id: 9, name: "المبيعات", type: "revenue", isDefault: true },
  { id: 10, name: "المشتريات", type: "expense", isDefault: true },
  { id: 11, name: "مصروف الإيجار", type: "expense", isDefault: true },
  { id: 12, name: "مصروف الرواتب", type: "expense", isDefault: true },
];

const demoProducts = [
  {
    id: 1,
    code: "P-1001",
    name: "كيبورد لاسلكي Max موديل 1321",
    category: "إلكترونيات",
    quantity: 35,
    purchasePrice: 6200,
    sellingPrice: 8400,
    stock: 35,
    costPrice: 6200,
    salePrice: 8400,
    unit: "قطعة",
  },
  {
    id: 2,
    code: "P-1002",
    name: "ماوس Gaming YemenTech موديل 1003",
    category: "إلكترونيات",
    quantity: 60,
    purchasePrice: 2100,
    sellingPrice: 3200,
    stock: 60,
    costPrice: 2100,
    salePrice: 3200,
    unit: "قطعة",
  },
  {
    id: 3,
    code: "P-1003",
    name: "شاشة اقتصادية YemenTech موديل 1018",
    category: "إلكترونيات",
    quantity: 18,
    purchasePrice: 118000,
    sellingPrice: 156000,
    stock: 18,
    costPrice: 118000,
    salePrice: 156000,
    unit: "قطعة",
  },
  {
    id: 4,
    code: "P-1004",
    name: "هارد SSD 1TB Royal موديل 1015",
    category: "تخزين",
    quantity: 40,
    purchasePrice: 9000,
    sellingPrice: 13500,
    stock: 40,
    costPrice: 9000,
    salePrice: 13500,
    unit: "قطعة",
  },
  {
    id: 5,
    code: "P-1005",
    name: "سماعة رأس Comfort X",
    category: "إكسسوارات",
    quantity: 22,
    purchasePrice: 6400,
    sellingPrice: 9700,
    stock: 22,
    costPrice: 6400,
    salePrice: 9700,
    unit: "قطعة",
  },
];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function readValue(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return localStorage.getItem(key);
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function SettingsPage() {
  const fileInputRef = useRef(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    confirmText: "موافق",
    danger: false,
  });

  const stats = useMemo(() => {
    const products = readArray("products");
    const accounts = readArray("accounts");
    const journalEntries = readArray("journalEntries");
    const salesInvoices = [
      ...readArray("salesInvoices"),
      ...readArray("mohasbti_sales_invoices"),
    ];
    const purchaseInvoices = readArray("purchaseInvoices");
    const vouchers = readArray("vouchers");

    return {
      products: products.length,
      accounts: accounts.length,
      journalEntries: journalEntries.length,
      salesInvoices: salesInvoices.length,
      purchaseInvoices: purchaseInvoices.length,
      vouchers: vouchers.length,
    };
  }, [refreshKey]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function openConfirm(type, title, message, confirmText, danger = false) {
    setConfirmState({
      open: true,
      type,
      title,
      message,
      confirmText,
      danger,
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      type: "",
      title: "",
      message: "",
      confirmText: "موافق",
      danger: false,
    });
  }

  function exportBackup() {
    const backup = {
      appName: "محاسبتي",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {},
    };

    STORAGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);

      if (value !== null) {
        backup.data[key] = readValue(key);
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `mohasbti-backup-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);

    showToast("تم تصدير النسخة الاحتياطية بنجاح.");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function importBackup(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);

        if (!backup.data || typeof backup.data !== "object") {
          showToast("ملف النسخة الاحتياطية غير صحيح.", "error");
          return;
        }

        window.pendingBackupData = backup.data;

        openConfirm(
          "import",
          "استيراد نسخة احتياطية",
          "سيتم استبدال البيانات الحالية ببيانات النسخة الاحتياطية. هل تريد المتابعة؟",
          "نعم، استيراد",
          false
        );
      } catch {
        showToast("تعذر قراءة ملف النسخة الاحتياطية.", "error");
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  }

  function clearAllDataRequest() {
    openConfirm(
      "clear",
      "مسح كل البيانات",
      "سيتم حذف كل بيانات التدريب والفواتير والمخزون والسندات. يفضل تصدير نسخة احتياطية قبل المتابعة.",
      "نعم، امسح البيانات",
      true
    );
  }

  function generateDemoDataRequest() {
    openConfirm(
      "demo",
      "توليد بيانات تجريبية",
      "سيتم إنشاء حسابات ومنتجات تجريبية أساسية. هذا مفيد عند تشغيل المشروع لأول مرة أو بعد مسح البيانات.",
      "توليد البيانات",
      false
    );
  }

  function confirmAction() {
    if (confirmState.type === "clear") {
      STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });

      closeConfirm();
      setRefreshKey((prev) => prev + 1);
      showToast("تم مسح كل البيانات بنجاح.");
      return;
    }

    if (confirmState.type === "demo") {
      saveArray("accounts", demoAccounts);
      saveArray("products", demoProducts);

      if (!localStorage.getItem("journalEntries")) {
        saveArray("journalEntries", []);
      }

      if (!localStorage.getItem("salesInvoices")) {
        saveArray("salesInvoices", []);
      }

      if (!localStorage.getItem("purchaseInvoices")) {
        saveArray("purchaseInvoices", []);
      }

      if (!localStorage.getItem("vouchers")) {
        saveArray("vouchers", []);
      }

      closeConfirm();
      setRefreshKey((prev) => prev + 1);
      showToast("تم توليد البيانات التجريبية الأساسية بنجاح.");
      return;
    }

    if (confirmState.type === "import") {
      const backupData = window.pendingBackupData;

      if (!backupData) {
        closeConfirm();
        showToast("لم يتم العثور على بيانات النسخة الاحتياطية.", "error");
        return;
      }

      Object.keys(backupData).forEach((key) => {
        localStorage.setItem(key, JSON.stringify(backupData[key]));
      });

      window.pendingBackupData = null;

      closeConfirm();
      setRefreshKey((prev) => prev + 1);
      showToast("تم استيراد النسخة الاحتياطية بنجاح.");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">الإعدادات</h1>
            <p className="section-subtitle">
              إدارة بيانات النسخة التجريبية: تصدير نسخة احتياطية، استيراد
              بيانات، مسح البيانات، أو توليد بيانات أساسية للتجربة.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>المنتجات</span>
              <strong>{formatNumber(stats.products)}</strong>
            </div>

            <div>
              <span>القيود</span>
              <strong>{formatNumber(stats.journalEntries)}</strong>
            </div>
          </div>
        </div>

        <div className="settings-summary">
          <div className="settings-summary-card">
            <Package size={28} />
            <span>عدد المنتجات</span>
            <strong>{formatNumber(stats.products)}</strong>
          </div>

          <div className="settings-summary-card">
            <WalletCards size={28} />
            <span>عدد الحسابات</span>
            <strong>{formatNumber(stats.accounts)}</strong>
          </div>

          <div className="settings-summary-card">
            <ReceiptText size={28} />
            <span>فواتير البيع</span>
            <strong>{formatNumber(stats.salesInvoices)}</strong>
          </div>

          <div className="settings-summary-card">
            <Database size={28} />
            <span>فواتير الشراء</span>
            <strong>{formatNumber(stats.purchaseInvoices)}</strong>
          </div>
        </div>

        <div className="settings-layout">
          <div className="settings-card">
            <div className="settings-card-title">
              <Download size={24} />
              <h2>النسخ الاحتياطي</h2>
            </div>

            <p>
              صدّر كل بيانات المشروع الحالية في ملف JSON. استخدم هذه الخطوة قبل
              مسح البيانات أو قبل رفع نسخة جديدة.
            </p>

            <button type="button" className="primary-btn" onClick={exportBackup}>
              <Download size={18} />
              تصدير نسخة احتياطية
            </button>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">
              <Upload size={24} />
              <h2>استيراد بيانات</h2>
            </div>

            <p>
              استورد ملف نسخة احتياطية سبق تصديره من النظام. سيتم استبدال
              البيانات الحالية ببيانات الملف.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={importBackup}
              hidden
            />

            <button
              type="button"
              className="secondary-btn"
              onClick={handleImportClick}
            >
              <Upload size={18} />
              استيراد نسخة احتياطية
            </button>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">
              <RefreshCcw size={24} />
              <h2>بيانات تجريبية</h2>
            </div>

            <p>
              أنشئ حسابات ومنتجات تجريبية أساسية. هذه العملية مفيدة عند تشغيل
              المشروع أول مرة أو بعد مسح البيانات.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={generateDemoDataRequest}
            >
              <RefreshCcw size={18} />
              توليد بيانات تجريبية
            </button>
          </div>

          <div className="settings-card danger">
            <div className="settings-card-title">
              <Trash2 size={24} />
              <h2>مسح البيانات</h2>
            </div>

            <p>
              يحذف كل بيانات localStorage الخاصة بالمشروع. يفضل تصدير نسخة
              احتياطية قبل تنفيذ هذه العملية.
            </p>

            <button type="button" className="danger-btn" onClick={clearAllDataRequest}>
              <Trash2 size={18} />
              مسح كل البيانات
            </button>
          </div>
        </div>

        <div className="settings-warning">
          <AlertCircle size={22} />
          <div>
            <strong>ملاحظة مهمة</strong>
            <p>
              هذه النسخة تعمل حاليًا على localStorage داخل المتصفح، لذلك
              البيانات محفوظة على جهازك فقط. عند الانتقال إلى Laravel/MySQL
              سنحوّل هذه العمليات إلى قاعدة بيانات حقيقية.
            </p>
          </div>
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />

      <AppConfirm
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText="إلغاء"
        danger={confirmState.danger}
        onConfirm={confirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default SettingsPage;