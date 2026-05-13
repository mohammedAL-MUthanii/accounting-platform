import { useMemo } from "react";
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
} from "lucide-react";

const PRODUCTS_KEY = "products";
const SALES_KEYS = ["mohasbti_sales_invoices", "salesInvoices"];
const PURCHASES_KEY = "purchaseInvoices";
const VOUCHERS_KEY = "vouchers";

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString()} ريال`;
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
    const id = invoice.id ?? `${invoice.number ?? invoice.invoiceNumber ?? index}`;
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

function getPurchaseTotal(invoice) {
  return Number(invoice.total ?? 0);
}

function BusinessReportPage() {
  const report = useMemo(() => {
    const products = readArray(PRODUCTS_KEY);
    const salesInvoices = getSalesInvoices();
    const purchaseInvoices = readArray(PURCHASES_KEY);
    const vouchers = readArray(VOUCHERS_KEY);

    const totalSales = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(getSaleTotal(invoice));
    }, 0);

    const totalSalesProfit = salesInvoices.reduce((sum, invoice) => {
      return sum + Number(getSaleProfit(invoice));
    }, 0);

    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => {
      return sum + getPurchaseTotal(invoice);
    }, 0);

    const totalStockValue = products.reduce((sum, product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      const cost = Number(product.purchasePrice ?? product.costPrice ?? 0);
      return sum + quantity * cost;
    }, 0);

    const totalExpectedStockSales = products.reduce((sum, product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      const sellingPrice = Number(product.sellingPrice ?? product.salePrice ?? 0);
      return sum + quantity * sellingPrice;
    }, 0);

    const totalExpectedStockProfit = totalExpectedStockSales - totalStockValue;

    const receiptVouchers = vouchers.filter((voucher) => voucher.type === "receipt");
    const paymentVouchers = vouchers.filter((voucher) => voucher.type === "payment");

    const totalReceipts = receiptVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const totalPayments = paymentVouchers.reduce((sum, voucher) => {
      return sum + Number(voucher.amount || 0);
    }, 0);

    const creditSales = salesInvoices.filter((invoice) => {
      const paymentType = getPaymentType(invoice);
      return (
        paymentType === "credit" ||
        paymentType === "آجل" ||
        paymentType === "آجل / على الحساب"
      );
    });

    const creditPurchases = purchaseInvoices.filter((invoice) => {
      const paymentType = invoice.paymentType ?? "";
      return paymentType === "credit" || paymentType === "آجل";
    });

    const customersMap = {};
    const suppliersMap = {};

    creditSales.forEach((invoice, index) => {
      const name = getCustomerName(invoice);
      const amount = Number(getSaleTotal(invoice));

      if (!customersMap[name]) {
        customersMap[name] = {
          name,
          debit: 0,
          credit: 0,
        };
      }

      customersMap[name].debit += amount;
    });

    creditPurchases.forEach((invoice) => {
      const name = invoice.supplierName ?? "مورد غير محدد";
      const amount = Number(invoice.total || 0);

      if (!suppliersMap[name]) {
        suppliersMap[name] = {
          name,
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
            name: partyName,
            debit: 0,
            credit: 0,
          };
        }

        customersMap[partyName].credit += amount;
      }

      if (voucher.type === "payment") {
        if (!suppliersMap[partyName]) {
          suppliersMap[partyName] = {
            name: partyName,
            debit: 0,
            credit: 0,
          };
        }

        suppliersMap[partyName].debit += amount;
      }
    });

    const customers = Object.values(customersMap);
    const suppliers = Object.values(suppliersMap);

    const customersBalance = customers.reduce((sum, customer) => {
      return sum + Math.max(customer.debit - customer.credit, 0);
    }, 0);

    const suppliersBalance = suppliers.reduce((sum, supplier) => {
      return sum + Math.max(supplier.credit - supplier.debit, 0);
    }, 0);

    const lowStockProducts = products.filter((product) => {
      const quantity = Number(product.quantity ?? product.stock ?? 0);
      return quantity <= 5;
    });

    const topSalesInvoices = [...salesInvoices]
      .map((invoice, index) => ({
        id: invoice.id ?? `sale-${index}`,
        number: invoice.invoiceNumber ?? invoice.number ?? index + 1,
        date: invoice.date,
        customerName: getCustomerName(invoice),
        amount: Number(getSaleTotal(invoice)),
        profit: Number(getSaleProfit(invoice)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const latestPurchases = [...purchaseInvoices]
      .map((invoice, index) => ({
        id: invoice.id ?? `purchase-${index}`,
        number: invoice.number ?? index + 1,
        date: invoice.date,
        supplierName: invoice.supplierName ?? "مورد غير محدد",
        amount: Number(invoice.total || 0),
        paymentType: invoice.paymentType,
      }))
      .sort((a, b) => Number(b.number) - Number(a.number))
      .slice(0, 5);

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
      totalReceipts,
      totalPayments,
      netCashMovement: totalReceipts - totalPayments,
      customersBalance,
      suppliersBalance,
      lowStockProducts,
      topSalesInvoices,
      latestPurchases,
      customers,
      suppliers,
    };
  }, []);

  const businessNetResult = report.totalSalesProfit;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">تقرير النشاط التجاري</h1>
            <p className="section-subtitle">
              ملخص شامل يجمع المبيعات، المشتريات، المخزون، السندات، وأرصدة
              العملاء والموردين في صفحة واحدة.
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
              <h2>حركة النقد والسندات</h2>
            </div>

            <div className="business-mini-grid">
              <div>
                <span>سندات القبض</span>
                <strong>{formatCurrency(report.totalReceipts)}</strong>
              </div>

              <div>
                <span>سندات الصرف</span>
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
                <span>عدد الجهات</span>
                <strong>{report.customers.length + report.suppliers.length}</strong>
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
                        <td>{formatCurrency(invoice.amount)}</td>
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
                        <td>{invoice.paymentType === "credit" ? "آجل" : "نقدًا"}</td>
                        <td>
                          <strong>{formatCurrency(invoice.amount)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessReportPage;