import { useMemo, useState } from "react";
import {
  ReceiptText,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  User,
  Wallet,
  PackageCheck,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const INVOICES_KEYS = ["mohasbti_sales_invoices", "salesInvoices"];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ar-YE")} ريال`;
}

function normalizeInvoice(invoice, index) {
  const items = invoice.lines || invoice.items || [];

  return {
    id: invoice.id ?? `invoice-${index}`,
    invoiceNumber: invoice.invoiceNumber ?? invoice.number ?? index + 1,
    date: invoice.date ?? "",
    customerName: invoice.customerName ?? "عميل نقدي",
    paymentMethod: invoice.paymentMethod ?? invoice.paymentType ?? "نقدًا",
    description: invoice.description ?? invoice.statement ?? "فاتورة بيع",
    items,
    grossTotal:
      invoice.totals?.gross ??
      invoice.grossTotal ??
      items.reduce((sum, item) => {
        const qty = Number(item.qty ?? item.quantity ?? 0);
        const price = Number(item.unitPrice ?? item.sellingPrice ?? 0);
        return sum + qty * price;
      }, 0),
    discount:
      invoice.totals?.discount ??
      invoice.discount ??
      invoice.totalDiscount ??
      0,
    netTotal:
      invoice.totals?.net ??
      invoice.total ??
      invoice.netTotal ??
      0,
    profit:
      invoice.profit ??
      items.reduce((sum, item) => {
        const qty = Number(item.qty ?? item.quantity ?? 0);
        const unitPrice = Number(item.unitPrice ?? item.sellingPrice ?? 0);
        const costPrice = Number(item.costPrice ?? item.purchasePrice ?? 0);
        return sum + (unitPrice - costPrice) * qty;
      }, 0),
  };
}

function loadInvoices() {
  const allInvoices = [];

  INVOICES_KEYS.forEach((key) => {
    const data = readArray(key);

    data.forEach((invoice) => {
      allInvoices.push({
        ...invoice,
        storageKey: key,
      });
    });
  });

  const uniqueMap = new Map();

  allInvoices.forEach((invoice, index) => {
    const normalized = normalizeInvoice(invoice, index);

    uniqueMap.set(String(normalized.id), {
      ...normalized,
      original: invoice,
      storageKey: invoice.storageKey,
    });
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    return Number(b.invoiceNumber) - Number(a.invoiceNumber);
  });
}

function SalesInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoices, setInvoices] = useState(() => loadInvoices());

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    invoice: null,
    title: "",
    message: "",
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      String(invoice.invoiceNumber).includes(keyword) ||
      invoice.customerName.toLowerCase().includes(keyword) ||
      invoice.paymentMethod.toLowerCase().includes(keyword) ||
      invoice.description.toLowerCase().includes(keyword)
    );
  });

  const selectedInvoice = invoices.find(
    (invoice) => String(invoice.id) === String(selectedInvoiceId)
  );

  const totalSales = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.netTotal || 0);
  }, 0);

  const totalProfit = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.profit || 0);
  }, 0);

  const totalItems = invoices.reduce((sum, invoice) => {
    return sum + invoice.items.length;
  }, 0);

  const summary = useMemo(() => {
    return {
      totalSales,
      totalProfit,
      totalItems,
    };
  }, [totalSales, totalProfit, totalItems]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function requestDeleteInvoice(invoice) {
    setConfirmState({
      open: true,
      invoice,
      title: `حذف فاتورة رقم ${invoice.invoiceNumber}`,
      message:
        "هل تريد حذف هذه الفاتورة؟ هذا الحذف للتجربة فقط ولن يرجع المخزون تلقائيًا.",
    });
  }

  function cancelDeleteInvoice() {
    setConfirmState({
      open: false,
      invoice: null,
      title: "",
      message: "",
    });
  }

  function confirmDeleteInvoice() {
    const invoice = confirmState.invoice;

    if (!invoice) {
      cancelDeleteInvoice();
      showToast("لم يتم العثور على الفاتورة المطلوبة.", "error");
      return;
    }

    const currentInvoices = readArray(invoice.storageKey);

    const updatedInvoices = currentInvoices.filter((item) => {
      const id = normalizeInvoice(item, 0).id;
      return String(id) !== String(invoice.id);
    });

    writeArray(invoice.storageKey, updatedInvoices);

    const updatedVisibleInvoices = invoices.filter((item) => {
      return String(item.id) !== String(invoice.id);
    });

    setInvoices(updatedVisibleInvoices);

    if (String(selectedInvoiceId) === String(invoice.id)) {
      setSelectedInvoiceId(null);
    }

    cancelDeleteInvoice();

    showToast(`تم حذف فاتورة رقم ${invoice.invoiceNumber} بنجاح.`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">فواتير المبيعات</h1>
            <p className="section-subtitle">
              هنا تظهر فواتير البيع المحفوظة من نقطة البيع، مع تفاصيل الأصناف
              والإجماليات والربح المتوقع.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الفواتير</span>
              <strong>{invoices.length}</strong>
            </div>

            <div>
              <span>إجمالي المبيعات</span>
              <strong>{formatCurrency(summary.totalSales)}</strong>
            </div>
          </div>
        </div>

        <div className="sales-summary">
          <div className="sales-summary-card">
            <ReceiptText size={26} />
            <span>عدد الفواتير</span>
            <strong>{invoices.length}</strong>
          </div>

          <div className="sales-summary-card">
            <PackageCheck size={26} />
            <span>عدد الأصناف المباعة</span>
            <strong>{summary.totalItems}</strong>
          </div>

          <div className="sales-summary-card">
            <Wallet size={26} />
            <span>إجمالي صافي المبيعات</span>
            <strong>{formatCurrency(summary.totalSales)}</strong>
          </div>

          <div className="sales-summary-card">
            <Wallet size={26} />
            <span>الربح المتوقع</span>
            <strong
              className={summary.totalProfit >= 0 ? "good-text" : "bad-text"}
            >
              {formatCurrency(summary.totalProfit)}
            </strong>
          </div>
        </div>

        <div className="sales-layout">
          <div className="sales-list-card">
            <div className="sales-list-header">
              <div>
                <h2>قائمة الفواتير</h2>
                <p>ابحث واعرض تفاصيل أي فاتورة بيع.</p>
              </div>

              <div className="sales-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="empty-search">
                لا توجد فواتير مطابقة للبحث الحالي.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>الدفع</th>
                      <th>الأصناف</th>
                      <th>الإجمالي</th>
                      <th>الخصم</th>
                      <th>الصافي</th>
                      <th>الربح</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={
                          String(selectedInvoiceId) === String(invoice.id)
                            ? "editing-row"
                            : ""
                        }
                      >
                        <td>#{invoice.invoiceNumber}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.customerName}</td>
                        <td>
                          <span className="payment-badge">
                            {invoice.paymentMethod}
                          </span>
                        </td>
                        <td>{invoice.items.length}</td>
                        <td>{formatCurrency(invoice.grossTotal)}</td>
                        <td>{formatCurrency(invoice.discount)}</td>
                        <td>
                          <strong>{formatCurrency(invoice.netTotal)}</strong>
                        </td>
                        <td>
                          <strong
                            className={
                              invoice.profit >= 0 ? "good-text" : "bad-text"
                            }
                          >
                            {formatCurrency(invoice.profit)}
                          </strong>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                setSelectedInvoiceId(
                                  String(selectedInvoiceId) ===
                                    String(invoice.id)
                                    ? null
                                    : invoice.id
                                )
                              }
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => requestDeleteInvoice(invoice)}
                              title="حذف الفاتورة"
                            >
                              <Trash2 size={16} />
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

          <div className="sales-details-card">
            {!selectedInvoice ? (
              <div className="empty-details">
                <ReceiptText size={42} />
                <h2>تفاصيل الفاتورة</h2>
                <p>اضغط على زر العين بجانب أي فاتورة لعرض تفاصيلها هنا.</p>
              </div>
            ) : (
              <>
                <div className="invoice-details-header">
                  <div>
                    <h2>فاتورة رقم #{selectedInvoice.invoiceNumber}</h2>
                    <p>{selectedInvoice.description}</p>
                  </div>

                  <span className="payment-badge">
                    {selectedInvoice.paymentMethod}
                  </span>
                </div>

                <div className="invoice-meta-grid">
                  <div>
                    <CalendarDays size={18} />
                    <span>التاريخ</span>
                    <strong>{selectedInvoice.date}</strong>
                  </div>

                  <div>
                    <User size={18} />
                    <span>العميل</span>
                    <strong>{selectedInvoice.customerName}</strong>
                  </div>

                  <div>
                    <Wallet size={18} />
                    <span>الصافي</span>
                    <strong>{formatCurrency(selectedInvoice.netTotal)}</strong>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>م</th>
                        <th>الصنف</th>
                        <th>الكمية</th>
                        <th>سعر البيع</th>
                        <th>الصافي</th>
                        <th>الربح</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map((item, index) => {
                        const qty = Number(item.qty ?? item.quantity ?? 0);
                        const price = Number(
                          item.unitPrice ?? item.sellingPrice ?? 0
                        );
                        const cost = Number(
                          item.costPrice ?? item.purchasePrice ?? 0
                        );

                        const net =
                          item.net ??
                          item.total ??
                          qty * price -
                            (Number(item.discountValue ?? 0) +
                              qty *
                                price *
                                (Number(item.discountPercent ?? 0) / 100));

                        const profit =
                          item.totalProfit ?? Number(net) - cost * qty;

                        return (
                          <tr key={item.lineId ?? item.id ?? index}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{item.name ?? item.productName}</strong>
                            </td>
                            <td>{qty}</td>
                            <td>{formatCurrency(price)}</td>
                            <td>{formatCurrency(net)}</td>
                            <td>
                              <strong
                                className={
                                  profit >= 0 ? "good-text" : "bad-text"
                                }
                              >
                                {formatCurrency(profit)}
                              </strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-totals-grid">
                  <div>
                    <span>الإجمالي</span>
                    <strong>{formatCurrency(selectedInvoice.grossTotal)}</strong>
                  </div>

                  <div>
                    <span>الخصم</span>
                    <strong>{formatCurrency(selectedInvoice.discount)}</strong>
                  </div>

                  <div>
                    <span>الصافي</span>
                    <strong>{formatCurrency(selectedInvoice.netTotal)}</strong>
                  </div>

                  <div>
                    <span>الربح</span>
                    <strong
                      className={
                        selectedInvoice.profit >= 0 ? "good-text" : "bad-text"
                      }
                    >
                      {formatCurrency(selectedInvoice.profit)}
                    </strong>
                  </div>
                </div>
              </>
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
        onConfirm={confirmDeleteInvoice}
        onCancel={cancelDeleteInvoice}
      />
    </div>
  );
}

export default SalesInvoicesPage;