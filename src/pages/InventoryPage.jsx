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
} from "lucide-react";

import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

const productTemplates = [
  { name: "كيبورد لاسلكي", category: "ملحقات كمبيوتر", min: 2500, max: 7000 },
  { name: "كيبورد ميكانيكي", category: "ملحقات كمبيوتر", min: 7000, max: 24000 },
  { name: "ماوس Gaming", category: "ملحقات كمبيوتر", min: 1800, max: 6500 },
  { name: "ماوس لاسلكي", category: "ملحقات كمبيوتر", min: 1500, max: 5500 },
  { name: "سماعة رأس", category: "صوتيات", min: 3500, max: 18000 },
  { name: "سماعات بلوتوث", category: "صوتيات", min: 4500, max: 25000 },
  { name: "ميكروفون USB", category: "صوتيات", min: 9000, max: 40000 },
  { name: "فلاش USB 32GB", category: "تخزين", min: 1000, max: 3500 },
  { name: "فلاش USB 64GB", category: "تخزين", min: 1500, max: 5000 },
  { name: "فلاش USB 128GB", category: "تخزين", min: 2500, max: 8500 },
  { name: "هارد خارجي 1TB", category: "تخزين", min: 28000, max: 65000 },
  { name: "هارد خارجي 2TB", category: "تخزين", min: 48000, max: 95000 },
  { name: "SSD 256GB", category: "تخزين", min: 13000, max: 32000 },
  { name: "SSD 512GB", category: "تخزين", min: 22000, max: 58000 },
  { name: "SSD 1TB", category: "تخزين", min: 42000, max: 110000 },
  { name: "RAM 8GB", category: "قطع كمبيوتر", min: 12000, max: 35000 },
  { name: "RAM 16GB", category: "قطع كمبيوتر", min: 22000, max: 65000 },
  { name: "كرت شاشة اقتصادي", category: "قطع كمبيوتر", min: 65000, max: 160000 },
  { name: "معالج Core i5", category: "قطع كمبيوتر", min: 75000, max: 180000 },
  { name: "لوحة أم", category: "قطع كمبيوتر", min: 35000, max: 120000 },
  { name: "شاحن Type-C", category: "شواحن وكابلات", min: 1800, max: 6000 },
  { name: "شاحن سريع", category: "شواحن وكابلات", min: 3500, max: 12000 },
  { name: "كابل HDMI", category: "شواحن وكابلات", min: 900, max: 4500 },
  { name: "كابل Type-C", category: "شواحن وكابلات", min: 700, max: 3500 },
  { name: "كابل شبكة", category: "شواحن وكابلات", min: 800, max: 5000 },
  { name: "باور بانك", category: "شواحن وكابلات", min: 6000, max: 25000 },
  { name: "شاشة 22 بوصة", category: "شاشات", min: 30000, max: 70000 },
  { name: "شاشة 24 بوصة", category: "شاشات", min: 38000, max: 85000 },
  { name: "شاشة 27 بوصة", category: "شاشات", min: 55000, max: 130000 },
  { name: "طابعة صغيرة", category: "طابعات", min: 45000, max: 110000 },
  { name: "حبر طابعة", category: "طابعات", min: 2500, max: 16000 },
  { name: "راوتر منزلي", category: "شبكات", min: 8000, max: 28000 },
  { name: "مقوي شبكة", category: "شبكات", min: 6000, max: 22000 },
  { name: "سويتش شبكة", category: "شبكات", min: 7000, max: 35000 },
  { name: "كاميرا ويب", category: "كاميرات", min: 7000, max: 30000 },
  { name: "كاميرا مراقبة", category: "كاميرات", min: 12000, max: 65000 },
  { name: "حامل لابتوب", category: "إكسسوارات", min: 2500, max: 12000 },
  { name: "حقيبة لابتوب", category: "إكسسوارات", min: 3500, max: 16000 },
  { name: "قارئ كروت", category: "إكسسوارات", min: 900, max: 4000 },
  { name: "موزع USB", category: "إكسسوارات", min: 2500, max: 12000 },
];

const brands = [
  "ProTech",
  "SmartX",
  "YemenTech",
  "Nova",
  "Ultra",
  "Max",
  "Speed",
  "Eagle",
  "Prime",
  "Core",
  "Future",
  "Digital",
  "Star",
  "Alpha",
  "Royal",
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundPrice(price) {
  return Math.round(price / 100) * 100;
}

function createDemoProducts(count = 500) {
  const products = [];

  for (let i = 1; i <= count; i++) {
    const template = productTemplates[(i - 1) % productTemplates.length];
    const brand = brands[(i - 1) % brands.length];

    const purchasePrice = roundPrice(randomBetween(template.min, template.max));
    const profitRate = randomBetween(18, 45) / 100;
    const sellingPrice = roundPrice(purchasePrice + purchasePrice * profitRate);
    const quantity = randomBetween(3, 90);

    products.push({
      id: i,
      code: `P-${1000 + i}`,
      name: `${template.name} ${brand} موديل ${1000 + i}`,
      category: template.category,

      purchasePrice,
      sellingPrice,
      quantity,

      costPrice: purchasePrice,
      salePrice: sellingPrice,
      stock: quantity,
      unit: "قطعة",
    });
  }

  return products;
}

const defaultProducts = createDemoProducts(500);

function normalizeProduct(product) {
  const purchasePrice = Number(product.purchasePrice ?? product.costPrice ?? 0);
  const sellingPrice = Number(product.sellingPrice ?? product.salePrice ?? 0);
  const quantity = Number(product.quantity ?? product.stock ?? 0);

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
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem("products");
      const parsedProducts = savedProducts ? JSON.parse(savedProducts) : defaultProducts;

      return Array.isArray(parsedProducts)
        ? parsedProducts.map(normalizeProduct)
        : defaultProducts;
    } catch {
      return defaultProducts;
    }
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("mohasbti_products", JSON.stringify(products));
  }, [products]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function openConfirm({ type, productId = null, title, message, confirmText, danger }) {
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

  function saveProduct(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const productData = {
      name: form.name.trim(),
      category: form.category.trim(),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.quantity),

      costPrice: Number(form.purchasePrice),
      salePrice: Number(form.sellingPrice),
      stock: Number(form.quantity),
      unit: "قطعة",
    };

    if (editingId) {
      const updatedProducts = products.map((product) => {
        if (product.id === editingId) {
          return {
            ...product,
            ...productData,
          };
        }

        return product;
      });

      setProducts(updatedProducts);
      resetForm();
      showToast("تم تحديث المنتج بنجاح.");
      return;
    }

    const isExisting = products.some((product) => {
      return product.name.trim() === productData.name;
    });

    if (isExisting) {
      showToast("هذا المنتج موجود بالفعل.", "warning");
      return;
    }

    const newProduct = {
      id: Date.now(),
      code: `P-${Date.now().toString().slice(-5)}`,
      ...productData,
    };

    setProducts([...products, newProduct]);
    resetForm();
    showToast("تمت إضافة المنتج بنجاح.");
  }

  function startEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category,
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

  function generateProducts() {
    openConfirm({
      type: "generate",
      title: "توليد 500 منتج وهمي",
      message:
        "سيتم توليد 500 منتج وهمي جديد واستبدال قائمة المنتجات الحالية. هل تريد المتابعة؟",
      confirmText: "توليد المنتجات",
      danger: false,
    });
  }

  function resetProducts() {
    openConfirm({
      type: "reset",
      title: "استعادة المنتجات الوهمية",
      message:
        "سيتم استعادة 500 منتج وهمي وحذف أي منتجات أضفتها أو عدلتها. هل تريد المتابعة؟",
      confirmText: "استعادة المنتجات",
      danger: true,
    });
  }

  function confirmAction() {
    if (confirmState.type === "delete") {
      const product = products.find((item) => item.id === confirmState.productId);

      setProducts(products.filter((item) => item.id !== confirmState.productId));

      if (editingId === confirmState.productId) {
        resetForm();
      }

      closeConfirm();
      showToast(product ? `تم حذف المنتج "${product.name}" بنجاح.` : "تم حذف المنتج.");
      return;
    }

    if (confirmState.type === "generate") {
      setProducts(createDemoProducts(500));
      resetForm();
      setSearchTerm("");
      closeConfirm();
      showToast("تم توليد 500 منتج وهمي بنجاح.");
      return;
    }

    if (confirmState.type === "reset") {
      setProducts(createDemoProducts(500));
      resetForm();
      setSearchTerm("");
      closeConfirm();
      showToast("تمت استعادة 500 منتج وهمي بنجاح.");
    }
  }

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();

    return (
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword) ||
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

  const lowStockProducts = products.filter((product) => Number(product.quantity) <= 5);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">المخزون والمنتجات</h1>
            <p className="section-subtitle">
              هنا تبدأ إدارة النشاط التجاري: أضف المنتجات، تابع الكميات، واحسب
              قيمة المخزون والربح المتوقع.
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

            <button className="primary-btn">
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? "تحديث المنتج" : "إضافة المنتج"}
            </button>

            {editingId && (
              <button type="button" className="cancel-edit-btn" onClick={resetForm}>
                <XCircle size={18} />
                إلغاء التعديل
              </button>
            )}

            <button type="button" className="secondary-btn" onClick={generateProducts}>
              توليد 500 منتج وهمي
            </button>

            <button type="button" className="secondary-btn" onClick={resetProducts}>
              استعادة 500 منتج وهمي
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

            {filteredProducts.length === 0 ? (
              <div className="empty-search">لا توجد منتجات مطابقة للبحث الحالي.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
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
                        Number(product.sellingPrice) - Number(product.purchasePrice);

                      return (
                        <tr
                          key={product.id}
                          className={editingId === product.id ? "editing-row" : ""}
                        >
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