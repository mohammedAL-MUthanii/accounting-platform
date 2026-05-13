import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Search, Receipt } from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const PRODUCT_STORAGE_KEYS = [
  "mohasbti_products",
  "accounting_products",
  "products",
];

const INVOICES_KEY = "mohasbti_sales_invoices";
const JOURNAL_KEY = "journalEntries";

const demoProducts = [
  {
    id: 1,
    code: "P-1001",
    name: "كيبورد لاسلكي Max موديل 1321",
    salePrice: 8400,
    costPrice: 6200,
    stock: 25,
    unit: "قطعة",
    category: "إلكترونيات",
  },
  {
    id: 2,
    code: "P-1002",
    name: "ماوس ضوئي Pro موديل 450",
    salePrice: 3200,
    costPrice: 2100,
    stock: 40,
    unit: "قطعة",
    category: "إلكترونيات",
  },
  {
    id: 3,
    code: "P-1003",
    name: "شاشة اقتصادية YemenTech موديل 1018",
    salePrice: 156000,
    costPrice: 118000,
    stock: 12,
    unit: "قطعة",
    category: "إلكترونيات",
  },
  {
    id: 4,
    code: "P-1004",
    name: "هارد SSD سعة 512GB",
    salePrice: 28500,
    costPrice: 21400,
    stock: 30,
    unit: "قطعة",
    category: "إلكترونيات",
  },
  {
    id: 5,
    code: "P-1005",
    name: "سماعة رأس Comfort X",
    salePrice: 9700,
    costPrice: 6400,
    stock: 20,
    unit: "قطعة",
    category: "إلكترونيات",
  },
];

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

function getProductStorage() {
  for (const key of PRODUCT_STORAGE_KEYS) {
    const items = readArray(key);

    if (items.length > 0) {
      return { key, items };
    }
  }

  writeArray(PRODUCT_STORAGE_KEYS[0], demoProducts);
  return { key: PRODUCT_STORAGE_KEYS[0], items: demoProducts };
}

function normalizeProduct(product, index) {
  const costPrice = Number(
    product.costPrice ??
      product.purchasePrice ??
      product.cost ??
      product.cost_price ??
      0
  );

  const salePrice = Number(
    product.salePrice ??
      product.sellingPrice ??
      product.price ??
      product.sale_price ??
      0
  );

  const stock = Number(product.stock ?? product.quantity ?? product.qty ?? 0);

  return {
    id: product.id ?? index + 1,
    code: product.code ?? `P-${product.id ?? index + 1000}`,
    name: product.name ?? product.title ?? "منتج بدون اسم",
    salePrice,
    costPrice,
    stock,
    unit: product.unit ?? "قطعة",
    category: product.category ?? "عام",
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

function getNextInvoiceNumber() {
  const invoices = readArray(INVOICES_KEY);

  if (!invoices.length) return 1;

  const maxNo = Math.max(
    ...invoices.map((item) => Number(item.invoiceNumber || 0))
  );

  return maxNo + 1;
}

export default function POSPage() {
  const [productStorageKey, setProductStorageKey] = useState(
    PRODUCT_STORAGE_KEYS[0]
  );
  const [products, setProducts] = useState([]);
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

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    type: "",
  });

  useEffect(() => {
    const storage = getProductStorage();
    setProductStorageKey(storage.key);
    setProducts(storage.items.map(normalizeProduct));
    setInvoiceNumber(getNextInvoiceNumber());
  }, []);

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

  function handleSaveInvoice() {
    if (!validateInvoice()) return;

    const updatedProducts = products.map((product) => {
      const line = cartItems.find(
        (item) => String(item.productId) === String(product.id)
      );

      const newStock = line
        ? Number(product.stock) - Number(line.qty)
        : Number(product.stock);

      return {
        ...product,

        // صيغة نقطة البيع
        stock: newStock,
        salePrice: Number(product.salePrice),
        costPrice: Number(product.costPrice),

        // صيغة صفحة المخزون
        quantity: newStock,
        sellingPrice: Number(product.salePrice),
        purchasePrice: Number(product.costPrice),
      };
    });

    const invoiceLines = cartItems.map((item, index) => {
      const calc = calculateLine(item);

      return {
        rowNo: index + 1,
        productId: item.productId,
        code: item.code,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        discountPercent: item.discountPercent,
        discountValue: item.discountValue,
        gross: calc.gross,
        net: calc.net,
        totalCost: calc.totalCost,
        totalProfit: calc.totalProfit,
      };
    });

    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: invoiceDate,
      customerName: customerName.trim(),
      currency,
      exchangeRate,
      paymentMethod,
      description,
      totals,
      lines: invoiceLines,
      createdAt: new Date().toISOString(),
    };

    const storedInvoices = readArray(INVOICES_KEY);
    writeArray(INVOICES_KEY, [invoice, ...storedInvoices]);

    writeArray(productStorageKey, updatedProducts);

    const storedEntries = readArray(JOURNAL_KEY);

    const newEntry = {
      id: `entry-${Date.now()}`,
      date: invoiceDate,
      description: `فاتورة بيع رقم ${invoiceNumber}`,
      debitAccount: paymentMethod === "آجل" ? "العملاء" : "الصندوق",
      creditAccount: "المبيعات",
      amount: totals.net,
      source: "POS",
      invoiceNumber,
    };

    writeArray(JOURNAL_KEY, [newEntry, ...storedEntries]);

    setProducts(updatedProducts);
    setCartItems([]);
    setExpandedLineId(null);
    setInvoiceNumber(getNextInvoiceNumber());
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setCustomerName("عميل نقدي");
    setCurrency("ريال");
    setExchangeRate(1);
    setPaymentMethod("نقداً");
    setDescription("فاتورة بيع");

    showToast(
      `تم حفظ فاتورة البيع رقم ${invoiceNumber} وتحديث المخزون وتوليد القيد بنجاح.`
    );
  }

  return (
    <div className="pos-v3-page">
      <div className="pos-v3-header">
        <div>
          <h1>نقطة البيع POS</h1>
          <p>
            فاتورة موحدة داخل جدول واحد، مع إمكانية إضافة عدة أصناف وإظهار
            التكلفة والربح داخل الصف عند الضغط على السعر.
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
              <option value="">اختر المنتج</option>
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
          >
            <Save size={18} />
            حفظ الفاتورة
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