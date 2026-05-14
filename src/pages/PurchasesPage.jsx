import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  Search,
  PackagePlus,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
}

function normalizeProduct(product) {
  const purchasePrice = Number(product.cost_price ?? product.purchasePrice ?? 0);
  const sellingPrice = Number(product.sale_price ?? product.sellingPrice ?? 0);
  const quantity = Number(product.quantity ?? product.stock ?? 0);

  return {
    ...product,
    purchasePrice,
    sellingPrice,
    quantity,
    costPrice: purchasePrice,
    salePrice: sellingPrice,
    stock: quantity,
  };
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
    date: invoice.invoice_date || invoice.created_at?.slice(0, 10),
    supplierName: invoice.supplier_name,
    paymentType: invoice.payment_type,
    items,
    total: Number(invoice.total || 0),
    createdAt: invoice.created_at,
  };
}

function PurchasesPage() {
  const [products, setProducts] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    type: "",
  });

  const [invoiceInfo, setInvoiceInfo] = useState({
    supplierName: "",
    date: new Date().toISOString().slice(0, 10),
    paymentType: "cash",
    description: "فاتورة شراء بضاعة",
  });

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setIsLoading(true);

    await Promise.all([loadProducts(), loadPurchaseInvoices()]);

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
        showToast(data.message || "تعذر تحميل المنتجات.", "error");
        return;
      }

      const normalizedProducts = Array.isArray(data.products)
        ? data.products.map(normalizeProduct)
        : [];

      setProducts(normalizedProducts);
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء تحميل المنتجات.", "error");
    }
  }

  async function loadPurchaseInvoices() {
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
        showToast(data.message || "تعذر تحميل فواتير الشراء.", "error");
        return;
      }

      const normalizedInvoices = Array.isArray(data.purchase_invoices)
        ? data.purchase_invoices.map(normalizePurchaseInvoice)
        : [];

      setPurchaseInvoices(normalizedInvoices);
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء تحميل فواتير الشراء.", "error");
    }
  }

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      product.name.toLowerCase().includes(keyword) ||
      String(product.category ?? "").toLowerCase().includes(keyword) ||
      String(product.code ?? "").toLowerCase().includes(keyword) ||
      String(product.id).includes(keyword)
    );
  });

  const selectedProduct = products.find(
    (product) => String(product.id) === String(selectedProductId)
  );

  const totalPurchase = useMemo(() => {
    return purchaseItems.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unitCost);
    }, 0);
  }, [purchaseItems]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function handleInvoiceChange(e) {
    const { name, value } = e.target;

    setInvoiceInfo({
      ...invoiceInfo,
      [name]: value,
    });
  }

  function handleProductSelect(e) {
    const productId = e.target.value;
    setSelectedProductId(productId);

    const product = products.find(
      (item) => String(item.id) === String(productId)
    );

    if (product) {
      setUnitCost(product.purchasePrice || product.costPrice || 0);
    } else {
      setUnitCost("");
    }
  }

  function addItem() {
    if (!selectedProduct) {
      showToast("اختر المنتج أولًا قبل إضافته إلى فاتورة الشراء.", "warning");
      return;
    }

    if (Number(quantity) <= 0) {
      showToast("الكمية يجب أن تكون أكبر من صفر.", "warning");
      return;
    }

    if (Number(unitCost) <= 0) {
      showToast("سعر الشراء يجب أن يكون أكبر من صفر.", "warning");
      return;
    }

    const existingItem = purchaseItems.find(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItem) {
      const updatedItems = purchaseItems.map((item) => {
        if (item.productId === selectedProduct.id) {
          return {
            ...item,
            quantity: Number(item.quantity) + Number(quantity),
            unitCost: Number(unitCost),
          };
        }

        return item;
      });

      setPurchaseItems(updatedItems);
      showToast("تم تحديث كمية الصنف داخل فاتورة الشراء.");
    } else {
      const newItem = {
        id: Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
      };

      setPurchaseItems([...purchaseItems, newItem]);
      showToast("تمت إضافة الصنف إلى فاتورة الشراء.");
    }

    setSelectedProductId("");
    setQuantity(1);
    setUnitCost("");
  }

  function updateItem(id, field, value) {
    const updatedItems = purchaseItems.map((item) => {
      if (item.id !== id) return item;

      if (field === "quantity") {
        return {
          ...item,
          quantity: Math.max(1, Number(value || 1)),
        };
      }

      if (field === "unitCost") {
        return {
          ...item,
          unitCost: Math.max(1, Number(value || 1)),
        };
      }

      return item;
    });

    setPurchaseItems(updatedItems);
  }

  function removeItem(id) {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== id));
    showToast("تم حذف الصنف من فاتورة الشراء.", "success");
  }

  function requestClearInvoice() {
    if (purchaseItems.length === 0) {
      showToast("فاتورة الشراء فارغة بالفعل.", "warning");
      return;
    }

    setConfirmState({
      open: true,
      title: "تفريغ فاتورة الشراء",
      message: "هل تريد تفريغ كل الأصناف الموجودة في فاتورة الشراء الحالية؟",
      type: "clear",
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      type: "",
    });
  }

  function confirmAction() {
    if (confirmState.type === "clear") {
      setPurchaseItems([]);
      closeConfirm();
      showToast("تم تفريغ فاتورة الشراء بنجاح.");
    }
  }

  function validatePurchaseInvoice() {
    if (!invoiceInfo.supplierName.trim()) {
      showToast("اكتب اسم المورد قبل حفظ فاتورة الشراء.", "warning");
      return false;
    }

    if (purchaseItems.length === 0) {
      showToast("أضف صنفًا واحدًا على الأقل قبل حفظ فاتورة الشراء.", "warning");
      return false;
    }

    if (totalPurchase <= 0) {
      showToast("إجمالي فاتورة الشراء يجب أن يكون أكبر من صفر.", "warning");
      return false;
    }

    return true;
  }

  async function savePurchaseInvoice() {
    if (!validatePurchaseInvoice()) return;

    setIsSaving(true);

    try {
      const token = getAuthToken();

      const payload = {
        supplier_name: invoiceInfo.supplierName.trim(),
        payment_type: invoiceInfo.paymentType,
        invoice_date: invoiceInfo.date,
        items: purchaseItems.map((item) => ({
          product_id: item.productId,
          quantity: Number(item.quantity),
          cost_price: Number(item.unitCost),
        })),
      };

      const response = await fetch(`${API_BASE_URL}/purchase-invoices`, {
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
          data?.errors?.supplier_name?.[0] ||
          data?.errors?.payment_type?.[0] ||
          data?.errors?.invoice_date?.[0] ||
          data?.errors?.items?.[0] ||
          data?.message;

        showToast(firstError || "تعذر حفظ فاتورة الشراء.", "error");
        setIsSaving(false);
        return;
      }

      const newInvoice = normalizePurchaseInvoice(data.purchase_invoice);

      setPurchaseInvoices((prevInvoices) => [newInvoice, ...prevInvoices]);

      setPurchaseItems([]);
      setInvoiceInfo({
        supplierName: "",
        date: new Date().toISOString().slice(0, 10),
        paymentType: "cash",
        description: "فاتورة شراء بضاعة",
      });
      setSelectedProductId("");
      setQuantity(1);
      setUnitCost("");

      await loadProducts();

      showToast(data.message || "تم حفظ فاتورة الشراء وتحديث المخزون بنجاح.");
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء حفظ فاتورة الشراء.", "error");
    }

    setIsSaving(false);
  }

  const totalPurchasedItems = purchaseInvoices.reduce((sum, invoice) => {
    return sum + (invoice.items?.length || 0);
  }, 0);

  const totalPurchasesAmount = purchaseInvoices.reduce((sum, invoice) => {
    return sum + Number(invoice.total || 0);
  }, 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">المشتريات</h1>
            <p className="section-subtitle">
              سجّل فواتير شراء البضاعة من الموردين، وسيتم تحديث المخزون في قاعدة
              بيانات Laravel تلقائيًا.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد فواتير الشراء</span>
              <strong>{purchaseInvoices.length}</strong>
            </div>

            <div>
              <span>إجمالي المشتريات</span>
              <strong>{formatCurrency(totalPurchasesAmount)}</strong>
            </div>
          </div>
        </div>

        {products.length === 0 && !isLoading && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              لا توجد منتجات في قاعدة البيانات. افتح صفحة المخزون أو شغّل
              ProductSeeder من Laravel لإضافة منتجات تجريبية.
            </span>
          </div>
        )}

        <div className="purchases-summary">
          <div className="purchase-summary-card">
            <ShoppingBag size={28} />
            <span>عدد فواتير الشراء</span>
            <strong>{purchaseInvoices.length}</strong>
          </div>

          <div className="purchase-summary-card">
            <PackagePlus size={28} />
            <span>عدد الأصناف المشتراة</span>
            <strong>{totalPurchasedItems}</strong>
          </div>

          <div className="purchase-summary-card">
            <ShoppingBag size={28} />
            <span>إجمالي المشتريات</span>
            <strong>{formatCurrency(totalPurchasesAmount)}</strong>
          </div>
        </div>

        <div className="purchase-window">
          <div className="purchase-header">
            <div className="form-title">
              <ShoppingBag size={22} />
              <h2>فاتورة شراء جديدة</h2>
            </div>

            <button type="button" className="secondary-btn" onClick={loadPageData}>
              <RefreshCcw size={18} />
              تحديث البيانات من السيرفر
            </button>

            <div className="purchase-info-grid">
              <label>
                المورد
                <input
                  type="text"
                  name="supplierName"
                  placeholder="مثال: مورد الإلكترونيات"
                  value={invoiceInfo.supplierName}
                  onChange={handleInvoiceChange}
                />
              </label>

              <label>
                التاريخ
                <input
                  type="date"
                  name="date"
                  value={invoiceInfo.date}
                  onChange={handleInvoiceChange}
                />
              </label>

              <label>
                طريقة الدفع
                <select
                  name="paymentType"
                  value={invoiceInfo.paymentType}
                  onChange={handleInvoiceChange}
                >
                  <option value="cash">نقدًا</option>
                  <option value="credit">آجل</option>
                </select>
              </label>

              <label>
                البيان
                <input
                  type="text"
                  name="description"
                  value={invoiceInfo.description}
                  onChange={handleInvoiceChange}
                />
              </label>
            </div>
          </div>

          <div className="purchase-add-row">
            <div className="purchase-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث عن منتج أو تصنيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select value={selectedProductId} onChange={handleProductSelect}>
              <option value="">اختر المنتج</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - المتاح: {product.quantity}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              placeholder="الكمية"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <input
              type="number"
              min="1"
              placeholder="سعر الشراء"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />

            <button type="button" className="primary-btn" onClick={addItem}>
              <Plus size={18} />
              إضافة
            </button>
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
                  <th>إجراء</th>
                </tr>
              </thead>

              <tbody>
                {purchaseItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-search">
                      لا توجد أصناف في فاتورة الشراء حتى الآن.
                    </td>
                  </tr>
                ) : (
                  purchaseItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong>{item.productName}</strong>
                      </td>

                      <td>{item.category}</td>

                      <td>
                        <input
                          className="purchase-table-input"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="purchase-table-input"
                          type="number"
                          min="1"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(item.id, "unitCost", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(item.quantity * item.unitCost)}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="purchase-footer">
            <div className="purchase-total-box">
              <span>إجمالي فاتورة الشراء</span>
              <strong>{formatCurrency(totalPurchase)}</strong>
            </div>

            <div className="purchase-actions">
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
                onClick={savePurchaseInvoice}
                disabled={isSaving}
              >
                <Save size={18} />
                {isSaving ? "جاري الحفظ..." : "حفظ فاتورة الشراء"}
              </button>
            </div>
          </div>
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

export default PurchasesPage;