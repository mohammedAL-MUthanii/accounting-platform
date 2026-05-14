import { useEffect, useMemo, useState } from "react";
import {
  ReceiptText,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  User,
  Wallet,
  PackageCheck,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ar-YE")} ريال`;
}

function getPaymentLabel(type) {
  if (type === "cash") return "نقدًا";
  if (type === "credit") return "آجل";
  return type || "-";
}

function normalizeSalesInvoice(invoice) {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || "منتج غير معروف",
        code: item.product?.code || "-",
        quantity: Number(item.quantity || 0),
        salePrice: Number(item.sale_price || 0),
        costPrice: Number(item.cost_price || 0),
        discountPercent: Number(item.discount_percent || 0),
        discountValue: Number(item.discount_value || 0),
        grossTotal: Number(item.gross_total || 0),
        netTotal: Number(item.net_total || 0),
        profitTotal: Number(item.profit_total || 0),
      }))
    : [];

  return {
    id: invoice.id,
    invoiceNumber: invoice.id,
    date: String(invoice.invoice_date || invoice.created_at || "").slice(0, 10),
    customerName: invoice.customer_name || "عميل نقدي",
    paymentType: invoice.payment_type || "cash",
    paymentMethod: getPaymentLabel(invoice.payment_type),
    description: "فاتورة بيع",
    items,
    grossTotal: Number(invoice.gross_total || 0),
    discount: Number(invoice.discount_total || 0),
    netTotal: Number(invoice.net_total || 0),
    profit: Number(invoice.profit_total || 0),
    createdAt: invoice.created_at,
    original: invoice,
  };
}

function SalesInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    invoice: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadSalesInvoices();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadSalesInvoices() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/sales-invoices`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحميل فواتير المبيعات.", "error");
        setIsLoading(false);
        return;
      }

      const normalizedInvoices = Array.isArray(data.sales_invoices)
        ? data.sales_invoices.map(normalizeSalesInvoice)
        : [];

      setInvoices(normalizedInvoices);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
  }

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

  const summary = useMemo(() => {
    const totalSales = invoices.reduce((sum, invoice) => {
      return sum + Number(invoice.netTotal || 0);
    }, 0);

    const totalProfit = invoices.reduce((sum, invoice) => {
      return sum + Number(invoice.profit || 0);
    }, 0);

    const totalItems = invoices.reduce((sum, invoice) => {
      return sum + invoice.items.length;
    }, 0);

    return {
      totalSales,
      totalProfit,
      totalItems,
    };
  }, [invoices]);

  function requestDeleteInvoice(invoice) {
    setConfirmState({
      open: true,
      invoice,
      title: `حذف فاتورة رقم ${invoice.invoiceNumber}`,
      message:
        "هل تريد حذف هذه الفاتورة؟ ملاحظة: حذف فاتورة البيع لا يرجع المخزون تلقائيًا.",
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

  async function confirmDeleteInvoice() {
    const invoice = confirmState.invoice;

    if (!invoice) {
      cancelDeleteInvoice();
      showToast("لم يتم العثور على الفاتورة المطلوبة.", "error");
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/sales-invoices/${invoice.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر حذف فاتورة البيع.", "error");
        cancelDeleteInvoice();
        return;
      }

      const updatedInvoices = invoices.filter((item) => {
        return String(item.id) !== String(invoice.id);
      });

      setInvoices(updatedInvoices);

      if (String(selectedInvoiceId) === String(invoice.id)) {
        setSelectedInvoiceId(null);
      }

      cancelDeleteInvoice();

      showToast(data.message || `تم حذف فاتورة رقم ${invoice.invoiceNumber}.`);
    } catch {
      cancelDeleteInvoice();
      showToast("تعذر الاتصال بالسيرفر أثناء حذف فاتورة البيع.", "error");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">فواتير المبيعات</h1>
            <p className="section-subtitle">
              هنا تظهر فواتير البيع المحفوظة في قاعدة بيانات Laravel، مع تفاصيل
              الأصناف والإجماليات والربح.
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

              <button
                type="button"
                className="secondary-btn"
                onClick={loadSalesInvoices}
              >
                <RefreshCcw size={18} />
                تحديث
              </button>

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

            {isLoading ? (
              <div className="empty-search">
                جاري تحميل فواتير المبيعات من السيرفر...
              </div>
            ) : filteredInvoices.length === 0 ? (
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
                          <span
                            className={
                              invoice.paymentType === "credit"
                                ? "purchase-payment-badge credit"
                                : "purchase-payment-badge cash"
                            }
                          >
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

                  <span
                    className={
                      selectedInvoice.paymentType === "credit"
                        ? "purchase-payment-badge credit"
                        : "purchase-payment-badge cash"
                    }
                  >
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
                        <th>الكود</th>
                        <th>الصنف</th>
                        <th>الكمية</th>
                        <th>سعر البيع</th>
                        <th>الخصم</th>
                        <th>الصافي</th>
                        <th>الربح</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map((item, index) => {
                        return (
                          <tr key={item.id ?? index}>
                            <td>{index + 1}</td>

                            <td>{item.code}</td>

                            <td>
                              <strong>{item.productName}</strong>
                            </td>

                            <td>{item.quantity}</td>

                            <td>{formatCurrency(item.salePrice)}</td>

                            <td>{formatCurrency(item.discountValue)}</td>

                            <td>{formatCurrency(item.netTotal)}</td>

                            <td>
                              <strong
                                className={
                                  item.profitTotal >= 0
                                    ? "good-text"
                                    : "bad-text"
                                }
                              >
                                {formatCurrency(item.profitTotal)}
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