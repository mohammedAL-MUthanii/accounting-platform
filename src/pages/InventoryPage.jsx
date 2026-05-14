import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Save,
  XCircle,
  Search,
  Boxes,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function normalizeProduct(product) {
  const purchasePrice = Number(product.cost_price ?? product.purchasePrice ?? 0);
  const sellingPrice = Number(product.sale_price ?? product.sellingPrice ?? 0);
  const quantity = Number(product.quantity ?? 0);

  return {
    ...product,
    purchasePrice,
    sellingPrice,
    quantity,
    costPrice: purchasePrice,
    salePrice: sellingPrice,
    stock: quantity,
    unit: product.unit ?? "قطعة",
  };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    productId: null,
    title: "",
    message: "",
    confirmText: "موافق",
    danger: false,
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    quantity: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function openConfirm({
    type,
    productId = null,
    title,
    message,
    confirmText,
    danger,
  }) {
    setConfirmState({
      open: true,
      type,
      productId,
      title,
      message,
      confirmText,
      danger,
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      type: "",
      productId: null,
      title: "",
      message: "",
      confirmText: "موافق",
      danger: false,
    });
  }

  async function loadProducts() {
    setIsLoading(true);

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
        setIsLoading(false);
        return;
      }

      const normalizedProducts = Array.isArray(data.products)
        ? data.products.map(normalizeProduct)
        : [];

      setProducts(normalizedProducts);
    } catch {
      showToast(
        "تعذر الاتصال بالسيرفر. تأكد أن Laravel يعمل على http://127.0.0.1:8000",
        "error"
      );
    }

    setIsLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  function resetForm() {
    setForm({
      name: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      quantity: "",
    });

    setEditingId(null);
  }

  function validateForm() {
    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.purchasePrice ||
      !form.sellingPrice ||
      form.quantity === ""
    ) {
      showToast("رجاءً املأ جميع حقول المنتج.", "warning");
      return false;
    }

    if (Number(form.purchasePrice) <= 0 || Number(form.sellingPrice) <= 0) {
      showToast("أسعار الشراء والبيع يجب أن تكون أكبر من صفر.", "warning");
      return false;
    }

    if (Number(form.quantity) < 0) {
      showToast("الكمية لا يمكن أن تكون أقل من صفر.", "warning");
      return false;
    }

    return true;
  }

  function makeProductPayload() {
    const currentProduct = products.find((product) => product.id === editingId);

    return {
      code:
        currentProduct?.code ||
        `P-${Date.now().toString().slice(-6)}`,
      name: form.name.trim(),
      category: form.category.trim(),
      cost_price: Number(form.purchasePrice),
      sale_price: Number(form.sellingPrice),
      quantity: Number(form.quantity),
    };
  }

  async function saveProduct(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const token = getAuthToken();
      const payload = makeProductPayload();

      const url = editingId
        ? `${API_BASE_URL}/products/${editingId}`
        : `${API_BASE_URL}/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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
          data?.errors?.code?.[0] ||
          data?.errors?.name?.[0] ||
          data?.errors?.category?.[0] ||
          data?.errors?.cost_price?.[0] ||
          data?.errors?.sale_price?.[0] ||
          data?.errors?.quantity?.[0] ||
          data?.message;

        showToast(firstError || "تعذر حفظ المنتج.", "error");
        setIsSaving(false);
        return;
      }

      const normalizedProduct = normalizeProduct(data.product);

      if (editingId) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === editingId ? normalizedProduct : product
          )
        );

        showToast(data.message || "تم تحديث المنتج بنجاح.");
      } else {
        setProducts((prevProducts) => [normalizedProduct, ...prevProducts]);
        showToast(data.message || "تمت إضافة المنتج بنجاح.");
      }

      resetForm();
    } catch {
      showToast("تعذر الاتصال بالسيرفر أثناء حفظ المنتج.", "error");
    }

    setIsSaving(false);
  }

  function startEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category || "",
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteProduct(id) {
    const product = products.find((item) => item.id === id);

    if (!product) return;

    openConfirm({
      type: "delete",
      productId: id,
      title: "حذف منتج",
      message: `هل تريد حذف المنتج "${product.name}"؟`,
      confirmText: "نعم، حذف",
      danger: true,
    });
  }

  async function confirmAction() {
    if (confirmState.type !== "delete") return;

    const product = products.find((item) => item.id === confirmState.productId);

    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/products/${confirmState.productId}`,
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
        showToast(data.message || "تعذر حذف المنتج.", "error");
        closeConfirm();
        return;
      }

      setProducts((prevProducts) =>
        prevProducts.filter((item) => item.id !== confirmState.productId)
      );

      if (editingId === confirmState.productId) {
        resetForm();
      }

      closeConfirm();
      showToast(
        product ? `تم حذف المنتج "${product.name}" بنجاح.` : "تم حذف المنتج."
      );
    } catch {
      closeConfirm();
      showToast("تعذر الاتصال بالسيرفر أثناء حذف المنتج.", "error");
    }
  }

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();

    return (
      product.name.toLowerCase().includes(keyword) ||
      String(product.category ?? "").toLowerCase().includes(keyword) ||
      String(product.code ?? "").toLowerCase().includes(keyword)
    );
  });

  const totalStockValue = products.reduce((sum, product) => {
    return sum + Number(product.purchasePrice) * Number(product.quantity);
  }, 0);

  const totalExpectedSales = products.reduce((sum, product) => {
    return sum + Number(product.sellingPrice) * Number(product.quantity);
  }, 0);

  const expectedProfit = totalExpectedSales - totalStockValue;

  const lowStockProducts = products.filter(
    (product) => Number(product.quantity) <= 5
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">المخزون والمنتجات</h1>
            <p className="section-subtitle">
              هنا تبدأ إدارة النشاط التجاري: أضف المنتجات، تابع الكميات، واحسب
              قيمة المخزون والربح المتوقع من قاعدة بيانات Laravel.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد المنتجات</span>
              <strong>{products.length}</strong>
            </div>

            <div>
              <span>منتجات منخفضة</span>
              <strong>{lowStockProducts.length}</strong>
            </div>
          </div>
        </div>

        <div className="inventory-summary">
          <div className="inventory-summary-card">
            <Boxes size={28} />
            <span>قيمة المخزون بسعر الشراء</span>
            <strong>{formatNumber(totalStockValue)} ريال</strong>
          </div>

          <div className="inventory-summary-card">
            <TrendingUp size={28} />
            <span>قيمة البيع المتوقعة</span>
            <strong>{formatNumber(totalExpectedSales)} ريال</strong>
          </div>

          <div className="inventory-summary-card">
            <Package size={28} />
            <span>الربح المتوقع من المخزون</span>
            <strong>{formatNumber(expectedProfit)} ريال</strong>
          </div>
        </div>

        <div className="inventory-layout">
          <form className="inventory-form" onSubmit={saveProduct}>
            <div className="form-title">
              <Package size={22} />
              <h2>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
            </div>

            {editingId && (
              <div className="edit-alert">
                أنت الآن تعدل منتجًا موجودًا. بعد التعديل اضغط تحديث المنتج.
              </div>
            )}

            <label>
              اسم المنتج
              <input
                type="text"
                name="name"
                placeholder="مثال: كيبورد لاسلكي"
                value={form.name}
                onChange={handleChange}
              />
            </label>

            <label>
              التصنيف
              <input
                type="text"
                name="category"
                placeholder="مثال: ملحقات كمبيوتر"
                value={form.category}
                onChange={handleChange}
              />
            </label>

            <label>
              سعر الشراء
              <input
                type="number"
                name="purchasePrice"
                placeholder="مثال: 3500"
                value={form.purchasePrice}
                onChange={handleChange}
              />
            </label>

            <label>
              سعر البيع
              <input
                type="number"
                name="sellingPrice"
                placeholder="مثال: 5000"
                value={form.sellingPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              الكمية
              <input
                type="number"
                name="quantity"
                placeholder="مثال: 25"
                value={form.quantity}
                onChange={handleChange}
              />
            </label>

            <button className="primary-btn" disabled={isSaving}>
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {isSaving
                ? "جاري الحفظ..."
                : editingId
                ? "تحديث المنتج"
                : "إضافة المنتج"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={resetForm}
              >
                <XCircle size={18} />
                إلغاء التعديل
              </button>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={loadProducts}
            >
              <RefreshCcw size={18} />
              تحديث المنتجات من السيرفر
            </button>
          </form>

          <div className="inventory-list-card">
            <div className="inventory-list-header">
              <div>
                <h2>قائمة المنتجات</h2>
                <p>تابع الكميات والأسعار وقيمة المخزون لكل منتج.</p>
              </div>

              <div className="inventory-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ابحث عن منتج أو تصنيف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="empty-search">جاري تحميل المنتجات من السيرفر...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-search">
                لا توجد منتجات مطابقة للبحث الحالي.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>الكود</th>
                      <th>المنتج</th>
                      <th>التصنيف</th>
                      <th>سعر الشراء</th>
                      <th>سعر البيع</th>
                      <th>الكمية</th>
                      <th>قيمة المخزون</th>
                      <th>ربح الوحدة</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockValue =
                        Number(product.purchasePrice) * Number(product.quantity);

                      const unitProfit =
                        Number(product.sellingPrice) -
                        Number(product.purchasePrice);

                      return (
                        <tr
                          key={product.id}
                          className={editingId === product.id ? "editing-row" : ""}
                        >
                          <td>{product.code}</td>

                          <td>
                            <strong>{product.name}</strong>
                          </td>

                          <td>{product.category}</td>

                          <td>{formatNumber(product.purchasePrice)} ريال</td>

                          <td>{formatNumber(product.sellingPrice)} ريال</td>

                          <td>
                            <span
                              className={
                                product.quantity <= 5
                                  ? "stock-badge low"
                                  : "stock-badge good"
                              }
                            >
                              {product.quantity}
                            </span>
                          </td>

                          <td>{formatNumber(stockValue)} ريال</td>

                          <td>
                            <span
                              className={
                                unitProfit >= 0 ? "profit-badge" : "loss-badge"
                              }
                            >
                              {formatNumber(unitProfit)} ريال
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() => startEdit(product)}
                                title="تعديل المنتج"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => deleteProduct(product.id)}
                                title="حذف المنتج"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />

      <AppConfirm
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText="إلغاء"
        danger={confirmState.danger}
        onConfirm={confirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default InventoryPage;