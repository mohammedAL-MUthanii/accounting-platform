import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, getAuthToken } from "../utils/auth";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  Users,
  ReceiptText,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Brain,
  ArrowLeft,
  ClipboardList,
  BookOpen,
  Settings,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";

import { API_BASE_URL } from "../config/api";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ar-YE")} ريال`;
}

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

function readValue(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getPlacementLabel(result) {
  if (!result) return "لم يتم الاختبار";

  if (typeof result === "string") return result;

  return result.levelLabel ?? result.level ?? result.title ?? "محدد";
}

function normalizeProduct(product) {
  const quantity = Number(product.quantity ?? 0);
  const costPrice = Number(product.cost_price ?? 0);
  const salePrice = Number(product.sale_price ?? 0);

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    category: product.category,
    quantity,
    costPrice,
    salePrice,
  };
}

function normalizeSalesInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const costTotal = items.reduce((sum, item) => {
    return sum + Number(item.cost_price || 0) * Number(item.quantity || 0);
  }, 0);

  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    customerName: invoice.customer_name || "عميل نقدي",
    paymentType: invoice.payment_type || "cash",
    total: Number(invoice.net_total || 0),
    profit: Number(invoice.profit_total || 0),
    costTotal,
    items,
  };
}

function normalizePurchaseInvoice(invoice) {
  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    supplierName: invoice.supplier_name || "مورد غير محدد",
    paymentType: invoice.payment_type || "cash",
    total: Number(invoice.total || 0),
    items: Array.isArray(invoice.items) ? invoice.items : [],
  };
}

function normalizeVoucher(voucher) {
  return {
    id: voucher.id,
    number: voucher.id,
    type: voucher.type,
    date: formatDate(voucher.voucher_date || voucher.created_at),
    partyName: voucher.party_name || "غير محدد",
    accountName: voucher.account_name || "",
    paymentMethod: voucher.payment_method || "الصندوق",
    amount: Number(voucher.amount || 0),
    description: voucher.description || "",
  };
}

function HomePage() {
  const currentUser = getCurrentUser();
  const isAdminUser = currentUser?.role === "admin";

  const [products, setProducts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isAdminUser) {
      loadDashboardData();
    }
  }, [isAdminUser]);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadDashboardData() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const [productsResponse, salesResponse, purchasesResponse, vouchersResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/products`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/sales-invoices`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/purchase-invoices`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/vouchers`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const productsData = await productsResponse.json();
      const salesData = await salesResponse.json();
      const purchasesData = await purchasesResponse.json();
      const vouchersData = await vouchersResponse.json();

      if (!productsResponse.ok) {
        showToast(productsData.message || "تعذر تحميل المنتجات.", "error");
      }

      if (!salesResponse.ok) {
        showToast(salesData.message || "تعذر تحميل فواتير البيع.", "error");
      }

      if (!purchasesResponse.ok) {
        showToast(
          purchasesData.message || "تعذر تحميل فواتير الشراء.",
          "error"
        );
      }

      if (!vouchersResponse.ok) {
        showToast(vouchersData.message || "تعذر تحميل السندات.", "error");
      }

      setProducts(
        Array.isArray(productsData.products)
          ? productsData.products.map(normalizeProduct)
          : []
      );

      setSalesInvoices(
        Array.isArray(salesData.sales_invoices)
          ? salesData.sales_invoices.map(normalizeSalesInvoice)
          : []
      );

      setPurchaseInvoices(
        Array.isArray(purchasesData.purchase_invoices)
          ? purchasesData.purchase_invoices.map(normalizePurchaseInvoice)
          : []
      );

      setVouchers(
        Array.isArray(vouchersData.vouchers)
          ? vouchersData.vouchers.map(normalizeVoucher)
          : []
      );
    } catch {
      showToast(
       "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت أو من تشغيل خدمة الباك إند."
      );
    }

    setIsLoading(false);
  }

  const dashboard = useMemo(() => {
    const placementResult = readValue("placementResult");

    const totalSales = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const totalProfit = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.profit || 0);
    }, 0);

    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const stockValue = products.reduce((sum, product) => {
      return sum + Number(product.quantity || 0) * Number(product.costPrice || 0);
    }, 0);

    const expectedStockSales = products.reduce((sum, product) => {
      return sum + Number(product.quantity || 0) * Number(product.salePrice || 0);
    }, 0);

    const lowStockProducts = products.filter((product) => {
      return Number(product.quantity || 0) <= 5;
    });

    const receiptVouchers = vouchers.filter((voucher) => {
      return voucher.type === "receipt";
    });

    const paymentVouchers = vouchers.filter((voucher) => {
      return voucher.type === "payment";
    });

    const totalReceipts = receiptVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const totalPayments = paymentVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const customersMap = {};
    const suppliersMap = {};

    salesInvoices.forEach((invoice) => {
      if (invoice.paymentType !== "credit") return;

      const name = invoice.customerName || "عميل غير محدد";
      const amount = Number(invoice.total || 0);

      if (!customersMap[name]) {
        customersMap[name] = {
          debit: 0,
          credit: 0,
        };
      }

      customersMap[name].debit += amount;
    });

    purchaseInvoices.forEach((invoice) => {
      if (invoice.paymentType !== "credit") return;

      const name = invoice.supplierName || "مورد غير محدد";
      const amount = Number(invoice.total || 0);

      if (!suppliersMap[name]) {
        suppliersMap[name] = {
          debit: 0,
          credit: 0,
        };
      }

      suppliersMap[name].credit += amount;
    });

    vouchers.forEach((voucher) => {
      const amount = Number(voucher.amount || 0);
      const partyName = voucher.partyName || "غير محدد";

      if (voucher.type === "receipt") {
        if (!customersMap[partyName]) {
          customersMap[partyName] = {
            debit: 0,
            credit: 0,
          };
        }

        customersMap[partyName].credit += amount;
      }

      if (voucher.type === "payment") {
        if (!suppliersMap[partyName]) {
          suppliersMap[partyName] = {
            debit: 0,
            credit: 0,
          };
        }

        suppliersMap[partyName].debit += amount;
      }
    });

    const customersBalance = Object.values(customersMap).reduce((sum, party) => {
      return sum + Math.max(Number(party.debit) - Number(party.credit), 0);
    }, 0);

    const suppliersBalance = Object.values(suppliersMap).reduce((sum, party) => {
      return sum + Math.max(Number(party.credit) - Number(party.debit), 0);
    }, 0);

    const latestSales = [...salesInvoices]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 4);

    const latestPurchases = [...purchaseInvoices]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 4);

    const generatedJournalCount =
      salesInvoices.length * 2 + purchaseInvoices.length + vouchers.length;

    return {
      products,
      salesInvoices,
      purchaseInvoices,
      vouchers,
      totalSales,
      totalProfit,
      totalPurchases,
      stockValue,
      expectedStockSales,
      expectedStockProfit: expectedStockSales - stockValue,
      lowStockProducts,
      totalReceipts,
      totalPayments,
      netCash: totalReceipts - totalPayments,
      customersBalance,
      suppliersBalance,
      latestSales,
      latestPurchases,
      journalEntriesCount: generatedJournalCount,
      placementLabel: getPlacementLabel(placementResult),
    };
  }, [products, salesInvoices, purchaseInvoices, vouchers]);

  const adminQuickActions = [
    {
      title: "نقطة البيع",
      description: "بيع المنتجات وتحديث المخزون",
      path: "/pos",
      icon: ShoppingCart,
    },
    {
      title: "المشتريات",
      description: "شراء بضاعة من الموردين",
      path: "/purchases",
      icon: ShoppingBag,
    },
    {
      title: "المخزون",
      description: "إدارة المنتجات والكميات",
      path: "/inventory",
      icon: Package,
    },
    {
      title: "السندات",
      description: "سند قبض وسند صرف",
      path: "/vouchers",
      icon: ReceiptText,
    },
    {
      title: "تقرير النشاط",
      description: "ملخص شامل للنظام",
      path: "/business-report",
      icon: BarChart3,
    },
    {
      title: "الإعدادات",
      description: "إعدادات النظام",
      path: "/settings",
      icon: Settings,
    },
  ];

  const studentQuickActions = [
    {
      title: "الدروس",
      description: "تعلم أساسيات المحاسبة",
      path: "/lessons",
      icon: BookOpen,
    },
    {
      title: "التمارين",
      description: "اختبار تدريبي عشوائي",
      path: "/practice",
      icon: ClipboardList,
    },
    {
      title: "السيناريوهات",
      description: "طبق القيود عمليًا",
      path: "/scenarios",
      icon: Brain,
    },
    {
      title: "اختبار المستوى",
      description: "اعرف مستواك الحالي",
      path: "/placement-test",
      icon: BarChart3,
    },
  ];

  const quickActions = isAdminUser ? adminQuickActions : studentQuickActions;

  return (
    <div className="page home-dashboard-page">
      <div className="container">
        <section className="home-hero">
          <div className="home-hero-content">
            <div className="hero-badge">
              <LayoutDashboard size={18} />
              لوحة تحكم محاسبتي
            </div>

            <h1>مرحبًا بك في محاسبتي</h1>

            {isAdminUser ? (
              <p>
                هنا تتابع نشاطك التجاري والتعليمي من مكان واحد: المبيعات،
                المشتريات، المخزون، السندات، العملاء والموردين، والتقارير.
              </p>
            ) : (
              <p>
                مرحبًا بك في وضع الطالب. يمكنك التدريب على المحاسبة، حل التمارين،
                تطبيق السيناريوهات، ومعرفة مستواك الحالي.
              </p>
            )}

            <div className="hero-actions">
              {isAdminUser ? (
                <>
                  <Link to="/pos" className="primary-btn">
                    <ShoppingCart size={18} />
                    ابدأ البيع
                  </Link>

                  <Link to="/business-report" className="secondary-btn">
                    <BarChart3 size={18} />
                    تقرير النشاط
                  </Link>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={loadDashboardData}
                    disabled={isLoading}
                  >
                    <RefreshCcw size={18} />
                    {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/practice" className="primary-btn">
                    <ClipboardList size={18} />
                    ابدأ التمارين
                  </Link>

                  <Link to="/placement-test" className="secondary-btn">
                    <Brain size={18} />
                    اختبار المستوى
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="home-hero-side">
            <div className="hero-status-card">
              <span>صافي ربح المبيعات</span>
              <strong>{formatCurrency(dashboard.totalProfit)}</strong>
              <small>حسب تكلفة الأصناف المباعة</small>
            </div>

            <div className="hero-status-card green">
              <span>المخزون بالتكلفة</span>
              <strong>{formatCurrency(dashboard.stockValue)}</strong>
              <small>{dashboard.products.length} منتج</small>
            </div>
          </div>
        </section>

        {isAdminUser && (
          <>
            <section className="dashboard-main-cards">
              <div className="dashboard-stat-card sales">
                <ShoppingCart size={30} />
                <span>إجمالي المبيعات</span>
                <strong>{formatCurrency(dashboard.totalSales)}</strong>
                <small>{dashboard.salesInvoices.length} فاتورة بيع</small>
              </div>

              <div className="dashboard-stat-card purchases">
                <ShoppingBag size={30} />
                <span>إجمالي المشتريات</span>
                <strong>{formatCurrency(dashboard.totalPurchases)}</strong>
                <small>{dashboard.purchaseInvoices.length} فاتورة شراء</small>
              </div>

              <div className="dashboard-stat-card profit">
                <TrendingUp size={30} />
                <span>صافي الربح</span>
                <strong>{formatCurrency(dashboard.totalProfit)}</strong>
                <small>من عمليات البيع</small>
              </div>

              <div className="dashboard-stat-card stock">
                <Package size={30} />
                <span>قيمة المخزون</span>
                <strong>{formatCurrency(dashboard.stockValue)}</strong>
                <small>{dashboard.products.length} منتج</small>
              </div>
            </section>

            <section className="dashboard-panels-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <Wallet size={22} />
                  <h2>النقد والسندات</h2>
                </div>

                <div className="dashboard-mini-grid">
                  <div>
                    <span>سندات القبض</span>
                    <strong>{formatCurrency(dashboard.totalReceipts)}</strong>
                  </div>

                  <div>
                    <span>سندات الصرف</span>
                    <strong>{formatCurrency(dashboard.totalPayments)}</strong>
                  </div>

                  <div>
                    <span>صافي النقد</span>
                    <strong
                      className={
                        dashboard.netCash >= 0 ? "good-text" : "bad-text"
                      }
                    >
                      {formatCurrency(dashboard.netCash)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <Users size={22} />
                  <h2>العملاء والموردون</h2>
                </div>

                <div className="dashboard-mini-grid">
                  <div>
                    <span>أرصدة العملاء</span>
                    <strong>{formatCurrency(dashboard.customersBalance)}</strong>
                  </div>

                  <div>
                    <span>أرصدة الموردين</span>
                    <strong>{formatCurrency(dashboard.suppliersBalance)}</strong>
                  </div>

                  <div>
                    <span>حركة السندات</span>
                    <strong>{dashboard.vouchers.length}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-panels-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <Package size={22} />
                  <h2>مؤشرات المخزون</h2>
                </div>

                <div className="dashboard-mini-grid">
                  <div>
                    <span>قيمة البيع المتوقعة</span>
                    <strong>{formatCurrency(dashboard.expectedStockSales)}</strong>
                  </div>

                  <div>
                    <span>ربح المخزون المتوقع</span>
                    <strong>{formatCurrency(dashboard.expectedStockProfit)}</strong>
                  </div>

                  <div>
                    <span>منتجات منخفضة</span>
                    <strong>{dashboard.lowStockProducts.length}</strong>
                  </div>
                </div>

                {dashboard.lowStockProducts.length > 0 && (
                  <div className="dashboard-warning">
                    <AlertCircle size={20} />
                    يوجد {dashboard.lowStockProducts.length} منتج كميته منخفضة
                    أو تساوي 5.
                  </div>
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <Brain size={22} />
                  <h2>التعلم والتدريب</h2>
                </div>

                <div className="dashboard-mini-grid">
                  <div>
                    <span>مستواك الحالي</span>
                    <strong>{dashboard.placementLabel}</strong>
                  </div>

                  <div>
                    <span>عدد القيود التلقائية</span>
                    <strong>{dashboard.journalEntriesCount}</strong>
                  </div>

                  <div>
                    <span>عدد المنتجات</span>
                    <strong>{dashboard.products.length}</strong>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <section className="quick-actions-section">
          <div className="dashboard-panel-title">
            <ClipboardList size={22} />
            <h2>اختصارات سريعة</h2>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  to={action.path}
                  className="quick-action-card"
                  key={action.path}
                >
                  <Icon size={24} />
                  <div>
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </div>
                  <ArrowLeft size={18} />
                </Link>
              );
            })}
          </div>
        </section>

        {isAdminUser && (
          <section className="dashboard-tables-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel-title">
                <ReceiptText size={22} />
                <h2>آخر فواتير البيع</h2>
              </div>

              {dashboard.latestSales.length === 0 ? (
                <p className="empty-text">لا توجد فواتير بيع حتى الآن.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>رقم</th>
                        <th>التاريخ</th>
                        <th>العميل</th>
                        <th>الصافي</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.latestSales.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>#{invoice.number}</td>
                          <td>{invoice.date}</td>
                          <td>{invoice.customerName}</td>
                          <td>
                            <strong>{formatCurrency(invoice.total)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel-title">
                <ShoppingBag size={22} />
                <h2>آخر فواتير الشراء</h2>
              </div>

              {dashboard.latestPurchases.length === 0 ? (
                <p className="empty-text">لا توجد فواتير شراء حتى الآن.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>رقم</th>
                        <th>التاريخ</th>
                        <th>المورد</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.latestPurchases.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>#{invoice.number}</td>
                          <td>{invoice.date}</td>
                          <td>{invoice.supplierName}</td>
                          <td>
                            <strong>{formatCurrency(invoice.total)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="education-links-panel">
          <div>
            <BookOpen size={24} />
            <h2>تريد تطوير الجانب التعليمي؟</h2>
            <p>
              بعد تجهيز النسخة الحالية، نقدر نطور الدروس والتمارين إلى نظام
              تعليمي كامل بمستويات وأسئلة أكبر.
            </p>
          </div>

          <div className="hero-actions">
            <Link to="/lessons" className="secondary-btn">
              الدروس
            </Link>

            <Link to="/practice" className="primary-btn">
              التمارين
            </Link>
          </div>
        </section>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default HomePage;