import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  WalletCards,
  Info,
  Pencil,
  XCircle,
  Save,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const accountTypes = {
  asset: "أصل",
  liability: "خصم",
  equity: "حقوق ملكية",
  revenue: "إيراد",
  expense: "مصروف",
};

const accountTypeDescriptions = {
  asset: "الأصول طبيعتها مدينة مثل الصندوق والبنك والمخزون.",
  liability: "الخصوم طبيعتها دائنة مثل الموردين والقروض.",
  equity: "حقوق الملكية طبيعتها دائنة مثل رأس المال.",
  revenue: "الإيرادات طبيعتها دائنة مثل المبيعات.",
  expense: "المصروفات طبيعتها مدينة مثل الإيجار والرواتب.",
};

function normalizeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    isDefault: Boolean(account.is_default),
    createdAt: account.created_at,
  };
}

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    accountId: null,
    title: "",
    message: "",
    confirmText: "موافق",
    danger: false,
  });

  const [form, setForm] = useState({
    name: "",
    type: "asset",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadAccounts() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحميل الحسابات من السيرفر.", "error");
        setIsLoading(false);
        return;
      }

      const normalizedAccounts = Array.isArray(data.accounts)
        ? data.accounts.map(normalizeAccount)
        : [];

      setAccounts(normalizedAccounts);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
  }

  function openConfirm({
    type,
    accountId = null,
    title,
    message,
    confirmText = "موافق",
    danger = false,
  }) {
    setConfirmState({
      open: true,
      type,
      accountId,
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
      accountId: null,
      title: "",
      message: "",
      confirmText: "موافق",
      danger: false,
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  function resetForm() {
    setForm({
      name: "",
      type: "asset",
    });

    setEditingId(null);
  }

  async function saveAccount(e) {
    e.preventDefault();

    const accountName = form.name.trim();

    if (!accountName) {
      showToast("اكتب اسم الحساب أولًا.", "warning");
      return;
    }

    const isExisting = accounts.some((account) => {
      return account.name.trim() === accountName && account.id !== editingId;
    });

    if (isExisting) {
      showToast("هذا الحساب موجود بالفعل.", "warning");
      return;
    }

    setIsSaving(true);

    try {
      const token = getAuthToken();

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_BASE_URL}/accounts/${editingId}`
        : `${API_BASE_URL}/accounts`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: accountName,
          type: form.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const firstError =
          data?.errors?.name?.[0] || data?.errors?.type?.[0] || data?.message;

        showToast(firstError || "تعذر حفظ الحساب.", "error");
        setIsSaving(false);
        return;
      }

      const savedAccount = normalizeAccount(data.account);

      if (isEditing) {
        setAccounts((prev) =>
          prev.map((account) =>
            account.id === editingId ? savedAccount : account
          )
        );

        showToast(data.message || "تم تحديث الحساب بنجاح.");
      } else {
        setAccounts((prev) => [...prev, savedAccount]);
        showToast(data.message || "تمت إضافة الحساب بنجاح.");
      }

      resetForm();
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء حفظ الحساب.", "error");
    }

    setIsSaving(false);
  }

  function startEdit(account) {
    setEditingId(account.id);

    setForm({
      name: account.name,
      type: account.type,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteAccount(id) {
    const account = accounts.find((item) => item.id === id);

    if (!account) return;

    if (account.isDefault) {
      showToast("لا يمكن حذف الحسابات الافتراضية.", "warning");
      return;
    }

    openConfirm({
      type: "delete",
      accountId: id,
      title: "حذف حساب",
      message: `هل تريد حذف حساب "${account.name}" من قاعدة البيانات؟`,
      confirmText: "نعم، حذف",
      danger: true,
    });
  }

  function resetAccounts() {
    openConfirm({
      type: "reset",
      title: "استعادة الحسابات الافتراضية",
      message:
        "سيتم حذف الحسابات المخصصة واستعادة الحسابات الافتراضية من قاعدة البيانات. هل تريد المتابعة؟",
      confirmText: "استعادة الحسابات",
      danger: true,
    });
  }

  async function confirmAction() {
    if (confirmState.type === "delete") {
      await confirmDeleteAccount();
      return;
    }

    if (confirmState.type === "reset") {
      await confirmResetAccounts();
    }
  }

  async function confirmDeleteAccount() {
    const id = confirmState.accountId;

    if (!id) {
      closeConfirm();
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر حذف الحساب.", "error");
        closeConfirm();
        return;
      }

      setAccounts((prev) => prev.filter((account) => account.id !== id));

      if (editingId === id) {
        resetForm();
      }

      closeConfirm();
      showToast(data.message || "تم حذف الحساب بنجاح.");
    } catch {
      closeConfirm();
      showToast("تعذر الاتصال بالسيرفر أثناء حذف الحساب.", "error");
    }
  }

  async function confirmResetAccounts() {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/accounts/reset-defaults`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر استعادة الحسابات الافتراضية.", "error");
        closeConfirm();
        return;
      }

      const normalizedAccounts = Array.isArray(data.accounts)
        ? data.accounts.map(normalizeAccount)
        : [];

      setAccounts(normalizedAccounts);
      resetForm();
      setSearchTerm("");
      setTypeFilter("all");

      closeConfirm();
      showToast(data.message || "تمت استعادة الحسابات الافتراضية بنجاح.");
    } catch {
      closeConfirm();
      showToast("تعذر الاتصال بالسيرفر أثناء استعادة الحسابات.", "error");
    }
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const matchesType = typeFilter === "all" || account.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    if (!groups[account.type]) {
      groups[account.type] = [];
    }

    groups[account.type].push(account);
    return groups;
  }, {});

  const customAccountsCount = accounts.filter((account) => {
    return !account.isDefault;
  }).length;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">إدارة الحسابات</h1>
            <p className="section-subtitle">
              أضف أو عدّل حساباتك المحاسبية من قاعدة بيانات Laravel، وحدد نوع
              كل حساب لاستخدامه في التقارير.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الحسابات</span>
              <strong>{accounts.length}</strong>
            </div>

            <div>
              <span>حسابات مخصصة</span>
              <strong>{customAccountsCount}</strong>
            </div>
          </div>
        </div>

        <div className="business-report-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={loadAccounts}
            disabled={isLoading}
          >
            <RefreshCcw size={18} />
            {isLoading ? "جاري التحديث..." : "تحديث الحسابات من السيرفر"}
          </button>
        </div>

        <div className="accounts-layout">
          <form className="accounts-form" onSubmit={saveAccount}>
            <div className="form-title">
              <WalletCards size={22} />
              <h2>{editingId ? "تعديل الحساب" : "إضافة حساب جديد"}</h2>
            </div>

            {editingId && (
              <div className="edit-alert">
                أنت الآن تعدل حسابًا موجودًا. بعد التعديل اضغط تحديث الحساب.
              </div>
            )}

            <label>
              اسم الحساب
              <input
                type="text"
                name="name"
                placeholder="مثال: السيارات، القروض، مصروف الكهرباء"
                value={form.name}
                onChange={handleChange}
              />
            </label>

            <label>
              نوع الحساب
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="asset">أصل</option>
                <option value="liability">خصم</option>
                <option value="equity">حقوق ملكية</option>
                <option value="revenue">إيراد</option>
                <option value="expense">مصروف</option>
              </select>
            </label>

            <div className="account-help">
              <Info size={18} />
              <span>{accountTypeDescriptions[form.type]}</span>
            </div>

            <button className="primary-btn" disabled={isSaving}>
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {isSaving
                ? "جاري الحفظ..."
                : editingId
                ? "تحديث الحساب"
                : "إضافة الحساب"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={resetForm}
              >
                <XCircle size={18} />
                إلغاء التعديل
              </button>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={resetAccounts}
            >
              استعادة الحسابات الافتراضية
            </button>
          </form>

          <div className="accounts-list-card">
            <h2>قائمة الحسابات</h2>

            <div className="accounts-toolbar">
              <input
                type="text"
                placeholder="ابحث عن حساب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">كل الأنواع</option>
                <option value="asset">الأصول</option>
                <option value="liability">الخصوم</option>
                <option value="equity">حقوق الملكية</option>
                <option value="revenue">الإيرادات</option>
                <option value="expense">المصروفات</option>
              </select>
            </div>

            {isLoading ? (
              <div className="empty-search">
                جاري تحميل الحسابات من السيرفر...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="empty-search">
                لا توجد حسابات مطابقة للبحث أو الفلتر الحالي.
              </div>
            ) : (
              <div className="accounts-groups">
                {Object.entries(accountTypes).map(([typeKey, typeName]) => {
                  const group = groupedAccounts[typeKey] || [];

                  if (typeFilter !== "all" && typeFilter !== typeKey) {
                    return null;
                  }

                  if (group.length === 0 && searchTerm.trim()) {
                    return null;
                  }

                  return (
                    <div className="account-group" key={typeKey}>
                      <div className="account-group-title">
                        <strong>{typeName}</strong>
                        <span>{group.length} حساب</span>
                      </div>

                      {group.length === 0 ? (
                        <p className="empty-text">
                          لا توجد حسابات في هذا النوع.
                        </p>
                      ) : (
                        <div className="account-items">
                          {group.map((account) => (
                            <div
                              className={
                                editingId === account.id
                                  ? "account-item editing-row"
                                  : "account-item"
                              }
                              key={account.id}
                            >
                              <div>
                                <strong>{account.name}</strong>
                                <span>
                                  {account.isDefault
                                    ? "حساب افتراضي"
                                    : "حساب مخصص"}
                                </span>

                                <span
                                  className={`account-type-badge ${account.type}`}
                                >
                                  {accountTypes[account.type]}
                                </span>
                              </div>

                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="edit-btn"
                                  onClick={() => startEdit(account)}
                                  title="تعديل الحساب"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  className={
                                    account.isDefault
                                      ? "delete-btn disabled-delete"
                                      : "delete-btn"
                                  }
                                  onClick={() => deleteAccount(account.id)}
                                  title={
                                    account.isDefault
                                      ? "لا يمكن حذف حساب افتراضي"
                                      : "حذف الحساب"
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

export default AccountsPage;