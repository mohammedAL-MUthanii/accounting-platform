import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Search,
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

function LedgerPage() {
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [selectedAccount, setSelectedAccount] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadLedgerData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function printLedger() {
    window.print();
  }

  async function loadLedgerData() {
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

    return generatedEntries
      .filter((entry) => Number(entry.amount || 0) > 0)
      .sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
  }, [salesInvoices, purchaseInvoices, vouchers]);

  const ledgerAccounts = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          type: getAccountType(entry.debitAccount),
          movements: [],
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          type: getAccountType(entry.creditAccount),
          movements: [],
        };
      }

      accountsMap[entry.debitAccount].movements.push({
        id: `${entry.id}-debit`,
        date: entry.date,
        description: entry.description,
        sourceLabel: entry.sourceLabel,
        debit: Number(entry.amount),
        credit: 0,
      });

      accountsMap[entry.creditAccount].movements.push({
        id: `${entry.id}-credit`,
        date: entry.date,
        description: entry.description,
        sourceLabel: entry.sourceLabel,
        debit: 0,
        credit: Number(entry.amount),
      });
    });

    return Object.entries(accountsMap)
      .map(([accountName, accountData]) => {
        let runningBalance = 0;

        const rows = accountData.movements
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((movement) => {
            runningBalance += movement.debit - movement.credit;

            return {
              ...movement,
              balance: runningBalance,
            };
          });

        const totalDebit = accountData.movements.reduce((sum, item) => {
          return sum + Number(item.debit || 0);
        }, 0);

        const totalCredit = accountData.movements.reduce((sum, item) => {
          return sum + Number(item.credit || 0);
        }, 0);

        const finalBalance = totalDebit - totalCredit;

        return {
          name: accountName,
          type: accountData.type,
          rows,
          totalDebit,
          totalCredit,
          finalBalance,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [entries]);

  const filteredAccounts =
    selectedAccount === "all"
      ? ledgerAccounts
      : ledgerAccounts.filter((account) => account.name === selectedAccount);

  const unknownAccounts = ledgerAccounts.filter((account) => {
    return account.type === "unknown";
  });

  const totalDebit = ledgerAccounts.reduce((sum, account) => {
    return sum + Number(account.totalDebit || 0);
  }, 0);

  const totalCredit = ledgerAccounts.reduce((sum, account) => {
    return sum + Number(account.totalCredit || 0);
  }, 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">دفتر الأستاذ</h1>
            <p className="section-subtitle">
              يتم إنشاء دفتر الأستاذ تلقائيًا من قيود اليومية الناتجة عن
              المبيعات والمشتريات والسندات في قاعدة بيانات Laravel.
            </p>
          </div>

          <div className="report-actions no-print">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadLedgerData}
              disabled={isLoading}
            >
              <RefreshCcw size={18} />
              {isLoading ? "جاري التحديث..." : "تحديث من السيرفر"}
            </button>

            <button className="primary-btn" onClick={printLedger}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الحسابات</span>
              <strong>{ledgerAccounts.length}</strong>
            </div>

            <div>
              <span>عدد القيود</span>
              <strong>{entries.length}</strong>
            </div>
          </div>
        </div>

        <div className="sales-summary no-print">
          <div className="sales-summary-card">
            <BookMarked size={26} />
            <span>إجمالي المدين</span>
            <strong>{formatCurrency(totalDebit)}</strong>
          </div>

          <div className="sales-summary-card">
            <BookMarked size={26} />
            <span>إجمالي الدائن</span>
            <strong>{formatCurrency(totalCredit)}</strong>
          </div>

          <div className="sales-summary-card">
            <BookMarked size={26} />
            <span>حالة التوازن</span>
            <strong>
              {Number(totalDebit) === Number(totalCredit) ? "متوازن" : "غير متوازن"}
            </strong>
          </div>
        </div>

        {unknownAccounts.length > 0 && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              توجد حسابات غير مصنفة في دفتر الأستاذ. أضفها لاحقًا في إدارة
              الحسابات أو حدّث قائمة الحسابات الافتراضية.
            </span>
          </div>
        )}

        <div className="ledger-filter no-print">
          <div className="filter-title">
            <Search size={20} />
            <span>فلترة حسب الحساب</span>
          </div>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="all">عرض كل الحسابات</option>
            {ledgerAccounts.map((account) => (
              <option key={account.name} value={account.name}>
                {account.name} - {accountTypeNames[account.type]}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="coming-card">
            <h2>جاري تحميل دفتر الأستاذ...</h2>
            <p>يتم جلب فواتير البيع والشراء والسندات من Laravel.</p>
          </div>
        ) : ledgerAccounts.length === 0 ? (
          <div className="coming-card">
            <h2>لا توجد بيانات بعد</h2>
            <p>
              أنشئ فاتورة بيع أو شراء أو سندًا، وبعدها سيظهر دفتر الأستاذ
              تلقائيًا.
            </p>
          </div>
        ) : (
          <div className="ledger-grid">
            {filteredAccounts.map((account) => (
              <div className="ledger-card" key={account.name}>
                <div className="ledger-card-header">
                  <div>
                    <BookMarked size={24} />
                    <h2>{account.name}</h2>
                    <span className={`account-type-badge ${account.type}`}>
                      {accountTypeNames[account.type]}
                    </span>
                  </div>

                  <span
                    className={
                      account.finalBalance > 0
                        ? "debit-badge"
                        : account.finalBalance < 0
                        ? "credit-badge"
                        : "neutral-badge"
                    }
                  >
                    {account.finalBalance > 0
                      ? "رصيد مدين"
                      : account.finalBalance < 0
                      ? "رصيد دائن"
                      : "متوازن"}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>البيان</th>
                        <th>المصدر</th>
                        <th>مدين</th>
                        <th>دائن</th>
                        <th>الرصيد</th>
                      </tr>
                    </thead>

                    <tbody>
                      {account.rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td>{row.description}</td>
                          <td>
                            <span className="payment-badge">
                              {row.sourceLabel}
                            </span>
                          </td>
                          <td>{row.debit > 0 ? formatCurrency(row.debit) : "-"}</td>
                          <td>
                            {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                          </td>
                          <td>
                            {formatCurrency(Math.abs(row.balance))}
                            {row.balance > 0
                              ? " مدين"
                              : row.balance < 0
                              ? " دائن"
                              : ""}
                          </td>
                        </tr>
                      ))}

                      <tr className="total-row">
                        <td colSpan="3">الإجمالي</td>
                        <td>{formatCurrency(account.totalDebit)}</td>
                        <td>{formatCurrency(account.totalCredit)}</td>
                        <td>{formatCurrency(Math.abs(account.finalBalance))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default LedgerPage;