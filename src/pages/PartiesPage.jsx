import { useMemo, useState } from "react";
import {
  Users,
  Search,
  UserRound,
  Building2,
  Wallet,
  Eye,
  ReceiptText,
} from "lucide-react";

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

function getPaymentType(invoice) {
  return invoice.paymentMethod ?? invoice.paymentType ?? "";
}

function getInvoiceCustomer(invoice) {
  return invoice.customerName ?? "عميل نقدي";
}

function getInvoiceNumber(invoice, index) {
  return invoice.invoiceNumber ?? invoice.number ?? index + 1;
}

function getSalesInvoiceTotal(invoice) {
  return (
    invoice.totals?.net ??
    invoice.total ??
    invoice.netTotal ??
    invoice.grossTotal ??
    0
  );
}

function getPurchaseInvoiceTotal(invoice) {
  return invoice.total ?? 0;
}

function getPartyTypeLabel(type) {
  if (type === "customer") return "عميل";
  if (type === "supplier") return "مورد";
  return "جهة أخرى";
}

function getPartyBalance(party) {
  return Number(party.debit) - Number(party.credit);
}

function getBalanceLabel(party) {
  const balance = getPartyBalance(party);

  if (balance > 0) return "مدين";
  if (balance < 0) return "دائن";
  return "متوازن";
}

function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyName, setSelectedPartyName] = useState(null);

  const parties = useMemo(() => {
    const salesInvoices = SALES_KEYS.flatMap((key) => readArray(key));
    const purchaseInvoices = readArray(PURCHASES_KEY);
    const vouchers = readArray(VOUCHERS_KEY);

    const partiesMap = {};

    function addParty(name, type) {
      if (!name) return;

      if (!partiesMap[name]) {
        partiesMap[name] = {
          name,
          type,
          debit: 0,
          credit: 0,
          movements: [],
        };
      }

      if (partiesMap[name].type === "other" && type !== "other") {
        partiesMap[name].type = type;
      }
    }

    // فواتير البيع الآجل: العميل مدين
    salesInvoices.forEach((invoice, index) => {
      const paymentType = getPaymentType(invoice);
      const customerName = getInvoiceCustomer(invoice);
      const total = Number(getSalesInvoiceTotal(invoice));
      const invoiceNumber = getInvoiceNumber(invoice, index);

      const isCreditSale =
        paymentType === "credit" ||
        paymentType === "آجل" ||
        paymentType === "آجل / على الحساب";

      if (!isCreditSale) return;

      addParty(customerName, "customer");

      partiesMap[customerName].debit += total;
      partiesMap[customerName].movements.push({
        id: invoice.id ?? `sale-${invoiceNumber}`,
        date: invoice.date,
        type: "فاتورة بيع آجل",
        description: `فاتورة بيع رقم ${invoiceNumber}`,
        debit: total,
        credit: 0,
      });
    });

    // فواتير الشراء الآجل: المورد دائن
    purchaseInvoices.forEach((invoice, index) => {
      const paymentType = invoice.paymentType ?? "";
      const supplierName = invoice.supplierName ?? "مورد غير محدد";
      const total = Number(getPurchaseInvoiceTotal(invoice));
      const invoiceNumber = invoice.number ?? index + 1;

      const isCreditPurchase = paymentType === "credit" || paymentType === "آجل";

      if (!isCreditPurchase) return;

      addParty(supplierName, "supplier");

      partiesMap[supplierName].credit += total;
      partiesMap[supplierName].movements.push({
        id: invoice.id ?? `purchase-${invoiceNumber}`,
        date: invoice.date,
        type: "فاتورة شراء آجل",
        description: `فاتورة شراء رقم ${invoiceNumber}`,
        debit: 0,
        credit: total,
      });
    });

    // السندات
    vouchers.forEach((voucher) => {
      const amount = Number(voucher.amount || 0);
      const partyName = voucher.partyName || "غير محدد";
      const accountName = voucher.accountName || "";

      if (voucher.type === "receipt") {
        addParty(partyName, "customer");

        partiesMap[partyName].credit += amount;
        partiesMap[partyName].movements.push({
          id: voucher.id,
          date: voucher.date,
          type: "سند قبض",
          description: voucher.description || "تحصيل من عميل",
          debit: 0,
          credit: amount,
        });
      }

      if (voucher.type === "payment") {
        const partyType = accountName.includes("مورد") ? "supplier" : "other";

        addParty(partyName, partyType);

        partiesMap[partyName].debit += amount;
        partiesMap[partyName].movements.push({
          id: voucher.id,
          date: voucher.date,
          type: "سند صرف",
          description: voucher.description || "صرف نقدي",
          debit: amount,
          credit: 0,
        });
      }
    });

    return Object.values(partiesMap)
      .map((party) => ({
        ...party,
        movements: party.movements.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        }),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, []);

  const filteredParties = parties.filter((party) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return (
      party.name.toLowerCase().includes(keyword) ||
      getPartyTypeLabel(party.type).toLowerCase().includes(keyword)
    );
  });

  const selectedParty = parties.find(
    (party) => String(party.name) === String(selectedPartyName)
  );

  const customers = parties.filter((party) => party.type === "customer");
  const suppliers = parties.filter((party) => party.type === "supplier");

  const totalCustomersBalance = customers.reduce((sum, party) => {
    return sum + Math.max(getPartyBalance(party), 0);
  }, 0);

  const totalSuppliersBalance = suppliers.reduce((sum, party) => {
    return sum + Math.abs(Math.min(getPartyBalance(party), 0));
  }, 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">العملاء والموردون</h1>
            <p className="section-subtitle">
              تابع أرصدة العملاء والموردين بناءً على فواتير البيع الآجل،
              فواتير الشراء الآجل، والسندات المسجلة.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الجهات</span>
              <strong>{parties.length}</strong>
            </div>

            <div>
              <span>أرصدة العملاء</span>
              <strong>{formatCurrency(totalCustomersBalance)}</strong>
            </div>
          </div>
        </div>

        <div className="parties-summary">
          <div className="party-summary-card">
            <Users size={28} />
            <span>إجمالي الجهات</span>
            <strong>{parties.length}</strong>
          </div>

          <div className="party-summary-card customer">
            <UserRound size={28} />
            <span>عدد العملاء</span>
            <strong>{customers.length}</strong>
          </div>

          <div className="party-summary-card supplier">
            <Building2 size={28} />
            <span>عدد الموردين</span>
            <strong>{suppliers.length}</strong>
          </div>

          <div className="party-summary-card">
            <Wallet size={28} />
            <span>أرصدة الموردين</span>
            <strong>{formatCurrency(totalSuppliersBalance)}</strong>
          </div>
        </div>

        <div className="parties-layout">
          <div className="parties-list-card">
            <div className="parties-list-header">
              <div>
                <h2>قائمة الجهات</h2>
                <p>اعرض أرصدة العملاء والموردين وحركاتهم.</p>
              </div>

              <div className="party-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="بحث باسم العميل أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredParties.length === 0 ? (
              <div className="empty-search">
                لا توجد جهات مطابقة للبحث الحالي.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>النوع</th>
                      <th>مدين</th>
                      <th>دائن</th>
                      <th>الرصيد</th>
                      <th>طبيعة الرصيد</th>
                      <th>الحركات</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredParties.map((party) => {
                      const balance = getPartyBalance(party);
                      const balanceLabel = getBalanceLabel(party);

                      return (
                        <tr
                          key={party.name}
                          className={
                            selectedPartyName === party.name
                              ? "editing-row"
                              : ""
                          }
                        >
                          <td>
                            <strong>{party.name}</strong>
                          </td>

                          <td>
                            <span
                              className={
                                party.type === "customer"
                                  ? "party-type customer"
                                  : party.type === "supplier"
                                  ? "party-type supplier"
                                  : "party-type other"
                              }
                            >
                              {getPartyTypeLabel(party.type)}
                            </span>
                          </td>

                          <td>{formatCurrency(party.debit)}</td>
                          <td>{formatCurrency(party.credit)}</td>

                          <td>
                            <strong
                              className={balance >= 0 ? "good-text" : "bad-text"}
                            >
                              {formatCurrency(Math.abs(balance))}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                balanceLabel === "مدين"
                                  ? "debit-badge"
                                  : balanceLabel === "دائن"
                                  ? "credit-badge"
                                  : "neutral-badge"
                              }
                            >
                              {balanceLabel}
                            </span>
                          </td>

                          <td>{party.movements.length}</td>

                          <td>
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                setSelectedPartyName(
                                  selectedPartyName === party.name
                                    ? null
                                    : party.name
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="party-details-card">
            {!selectedParty ? (
              <div className="empty-details">
                <Wallet size={42} />
                <h2>تفاصيل الجهة</h2>
                <p>اضغط على زر العين بجانب أي عميل أو مورد لعرض حركاته.</p>
              </div>
            ) : (
              <>
                <div className="party-details-header">
                  <div>
                    <h2>{selectedParty.name}</h2>
                    <p>{getPartyTypeLabel(selectedParty.type)}</p>
                  </div>

                  <span
                    className={
                      selectedParty.type === "customer"
                        ? "party-type customer"
                        : selectedParty.type === "supplier"
                        ? "party-type supplier"
                        : "party-type other"
                    }
                  >
                    {getPartyTypeLabel(selectedParty.type)}
                  </span>
                </div>

                <div className="party-meta-grid">
                  <div>
                    <Wallet size={18} />
                    <span>مدين</span>
                    <strong>{formatCurrency(selectedParty.debit)}</strong>
                  </div>

                  <div>
                    <Wallet size={18} />
                    <span>دائن</span>
                    <strong>{formatCurrency(selectedParty.credit)}</strong>
                  </div>

                  <div>
                    <ReceiptText size={18} />
                    <span>الرصيد</span>
                    <strong>
                      {formatCurrency(Math.abs(getPartyBalance(selectedParty)))}
                    </strong>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>نوع الحركة</th>
                        <th>البيان</th>
                        <th>مدين</th>
                        <th>دائن</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedParty.movements.map((movement) => (
                        <tr key={movement.id}>
                          <td>{movement.date}</td>
                          <td>{movement.type}</td>
                          <td>{movement.description}</td>
                          <td>{formatCurrency(movement.debit)}</td>
                          <td>{formatCurrency(movement.credit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartiesPage;