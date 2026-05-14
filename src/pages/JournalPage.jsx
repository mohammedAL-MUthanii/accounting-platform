import { useEffect, useMemo, useState } from "react";
import {
  NotebookPen,
  Printer,
  RefreshCcw,
  ReceiptText,
  ShoppingCart,
  ShoppingBag,
  Wallet,
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
    grossTotal: Number(invoice.gross_total || 0),
    discountTotal: Number(invoice.discount_total || 0),
    netTotal: Number(invoice.net_total || 0),
    profitTotal: Number(invoice.profit_total || 0),
    costTotal: items.reduce((sum, item) => {
      return sum + Number(item.cost_price || 0) * Number(item.quantity || 0);
    }, 0),
    items,
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
    items: Array.isArray(invoice.items) ? invoice.items : [],
  };
}

function normalizeVoucher(voucher) {
  return {
    id: voucher.id,
    number: voucher.id,
    type: voucher.type,
    date: formatDate(voucher.voucher_date || voucher.created_at),
    partyName: voucher.party_name || "غير محدد",
    accountName: voucher.account_name || "",
    paymentMethod: voucher.payment_method || "الصندوق",
    amount: Number(voucher.amount || 0),
    description: voucher.description || "",
    debitAccount: voucher.debit_account || "",
    creditAccount: voucher.credit_account || "",
  };
}

function getAccountInfo(accountName) {
  return defaultAccounts.find((account) => account.name === accountName);
}

function makeEntry({
  id,
  number,
  date,
  debitAccount,
  creditAccount,
  description,
  amount,
  source,
  sourceLabel,
}) {
  return {
    id,
    number,
    date,
    debitAccount,
    creditAccount,
    description,
    amount: Number(amount || 0),
    source,
    sourceLabel,
  };
}

function JournalPage() {
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadJournalData();
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

  async function loadJournalData() {
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
          source: "sales",
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
            source: "sales-cost",
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
          source: "purchases",
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
          source: "vouchers",
          sourceLabel: voucher.type === "receipt" ? "سند قبض" : "سند صرف",
        })
      );
    });

    return generatedEntries
      .filter((entry) => Number(entry.amount || 0) > 0)
      .sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      })
      .map((entry, index) => ({
        ...entry,
        number: index + 1,
      }));
  }, [salesInvoices, purchaseInvoices, vouchers]);

  const totalAmount = entries.reduce((sum, entry) => {
    return sum + Number(entry.amount || 0);
  }, 0);

  const summary = useMemo(() => {
    const salesEntries = entries.filter((entry) => entry.source === "sales");
    const purchaseEntries = entries.filter(
      (entry) => entry.source === "purchases"
    );
    const voucherEntries = entries.filter((entry) => entry.source === "vouchers");

    return {
      salesCount: salesEntries.length,
      purchasesCount: purchaseEntries.length,
      vouchersCount: voucherEntries.length,
      totalDebits: totalAmount,
      totalCredits: totalAmount,
    };
  }, [entries, totalAmount]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">دفتر اليومية</h1>
            <p className="section-subtitle">
              دفتر يومية تلقائي من بيانات Laravel: فواتير البيع، فواتير الشراء،
              وسندات القبض والصرف.
            </p>
          </div>

          <div className="report-actions no-print">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadJournalData}
              disabled={isLoading}
            >
              <RefreshCcw size={18} />
              {isLoading ? "جاري التحديث..." : "تحديث من السيرفر"}
            </button>

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
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="sales-summary no-print">
          <div className="sales-summary-card">
            <ShoppingCart size={26} />
            <span>قيود المبيعات</span>
            <strong>{summary.salesCount}</strong>
          </div>

          <div className="sales-summary-card">
            <ShoppingBag size={26} />
            <span>قيود المشتريات</span>
            <strong>{summary.purchasesCount}</strong>
          </div>

          <div className="sales-summary-card">
            <Wallet size={26} />
            <span>قيود السندات</span>
            <strong>{summary.vouchersCount}</strong>
          </div>

          <div className="sales-summary-card">
            <ReceiptText size={26} />
            <span>توازن اليومية</span>
            <strong>{formatCurrency(summary.totalDebits)}</strong>
          </div>
        </div>

        <div className="balance-status success no-print">
          <NotebookPen size={22} />
          <span>
            هذه الصفحة تولّد القيود تلقائيًا من العمليات الفعلية. إذا أردت
            تعديل عملية، عدّل الفاتورة أو السند من صفحته الأساسية بدل تعديل
            القيد مباشرة.
          </span>
        </div>

        <div className="journal-table">
          <h2>القيود المسجلة تلقائيًا</h2>

          {isLoading ? (
            <p className="empty-text">جاري تحميل قيود اليومية من السيرفر...</p>
          ) : entries.length === 0 ? (
            <p className="empty-text">
              لا توجد قيود حتى الآن. أنشئ فاتورة بيع أو شراء أو سندًا أولًا.
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
                    <th>المصدر</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => {
                    const debitAccountInfo = getAccountInfo(entry.debitAccount);
                    const creditAccountInfo = getAccountInfo(
                      entry.creditAccount
                    );

                    return (
                      <tr key={entry.id}>
                        <td>#{entry.number}</td>
                        <td>{entry.date}</td>

                        <td>
                          <div className="account-cell">
                            <span className="debit-badge">
                              {entry.debitAccount}
                            </span>

                            {debitAccountInfo && (
                              <span
                                className={`account-type-badge ${debitAccountInfo.type}`}
                              >
                                {accountTypeNames[debitAccountInfo.type]}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="account-cell">
                            <span className="credit-badge">
                              {entry.creditAccount}
                            </span>

                            {creditAccountInfo && (
                              <span
                                className={`account-type-badge ${creditAccountInfo.type}`}
                              >
                                {accountTypeNames[creditAccountInfo.type]}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>{entry.description}</td>

                        <td>{formatCurrency(entry.amount)}</td>

                        <td>
                          <span className="payment-badge">
                            {entry.sourceLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="5">الإجمالي</th>
                    <th>{formatCurrency(totalAmount)}</th>
                    <th>مدين = دائن</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default JournalPage;