import { useMemo, useState } from "react";
import { BookMarked, Search, AlertCircle, Printer } from "lucide-react";

const defaultAccounts = [
  { id: 1, name: "الصندوق", type: "asset", isDefault: true },
  { id: 2, name: "البنك", type: "asset", isDefault: true },
  { id: 3, name: "العملاء", type: "asset", isDefault: true },
  { id: 4, name: "المخزون", type: "asset", isDefault: true },
  { id: 5, name: "الأثاث", type: "asset", isDefault: true },
  { id: 6, name: "معدات", type: "asset", isDefault: true },

  { id: 7, name: "الموردون", type: "liability", isDefault: true },

  { id: 8, name: "رأس المال", type: "equity", isDefault: true },

  { id: 9, name: "المبيعات", type: "revenue", isDefault: true },

  { id: 10, name: "المشتريات", type: "expense", isDefault: true },
  { id: 11, name: "مصروف الإيجار", type: "expense", isDefault: true },
  { id: 12, name: "مصروف الرواتب", type: "expense", isDefault: true },
];

const accountTypeNames = {
  asset: "أصل",
  liability: "خصم",
  equity: "حقوق ملكية",
  revenue: "إيراد",
  expense: "مصروف",
  unknown: "غير مصنف",
};

function LedgerPage() {
  function printLedger() {
    window.print();
  }
  const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
  const accountsList =
    JSON.parse(localStorage.getItem("accounts")) || defaultAccounts;

  const [selectedAccount, setSelectedAccount] = useState("all");

  function getAccountInfo(accountName) {
    return accountsList.find((account) => account.name === accountName);
  }

  function getAccountType(accountName) {
    const account = getAccountInfo(accountName);
    return account ? account.type : "unknown";
  }

  const ledgerAccounts = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          type: getAccountType(entry.debitAccount),
          movements: [],
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          type: getAccountType(entry.creditAccount),
          movements: [],
        };
      }

      accountsMap[entry.debitAccount].movements.push({
        id: `${entry.id}-debit`,
        date: entry.date,
        description: entry.description,
        debit: Number(entry.amount),
        credit: 0,
      });

      accountsMap[entry.creditAccount].movements.push({
        id: `${entry.id}-credit`,
        date: entry.date,
        description: entry.description,
        debit: 0,
        credit: Number(entry.amount),
      });
    });

    return Object.entries(accountsMap).map(([accountName, accountData]) => {
      let runningBalance = 0;

      const rows = accountData.movements.map((movement) => {
        runningBalance += movement.debit - movement.credit;

        return {
          ...movement,
          balance: runningBalance,
        };
      });

      const totalDebit = accountData.movements.reduce(
        (sum, item) => sum + item.debit,
        0
      );

      const totalCredit = accountData.movements.reduce(
        (sum, item) => sum + item.credit,
        0
      );

      const finalBalance = totalDebit - totalCredit;

      return {
        name: accountName,
        type: accountData.type,
        rows,
        totalDebit,
        totalCredit,
        finalBalance,
      };
    });
  }, [entries, accountsList]);

  const filteredAccounts =
    selectedAccount === "all"
      ? ledgerAccounts
      : ledgerAccounts.filter((account) => account.name === selectedAccount);

  const unknownAccounts = ledgerAccounts.filter(
    (account) => account.type === "unknown"
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">دفتر الأستاذ</h1>
            <p className="section-subtitle">
              يتم إنشاء دفتر الأستاذ تلقائيًا من القيود المسجلة في دفتر اليومية،
              مع عرض نوع كل حساب من إدارة الحسابات.
            </p>
          </div>
          <div className="report-actions no-print">
            <button className="primary-btn" onClick={printLedger}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الحسابات</span>
              <strong>{ledgerAccounts.length}</strong>
            </div>

            <div>
              <span>عدد القيود</span>
              <strong>{entries.length}</strong>
            </div>
          </div>
        </div>

        {unknownAccounts.length > 0 && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              توجد حسابات غير مصنفة في دفتر الأستاذ. افتح إدارة الحسابات وأضف
              هذه الحسابات بنفس الاسم وحدد نوعها الصحيح.
            </span>
          </div>
        )}

        <div className="ledger-filter no-print">
          <div className="filter-title">
            <Search size={20} />
            <span>فلترة حسب الحساب</span>
          </div>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="all">عرض كل الحسابات</option>
            {ledgerAccounts.map((account) => (
              <option key={account.name} value={account.name}>
                {account.name} - {accountTypeNames[account.type]}
              </option>
            ))}
          </select>
        </div>

        {ledgerAccounts.length === 0 ? (
          <div className="coming-card">
            <h2>لا توجد بيانات بعد</h2>
            <p>
              أضف قيودًا من صفحة دفتر اليومية، وبعدها ستظهر هنا حسابات دفتر
              الأستاذ تلقائيًا.
            </p>
          </div>
        ) : (
          <div className="ledger-grid">
            {filteredAccounts.map((account) => (
              <div className="ledger-card" key={account.name}>
                <div className="ledger-card-header">
                  <div>
                    <BookMarked size={24} />
                    <h2>{account.name}</h2>
                    <span className={`account-type-badge ${account.type}`}>
                      {accountTypeNames[account.type]}
                    </span>
                  </div>

                  <span
                    className={
                      account.finalBalance > 0
                        ? "debit-badge"
                        : account.finalBalance < 0
                          ? "credit-badge"
                          : "neutral-badge"
                    }
                  >
                    {account.finalBalance > 0
                      ? "رصيد مدين"
                      : account.finalBalance < 0
                        ? "رصيد دائن"
                        : "متوازن"}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>البيان</th>
                        <th>مدين</th>
                        <th>دائن</th>
                        <th>الرصيد</th>
                      </tr>
                    </thead>

                    <tbody>
                      {account.rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td>{row.description}</td>
                          <td>
                            {row.debit > 0
                              ? `${row.debit.toLocaleString()} ريال`
                              : "-"}
                          </td>
                          <td>
                            {row.credit > 0
                              ? `${row.credit.toLocaleString()} ريال`
                              : "-"}
                          </td>
                          <td>
                            {Math.abs(row.balance).toLocaleString()} ريال
                            {row.balance > 0
                              ? " مدين"
                              : row.balance < 0
                                ? " دائن"
                                : ""}
                          </td>
                        </tr>
                      ))}

                      <tr className="total-row">
                        <td colSpan="2">الإجمالي</td>
                        <td>{account.totalDebit.toLocaleString()} ريال</td>
                        <td>{account.totalCredit.toLocaleString()} ريال</td>
                        <td>
                          {Math.abs(account.finalBalance).toLocaleString()} ريال
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LedgerPage;