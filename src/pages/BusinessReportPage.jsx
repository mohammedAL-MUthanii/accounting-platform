import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  Receipt,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";
import { getAuthToken } from "../utils/auth";

import { API_BASE_URL } from "../config/api";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
}

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

function getPaymentLabel(type) {
  if (type === "cash") return "نقدًا";
  if (type === "credit") return "آجل";
  return type || "-";
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
  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    customerName: invoice.customer_name || "عميل نقدي",
    paymentType: invoice.payment_type || "cash",
    total: Number(invoice.net_total || 0),
    grossTotal: Number(invoice.gross_total || 0),
    discountTotal: Number(invoice.discount_total || 0),
    profit: Number(invoice.profit_total || 0),
    items: Array.isArray(invoice.items) ? invoice.items : [],
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

function BusinessReportPage() {
  const [products, setProducts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadReportData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadReportData() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const [
        productsResponse,
        salesResponse,
        purchasesResponse,
        vouchersResponse,
      ] = await Promise.all([
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
        showToast(productsData.message || "تعذر تحميل بيانات المنتجات.", "error");
      }

      if (!salesResponse.ok) {
        showToast(salesData.message || "تعذر تحميل فواتير المبيعات.", "error");
      }

      if (!purchasesResponse.ok) {
        showToast(
          purchasesData.message || "تعذر تحميل فواتير المشتريات.",
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

  const report = useMemo(() => {
    const totalSales = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const totalSalesProfit = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.profit || 0);
    }, 0);

    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.total || 0);
    }, 0);

    const totalStockValue = products.reduce((sum, product) => {
      return sum + Number(product.quantity) * Number(product.costPrice);
    }, 0);

    const totalExpectedStockSales = products.reduce((sum, product) => {
      return sum + Number(product.quantity) * Number(product.salePrice);
    }, 0);

    const totalExpectedStockProfit =
      totalExpectedStockSales - totalStockValue;

    const cashSales = salesInvoices
      .filter((invoice) => invoice.paymentType === "cash")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const creditSales = salesInvoices
      .filter((invoice) => invoice.paymentType === "credit")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const cashPurchases = purchaseInvoices
      .filter((invoice) => invoice.paymentType === "cash")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const creditPurchases = purchaseInvoices
      .filter((invoice) => invoice.paymentType === "credit")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    const totalReceipts = vouchers
      .filter((voucher) => voucher.type === "receipt")
      .reduce((sum, voucher) => sum + Number(voucher.amount || 0), 0);

    const totalPayments = vouchers
      .filter((voucher) => voucher.type === "payment")
      .reduce((sum, voucher) => sum + Number(voucher.amount || 0), 0);

    const netCashMovement = totalReceipts - totalPayments;

    const totalSoldItems = salesInvoices.reduce((sum, invoice) => {
      return sum + invoice.items.length;
    }, 0);

    const totalPurchasedItems = purchaseInvoices.reduce((sum, invoice) => {
      return sum + invoice.items.length;
    }, 0);

    const lowStockProducts = products.filter((product) => {
      return Number(product.quantity) <= 5;
    });

    const topSalesInvoices = [...salesInvoices]
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 5);

    const latestPurchases = [...purchaseInvoices]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);

    const latestSales = [...salesInvoices]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);

    const latestVouchers = [...vouchers]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);

    const customersMap = {};
    const suppliersMap = {};

    salesInvoices
      .filter((invoice) => invoice.paymentType === "credit")
      .forEach((invoice) => {
        const name = invoice.customerName || "عميل غير محدد";

        if (!customersMap[name]) {
          customersMap[name] = {
            name,
            balance: 0,
          };
        }

        customersMap[name].balance += Number(invoice.total || 0);
      });

    purchaseInvoices
      .filter((invoice) => invoice.paymentType === "credit")
      .forEach((invoice) => {
        const name = invoice.supplierName || "مورد غير محدد";

        if (!suppliersMap[name]) {
          suppliersMap[name] = {
            name,
            balance: 0,
          };
        }

        suppliersMap[name].balance += Number(invoice.total || 0);
      });

    vouchers.forEach((voucher) => {
      if (voucher.type === "receipt") {
        const name = voucher.partyName || "عميل غير محدد";

        if (!customersMap[name]) {
          customersMap[name] = {
            name,
            balance: 0,
          };
        }

        customersMap[name].balance -= Number(voucher.amount || 0);
      }

      if (voucher.type === "payment") {
        const name = voucher.partyName || "مورد غير محدد";

        if (!suppliersMap[name]) {
          suppliersMap[name] = {
            name,
            balance: 0,
          };
        }

        suppliersMap[name].balance -= Number(voucher.amount || 0);
      }
    });

    const customers = Object.values(customersMap).filter((customer) => {
      return Number(customer.balance) !== 0;
    });

    const suppliers = Object.values(suppliersMap).filter((supplier) => {
      return Number(supplier.balance) !== 0;
    });

    const customersBalance = customers.reduce((sum, customer) => {
      return sum + Math.max(Number(customer.balance || 0), 0);
    }, 0);

    const suppliersBalance = suppliers.reduce((sum, supplier) => {
      return sum + Math.max(Number(supplier.balance || 0), 0);
    }, 0);

    return {
      products,
      salesInvoices,
      purchaseInvoices,
      vouchers,
      totalSales,
      totalSalesProfit,
      totalPurchases,
      totalStockValue,
      totalExpectedStockSales,
      totalExpectedStockProfit,
      cashSales,
      creditSales,
      cashPurchases,
      creditPurchases,
      totalReceipts,
      totalPayments,
      netCashMovement,
      totalSoldItems,
      totalPurchasedItems,
      lowStockProducts,
      topSalesInvoices,
      latestPurchases,
      latestSales,
      latestVouchers,
      customers,
      suppliers,
      customersBalance,
      suppliersBalance,
    };
  }, [products, salesInvoices, purchaseInvoices, vouchers]);

  const businessNetResult = report.totalSalesProfit;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">تقرير النشاط التجاري</h1>
            <p className="section-subtitle">
              ملخص مباشر من قاعدة بيانات Laravel يجمع المبيعات، المشتريات،
              المخزون، السندات، وأرصدة العملاء والموردين.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>صافي الربح من المبيعات</span>
              <strong>{formatCurrency(businessNetResult)}</strong>
            </div>

            <div>
              <span>قيمة المخزون</span>
              <strong>{formatCurrency(report.totalStockValue)}</strong>
            </div>
          </div>
        </div>

        <div className="business-report-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={loadReportData}
            disabled={isLoading}
          >
            <RefreshCcw size={18} />
            {isLoading ? "جاري التحديث..." : "تحديث التقرير من السيرفر"}
          </button>
        </div>

        <div className="business-main-grid">
          <div className="business-card sales">
            <ShoppingCart size={30} />
            <span>إجمالي المبيعات</span>
            <strong>{formatCurrency(report.totalSales)}</strong>
            <small>{report.salesInvoices.length} فاتورة بيع</small>
          </div>

          <div className="business-card purchases">
            <ShoppingBag size={30} />
            <span>إجمالي المشتريات</span>
            <strong>{formatCurrency(report.totalPurchases)}</strong>
            <small>{report.purchaseInvoices.length} فاتورة شراء</small>
          </div>

          <div className="business-card profit">
            <TrendingUp size={30} />
            <span>ربح المبيعات</span>
            <strong>{formatCurrency(report.totalSalesProfit)}</strong>
            <small>حسب تكلفة الأصناف المباعة</small>
          </div>

          <div className="business-card stock">
            <Package size={30} />
            <span>قيمة المخزون</span>
            <strong>{formatCurrency(report.totalStockValue)}</strong>
            <small>{report.products.length} منتج</small>
          </div>
        </div>

        <div className="business-secondary-grid">
          <div className="business-panel">
            <div className="business-panel-title">
              <Wallet size={22} />
              <h2>تحليل النقد والآجل</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>مبيعات نقدية</span>
                <strong>{formatCurrency(report.cashSales)}</strong>
              </div>

              <div>
                <span>مبيعات آجلة</span>
                <strong>{formatCurrency(report.creditSales)}</strong>
              </div>

              <div>
                <span>مشتريات نقدية</span>
                <strong>{formatCurrency(report.cashPurchases)}</strong>
              </div>

              <div>
                <span>مشتريات آجلة</span>
                <strong>{formatCurrency(report.creditPurchases)}</strong>
              </div>

              <div>
                <span>سندات قبض</span>
                <strong>{formatCurrency(report.totalReceipts)}</strong>
              </div>

              <div>
                <span>سندات صرف</span>
                <strong>{formatCurrency(report.totalPayments)}</strong>
              </div>

              <div>
                <span>صافي حركة النقد</span>
                <strong
                  className={
                    report.netCashMovement >= 0 ? "good-text" : "bad-text"
                  }
                >
                  {formatCurrency(report.netCashMovement)}
                </strong>
              </div>
            </div>
          </div>

          <div className="business-panel">
            <div className="business-panel-title">
              <Users size={22} />
              <h2>العملاء والموردون</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>أرصدة العملاء</span>
                <strong>{formatCurrency(report.customersBalance)}</strong>
              </div>

              <div>
                <span>أرصدة الموردين</span>
                <strong>{formatCurrency(report.suppliersBalance)}</strong>
              </div>

              <div>
                <span>عدد العملاء الآجل</span>
                <strong>{report.customers.length}</strong>
              </div>

              <div>
                <span>عدد الموردين الآجل</span>
                <strong>{report.suppliers.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="business-secondary-grid">
          <div className="business-panel">
            <div className="business-panel-title">
              <Package size={22} />
              <h2>المخزون</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>قيمة المخزون بالتكلفة</span>
                <strong>{formatCurrency(report.totalStockValue)}</strong>
              </div>

              <div>
                <span>قيمة البيع المتوقعة</span>
                <strong>{formatCurrency(report.totalExpectedStockSales)}</strong>
              </div>

              <div>
                <span>ربح المخزون المتوقع</span>
                <strong>{formatCurrency(report.totalExpectedStockProfit)}</strong>
              </div>

              <div>
                <span>منتجات منخفضة</span>
                <strong>{report.lowStockProducts.length}</strong>
              </div>
            </div>

            {report.lowStockProducts.length > 0 && (
              <div className="low-stock-alert">
                <AlertCircle size={20} />
                <span>
                  يوجد {report.lowStockProducts.length} منتج كميته منخفضة أو
                  تساوي 5.
                </span>
              </div>
            )}
          </div>

          <div className="business-panel">
            <div className="business-panel-title">
              <Receipt size={22} />
              <h2>مؤشرات سريعة</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>عدد فواتير البيع</span>
                <strong>{report.salesInvoices.length}</strong>
              </div>

              <div>
                <span>عدد فواتير الشراء</span>
                <strong>{report.purchaseInvoices.length}</strong>
              </div>

              <div>
                <span>عدد السندات</span>
                <strong>{report.vouchers.length}</strong>
              </div>

              <div>
                <span>عدد أصناف البيع</span>
                <strong>{report.totalSoldItems}</strong>
              </div>

              <div>
                <span>عدد أصناف الشراء</span>
                <strong>{report.totalPurchasedItems}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="business-tables-grid">
          <div className="business-panel">
            <div className="business-panel-title">
              <BarChart3 size={22} />
              <h2>أكبر فواتير البيع</h2>
            </div>

            {report.topSalesInvoices.length === 0 ? (
              <p className="empty-text">لا توجد فواتير بيع حتى الآن.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>الدفع</th>
                      <th>الصافي</th>
                      <th>الربح</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.topSalesInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>#{invoice.number}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.customerName}</td>
                        <td>{getPaymentLabel(invoice.paymentType)}</td>
                        <td>{formatCurrency(invoice.total)}</td>
                        <td>
                          <strong
                            className={
                              invoice.profit >= 0 ? "good-text" : "bad-text"
                            }
                          >
                            {formatCurrency(invoice.profit)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="business-panel">
            <div className="business-panel-title">
              <ShoppingBag size={22} />
              <h2>آخر فواتير الشراء</h2>
            </div>

            {report.latestPurchases.length === 0 ? (
              <p className="empty-text">لا توجد فواتير شراء حتى الآن.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>المورد</th>
                      <th>الدفع</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.latestPurchases.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>#{invoice.number}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.supplierName}</td>
                        <td>{getPaymentLabel(invoice.paymentType)}</td>
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
        </div>

        <div className="business-tables-grid">
          <div className="business-panel">
            <div className="business-panel-title">
              <ShoppingCart size={22} />
              <h2>آخر فواتير البيع</h2>
            </div>

            {report.latestSales.length === 0 ? (
              <p className="empty-text">لا توجد فواتير بيع حتى الآن.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>الدفع</th>
                      <th>الصافي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.latestSales.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>#{invoice.number}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.customerName}</td>
                        <td>{getPaymentLabel(invoice.paymentType)}</td>
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

          <div className="business-panel">
            <div className="business-panel-title">
              <Building2 size={22} />
              <h2>أرصدة الجهات الآجلة</h2>
            </div>

            {report.customers.length === 0 && report.suppliers.length === 0 ? (
              <p className="empty-text">
                لا توجد فواتير آجلة للعملاء أو الموردين حتى الآن.
              </p>
            ) : (
              <div className="business-mini-grid">
                {report.customers.map((customer) => (
                  <div key={`customer-${customer.name}`}>
                    <span>عميل: {customer.name}</span>
                    <strong>{formatCurrency(customer.balance)}</strong>
                  </div>
                ))}

                {report.suppliers.map((supplier) => (
                  <div key={`supplier-${supplier.name}`}>
                    <span>مورد: {supplier.name}</span>
                    <strong>{formatCurrency(supplier.balance)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="business-tables-grid">
          <div className="business-panel">
            <div className="business-panel-title">
              <Receipt size={22} />
              <h2>آخر السندات</h2>
            </div>

            {report.latestVouchers.length === 0 ? (
              <p className="empty-text">لا توجد سندات حتى الآن.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>رقم</th>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>الجهة</th>
                      <th>الحساب</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.latestVouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td>#{voucher.number}</td>
                        <td>{voucher.date}</td>
                        <td>
                          {voucher.type === "receipt" ? "سند قبض" : "سند صرف"}
                        </td>
                        <td>{voucher.partyName}</td>
                        <td>{voucher.accountName}</td>
                        <td>
                          <strong>{formatCurrency(voucher.amount)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="business-panel">
            <div className="business-panel-title">
              <Wallet size={22} />
              <h2>ملخص السندات</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>إجمالي سندات القبض</span>
                <strong>{formatCurrency(report.totalReceipts)}</strong>
              </div>

              <div>
                <span>إجمالي سندات الصرف</span>
                <strong>{formatCurrency(report.totalPayments)}</strong>
              </div>

              <div>
                <span>صافي السندات</span>
                <strong
                  className={
                    report.netCashMovement >= 0 ? "good-text" : "bad-text"
                  }
                >
                  {formatCurrency(report.netCashMovement)}
                </strong>
              </div>

              <div>
                <span>عدد السندات</span>
                <strong>{report.vouchers.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default BusinessReportPage;