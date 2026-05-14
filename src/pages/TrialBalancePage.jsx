import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Printer,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const defaultAccounts = [
  { id: 1, name: "الصندوق", type: "asset", isDefault: true },
  { id: 2, name: "البنك", type: "asset", isDefault: true },
  { id: 3, name: "العملاء", type: "asset", isDefault: true },
  { id: 4, name: "المخزون", type: "asset", isDefault: true },
  { id: 5, name: "تكلفة البضاعة المباعة", type: "expense", isDefault: true },
  { id: 6, name: "الموردون", type: "liability", isDefault: true },
  { id: 7, name: "رأس المال", type: "equity", isDefault: true },
  { id: 8, name: "المبيعات", type: "revenue", isDefault: true },
  { id: 9, name: "المشتريات", type: "expense", isDefault: true },
  { id: 10, name: "مصروف الإيجار", type: "expense", isDefault: true },
  { id: 11, name: "مصروف الرواتب", type: "expense", isDefault: true },
];

const accountTypeNames = {
  asset: "أصل",
  liability: "خصم",
  equity: "حقوق ملكية",
  revenue: "إيراد",
  expense: "مصروف",
  unknown: "غير مصنف",
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
}

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

function normalizeSalesInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    customerName: invoice.customer_name || "عميل نقدي",
    paymentType: invoice.payment_type || "cash",
    netTotal: Number(invoice.net_total || 0),
    costTotal: items.reduce((sum, item) => {
      return sum + Number(item.cost_price || 0) * Number(item.quantity || 0);
    }, 0),
  };
}

function normalizePurchaseInvoice(invoice) {
  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    supplierName: invoice.supplier_name || "مورد غير محدد",
    paymentType: invoice.payment_type || "cash",
    total: Number(invoice.total || 0),
  };
}

function normalizeVoucher(voucher) {
  return {
    id: voucher.id,
    number: voucher.id,
    type: voucher.type,
    date: formatDate(voucher.voucher_date || voucher.created_at),
    partyName: voucher.party_name || "غير محدد",
    amount: Number(voucher.amount || 0),
    description: voucher.description || "",
    debitAccount: voucher.debit_account || "",
    creditAccount: voucher.credit_account || "",
  };
}

function makeEntry({
  id,
  date,
  debitAccount,
  creditAccount,
  description,
  amount,
  sourceLabel,
}) {
  return {
    id,
    date,
    debitAccount,
    creditAccount,
    description,
    amount: Number(amount || 0),
    sourceLabel,
  };
}

function getAccountInfo(accountName) {
  return defaultAccounts.find((account) => account.name === accountName);
}

function getAccountType(accountName) {
  const account = getAccountInfo(accountName);
  return account ? account.type : "unknown";
}

function TrialBalancePage() {
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTrialBalanceData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function printTrialBalance() {
    window.print();
  }

  async function loadTrialBalanceData() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const [salesResponse, purchasesResponse, vouchersResponse] =
        await Promise.all([
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

      const salesData = await salesResponse.json();
      const purchasesData = await purchasesResponse.json();
      const vouchersData = await vouchersResponse.json();

      if (!salesResponse.ok) {
        showToast(salesData.message || "تعذر تحميل فواتير المبيعات.", "error");
      }

      if (!purchasesResponse.ok) {
        showToast(
          purchasesData.message || "تعذر تحميل فواتير المشتريات.",
          "error"
        );
      }

      if (!vouchersResponse.ok) {
        showToast(vouchersData.message || "تعذر تحميل السندات.", "error");
      }

      setSalesInvoices(
        Array.isArray(salesData.sales_invoices)
          ? salesData.sales_invoices.map(normalizeSalesInvoice)
          : []
      );

      setPurchaseInvoices(
        Array.isArray(purchasesData.purchase_invoices)
          ? purchasesData.purchase_invoices.map(normalizePurchaseInvoice)
          : []
      );

      setVouchers(
        Array.isArray(vouchersData.vouchers)
          ? vouchersData.vouchers.map(normalizeVoucher)
          : []
      );
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
  }

  const entries = useMemo(() => {
    const generatedEntries = [];

    salesInvoices.forEach((invoice) => {
      const debitAccount =
        invoice.paymentType === "credit" ? "العملاء" : "الصندوق";

      generatedEntries.push(
        makeEntry({
          id: `sale-revenue-${invoice.id}`,
          date: invoice.date,
          debitAccount,
          creditAccount: "المبيعات",
          description: `إثبات فاتورة بيع رقم ${invoice.number} - ${invoice.customerName}`,
          amount: invoice.netTotal,
          sourceLabel: "مبيعات",
        })
      );

      if (invoice.costTotal > 0) {
        generatedEntries.push(
          makeEntry({
            id: `sale-cost-${invoice.id}`,
            date: invoice.date,
            debitAccount: "تكلفة البضاعة المباعة",
            creditAccount: "المخزون",
            description: `إثبات تكلفة البضاعة المباعة لفاتورة بيع رقم ${invoice.number}`,
            amount: invoice.costTotal,
            sourceLabel: "تكلفة مبيعات",
          })
        );
      }
    });

    purchaseInvoices.forEach((invoice) => {
      const creditAccount =
        invoice.paymentType === "credit" ? "الموردون" : "الصندوق";

      generatedEntries.push(
        makeEntry({
          id: `purchase-${invoice.id}`,
          date: invoice.date,
          debitAccount: "المخزون",
          creditAccount,
          description: `إثبات فاتورة شراء رقم ${invoice.number} - ${invoice.supplierName}`,
          amount: invoice.total,
          sourceLabel: "مشتريات",
        })
      );
    });

    vouchers.forEach((voucher) => {
      generatedEntries.push(
        makeEntry({
          id: `voucher-${voucher.id}`,
          date: voucher.date,
          debitAccount: voucher.debitAccount,
          creditAccount: voucher.creditAccount,
          description:
            voucher.description ||
            `${voucher.type === "receipt" ? "سند قبض" : "سند صرف"} رقم ${
              voucher.number
            } - ${voucher.partyName}`,
          amount: voucher.amount,
          sourceLabel: voucher.type === "receipt" ? "سند قبض" : "سند صرف",
        })
      );
    });

    return generatedEntries.filter((entry) => Number(entry.amount || 0) > 0);
  }, [salesInvoices, purchaseInvoices, vouchers]);

  const trialBalance = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          name: entry.debitAccount,
          type: getAccountType(entry.debitAccount),
          debit: 0,
          credit: 0,
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          name: entry.creditAccount,
          type: getAccountType(entry.creditAccount),
          debit: 0,
          credit: 0,
        };
      }

      accountsMap[entry.debitAccount].debit += Number(entry.amount || 0);
      accountsMap[entry.creditAccount].credit += Number(entry.amount || 0);
    });

    return Object.values(accountsMap).sort((a, b) => {
      return a.name.localeCompare(b.name, "ar");
    });
  }, [entries]);

  const totalDebit = trialBalance.reduce((sum, account) => {
    return sum + Number(account.debit || 0);
  }, 0);

  const totalCredit = trialBalance.reduce((sum, account) => {
    return sum + Number(account.credit || 0);
  }, 0);

  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const unknownAccounts = trialBalance.filter((account) => {
    return account.type === "unknown";
  });

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">ميزان المراجعة</h1>
            <p className="section-subtitle">
              يتم إنشاء ميزان المراجعة تلقائيًا من قيود Laravel الناتجة عن
              المبيعات والمشتريات والسندات.
            </p>
          </div>

          <div className="report-actions no-print">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadTrialBalanceData}
              disabled={isLoading}
            >
              <RefreshCcw size={18} />
              {isLoading ? "جاري التحديث..." : "تحديث من السيرفر"}
            </button>

            <button className="primary-btn" onClick={printTrialBalance}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>إجمالي المدين</span>
              <strong>{formatCurrency(totalDebit)}</strong>
            </div>

            <div>
              <span>إجمالي الدائن</span>
              <strong>{formatCurrency(totalCredit)}</strong>
            </div>
          </div>
        </div>

        {unknownAccounts.length > 0 && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              توجد حسابات غير مصنفة. أضف هذه الحسابات لاحقًا في إدارة الحسابات
              أو حدّث قائمة الحسابات الافتراضية.
            </span>
          </div>
        )}

        <div
          className={isBalanced ? "balance-status success" : "balance-status error"}
        >
          {isBalanced ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}

          {isBalanced ? (
            <span>ميزان المراجعة متوازن: إجمالي المدين يساوي إجمالي الدائن</span>
          ) : (
            <span>
              يوجد فرق في الميزان بمبلغ {formatCurrency(difference)}: إجمالي
              المدين لا يساوي إجمالي الدائن
            </span>
          )}
        </div>

        <div className="trial-layout">
          <div className="journal-table">
            <div className="table-title">
              <BarChart3 size={22} />
              <h2>أرصدة الحسابات</h2>
            </div>

            {isLoading ? (
              <p className="empty-text">جاري تحميل ميزان المراجعة من السيرفر...</p>
            ) : trialBalance.length === 0 ? (
              <p className="empty-text">
                لا توجد بيانات بعد. أنشئ فاتورة بيع أو شراء أو سندًا أولًا.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>اسم الحساب</th>
                      <th>نوع الحساب</th>
                      <th>مدين</th>
                      <th>دائن</th>
                      <th>طبيعة الرصيد</th>
                      <th>الرصيد النهائي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {trialBalance.map((account) => {
                      const balance = Math.abs(account.debit - account.credit);

                      const balanceType =
                        account.debit > account.credit
                          ? "مدين"
                          : account.credit > account.debit
                          ? "دائن"
                          : "متوازن";

                      return (
                        <tr key={account.name}>
                          <td>
                            <strong>{account.name}</strong>
                          </td>

                          <td>
                            <span
                              className={`account-type-badge ${account.type}`}
                            >
                              {accountTypeNames[account.type]}
                            </span>
                          </td>

                          <td>{formatCurrency(account.debit)}</td>

                          <td>{formatCurrency(account.credit)}</td>

                          <td>
                            <span
                              className={
                                balanceType === "مدين"
                                  ? "debit-badge"
                                  : balanceType === "دائن"
                                  ? "credit-badge"
                                  : "neutral-badge"
                              }
                            >
                              {balanceType}
                            </span>
                          </td>

                          <td>{formatCurrency(balance)}</td>
                        </tr>
                      );
                    })}

                    <tr className="total-row">
                      <td>الإجمالي</td>
                      <td>-</td>
                      <td>{formatCurrency(totalDebit)}</td>
                      <td>{formatCurrency(totalCredit)}</td>
                      <td>-</td>
                      <td>{formatCurrency(difference)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="analysis-card">
            <h2>تحليل سريع</h2>

            <div className="analysis-item">
              <span>عدد الحسابات</span>
              <strong>{trialBalance.length}</strong>
            </div>

            <div className="analysis-item">
              <span>عدد القيود المصدرية</span>
              <strong>{entries.length}</strong>
            </div>

            <div className="analysis-item">
              <span>حالة الميزان</span>
              <strong className={isBalanced ? "good-text" : "bad-text"}>
                {isBalanced ? "متوازن" : "غير متوازن"}
              </strong>
            </div>

            <div className="analysis-item">
              <span>حسابات غير مصنفة</span>
              <strong
                className={
                  unknownAccounts.length === 0 ? "good-text" : "bad-text"
                }
              >
                {unknownAccounts.length}
              </strong>
            </div>

            <p>
              ميزان المراجعة يساعدك تتأكد أن كل قيود العمليات متوازنة، لأنه
              يجمع كل الحسابات المدينة والدائنة الناتجة عن البيع والشراء
              والسندات.
            </p>
          </div>
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default TrialBalancePage;