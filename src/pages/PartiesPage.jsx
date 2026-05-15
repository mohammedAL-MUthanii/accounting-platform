import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  UserRound,
  Building2,
  Wallet,
  Eye,
  ReceiptText,
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

function normalizeSalesInvoice(invoice) {
  return {
    id: invoice.id,
    number: invoice.id,
    date: formatDate(invoice.invoice_date || invoice.created_at),
    customerName: invoice.customer_name || "عميل نقدي",
    paymentType: invoice.payment_type || "cash",
    total: Number(invoice.net_total || 0),
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

function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyName, setSelectedPartyName] = useState(null);

  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadPartiesData();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadPartiesData() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const [salesResponse, purchasesResponse, vouchersResponse] =
        await Promise.all([
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

      const salesData = await salesResponse.json();
      const purchasesData = await purchasesResponse.json();
      const vouchersData = await vouchersResponse.json();

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

  const parties = useMemo(() => {
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

    // فواتير البيع الآجلة: العميل مدين
    salesInvoices.forEach((invoice) => {
      const isCreditSale = invoice.paymentType === "credit";

      if (!isCreditSale) return;

      const customerName = invoice.customerName || "عميل غير محدد";
      const total = Number(invoice.total || 0);

      addParty(customerName, "customer");

      partiesMap[customerName].debit += total;
      partiesMap[customerName].movements.push({
        id: `sale-${invoice.id}`,
        date: invoice.date,
        type: "فاتورة بيع آجل",
        description: `فاتورة بيع رقم ${invoice.number}`,
        debit: total,
        credit: 0,
      });
    });

    // فواتير الشراء الآجلة: المورد دائن
    purchaseInvoices.forEach((invoice) => {
      const isCreditPurchase = invoice.paymentType === "credit";

      if (!isCreditPurchase) return;

      const supplierName = invoice.supplierName || "مورد غير محدد";
      const total = Number(invoice.total || 0);

      addParty(supplierName, "supplier");

      partiesMap[supplierName].credit += total;
      partiesMap[supplierName].movements.push({
        id: `purchase-${invoice.id}`,
        date: invoice.date,
        type: "فاتورة شراء آجل",
        description: `فاتورة شراء رقم ${invoice.number}`,
        debit: 0,
        credit: total,
      });
    });

    // السندات: سند القبض يخفض رصيد العميل، وسند الصرف يخفض رصيد المورد
    vouchers.forEach((voucher) => {
      const amount = Number(voucher.amount || 0);
      const partyName = voucher.partyName || "غير محدد";

      if (voucher.type === "receipt") {
        addParty(partyName, "customer");

        partiesMap[partyName].credit += amount;
        partiesMap[partyName].movements.push({
          id: `voucher-receipt-${voucher.id}`,
          date: voucher.date,
          type: "سند قبض",
          description: voucher.description || `سند قبض رقم ${voucher.number}`,
          debit: 0,
          credit: amount,
        });
      }

      if (voucher.type === "payment") {
        addParty(partyName, "supplier");

        partiesMap[partyName].debit += amount;
        partiesMap[partyName].movements.push({
          id: `voucher-payment-${voucher.id}`,
          date: voucher.date,
          type: "سند صرف",
          description: voucher.description || `سند صرف رقم ${voucher.number}`,
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
  }, [salesInvoices, purchaseInvoices, vouchers]);

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
              تابع أرصدة العملاء والموردين بناءً على فواتير البيع الآجلة،
              فواتير الشراء الآجلة، وسندات القبض والصرف من قاعدة بيانات Laravel.
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

        <div className="business-report-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={loadPartiesData}
            disabled={isLoading}
          >
            <RefreshCcw size={18} />
            {isLoading ? "جاري التحديث..." : "تحديث الجهات من السيرفر"}
          </button>
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

            {isLoading ? (
              <div className="empty-search">جاري تحميل الجهات من السيرفر...</div>
            ) : filteredParties.length === 0 ? (
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
                            selectedPartyName === party.name ? "editing-row" : ""
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

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default PartiesPage;