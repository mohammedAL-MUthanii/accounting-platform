import { useMemo, useState } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  Search,
  PackagePlus,
  AlertCircle,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const PRODUCTS_KEY = "products";
const PURCHASES_KEY = "purchaseInvoices";
const JOURNAL_KEY = "journalEntries";

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

function PurchasesPage() {
  const [products, setProducts] = useState(() => readArray(PRODUCTS_KEY));
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");

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

  const purchaseInvoices = readArray(PURCHASES_KEY);

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword) ||
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

  function savePurchaseInvoice() {
    if (!validatePurchaseInvoice()) return;

    const currentInvoices = readArray(PURCHASES_KEY);
    const currentEntries = readArray(JOURNAL_KEY);

    const invoiceNumber = currentInvoices.length + 1;
    const invoiceId = Date.now();

    const updatedProducts = products.map((product) => {
      const purchaseItem = purchaseItems.find(
        (item) => item.productId === product.id
      );

      if (!purchaseItem) return product;

      const oldQuantity = Number(product.quantity ?? product.stock ?? 0);
      const oldCost = Number(product.purchasePrice ?? product.costPrice ?? 0);
      const addedQuantity = Number(purchaseItem.quantity);
      const newCost = Number(purchaseItem.unitCost);

      const totalOldCost = oldQuantity * oldCost;
      const totalNewCost = addedQuantity * newCost;
      const newQuantity = oldQuantity + addedQuantity;

      const averageCost =
        newQuantity > 0
          ? Math.round((totalOldCost + totalNewCost) / newQuantity)
          : newCost;

      return {
        ...product,

        // صيغة صفحة المخزون
        quantity: newQuantity,
        purchasePrice: averageCost,
        sellingPrice: Number(product.sellingPrice ?? product.salePrice ?? 0),

        // صيغة نقطة البيع
        stock: newQuantity,
        costPrice: averageCost,
        salePrice: Number(product.sellingPrice ?? product.salePrice ?? 0),
      };
    });

    const newInvoice = {
      id: invoiceId,
      number: invoiceNumber,
      date: invoiceInfo.date,
      supplierName: invoiceInfo.supplierName.trim(),
      paymentType: invoiceInfo.paymentType,
      description: invoiceInfo.description || "فاتورة شراء بضاعة",
      items: purchaseItems,
      total: totalPurchase,
      createdAt: new Date().toISOString(),
    };

    const journalEntry = {
      id: invoiceId + 1,
      number: currentEntries.length + 1,
      date: invoiceInfo.date,
      debitAccount: "المخزون",
      creditAccount:
        invoiceInfo.paymentType === "cash" ? "الصندوق" : "الموردون",
      description:
        invoiceInfo.paymentType === "cash"
          ? `فاتورة شراء نقدي رقم ${invoiceNumber} - ${invoiceInfo.supplierName}`
          : `فاتورة شراء آجل رقم ${invoiceNumber} - ${invoiceInfo.supplierName}`,
      amount: totalPurchase,
      source: "purchase",
      invoiceNumber,
    };

    saveArray(PRODUCTS_KEY, updatedProducts);
    saveArray(PURCHASES_KEY, [newInvoice, ...currentInvoices]);
    saveArray(JOURNAL_KEY, [journalEntry, ...currentEntries]);

    setProducts(updatedProducts);
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

    showToast(
      `تم حفظ فاتورة الشراء رقم ${invoiceNumber} وتحديث المخزون وتوليد القيد بنجاح.`
    );
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
              سجّل فواتير شراء البضاعة من الموردين، وسيتم تحديث المخزون وتوليد
              القيد المحاسبي تلقائيًا.
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

        {products.length === 0 && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              لا توجد منتجات في المخزون. افتح صفحة المخزون واضغط توليد 500 منتج
              وهمي أولًا.
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
                  {product.name} - المتاح:{" "}
                  {product.quantity ?? product.stock ?? 0}
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
              >
                <Save size={18} />
                حفظ فاتورة الشراء
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