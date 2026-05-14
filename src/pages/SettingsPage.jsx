import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Trash2,
  Database,
  RefreshCcw,
  AlertCircle,
  Package,
  ReceiptText,
  WalletCards,
  ShoppingCart,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const LOCAL_STORAGE_KEYS = [
  "accounts",
  "products",
  "journalEntries",
  "salesInvoices",
  "mohasbti_sales_invoices",
  "purchaseInvoices",
  "vouchers",
  "placementResult",
  "scenariosResult",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function SettingsPage() {
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadSystemStats();
  }, []);

  const localStats = useMemo(() => {
    const result = {
      keysCount: 0,
      existingKeys: [],
    };

    LOCAL_STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        result.keysCount += 1;
        result.existingKeys.push(key);
      }
    });

    return result;
  }, [refreshKey]);

  const stats = useMemo(() => {
    return {
      products: products.length,
      accounts: accounts.length,
      salesInvoices: salesInvoices.length,
      purchaseInvoices: purchaseInvoices.length,
      vouchers: vouchers.length,
    };
  }, [products, accounts, salesInvoices, purchaseInvoices, vouchers]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadSystemStats() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const [
        productsResponse,
        accountsResponse,
        salesResponse,
        purchasesResponse,
        vouchersResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/products`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/accounts`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/sales-invoices`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/purchase-invoices`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/vouchers`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const productsData = await productsResponse.json();
      const accountsData = await accountsResponse.json();
      const salesData = await salesResponse.json();
      const purchasesData = await purchasesResponse.json();
      const vouchersData = await vouchersResponse.json();

      if (!productsResponse.ok) {
        showToast(productsData.message || "تعذر تحميل المنتجات.", "error");
      }

      if (!accountsResponse.ok) {
        showToast(accountsData.message || "تعذر تحميل الحسابات.", "error");
      }

      if (!salesResponse.ok) {
        showToast(salesData.message || "تعذر تحميل فواتير البيع.", "error");
      }

      if (!purchasesResponse.ok) {
        showToast(
          purchasesData.message || "تعذر تحميل فواتير الشراء.",
          "error"
        );
      }

      if (!vouchersResponse.ok) {
        showToast(vouchersData.message || "تعذر تحميل السندات.", "error");
      }

      setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      setAccounts(Array.isArray(accountsData.accounts) ? accountsData.accounts : []);
      setSalesInvoices(
        Array.isArray(salesData.sales_invoices) ? salesData.sales_invoices : []
      );
      setPurchaseInvoices(
        Array.isArray(purchasesData.purchase_invoices)
          ? purchasesData.purchase_invoices
          : []
      );
      setVouchers(Array.isArray(vouchersData.vouchers) ? vouchersData.vouchers : []);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
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

  function clearLocalDataRequest() {
    openConfirm(
      "clearLocal",
      "تنظيف بيانات المتصفح القديمة",
      "سيتم حذف بيانات localStorage القديمة فقط. لن يتم حذف أي شيء من قاعدة بيانات Laravel/MySQL.",
      "نعم، نظّف البيانات",
      true
    );
  }

  function confirmAction() {
    if (confirmState.type === "clearLocal") {
      LOCAL_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });

      closeConfirm();
      setRefreshKey((prev) => prev + 1);
      showToast("تم تنظيف بيانات المتصفح القديمة بنجاح.");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">الإعدادات</h1>
            <p className="section-subtitle">
              متابعة حالة النظام والبيانات المرتبطة بقاعدة بيانات Laravel، مع
              تنظيف آمن لبيانات المتصفح القديمة.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>المنتجات</span>
              <strong>{formatNumber(stats.products)}</strong>
            </div>

            <div>
              <span>الحسابات</span>
              <strong>{formatNumber(stats.accounts)}</strong>
            </div>
          </div>
        </div>

        <div className="business-report-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={loadSystemStats}
            disabled={isLoading}
          >
            <RefreshCcw size={18} />
            {isLoading ? "جاري التحديث..." : "تحديث حالة النظام"}
          </button>
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
            <ShoppingCart size={28} />
            <span>فواتير البيع</span>
            <strong>{formatNumber(stats.salesInvoices)}</strong>
          </div>

          <div className="settings-summary-card">
            <ShoppingBag size={28} />
            <span>فواتير الشراء</span>
            <strong>{formatNumber(stats.purchaseInvoices)}</strong>
          </div>

          <div className="settings-summary-card">
            <ReceiptText size={28} />
            <span>السندات</span>
            <strong>{formatNumber(stats.vouchers)}</strong>
          </div>

          <div className="settings-summary-card">
            <Database size={28} />
            <span>بيانات محلية قديمة</span>
            <strong>{formatNumber(localStats.keysCount)}</strong>
          </div>
        </div>

        <div className="settings-layout">
          <div className="settings-card">
            <div className="settings-card-title">
              <Database size={24} />
              <h2>مصدر البيانات الحالي</h2>
            </div>

            <p>
              أغلب صفحات النظام الآن تقرأ من Laravel API وقاعدة بيانات MySQL:
              المنتجات، الحسابات، المشتريات، المبيعات، السندات، التقارير
              والقوائم المالية.
            </p>

            <div className="balance-status success">
              <ShieldCheck size={22} />
              <span>قاعدة البيانات هي المصدر الأساسي للبيانات.</span>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">
              <RefreshCcw size={24} />
              <h2>تحديث الحالة</h2>
            </div>

            <p>
              استخدم هذا الزر للتأكد من اتصال الواجهة بالباك إند وجلب أعداد
              السجلات الحالية من قاعدة البيانات.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={loadSystemStats}
              disabled={isLoading}
            >
              <RefreshCcw size={18} />
              {isLoading ? "جاري التحديث..." : "تحديث من Laravel"}
            </button>
          </div>

          <div className="settings-card danger">
            <div className="settings-card-title">
              <Trash2 size={24} />
              <h2>تنظيف بيانات المتصفح القديمة</h2>
            </div>

            <p>
              يحذف فقط بيانات localStorage القديمة التي كانت مستخدمة قبل ربط
              المشروع بقاعدة البيانات. هذه العملية لا تحذف بيانات MySQL.
            </p>

            <button
              type="button"
              className="danger-btn"
              onClick={clearLocalDataRequest}
            >
              <Trash2 size={18} />
              تنظيف localStorage القديم
            </button>
          </div>
        </div>

        <div className="settings-warning">
          <AlertCircle size={22} />
          <div>
            <strong>ملاحظة مهمة</strong>
            <p>
              لا تستخدم هذه الصفحة لمسح قاعدة بيانات Laravel. حذف أو تعديل
              البيانات الحقيقية يتم من صفحات النظام نفسها مثل المخزون، السندات،
              فواتير البيع، فواتير الشراء، وإدارة الحسابات.
            </p>
          </div>
        </div>

        {localStats.existingKeys.length > 0 && (
          <div className="settings-warning">
            <Settings size={22} />
            <div>
              <strong>بيانات محلية قديمة موجودة</strong>
              <p>
                يوجد بعض مفاتيح localStorage القديمة:
                {" "}
                {localStats.existingKeys.join("، ")}
              </p>
            </div>
          </div>
        )}
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