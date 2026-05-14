import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  Building2,
  PackageCheck,
  Wallet,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
}

function getPaymentLabel(type) {
  if (type === "cash") return "نقدًا";
  if (type === "credit") return "آجل";
  return type || "-";
}

function normalizePurchaseInvoice(invoice) {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || "منتج غير معروف",
        category: item.product?.category || "-",
        quantity: Number(item.quantity || 0),
        unitCost: Number(item.cost_price || 0),
        total: Number(item.total || 0),
      }))
    : [];

  return {
    id: invoice.id,
    number: invoice.id,
    date: invoice.invoice_date || invoice.created_at?.slice(0, 10) || "",
    supplierName: invoice.supplier_name || "مورد غير محدد",
    paymentType: invoice.payment_type || "cash",
    description: "فاتورة شراء",
    items,
    total: Number(invoice.total || 0),
    createdAt: invoice.created_at,
    original: invoice,
  };
}

function PurchaseInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    invoice: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadPurchaseInvoices();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadPurchaseInvoices() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/purchase-invoices`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحميل فواتير المشتريات.", "error");
        setIsLoading(false);
        return;
      }

      const normalizedInvoices = Array.isArray(data.purchase_invoices)
        ? data.purchase_invoices.map(normalizePurchaseInvoice)
        : [];

      setPurchaseInvoices(normalizedInvoices);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
  }

  const filteredInvoices = purchaseInvoices.filter((invoice) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      String(invoice.number).includes(keyword) ||
      invoice.supplierName.toLowerCase().includes(keyword) ||
      invoice.description.toLowerCase().includes(keyword) ||
      getPaymentLabel(invoice.paymentType).toLowerCase().includes(keyword)
    );
  });

  const selectedInvoice = purchaseInvoices.find(
    (invoice) => String(invoice.id) === String(selectedInvoiceId)
  );

  const summary = useMemo(() => {
    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const totalItems = purchaseInvoices.reduce((sum, invoice) => {
      return sum + invoice.items.length;
    }, 0);

    const creditPurchases = purchaseInvoices
      .filter((invoice) => invoice.paymentType === "credit")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const cashPurchases = purchaseInvoices
      .filter((invoice) => invoice.paymentType === "cash")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    return {
      totalPurchases,
      totalItems,
      creditPurchases,
      cashPurchases,
    };
  }, [purchaseInvoices]);

  function requestDeleteInvoice(invoice) {
    setConfirmState({
      open: true,
      invoice,
      title: `حذف فاتورة شراء رقم ${invoice.number}`,
      message:
        "هل تريد حذف فاتورة الشراء؟ ملاحظة: حذف الفاتورة لا ينقص المخزون تلقائيًا.",
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
      showToast("لم يتم العثور على فاتورة الشراء المطلوبة.", "error");
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/purchase-invoices/${invoice.id}`,
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
        showToast(data.message || "تعذر حذف فاتورة الشراء.", "error");
        cancelDeleteInvoice();
        return;
      }

      const updatedVisibleInvoices = purchaseInvoices.filter((item) => {
        return String(item.id) !== String(invoice.id);
      });

      setPurchaseInvoices(updatedVisibleInvoices);

      if (String(selectedInvoiceId) === String(invoice.id)) {
        setSelectedInvoiceId(null);
      }

      cancelDeleteInvoice();
      showToast(data.message || `تم حذف فاتورة الشراء رقم ${invoice.number}.`);
    } catch {
      cancelDeleteInvoice();
      showToast("تعذر الاتصال بالسيرفر أثناء حذف فاتورة الشراء.", "error");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">فواتير المشتريات</h1>
            <p className="section-subtitle">
              هنا تظهر فواتير الشراء المحفوظة في قاعدة بيانات Laravel، مع تفاصيل
              الموردين والأصناف والإجماليات.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الفواتير</span>
              <strong>{purchaseInvoices.length}</strong>
            </div>

            <div>
              <span>إجمالي المشتريات</span>
              <strong>{formatCurrency(summary.totalPurchases)}</strong>
            </div>
          </div>
        </div>

        <div className="purchase-invoices-summary">
          <div className="purchase-invoice-summary-card">
            <ShoppingBag size={26} />
            <span>عدد فواتير الشراء</span>
            <strong>{purchaseInvoices.length}</strong>
          </div>

          <div className="purchase-invoice-summary-card">
            <PackageCheck size={26} />
            <span>عدد الأصناف المشتراة</span>
            <strong>{summary.totalItems}</strong>
          </div>

          <div className="purchase-invoice-summary-card">
            <Wallet size={26} />
            <span>شراء نقدي</span>
            <strong>{formatCurrency(summary.cashPurchases)}</strong>
          </div>

          <div className="purchase-invoice-summary-card">
            <Building2 size={26} />
            <span>شراء آجل</span>
            <strong>{formatCurrency(summary.creditPurchases)}</strong>
          </div>
        </div>

        <div className="purchase-invoices-layout">
          <div className="purchase-invoices-list-card">
            <div className="purchase-invoices-list-header">
              <div>
                <h2>قائمة فواتير الشراء</h2>
                <p>ابحث واعرض تفاصيل أي فاتورة شراء محفوظة.</p>
              </div>

              <button
                type="button"
                className="secondary-btn"
                onClick={loadPurchaseInvoices}
              >
                <RefreshCcw size={18} />
                تحديث
              </button>

              <div className="purchase-invoices-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="empty-search">
                جاري تحميل فواتير المشتريات من السيرفر...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="empty-search">
                لا توجد فواتير مشتريات مطابقة للبحث الحالي.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>المورد</th>
                      <th>الدفع</th>
                      <th>الأصناف</th>
                      <th>الإجمالي</th>
                      <th>البيان</th>
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
                        <td>#{invoice.number}</td>
                        <td>{invoice.date}</td>
                        <td>
                          <strong>{invoice.supplierName}</strong>
                        </td>
                        <td>
                          <span
                            className={
                              invoice.paymentType === "credit"
                                ? "purchase-payment-badge credit"
                                : "purchase-payment-badge cash"
                            }
                          >
                            {getPaymentLabel(invoice.paymentType)}
                          </span>
                        </td>
                        <td>{invoice.items.length}</td>
                        <td>
                          <strong>{formatCurrency(invoice.total)}</strong>
                        </td>
                        <td>{invoice.description}</td>
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

          <div className="purchase-invoice-details-card">
            {!selectedInvoice ? (
              <div className="empty-details">
                <ShoppingBag size={42} />
                <h2>تفاصيل فاتورة الشراء</h2>
                <p>اضغط على زر العين بجانب أي فاتورة لعرض تفاصيلها هنا.</p>
              </div>
            ) : (
              <>
                <div className="purchase-invoice-details-header">
                  <div>
                    <h2>فاتورة شراء رقم #{selectedInvoice.number}</h2>
                    <p>{selectedInvoice.description}</p>
                  </div>

                  <span
                    className={
                      selectedInvoice.paymentType === "credit"
                        ? "purchase-payment-badge credit"
                        : "purchase-payment-badge cash"
                    }
                  >
                    {getPaymentLabel(selectedInvoice.paymentType)}
                  </span>
                </div>

                <div className="purchase-invoice-meta-grid">
                  <div>
                    <CalendarDays size={18} />
                    <span>التاريخ</span>
                    <strong>{selectedInvoice.date}</strong>
                  </div>

                  <div>
                    <Building2 size={18} />
                    <span>المورد</span>
                    <strong>{selectedInvoice.supplierName}</strong>
                  </div>

                  <div>
                    <Wallet size={18} />
                    <span>إجمالي الفاتورة</span>
                    <strong>{formatCurrency(selectedInvoice.total)}</strong>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>م</th>
                        <th>الصنف</th>
                        <th>التصنيف</th>
                        <th>الكمية</th>
                        <th>سعر الشراء</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map((item, index) => {
                        const quantity = Number(item.quantity || 0);
                        const unitCost = Number(item.unitCost || 0);
                        const lineTotal = Number(item.total || quantity * unitCost);

                        return (
                          <tr key={item.id ?? index}>
                            <td>{index + 1}</td>

                            <td>
                              <strong>{item.productName}</strong>
                            </td>

                            <td>{item.category}</td>

                            <td>{quantity}</td>

                            <td>{formatCurrency(unitCost)}</td>

                            <td>
                              <strong>{formatCurrency(lineTotal)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="purchase-invoice-totals-grid">
                  <div>
                    <span>عدد الأصناف</span>
                    <strong>{selectedInvoice.items.length}</strong>
                  </div>

                  <div>
                    <span>طريقة الدفع</span>
                    <strong>{getPaymentLabel(selectedInvoice.paymentType)}</strong>
                  </div>

                  <div>
                    <span>الإجمالي</span>
                    <strong>{formatCurrency(selectedInvoice.total)}</strong>
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

export default PurchaseInvoicesPage;