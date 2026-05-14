import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Search,
  Receipt,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function normalizeProduct(product) {
  const costPrice = Number(product.cost_price ?? product.costPrice ?? 0);
  const salePrice = Number(product.sale_price ?? product.salePrice ?? 0);
  const stock = Number(product.quantity ?? product.stock ?? 0);

  return {
    id: product.id,
    code: product.code ?? `P-${product.id}`,
    name: product.name ?? "منتج بدون اسم",
    salePrice,
    costPrice,
    stock,
    unit: product.unit ?? "قطعة",
    category: product.category ?? "عام",
  };
}

function normalizeSalesInvoice(invoice) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.id,
    date: invoice.invoice_date || invoice.created_at?.slice(0, 10),
    customerName: invoice.customer_name,
    paymentMethod: invoice.payment_type === "credit" ? "آجل" : "نقداً",
    totals: {
      gross: Number(invoice.gross_total || 0),
      discount: Number(invoice.discount_total || 0),
      net: Number(invoice.net_total || 0),
    },
  };
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ar-YE")} ريال`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateLine(item) {
  const qty = Number(item.qty || 0);
  const unitPrice = Number(item.unitPrice || 0);
  const costPrice = Number(item.costPrice || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const discountValue = Number(item.discountValue || 0);

  const gross = qty * unitPrice;
  const percentDiscount = gross * (discountPercent / 100);
  const totalDiscount = Math.min(gross, percentDiscount + discountValue);
  const net = gross - totalDiscount;
  const totalCost = qty * costPrice;
  const profitPerUnit = unitPrice - costPrice;
  const totalProfit = net - totalCost;

  return {
    gross,
    totalDiscount,
    net,
    totalCost,
    profitPerUnit,
    totalProfit,
  };
}

function getPaymentType(method) {
  return method === "آجل" ? "credit" : "cash";
}

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [customerName, setCustomerName] = useState("عميل نقدي");
  const [currency, setCurrency] = useState("ريال");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("نقداً");
  const [description, setDescription] = useState("فاتورة بيع");

  const [cartItems, setCartItems] = useState([]);
  const [expandedLineId, setExpandedLineId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    type: "",
  });

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setIsLoading(true);

    await Promise.all([loadProducts(), loadSalesInvoices()]);

    setIsLoading(false);
  }

  async function loadProducts() {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحميل المنتجات من السيرفر.", "error");
        return;
      }

      const normalizedProducts = Array.isArray(data.products)
        ? data.products.map(normalizeProduct)
        : [];

      setProducts(normalizedProducts);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر أثناء تحميل المنتجات. تأكد أن Laravel يعمل.",
        "error"
      );
    }
  }

  async function loadSalesInvoices() {
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
        showToast(data.message || "تعذر تحميل فواتير البيع.", "error");
        return;
      }

      const normalizedInvoices = Array.isArray(data.sales_invoices)
        ? data.sales_invoices.map(normalizeSalesInvoice)
        : [];

      setSalesInvoices(normalizedInvoices);

      const nextNumber =
        normalizedInvoices.length > 0
          ? Math.max(...normalizedInvoices.map((item) => Number(item.id || 0))) + 1
          : 1;

      setInvoiceNumber(nextNumber);
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء تحميل فواتير البيع.", "error");
    }
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.code.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    return products.find((item) => String(item.id) === String(selectedProductId));
  }, [products, selectedProductId]);

  const totals = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        const calc = calculateLine(item);

        acc.gross += calc.gross;
        acc.discount += calc.totalDiscount;
        acc.net += calc.net;

        return acc;
      },
      {
        gross: 0,
        discount: 0,
        net: 0,
      }
    );
  }, [cartItems]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      type: "",
    });
  }

  function handleAddItem() {
    if (!selectedProductId) {
      showToast("اختر المنتج أولًا.", "warning");
      return;
    }

    const product = products.find(
      (item) => String(item.id) === String(selectedProductId)
    );

    if (!product) {
      showToast("المنتج غير موجود.", "error");
      return;
    }

    const qty = Number(quantityToAdd || 0);

    if (qty <= 0) {
      showToast("أدخل كمية صحيحة أكبر من صفر.", "warning");
      return;
    }

    if (qty > product.stock) {
      showToast(
        `الكمية المطلوبة أكبر من المخزون المتاح (${product.stock}).`,
        "warning"
      );
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => String(item.productId) === String(product.id)
    );

    if (existingItemIndex !== -1) {
      const currentItem = cartItems[existingItemIndex];
      const newQty = Number(currentItem.qty) + qty;

      if (newQty > product.stock) {
        showToast(
          `لا يمكن تجاوز المخزون المتاح لهذا المنتج (${product.stock}).`,
          "warning"
        );
        return;
      }

      const updated = [...cartItems];

      updated[existingItemIndex] = {
        ...updated[existingItemIndex],
        qty: newQty,
      };

      setCartItems(updated);
      showToast("تم تحديث كمية الصنف داخل الفاتورة.");
    } else {
      const newItem = {
        lineId: `line-${Date.now()}-${Math.random()}`,
        productId: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        availableStock: product.stock,
        qty,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        discountPercent: 0,
        discountValue: 0,
      };

      setCartItems((prev) => [...prev, newItem]);
      showToast("تمت إضافة الصنف إلى الفاتورة.");
    }

    setSelectedProductId("");
    setQuantityToAdd(1);
    setSearchTerm("");
  }

  function handleRemoveItem(lineId) {
    setCartItems((prev) => prev.filter((item) => item.lineId !== lineId));

    if (expandedLineId === lineId) {
      setExpandedLineId(null);
    }

    showToast("تم حذف الصنف من الفاتورة.");
  }

  function handleItemChange(lineId, field, value) {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.lineId !== lineId) return item;

        const next = { ...item };

        if (field === "qty") {
          next.qty = clamp(Number(value || 1), 1, item.availableStock || 999999);
        }

        if (field === "unitPrice") {
          next.unitPrice = Math.max(0, Number(value || 0));
        }

        if (field === "discountPercent") {
          next.discountPercent = clamp(Number(value || 0), 0, 100);
        }

        if (field === "discountValue") {
          const gross =
            Number(next.qty || item.qty) *
            Number(next.unitPrice || item.unitPrice);

          next.discountValue = clamp(Number(value || 0), 0, gross);
        }

        return next;
      })
    );
  }

  function requestClearInvoice() {
    if (cartItems.length === 0) {
      showToast("الفاتورة فارغة بالفعل.", "warning");
      return;
    }

    setConfirmState({
      open: true,
      title: "تفريغ فاتورة البيع",
      message:
        "هل تريد حذف كل الأصناف من فاتورة البيع الحالية؟ لن يتم حفظ أي صنف موجود في السلة.",
      type: "clear",
    });
  }

  function confirmAction() {
    if (confirmState.type === "clear") {
      setCartItems([]);
      setExpandedLineId(null);
      closeConfirm();
      showToast("تم تفريغ فاتورة البيع بنجاح.");
    }
  }

  function validateInvoice() {
    if (!customerName.trim()) {
      showToast("اكتب اسم العميل قبل حفظ الفاتورة.", "warning");
      return false;
    }

    if (cartItems.length === 0) {
      showToast("أضف صنفًا واحدًا على الأقل قبل حفظ الفاتورة.", "warning");
      return false;
    }

    if (totals.net <= 0) {
      showToast("صافي الفاتورة يجب أن يكون أكبر من صفر.", "warning");
      return false;
    }

    const productMap = new Map(
      products.map((product) => [String(product.id), { ...product }])
    );

    for (const item of cartItems) {
      const product = productMap.get(String(item.productId));

      if (!product) {
        showToast(`المنتج ${item.name} غير موجود.`, "error");
        return false;
      }

      if (Number(item.qty) > Number(product.stock)) {
        showToast(
          `الكمية المطلوبة من "${item.name}" أكبر من المخزون الحالي.`,
          "warning"
        );
        return false;
      }

      if (Number(item.unitPrice) <= 0) {
        showToast(`سعر بيع "${item.name}" يجب أن يكون أكبر من صفر.`, "warning");
        return false;
      }
    }

    return true;
  }

  async function handleSaveInvoice() {
    if (!validateInvoice()) return;

    setIsSaving(true);

    try {
      const token = getAuthToken();

      const payload = {
        customer_name: customerName.trim(),
        payment_type: getPaymentType(paymentMethod),
        invoice_date: invoiceDate,
        items: cartItems.map((item) => ({
          product_id: item.productId,
          quantity: Number(item.qty),
          sale_price: Number(item.unitPrice),
          discount_percent: Number(item.discountPercent || 0),
          discount_value: Number(item.discountValue || 0),
        })),
      };

      const response = await fetch(`${API_BASE_URL}/sales-invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const firstError =
          data?.errors?.customer_name?.[0] ||
          data?.errors?.payment_type?.[0] ||
          data?.errors?.invoice_date?.[0] ||
          data?.errors?.items?.[0] ||
          data?.message;

        showToast(firstError || "تعذر حفظ فاتورة البيع.", "error");
        setIsSaving(false);
        return;
      }

      const savedInvoice = normalizeSalesInvoice(data.sales_invoice);

      setSalesInvoices((prevInvoices) => [savedInvoice, ...prevInvoices]);

      setCartItems([]);
      setExpandedLineId(null);
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setCustomerName("عميل نقدي");
      setCurrency("ريال");
      setExchangeRate(1);
      setPaymentMethod("نقداً");
      setDescription("فاتورة بيع");

      await Promise.all([loadProducts(), loadSalesInvoices()]);

      showToast(data.message || "تم حفظ فاتورة البيع وتحديث المخزون بنجاح.");
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء حفظ فاتورة البيع.", "error");
    }

    setIsSaving(false);
  }

  return (
    <div className="pos-v3-page">
      <div className="pos-v3-header">
        <div>
          <h1>نقطة البيع POS</h1>
          <p>
            فاتورة بيع مرتبطة الآن بقاعدة البيانات، تحفظ الفاتورة وتنقص المخزون
            من Laravel تلقائيًا.
          </p>
        </div>

        <div className="pos-v3-stats">
          <div className="stat-card">
            <span>رقم الفاتورة</span>
            <strong>{invoiceNumber}</strong>
          </div>

          <div className="stat-card">
            <span>عدد الأصناف</span>
            <strong>{cartItems.length}</strong>
          </div>

          <div className="stat-card">
            <span>الصافي</span>
            <strong>{formatCurrency(totals.net)}</strong>
          </div>
        </div>
      </div>

      <div className="pos-v3-card">
        <div className="pos-v3-card-title">
          <div className="title-right">
            <Receipt size={20} />
            <h2>فاتورة بيع</h2>
          </div>

          <button type="button" className="secondary-btn" onClick={loadPageData}>
            <RefreshCcw size={18} />
            تحديث من السيرفر
          </button>
        </div>

        <div className="pos-v3-top-grid">
          <div className="field-group">
            <label>العميل</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>العملة</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>المعادل</label>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value || 1))}
            />
          </div>

          <div className="field-group">
            <label>طريقة الدفع</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="نقداً">نقداً</option>
              <option value="شبكة">شبكة</option>
              <option value="آجل">آجل</option>
            </select>
          </div>

          <div className="field-group">
            <label>التاريخ</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>البيان</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="pos-v3-add-area">
          <div className="field-group search-box">
            <label>بحث سريع</label>
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث باسم المنتج أو الكود أو التصنيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>المادة / المنتج</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">
                {isLoading ? "جاري تحميل المنتجات..." : "اختر المنتج"}
              </option>

              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} | {product.name} | السعر:{" "}
                  {product.salePrice.toLocaleString("ar-YE")} | المتاح:{" "}
                  {product.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group small-field">
            <label>المتاح</label>
            <input
              type="number"
              value={selectedProduct ? selectedProduct.stock : 0}
              readOnly
            />
          </div>

          <div className="field-group small-field">
            <label>الكمية</label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(Number(e.target.value || 1))}
            />
          </div>

          <button type="button" className="add-btn" onClick={handleAddItem}>
            <Plus size={18} />
            إضافة صنف
          </button>
        </div>

        <div className="pos-v3-table-wrap">
          <table className="pos-v3-table">
            <thead>
              <tr>
                <th>م</th>
                <th>الكود</th>
                <th>اسم المادة</th>
                <th>الكمية</th>
                <th>سعر البيع</th>
                <th>الإجمالي</th>
                <th>خصم %</th>
                <th>خصم</th>
                <th>الصافي</th>
                <th>حذف</th>
              </tr>
            </thead>

            <tbody>
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-row">
                    لا توجد أصناف في الفاتورة حتى الآن.
                  </td>
                </tr>
              ) : (
                cartItems.map((item, index) => {
                  const calc = calculateLine(item);
                  const detailsOpen = expandedLineId === item.lineId;

                  return (
                    <React.Fragment key={item.lineId}>
                      <tr>
                        <td>{index + 1}</td>
                        <td className="code-cell">{item.code}</td>
                        <td className="name-cell">{item.name}</td>

                        <td>
                          <input
                            className="table-input qty-input"
                            type="number"
                            min="1"
                            max={item.availableStock}
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(
                                item.lineId,
                                "qty",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="price-toggle-btn"
                            onClick={() =>
                              setExpandedLineId((prev) =>
                                prev === item.lineId ? null : item.lineId
                              )
                            }
                            title="اضغط لإظهار التكلفة والربح"
                          >
                            {formatCurrency(item.unitPrice)}
                          </button>
                        </td>

                        <td>{formatCurrency(calc.gross)}</td>

                        <td>
                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) =>
                              handleItemChange(
                                item.lineId,
                                "discountPercent",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            value={item.discountValue}
                            onChange={(e) =>
                              handleItemChange(
                                item.lineId,
                                "discountValue",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td className="net-cell">{formatCurrency(calc.net)}</td>

                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleRemoveItem(item.lineId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {detailsOpen ? (
                        <tr className="details-row">
                          <td colSpan="10">
                            <div className="details-box">
                              <div>
                                <span>سعر التكلفة:</span>
                                <strong>{formatCurrency(item.costPrice)}</strong>
                              </div>

                              <div>
                                <span>إجمالي التكلفة:</span>
                                <strong>{formatCurrency(calc.totalCost)}</strong>
                              </div>

                              <div>
                                <span>ربح الوحدة:</span>
                                <strong>
                                  {formatCurrency(calc.profitPerUnit)}
                                </strong>
                              </div>

                              <div>
                                <span>إجمالي الربح:</span>
                                <strong>
                                  {formatCurrency(calc.totalProfit)}
                                </strong>
                              </div>

                              <div>
                                <span>المخزون المتاح:</span>
                                <strong>{item.availableStock}</strong>
                              </div>

                              <div>
                                <span>الوحدة:</span>
                                <strong>{item.unit}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pos-v3-summary">
          <div className="summary-box">
            <span>المجموع</span>
            <strong>{formatCurrency(totals.gross)}</strong>
          </div>

          <div className="summary-box">
            <span>مجموع الخصم</span>
            <strong>{formatCurrency(totals.discount)}</strong>
          </div>

          <div className="summary-box highlight">
            <span>الصافي</span>
            <strong>{formatCurrency(totals.net)}</strong>
          </div>
        </div>

        <div className="pos-v3-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={requestClearInvoice}
          >
            تفريغ الفاتورة
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={handleSaveInvoice}
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </button>
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />

      <AppConfirm
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="نعم، تفريغ"
        cancelText="إلغاء"
        danger
        onConfirm={confirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}