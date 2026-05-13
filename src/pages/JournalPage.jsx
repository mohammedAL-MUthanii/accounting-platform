import { useEffect, useState } from "react";
import {
  Trash2,
  Save,
  NotebookPen,
  Pencil,
  XCircle,
  Printer,
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

const accountTypeNames = {
  asset: "أصل",
  liability: "خصم",
  equity: "حقوق ملكية",
  revenue: "إيراد",
  expense: "مصروف",
};

const accountNature = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  revenue: "credit",
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

function JournalPage() {
  const [entries, setEntries] = useState(() => readArray("journalEntries"));

  const [accounts, setAccounts] = useState(() => {
    const savedAccounts = readArray("accounts");
    return savedAccounts.length > 0 ? savedAccounts : defaultAccounts;
  });

  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    entryId: null,
    title: "",
    message: "",
  });

  const [form, setForm] = useState({
    date: "",
    debitAccount: "",
    creditAccount: "",
    description: "",
    amount: "",
  });

  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const savedAccounts = readArray("accounts");
    setAccounts(savedAccounts.length > 0 ? savedAccounts : defaultAccounts);
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function printJournal() {
    window.print();
  }

  function getAccountInfo(accountName) {
    return accounts.find((account) => account.name === accountName);
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
      date: "",
      debitAccount: "",
      creditAccount: "",
      description: "",
      amount: "",
    });

    setEditingId(null);
  }

  function validateEntry() {
    if (
      !form.date ||
      !form.debitAccount ||
      !form.creditAccount ||
      !form.description.trim() ||
      !form.amount
    ) {
      showToast("رجاءً املأ جميع حقول القيد.", "warning");
      return false;
    }

    if (form.debitAccount === form.creditAccount) {
      showToast("لا يمكن أن يكون الحساب المدين هو نفسه الحساب الدائن.", "error");
      return false;
    }

    if (Number(form.amount) <= 0) {
      showToast("المبلغ يجب أن يكون أكبر من صفر.", "warning");
      return false;
    }

    return true;
  }

  function saveEntry(e) {
    e.preventDefault();

    if (!validateEntry()) return;

    if (editingId) {
      const updatedEntries = entries.map((entry) => {
        if (entry.id === editingId) {
          return {
            ...entry,
            date: form.date,
            debitAccount: form.debitAccount,
            creditAccount: form.creditAccount,
            description: form.description.trim(),
            amount: Number(form.amount),
          };
        }

        return entry;
      });

      setEntries(updatedEntries);
      resetForm();
      showToast("تم تحديث القيد بنجاح.");
      return;
    }

    const maxNumber = entries.length
      ? Math.max(...entries.map((entry) => Number(entry.number || 0)))
      : 0;

    const newEntry = {
      id: Date.now(),
      number: maxNumber + 1,
      date: form.date,
      debitAccount: form.debitAccount,
      creditAccount: form.creditAccount,
      description: form.description.trim(),
      amount: Number(form.amount),
      source: "manual",
    };

    setEntries([newEntry, ...entries]);
    resetForm();
    showToast("تم حفظ القيد بنجاح.");
  }

  function startEdit(entry) {
    setEditingId(entry.id);

    setForm({
      date: entry.date,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      description: entry.description,
      amount: entry.amount,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteEntry(id) {
    const entry = entries.find((item) => item.id === id);

    if (!entry) return;

    setConfirmState({
      open: true,
      entryId: id,
      title: `حذف قيد رقم ${entry.number}`,
      message:
        "هل تريد حذف هذا القيد من دفتر اليومية؟ هذا الإجراء سيؤثر على الأستاذ وميزان المراجعة والقوائم المالية.",
    });
  }

  function confirmDeleteEntry() {
    const id = confirmState.entryId;

    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);

    if (editingId === id) {
      resetForm();
    }

    setConfirmState({
      open: false,
      entryId: null,
      title: "",
      message: "",
    });

    showToast("تم حذف القيد بنجاح.");
  }

  function cancelDeleteEntry() {
    setConfirmState({
      open: false,
      entryId: null,
      title: "",
      message: "",
    });
  }

  const debitAccountInfo = getAccountInfo(form.debitAccount);
  const creditAccountInfo = getAccountInfo(form.creditAccount);

  const debitWarning =
    debitAccountInfo && accountNature[debitAccountInfo.type] === "credit"
      ? `تنبيه: حساب "${form.debitAccount}" نوعه ${
          accountTypeNames[debitAccountInfo.type]
        } وطبيعته غالبًا دائن، ووضعه في الطرف المدين قد يكون غير صحيح إلا في حالات خاصة.`
      : "";

  const creditWarning =
    creditAccountInfo && accountNature[creditAccountInfo.type] === "debit"
      ? `تنبيه: حساب "${form.creditAccount}" نوعه ${
          accountTypeNames[creditAccountInfo.type]
        } وطبيعته غالبًا مدين، ووضعه في الطرف الدائن قد يكون غير صحيح إلا في حالات خاصة.`
      : "";

  const totalAmount = entries.reduce((sum, entry) => {
    return sum + Number(entry.amount || 0);
  }, 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">دفتر اليومية</h1>
            <p className="section-subtitle">
              هنا تبدأ التطبيق الحقيقي: أدخل القيود المحاسبية باستخدام الحسابات
              التي أنشأتها في صفحة إدارة الحسابات.
            </p>
          </div>

          <div className="report-actions no-print">
            <button type="button" className="primary-btn" onClick={printJournal}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد القيود</span>
              <strong>{entries.length}</strong>
            </div>

            <div>
              <span>إجمالي المبالغ</span>
              <strong>{totalAmount.toLocaleString()} ريال</strong>
            </div>
          </div>
        </div>

        <div className="journal-layout">
          <form className="journal-form no-print" onSubmit={saveEntry}>
            <div className="form-title">
              <NotebookPen size={22} />
              <h2>{editingId ? "تعديل القيد" : "إضافة قيد جديد"}</h2>
            </div>

            {editingId && (
              <div className="edit-alert">
                أنت الآن تعدل قيدًا موجودًا. بعد التعديل اضغط تحديث القيد.
              </div>
            )}

            <label>
              التاريخ
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </label>

            <label>
              الحساب المدين
              <select
                name="debitAccount"
                value={form.debitAccount}
                onChange={handleChange}
              >
                <option value="">اختر الحساب المدين</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name} - {accountTypeNames[account.type]}
                  </option>
                ))}
              </select>
            </label>

            {debitWarning && <div className="smart-warning">{debitWarning}</div>}

            <label>
              الحساب الدائن
              <select
                name="creditAccount"
                value={form.creditAccount}
                onChange={handleChange}
              >
                <option value="">اختر الحساب الدائن</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name} - {accountTypeNames[account.type]}
                  </option>
                ))}
              </select>
            </label>

            {creditWarning && (
              <div className="smart-warning">{creditWarning}</div>
            )}

            <label>
              البيان
              <textarea
                name="description"
                placeholder="مثال: إثبات رأس مال المنشأة"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <label>
              المبلغ
              <input
                type="number"
                name="amount"
                placeholder="مثال: 100000"
                value={form.amount}
                onChange={handleChange}
              />
            </label>

            <button className="primary-btn">
              <Save size={18} />
              {editingId ? "تحديث القيد" : "حفظ القيد"}
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
          </form>

          <div className="journal-table">
            <h2>القيود المسجلة</h2>

            {entries.length === 0 ? (
              <p className="empty-text">
                لا توجد قيود حتى الآن. أضف أول قيد من النموذج.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>التاريخ</th>
                      <th>الحساب المدين</th>
                      <th>الحساب الدائن</th>
                      <th>البيان</th>
                      <th>المبلغ</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={editingId === entry.id ? "editing-row" : ""}
                      >
                        <td>#{entry.number}</td>
                        <td>{entry.date}</td>
                        <td>
                          <div className="account-cell">
                            <span className="debit-badge">
                              {entry.debitAccount}
                            </span>

                            {getAccountInfo(entry.debitAccount) && (
                              <span
                                className={`account-type-badge ${
                                  getAccountInfo(entry.debitAccount).type
                                }`}
                              >
                                {
                                  accountTypeNames[
                                    getAccountInfo(entry.debitAccount).type
                                  ]
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="account-cell">
                            <span className="credit-badge">
                              {entry.creditAccount}
                            </span>

                            {getAccountInfo(entry.creditAccount) && (
                              <span
                                className={`account-type-badge ${
                                  getAccountInfo(entry.creditAccount).type
                                }`}
                              >
                                {
                                  accountTypeNames[
                                    getAccountInfo(entry.creditAccount).type
                                  ]
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>{entry.description}</td>
                        <td>{Number(entry.amount || 0).toLocaleString()} ريال</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() => startEdit(entry)}
                              title="تعديل"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => deleteEntry(entry.id)}
                              title="حذف"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        danger
        onConfirm={confirmDeleteEntry}
        onCancel={cancelDeleteEntry}
      />
    </div>
  );
}

export default JournalPage;