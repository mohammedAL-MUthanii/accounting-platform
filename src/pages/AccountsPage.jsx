import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  WalletCards,
  Info,
  Pencil,
  XCircle,
  Save,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const defaultAccounts = [
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

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function AccountsPage() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const savedAccounts = localStorage.getItem("accounts");
      const parsedAccounts = savedAccounts ? JSON.parse(savedAccounts) : defaultAccounts;
      return Array.isArray(parsedAccounts) ? parsedAccounts : defaultAccounts;
    } catch {
      return defaultAccounts;
    }
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    accountId: null,
    oldAccountName: "",
    newAccountName: "",
    title: "",
    message: "",
    confirmText: "موافق",
    danger: false,
    pendingUpdatedAccounts: null,
  });

  const [form, setForm] = useState({
    name: "",
    type: "asset",
  });

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function openConfirm({
    type,
    accountId = null,
    oldAccountName = "",
    newAccountName = "",
    title,
    message,
    confirmText = "موافق",
    danger = false,
    pendingUpdatedAccounts = null,
  }) {
    setConfirmState({
      open: true,
      type,
      accountId,
      oldAccountName,
      newAccountName,
      title,
      message,
      confirmText,
      danger,
      pendingUpdatedAccounts,
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      type: "",
      accountId: null,
      oldAccountName: "",
      newAccountName: "",
      title: "",
      message: "",
      confirmText: "موافق",
      danger: false,
      pendingUpdatedAccounts: null,
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

  function saveAccount(e) {
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

    if (editingId) {
      const oldAccount = accounts.find((account) => account.id === editingId);

      if (!oldAccount) {
        showToast("لم يتم العثور على الحساب المطلوب تعديله.", "error");
        return;
      }

      const oldAccountName = oldAccount.name;
      const hasNameChanged = oldAccountName !== accountName;

      const updatedAccounts = accounts.map((account) => {
        if (account.id === editingId) {
          return {
            ...account,
            name: accountName,
            type: form.type,
          };
        }

        return account;
      });

      if (hasNameChanged) {
        const savedEntries = readArray("journalEntries");

        const accountIsUsed = savedEntries.some((entry) => {
          return (
            entry.debitAccount === oldAccountName ||
            entry.creditAccount === oldAccountName
          );
        });

        if (accountIsUsed) {
          openConfirm({
            type: "updateEntries",
            oldAccountName,
            newAccountName: accountName,
            title: "تحديث اسم الحساب في القيود",
            message: `تم تغيير اسم الحساب من "${oldAccountName}" إلى "${accountName}". هل تريد تحديث القيود القديمة التي تستخدم هذا الحساب أيضًا؟`,
            confirmText: "نعم، حدث القيود",
            danger: false,
            pendingUpdatedAccounts: updatedAccounts,
          });

          return;
        }
      }

      setAccounts(updatedAccounts);
      resetForm();
      showToast("تم تحديث الحساب بنجاح.");
      return;
    }

    const newAccount = {
      id: Date.now(),
      name: accountName,
      type: form.type,
      isDefault: false,
    };

    setAccounts([...accounts, newAccount]);
    resetForm();
    showToast("تمت إضافة الحساب بنجاح.");
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

    const savedEntries = readArray("journalEntries");

    const accountIsUsed = savedEntries.some((entry) => {
      return (
        entry.debitAccount === account.name ||
        entry.creditAccount === account.name
      );
    });

    if (accountIsUsed) {
      showToast(
        `لا يمكن حذف حساب "${account.name}" لأنه مستخدم في قيود محاسبية قديمة. احذف أو عدّل القيود المرتبطة به أولًا.`,
        "error"
      );
      return;
    }

    openConfirm({
      type: "delete",
      accountId: id,
      title: "حذف حساب",
      message: `هل تريد حذف حساب "${account.name}"؟`,
      confirmText: "نعم، حذف",
      danger: true,
    });
  }

  function resetAccounts() {
    openConfirm({
      type: "reset",
      title: "استعادة الحسابات الافتراضية",
      message:
        "سيتم حذف الحسابات المخصصة واستعادة الحسابات الافتراضية الأساسية. هل تريد المتابعة؟",
      confirmText: "استعادة الحسابات",
      danger: true,
    });
  }

  function confirmAction() {
    if (confirmState.type === "delete") {
      const account = accounts.find((item) => item.id === confirmState.accountId);

      setAccounts(accounts.filter((item) => item.id !== confirmState.accountId));

      if (editingId === confirmState.accountId) {
        resetForm();
      }

      closeConfirm();
      showToast(account ? `تم حذف حساب "${account.name}" بنجاح.` : "تم حذف الحساب.");
      return;
    }

    if (confirmState.type === "reset") {
      setAccounts(defaultAccounts);
      resetForm();
      setSearchTerm("");
      setTypeFilter("all");
      closeConfirm();
      showToast("تمت استعادة الحسابات الافتراضية بنجاح.");
      return;
    }

    if (confirmState.type === "updateEntries") {
      const savedEntries = readArray("journalEntries");

      const updatedEntries = savedEntries.map((entry) => {
        return {
          ...entry,
          debitAccount:
            entry.debitAccount === confirmState.oldAccountName
              ? confirmState.newAccountName
              : entry.debitAccount,
          creditAccount:
            entry.creditAccount === confirmState.oldAccountName
              ? confirmState.newAccountName
              : entry.creditAccount,
        };
      });

      localStorage.setItem("journalEntries", JSON.stringify(updatedEntries));

      if (confirmState.pendingUpdatedAccounts) {
        setAccounts(confirmState.pendingUpdatedAccounts);
      }

      resetForm();
      closeConfirm();
      showToast("تم تحديث الحساب وتحديث القيود القديمة بنجاح.");
    }
  }

  function cancelConfirm() {
    if (confirmState.type === "updateEntries") {
      if (confirmState.pendingUpdatedAccounts) {
        setAccounts(confirmState.pendingUpdatedAccounts);
      }

      resetForm();
      showToast("تم تحديث الحساب بدون تعديل القيود القديمة.", "success");
    }

    closeConfirm();
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

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">إدارة الحسابات</h1>
            <p className="section-subtitle">
              أضف أو عدّل حساباتك المحاسبية وحدد نوع كل حساب حتى تستخدمها في
              دفتر اليومية والقوائم المالية.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الحسابات</span>
              <strong>{accounts.length}</strong>
            </div>

            <div>
              <span>حسابات مخصصة</span>
              <strong>
                {accounts.filter((account) => !account.isDefault).length}
              </strong>
            </div>
          </div>
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

            <button className="primary-btn">
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? "تحديث الحساب" : "إضافة الحساب"}
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

            {filteredAccounts.length === 0 ? (
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
        cancelText={
          confirmState.type === "updateEntries"
            ? "لا، حدث الحساب فقط"
            : "إلغاء"
        }
        danger={confirmState.danger}
        onConfirm={confirmAction}
        onCancel={cancelConfirm}
      />
    </div>
  );
}

export default AccountsPage;