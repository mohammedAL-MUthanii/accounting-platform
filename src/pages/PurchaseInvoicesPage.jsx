import { useMemo, useState } from "react";
import {
  ShoppingBag,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  Building2,
  PackageCheck,
  Wallet,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const PURCHASES_KEY = "purchaseInvoices";

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

function getPaymentLabel(type) {
  if (type === "cash") return "نقدًا";
  if (type === "credit") return "آجل";
  return type;
}

function normalizePurchaseInvoice(invoice, index) {
  return {
    id: invoice.id ?? `purchase-${index}`,
    number: invoice.number ?? index + 1,
    date: invoice.date ?? "",
    supplierName: invoice.supplierName ?? "مورد غير محدد",
    paymentType: invoice.paymentType ?? "cash",
    description: invoice.description ?? "فاتورة شراء",
    items: invoice.items || [],
    total: Number(invoice.total || 0),
    createdAt: invoice.createdAt,
    original: invoice,
  };
}

function loadPurchaseInvoices() {
  const invoices = readArray(PURCHASES_KEY);

  return invoices
    .map((invoice, index) => normalizePurchaseInvoice(invoice, index))
    .sort((a, b) => Number(b.number) - Number(a.number));
}

function PurchaseInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [purchaseInvoices, setPurchaseInvoices] = useState(() =>
    loadPurchaseInvoices()
  );

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    invoice: null,
    title: "",
    message: "",
  });

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
      title: `حذف فاتورة شراء رقم ${invoice.number}`,
      message:
        "هل تريد حذف فاتورة الشراء؟ ملاحظة: لن يتم عكس أثرها من المخزون أو دفتر اليومية تلقائيًا.",
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
      showToast("لم يتم العثور على فاتورة الشراء المطلوبة.", "error");
      return;
    }

    const currentInvoices = readArray(PURCHASES_KEY);

    const updatedInvoices = currentInvoices.filter((item, index) => {
      const normalized = normalizePurchaseInvoice(item, index);
      return String(normalized.id) !== String(invoice.id);
    });

    saveArray(PURCHASES_KEY, updatedInvoices);

    const updatedVisibleInvoices = purchaseInvoices.filter((item) => {
      return String(item.id) !== String(invoice.id);
    });

    setPurchaseInvoices(updatedVisibleInvoices);

    if (String(selectedInvoiceId) === String(invoice.id)) {
      setSelectedInvoiceId(null);
    }

    cancelDeleteInvoice();
    showToast(`تم حذف فاتورة الشراء رقم ${invoice.number} بنجاح.`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">فواتير المشتريات</h1>
            <p className="section-subtitle">
              هنا تظهر فواتير الشراء المحفوظة من صفحة المشتريات، مع تفاصيل
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

            {filteredInvoices.length === 0 ? (
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
                        const lineTotal = quantity * unitCost;

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