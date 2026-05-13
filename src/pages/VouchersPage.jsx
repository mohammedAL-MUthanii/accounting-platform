import { useMemo, useState } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Wallet,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const VOUCHERS_KEY = "vouchers";
const JOURNAL_KEY = "journalEntries";

const defaultAccounts = [
  { id: 1, name: "الصندوق", type: "asset" },
  { id: 2, name: "البنك", type: "asset" },
  { id: 3, name: "العملاء", type: "asset" },
  { id: 4, name: "الموردون", type: "liability" },
  { id: 5, name: "رأس المال", type: "equity" },
  { id: 6, name: "المبيعات", type: "revenue" },
  { id: 7, name: "مصروف الإيجار", type: "expense" },
  { id: 8, name: "مصروف الرواتب", type: "expense" },
  { id: 9, name: "المشتريات", type: "expense" },
];

const cashAccounts = ["الصندوق", "البنك"];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
}

function getAccountTypeName(type) {
  if (type === "asset") return "أصل";
  if (type === "liability") return "خصم";
  if (type === "equity") return "حقوق ملكية";
  if (type === "revenue") return "إيراد";
  if (type === "expense") return "مصروف";
  return "غير مصنف";
}

function VouchersPage() {
  const [vouchers, setVouchers] = useState(() => readArray(VOUCHERS_KEY));
  const [searchTerm, setSearchTerm] = useState("");

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    voucherId: null,
    title: "",
    message: "",
  });

  const savedAccounts = readArray("accounts");
  const accounts = savedAccounts.length > 0 ? savedAccounts : defaultAccounts;

  const [form, setForm] = useState({
    type: "receipt",
    date: new Date().toISOString().slice(0, 10),
    partyName: "",
    accountName: "العملاء",
    amount: "",
    paymentMethod: "الصندوق",
    description: "سند قبض",
  });

  const receiptAccounts = accounts
    .filter((account) => {
      return ["asset", "revenue", "equity"].includes(account.type);
    })
    .map((account) => account.name)
    .filter((name) => !cashAccounts.includes(name));

  const paymentAccounts = accounts
    .filter((account) => {
      return ["liability", "expense", "asset"].includes(account.type);
    })
    .map((account) => account.name)
    .filter((name) => !cashAccounts.includes(name));

  const accountOptions =
    form.type === "receipt" ? receiptAccounts : paymentAccounts;

  const expectedEntry =
    form.type === "receipt"
      ? {
          debitAccount: form.paymentMethod,
          creditAccount: form.accountName,
        }
      : {
          debitAccount: form.accountName,
          creditAccount: form.paymentMethod,
        };

  const isSameAccount =
    expectedEntry.debitAccount &&
    expectedEntry.debitAccount === expectedEntry.creditAccount;

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    if (name === "type") {
      nextForm.accountName = value === "receipt" ? "العملاء" : "مصروف الإيجار";
      nextForm.description = value === "receipt" ? "سند قبض" : "سند صرف";
      nextForm.paymentMethod = "الصندوق";
    }

    setForm(nextForm);
  }

  function resetForm() {
    setForm({
      type: "receipt",
      date: new Date().toISOString().slice(0, 10),
      partyName: "",
      accountName: "العملاء",
      amount: "",
      paymentMethod: "الصندوق",
      description: "سند قبض",
    });
  }

  function validateForm() {
    if (!form.partyName.trim()) {
      showToast("اكتب اسم الجهة أو الشخص قبل حفظ السند.", "warning");
      return false;
    }

    if (!form.accountName) {
      showToast("اختر الحساب المرتبط بالسند.", "warning");
      return false;
    }

    if (!form.paymentMethod) {
      showToast("اختر طريقة الدفع أو الصندوق.", "warning");
      return false;
    }

    if (isSameAccount) {
      showToast(
        "لا يمكن أن يكون الحساب المدين والحساب الدائن نفس الحساب.",
        "error"
      );
      return false;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      showToast("أدخل مبلغًا صحيحًا أكبر من صفر.", "warning");
      return false;
    }

    return true;
  }

  function saveVoucher(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const currentVouchers = readArray(VOUCHERS_KEY);
    const currentEntries = readArray(JOURNAL_KEY);

    const voucherNumber = currentVouchers.length + 1;
    const voucherId = Date.now();

    const newVoucher = {
      id: voucherId,
      number: voucherNumber,
      type: form.type,
      date: form.date,
      partyName: form.partyName.trim(),
      accountName: form.accountName,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      description:
        form.description ||
        (form.type === "receipt" ? "سند قبض" : "سند صرف"),
      createdAt: new Date().toISOString(),
    };

    const journalEntry = {
      id: voucherId + 1,
      number: currentEntries.length + 1,
      date: form.date,
      debitAccount: expectedEntry.debitAccount,
      creditAccount: expectedEntry.creditAccount,
      description:
        form.type === "receipt"
          ? `سند قبض رقم ${voucherNumber} - ${form.partyName.trim()}`
          : `سند صرف رقم ${voucherNumber} - ${form.partyName.trim()}`,
      amount: Number(form.amount),
      source: "voucher",
      voucherNumber,
    };

    const updatedVouchers = [newVoucher, ...currentVouchers];
    const updatedEntries = [journalEntry, ...currentEntries];

    saveArray(VOUCHERS_KEY, updatedVouchers);
    saveArray(JOURNAL_KEY, updatedEntries);

    setVouchers(updatedVouchers);
    resetForm();

    showToast("تم حفظ السند وتوليد القيد في دفتر اليومية بنجاح.");
  }

  function requestDeleteVoucher(id) {
    const voucher = vouchers.find((item) => item.id === id);

    if (!voucher) return;

    setConfirmState({
      open: true,
      voucherId: id,
      title: `حذف سند رقم ${voucher.number}`,
      message:
        "هل تريد حذف هذا السند؟ ملاحظة: لن يتم حذف القيد المرتبط من دفتر اليومية تلقائيًا.",
    });
  }

  function confirmDeleteVoucher() {
    const id = confirmState.voucherId;

    const updatedVouchers = vouchers.filter((item) => item.id !== id);
    saveArray(VOUCHERS_KEY, updatedVouchers);
    setVouchers(updatedVouchers);

    setConfirmState({
      open: false,
      voucherId: null,
      title: "",
      message: "",
    });

    showToast("تم حذف السند بنجاح.", "success");
  }

  function cancelDeleteVoucher() {
    setConfirmState({
      open: false,
      voucherId: null,
      title: "",
      message: "",
    });
  }

  const filteredVouchers = vouchers.filter((voucher) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      String(voucher.number).includes(keyword) ||
      voucher.partyName.toLowerCase().includes(keyword) ||
      voucher.accountName.toLowerCase().includes(keyword) ||
      voucher.description.toLowerCase().includes(keyword) ||
      voucher.paymentMethod.toLowerCase().includes(keyword)
    );
  });

  const totals = useMemo(() => {
    const totalReceipt = vouchers
      .filter((voucher) => voucher.type === "receipt")
      .reduce((sum, voucher) => sum + Number(voucher.amount), 0);

    const totalPayment = vouchers
      .filter((voucher) => voucher.type === "payment")
      .reduce((sum, voucher) => sum + Number(voucher.amount), 0);

    return {
      totalReceipt,
      totalPayment,
      netCash: totalReceipt - totalPayment,
    };
  }, [vouchers]);

  const selectedAccount = accounts.find(
    (account) => account.name === form.accountName
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">السندات</h1>
            <p className="section-subtitle">
              أنشئ سند قبض أو سند صرف، وسيتم توليد القيد المحاسبي تلقائيًا في
              دفتر اليومية مع منع الأخطاء المحاسبية الواضحة.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>إجمالي القبض</span>
              <strong>{formatCurrency(totals.totalReceipt)}</strong>
            </div>

            <div>
              <span>إجمالي الصرف</span>
              <strong>{formatCurrency(totals.totalPayment)}</strong>
            </div>
          </div>
        </div>

        <div className="vouchers-summary">
          <div className="voucher-summary-card receipt">
            <ArrowDownCircle size={28} />
            <span>سندات القبض</span>
            <strong>{formatCurrency(totals.totalReceipt)}</strong>
          </div>

          <div className="voucher-summary-card payment">
            <ArrowUpCircle size={28} />
            <span>سندات الصرف</span>
            <strong>{formatCurrency(totals.totalPayment)}</strong>
          </div>

          <div className="voucher-summary-card">
            <Wallet size={28} />
            <span>صافي حركة النقد</span>
            <strong
              className={totals.netCash >= 0 ? "good-text" : "bad-text"}
            >
              {formatCurrency(totals.netCash)}
            </strong>
          </div>
        </div>

        <div className="vouchers-layout">
          <form className="voucher-form" onSubmit={saveVoucher}>
            <div className="form-title">
              <Receipt size={22} />
              <h2>إضافة سند جديد</h2>
            </div>

            <label>
              نوع السند
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="receipt">سند قبض</option>
                <option value="payment">سند صرف</option>
              </select>
            </label>

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
              اسم الجهة / الشخص
              <input
                type="text"
                name="partyName"
                placeholder={
                  form.type === "receipt"
                    ? "مثال: العميل محمد"
                    : "مثال: المورد علي أو مالك العقار"
                }
                value={form.partyName}
                onChange={handleChange}
              />
            </label>

            <label>
              الحساب المرتبط
              <select
                name="accountName"
                value={form.accountName}
                onChange={handleChange}
              >
                <option value="">اختر الحساب</option>
                {accountOptions.map((accountName) => (
                  <option key={accountName} value={accountName}>
                    {accountName}
                  </option>
                ))}
              </select>
            </label>

            {selectedAccount && (
              <div className="voucher-hint">
                نوع الحساب المرتبط: {getAccountTypeName(selectedAccount.type)}
              </div>
            )}

            <label>
              طريقة الدفع / الصندوق
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="الصندوق">الصندوق</option>
                <option value="البنك">البنك</option>
              </select>
            </label>

            <div
              className={isSameAccount ? "expected-entry error" : "expected-entry"}
            >
              <strong>القيد المتوقع:</strong>

              <div>
                <span>من حـ/</span>
                <b>{expectedEntry.debitAccount || "-"}</b>
              </div>

              <div>
                <span>إلى حـ/</span>
                <b>{expectedEntry.creditAccount || "-"}</b>
              </div>

              {isSameAccount && (
                <p>خطأ: لا يمكن أن يكون الحساب المدين والدائن نفس الحساب.</p>
              )}
            </div>

            <label>
              البيان
              <textarea
                name="description"
                placeholder={
                  form.type === "receipt"
                    ? "مثال: تحصيل من عميل"
                    : "مثال: دفع إيجار أو سداد مورد"
                }
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <label>
              المبلغ
              <input
                type="number"
                name="amount"
                placeholder="مثال: 50000"
                value={form.amount}
                onChange={handleChange}
              />
            </label>

            <button className="primary-btn">
              <Plus size={18} />
              حفظ السند
            </button>
          </form>

          <div className="vouchers-list-card">
            <div className="vouchers-list-header">
              <div>
                <h2>قائمة السندات</h2>
                <p>تابع سندات القبض والصرف المسجلة.</p>
              </div>

              <div className="voucher-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="بحث برقم السند أو الجهة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredVouchers.length === 0 ? (
              <div className="empty-search">
                لا توجد سندات مطابقة للبحث الحالي.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>الجهة</th>
                      <th>الحساب</th>
                      <th>طريقة الدفع</th>
                      <th>البيان</th>
                      <th>المبلغ</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td>#{voucher.number}</td>
                        <td>{voucher.date}</td>
                        <td>
                          <span
                            className={
                              voucher.type === "receipt"
                                ? "voucher-type receipt"
                                : "voucher-type payment"
                            }
                          >
                            {voucher.type === "receipt"
                              ? "سند قبض"
                              : "سند صرف"}
                          </span>
                        </td>
                        <td>{voucher.partyName}</td>
                        <td>{voucher.accountName}</td>
                        <td>{voucher.paymentMethod}</td>
                        <td>{voucher.description}</td>
                        <td>
                          <strong>{formatCurrency(voucher.amount)}</strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => requestDeleteVoucher(voucher.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="balance-status success">
          <AlertCircle size={22} />
          <span>
            ملاحظة: السندات تمنع القيد الخاطئ مثل الصندوق ضد الصندوق، وتعرض
            القيد المتوقع قبل الحفظ.
          </span>
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
        onConfirm={confirmDeleteVoucher}
        onCancel={cancelDeleteVoucher}
      />
    </div>
  );
}

export default VouchersPage;