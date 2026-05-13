import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  Users,
  FileText,
  ReceiptText,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Brain,
  ArrowLeft,
  ClipboardList,
  BookOpen,
  Settings,
} from "lucide-react";

const SALES_KEYS = ["salesInvoices", "mohasbti_sales_invoices"];
const PRODUCTS_KEY = "products";
const PURCHASES_KEY = "purchaseInvoices";
const VOUCHERS_KEY = "vouchers";
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

function readValue(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ar-YE")} ريال`;
}

function getSalesInvoices() {
  const allInvoices = [];

  SALES_KEYS.forEach((key) => {
    readArray(key).forEach((invoice) => {
      allInvoices.push(invoice);
    });
  });

  const uniqueMap = new Map();

  allInvoices.forEach((invoice, index) => {
    const id = invoice.id ?? `${invoice.invoiceNumber ?? invoice.number ?? index}`;
    uniqueMap.set(String(id), invoice);
  });

  return Array.from(uniqueMap.values());
}

function getSaleTotal(invoice) {
  return (
    invoice.totals?.net ??
    invoice.total ??
    invoice.netTotal ??
    invoice.grossTotal ??
    0
  );
}

function getSaleProfit(invoice) {
  if (invoice.profit !== undefined) return Number(invoice.profit);

  const items = invoice.lines || invoice.items || [];

  return items.reduce((sum, item) => {
    const qty = Number(item.qty ?? item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.sellingPrice ?? 0);
    const costPrice = Number(item.costPrice ?? item.purchasePrice ?? 0);
    const discountPercent = Number(item.discountPercent ?? 0);
    const discountValue = Number(item.discountValue ?? 0);

    const gross = qty * unitPrice;
    const discount = gross * (discountPercent / 100) + discountValue;
    const net = gross - discount;
    const cost = qty * costPrice;

    return sum + (net - cost);
  }, 0);
}

function getPaymentType(invoice) {
  return invoice.paymentMethod ?? invoice.paymentType ?? "";
}

function getCustomerName(invoice) {
  return invoice.customerName ?? "عميل نقدي";
}

function getPlacementLabel(result) {
  if (!result) return "لم يتم الاختبار";

  if (typeof result === "string") return result;

  return result.levelLabel ?? result.level ?? result.title ?? "محدد";
}

function HomePage() {
    const currentUser = getCurrentUser();
  const isAdminUser = currentUser?.role === "admin";
  const dashboard = useMemo(() => {
    const products = readArray(PRODUCTS_KEY);
    const salesInvoices = getSalesInvoices();
    const purchaseInvoices = readArray(PURCHASES_KEY);
    const vouchers = readArray(VOUCHERS_KEY);
    const journalEntries = readArray(JOURNAL_KEY);
    const placementResult = readValue("placementResult");

    const totalSales = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(getSaleTotal(invoice));
    }, 0);

    const totalProfit = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(getSaleProfit(invoice));
    }, 0);

    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const stockValue = products.reduce((sum, product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      const cost = Number(product.purchasePrice ?? product.costPrice ?? 0);
      return sum + quantity * cost;
    }, 0);

    const expectedStockSales = products.reduce((sum, product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      const sellingPrice = Number(product.sellingPrice ?? product.salePrice ?? 0);
      return sum + quantity * sellingPrice;
    }, 0);

    const lowStockProducts = products.filter((product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      return quantity <= 5;
    });

    const receiptVouchers = vouchers.filter((voucher) => voucher.type === "receipt");
    const paymentVouchers = vouchers.filter((voucher) => voucher.type === "payment");

    const totalReceipts = receiptVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const totalPayments = paymentVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const customersMap = {};
    const suppliersMap = {};

    salesInvoices.forEach((invoice) => {
      const paymentType = getPaymentType(invoice);
      const isCreditSale =
        paymentType === "credit" ||
        paymentType === "آجل" ||
        paymentType === "آجل / على الحساب";

      if (!isCreditSale) return;

      const name = getCustomerName(invoice);
      const amount = Number(getSaleTotal(invoice));

      if (!customersMap[name]) {
        customersMap[name] = { debit: 0, credit: 0 };
      }

      customersMap[name].debit += amount;
    });

    purchaseInvoices.forEach((invoice) => {
      const paymentType = invoice.paymentType ?? "";
      const isCreditPurchase = paymentType === "credit" || paymentType === "آجل";

      if (!isCreditPurchase) return;

      const name = invoice.supplierName ?? "مورد غير محدد";
      const amount = Number(invoice.total || 0);

      if (!suppliersMap[name]) {
        suppliersMap[name] = { debit: 0, credit: 0 };
      }

      suppliersMap[name].credit += amount;
    });

    vouchers.forEach((voucher) => {
      const amount = Number(voucher.amount || 0);
      const partyName = voucher.partyName || "غير محدد";

      if (voucher.type === "receipt") {
        if (!customersMap[partyName]) {
          customersMap[partyName] = { debit: 0, credit: 0 };
        }

        customersMap[partyName].credit += amount;
      }

      if (voucher.type === "payment") {
        if (!suppliersMap[partyName]) {
          suppliersMap[partyName] = { debit: 0, credit: 0 };
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
      .map((invoice, index) => ({
        id: invoice.id ?? `sale-${index}`,
        number: invoice.invoiceNumber ?? invoice.number ?? index + 1,
        date: invoice.date ?? "-",
        customerName: getCustomerName(invoice),
        total: Number(getSaleTotal(invoice)),
      }))
      .sort((a, b) => Number(b.number) - Number(a.number))
      .slice(0, 4);

    const latestPurchases = [...purchaseInvoices]
      .map((invoice, index) => ({
        id: invoice.id ?? `purchase-${index}`,
        number: invoice.number ?? index + 1,
        date: invoice.date ?? "-",
        supplierName: invoice.supplierName ?? "مورد غير محدد",
        total: Number(invoice.total || 0),
      }))
      .sort((a, b) => Number(b.number) - Number(a.number))
      .slice(0, 4);

    return {
      products,
      salesInvoices,
      purchaseInvoices,
      vouchers,
      journalEntries,
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
      placementLabel: getPlacementLabel(placementResult),
    };
  }, []);

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
      description: "نسخ احتياطي ومسح البيانات",
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
                <strong className={dashboard.netCash >= 0 ? "good-text" : "bad-text"}>
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
                يوجد {dashboard.lowStockProducts.length} منتج كميته منخفضة أو تساوي 5.
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
                <span>عدد القيود</span>
                <strong>{dashboard.journalEntries.length}</strong>
              </div>

              <div>
                <span>عدد المنتجات</span>
                <strong>{dashboard.products.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="quick-actions-section">
          <div className="dashboard-panel-title">
            <ClipboardList size={22} />
            <h2>اختصارات سريعة</h2>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link to={action.path} className="quick-action-card" key={action.path}>
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
    </div>
  );
}

export default HomePage;