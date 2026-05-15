import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  Printer,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import { getAuthToken } from "../utils/auth";

import { API_BASE_URL } from "../config/api";

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

function StatementsPage() {
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadStatementsData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function printStatements() {
    window.print();
  }

  async function loadStatementsData() {
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
        "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت أو من تشغيل خدمة الباك إند."
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

  const statements = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          name: entry.debitAccount,
          debit: 0,
          credit: 0,
          type: getAccountType(entry.debitAccount),
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          name: entry.creditAccount,
          debit: 0,
          credit: 0,
          type: getAccountType(entry.creditAccount),
        };
      }

      accountsMap[entry.debitAccount].debit += Number(entry.amount || 0);
      accountsMap[entry.creditAccount].credit += Number(entry.amount || 0);
    });

    const allAccounts = Object.values(accountsMap);

    const revenues = allAccounts
      .filter((account) => account.type === "revenue")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const expenses = allAccounts
      .filter((account) => account.type === "expense")
      .map((account) => ({
        ...account,
        balance: account.debit - account.credit,
      }));

    const assets = allAccounts
      .filter((account) => account.type === "asset")
      .map((account) => ({
        ...account,
        balance: account.debit - account.credit,
      }));

    const liabilities = allAccounts
      .filter((account) => account.type === "liability")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const equity = allAccounts
      .filter((account) => account.type === "equity")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const unknownAccounts = allAccounts.filter((account) => {
      return account.type === "unknown";
    });

    const totalRevenues = revenues.reduce((sum, account) => {
      return sum + Number(account.balance || 0);
    }, 0);

    const totalExpenses = expenses.reduce((sum, account) => {
      return sum + Number(account.balance || 0);
    }, 0);

    const netIncome = totalRevenues - totalExpenses;

    const totalAssets = assets.reduce((sum, account) => {
      return sum + Number(account.balance || 0);
    }, 0);

    const totalLiabilities = liabilities.reduce((sum, account) => {
      return sum + Number(account.balance || 0);
    }, 0);

    const totalEquityBeforeProfit = equity.reduce((sum, account) => {
      return sum + Number(account.balance || 0);
    }, 0);

    const totalEquity = totalEquityBeforeProfit + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const statementDifference = totalAssets - totalLiabilitiesAndEquity;

    return {
      revenues,
      expenses,
      assets,
      liabilities,
      equity,
      unknownAccounts,
      totalRevenues,
      totalExpenses,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquityBeforeProfit,
      totalEquity,
      totalLiabilitiesAndEquity,
      statementDifference,
    };
  }, [entries]);

  const isBalanced = Math.abs(statements.statementDifference) < 0.01;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">القوائم المالية</h1>
            <p className="section-subtitle">
              يتم إنشاء قائمة الدخل وقائمة المركز المالي تلقائيًا من بيانات
              Laravel: فواتير البيع، فواتير الشراء، والسندات.
            </p>
          </div>

          <div className="report-actions no-print">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadStatementsData}
              disabled={isLoading}
            >
              <RefreshCcw size={18} />
              {isLoading ? "جاري التحديث..." : "تحديث من السيرفر"}
            </button>

            <button className="primary-btn" onClick={printStatements}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>صافي النتيجة</span>
              <strong
                className={statements.netIncome >= 0 ? "good-text" : "bad-text"}
              >
                {formatCurrency(Math.abs(statements.netIncome))}
              </strong>
            </div>

            <div>
              <span>الحالة</span>
              <strong>{statements.netIncome >= 0 ? "ربح" : "خسارة"}</strong>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="coming-card">
            <h2>جاري تحميل القوائم المالية...</h2>
            <p>يتم جلب فواتير البيع والشراء والسندات من Laravel.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="coming-card">
            <h2>لا توجد بيانات بعد</h2>
            <p>
              أنشئ فاتورة بيع أو شراء أو سندًا، وبعدها ستظهر القوائم المالية هنا
              تلقائيًا.
            </p>
          </div>
        ) : (
          <>
            {statements.unknownAccounts.length > 0 && (
              <div className="balance-status error">
                <AlertCircle size={22} />
                <span>
                  توجد حسابات غير مصنفة. أضف هذه الحسابات لاحقًا في إدارة
                  الحسابات أو حدّث قائمة الحسابات الافتراضية.
                </span>
              </div>
            )}

            <div
              className={
                isBalanced ? "balance-status success" : "balance-status error"
              }
            >
              {isBalanced ? (
                <CheckCircle2 size={22} />
              ) : (
                <AlertCircle size={22} />
              )}

              {isBalanced ? (
                <span>قائمة المركز المالي متوازنة</span>
              ) : (
                <span>
                  قائمة المركز المالي غير متوازنة، الفرق هو{" "}
                  {formatCurrency(Math.abs(statements.statementDifference))}.
                  قد يكون السبب عدم وجود قيد رأس مال افتتاحي أو وجود مخزون
                  تجريبي بدون قيد افتتاحي.
                </span>
              )}
            </div>

            <div className="statements-grid">
              <div className="statement-card">
                <div className="statement-title">
                  <TrendingUp size={24} />
                  <h2>قائمة الدخل</h2>
                </div>

                <div className="statement-section">
                  <h3>الإيرادات</h3>

                  {statements.revenues.length === 0 ? (
                    <p className="empty-text">لا توجد إيرادات.</p>
                  ) : (
                    statements.revenues.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الإيرادات</span>
                    <strong>{formatCurrency(statements.totalRevenues)}</strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>المصروفات</h3>

                  {statements.expenses.length === 0 ? (
                    <p className="empty-text">لا توجد مصروفات.</p>
                  ) : (
                    statements.expenses.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي المصروفات</span>
                    <strong>{formatCurrency(statements.totalExpenses)}</strong>
                  </div>
                </div>

                <div
                  className={
                    statements.netIncome >= 0
                      ? "net-result profit"
                      : "net-result loss"
                  }
                >
                  <span>
                    {statements.netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}
                  </span>
                  <strong>{formatCurrency(Math.abs(statements.netIncome))}</strong>
                </div>
              </div>

              <div className="statement-card">
                <div className="statement-title">
                  <Building2 size={24} />
                  <h2>قائمة المركز المالي</h2>
                </div>

                <div className="statement-section">
                  <h3>الأصول</h3>

                  {statements.assets.length === 0 ? (
                    <p className="empty-text">لا توجد أصول.</p>
                  ) : (
                    statements.assets.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الأصول</span>
                    <strong>{formatCurrency(statements.totalAssets)}</strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>الخصوم</h3>

                  {statements.liabilities.length === 0 ? (
                    <p className="empty-text">لا توجد خصوم.</p>
                  ) : (
                    statements.liabilities.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الخصوم</span>
                    <strong>{formatCurrency(statements.totalLiabilities)}</strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>حقوق الملكية</h3>

                  {statements.equity.length === 0 ? (
                    <p className="empty-text">لا توجد حقوق ملكية.</p>
                  ) : (
                    statements.equity.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-row">
                    <span>
                      {statements.netIncome >= 0
                        ? "صافي الربح"
                        : "صافي الخسارة"}
                    </span>
                    <strong>{formatCurrency(statements.netIncome)}</strong>
                  </div>

                  <div className="statement-total">
                    <span>إجمالي حقوق الملكية</span>
                    <strong>{formatCurrency(statements.totalEquity)}</strong>
                  </div>
                </div>

                <div className="net-result">
                  <span>إجمالي الخصوم وحقوق الملكية</span>
                  <strong>
                    {formatCurrency(statements.totalLiabilitiesAndEquity)}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default StatementsPage;