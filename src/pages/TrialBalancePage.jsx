import { useMemo } from "react";
import { CheckCircle2, AlertCircle, BarChart3, Printer } from "lucide-react";

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

function TrialBalancePage() {
  function printTrialBalance() {
    window.print();
  }

  const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
  const accountsList =
    JSON.parse(localStorage.getItem("accounts")) || defaultAccounts;

  function getAccountInfo(accountName) {
    return accountsList.find((account) => account.name === accountName);
  }

  function getAccountType(accountName) {
    const account = getAccountInfo(accountName);
    return account ? account.type : "unknown";
  }

  const trialBalance = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          name: entry.debitAccount,
          type: getAccountType(entry.debitAccount),
          debit: 0,
          credit: 0,
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          name: entry.creditAccount,
          type: getAccountType(entry.creditAccount),
          debit: 0,
          credit: 0,
        };
      }

      accountsMap[entry.debitAccount].debit += Number(entry.amount);
      accountsMap[entry.creditAccount].credit += Number(entry.amount);
    });

    return Object.values(accountsMap);
  }, [entries, accountsList]);

  const totalDebit = trialBalance.reduce((sum, account) => {
    return sum + account.debit;
  }, 0);

  const totalCredit = trialBalance.reduce((sum, account) => {
    return sum + account.credit;
  }, 0);

  const isBalanced = totalDebit === totalCredit;

  const unknownAccounts = trialBalance.filter(
    (account) => account.type === "unknown"
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">ميزان المراجعة</h1>
            <p className="section-subtitle">
              يتم إنشاء هذا الميزان تلقائيًا من القيود المسجلة في دفتر اليومية،
              مع عرض نوع كل حساب من إدارة الحسابات.
            </p>
          </div>

          <div className="report-actions no-print">
            <button className="primary-btn" onClick={printTrialBalance}>
              <Printer size={18} />
              طباعة / حفظ PDF
            </button>
          </div>

          <div className="stats-box">
            <div>
              <span>إجمالي المدين</span>
              <strong>{totalDebit.toLocaleString()} ريال</strong>
            </div>

            <div>
              <span>إجمالي الدائن</span>
              <strong>{totalCredit.toLocaleString()} ريال</strong>
            </div>
          </div>
        </div>

        {unknownAccounts.length > 0 && (
          <div className="balance-status error">
            <AlertCircle size={22} />
            <span>
              توجد حسابات غير مصنفة. افتح إدارة الحسابات وأضف هذه الحسابات حتى
              تظهر التقارير بشكل أدق.
            </span>
          </div>
        )}

        <div
          className={isBalanced ? "balance-status success" : "balance-status error"}
        >
          {isBalanced ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}

          {isBalanced ? (
            <span>ميزان المراجعة متوازن: إجمالي المدين يساوي إجمالي الدائن</span>
          ) : (
            <span>يوجد فرق في الميزان: إجمالي المدين لا يساوي إجمالي الدائن</span>
          )}
        </div>

        <div className="trial-layout">
          <div className="journal-table">
            <div className="table-title">
              <BarChart3 size={22} />
              <h2>أرصدة الحسابات</h2>
            </div>

            {trialBalance.length === 0 ? (
              <p className="empty-text">
                لا توجد بيانات بعد. أضف قيودًا من صفحة دفتر اليومية أولًا.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>اسم الحساب</th>
                      <th>نوع الحساب</th>
                      <th>مدين</th>
                      <th>دائن</th>
                      <th>طبيعة الرصيد</th>
                      <th>الرصيد النهائي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {trialBalance.map((account) => {
                      const balance = Math.abs(account.debit - account.credit);

                      const balanceType =
                        account.debit > account.credit
                          ? "مدين"
                          : account.credit > account.debit
                            ? "دائن"
                            : "متوازن";

                      return (
                        <tr key={account.name}>
                          <td>
                            <strong>{account.name}</strong>
                          </td>

                          <td>
                            <span
                              className={`account-type-badge ${account.type}`}
                            >
                              {accountTypeNames[account.type]}
                            </span>
                          </td>

                          <td>{account.debit.toLocaleString()} ريال</td>

                          <td>{account.credit.toLocaleString()} ريال</td>

                          <td>
                            <span
                              className={
                                balanceType === "مدين"
                                  ? "debit-badge"
                                  : balanceType === "دائن"
                                    ? "credit-badge"
                                    : "neutral-badge"
                              }
                            >
                              {balanceType}
                            </span>
                          </td>

                          <td>{balance.toLocaleString()} ريال</td>
                        </tr>
                      );
                    })}

                    <tr className="total-row">
                      <td>الإجمالي</td>
                      <td>-</td>
                      <td>{totalDebit.toLocaleString()} ريال</td>
                      <td>{totalCredit.toLocaleString()} ريال</td>
                      <td>-</td>
                      <td>
                        {Math.abs(totalDebit - totalCredit).toLocaleString()} ريال
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="analysis-card">
            <h2>تحليل سريع</h2>

            <div className="analysis-item">
              <span>عدد الحسابات</span>
              <strong>{trialBalance.length}</strong>
            </div>

            <div className="analysis-item">
              <span>عدد القيود المصدرية</span>
              <strong>{entries.length}</strong>
            </div>

            <div className="analysis-item">
              <span>حالة الميزان</span>
              <strong className={isBalanced ? "good-text" : "bad-text"}>
                {isBalanced ? "متوازن" : "غير متوازن"}
              </strong>
            </div>

            <div className="analysis-item">
              <span>حسابات غير مصنفة</span>
              <strong
                className={
                  unknownAccounts.length === 0 ? "good-text" : "bad-text"
                }
              >
                {unknownAccounts.length}
              </strong>
            </div>

            <p>
              ميزان المراجعة يساعدك تتأكد أن القيود المحاسبية مسجلة بشكل صحيح
              من ناحية تساوي المدين والدائن، كما يوضح نوع كل حساب لتسهيل الفهم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrialBalancePage;