import { useMemo } from "react";
import {
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  Printer,
} from "lucide-react";

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

function StatementsPage() {
    function printStatements() {
  window.print();
}
  const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
  const accountsList =
    JSON.parse(localStorage.getItem("accounts")) || defaultAccounts;

  function getAccountType(accountName) {
    const account = accountsList.find((item) => item.name === accountName);
    return account ? account.type : "unknown";
  }

  const statements = useMemo(() => {
    const accountsMap = {};

    entries.forEach((entry) => {
      if (!accountsMap[entry.debitAccount]) {
        accountsMap[entry.debitAccount] = {
          name: entry.debitAccount,
          debit: 0,
          credit: 0,
          type: getAccountType(entry.debitAccount),
        };
      }

      if (!accountsMap[entry.creditAccount]) {
        accountsMap[entry.creditAccount] = {
          name: entry.creditAccount,
          debit: 0,
          credit: 0,
          type: getAccountType(entry.creditAccount),
        };
      }

      accountsMap[entry.debitAccount].debit += Number(entry.amount);
      accountsMap[entry.creditAccount].credit += Number(entry.amount);
    });

    const allAccounts = Object.values(accountsMap);

    const revenues = allAccounts
      .filter((account) => account.type === "revenue")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const expenses = allAccounts
      .filter((account) => account.type === "expense")
      .map((account) => ({
        ...account,
        balance: account.debit - account.credit,
      }));

    const assets = allAccounts
      .filter((account) => account.type === "asset")
      .map((account) => ({
        ...account,
        balance: account.debit - account.credit,
      }));

    const liabilities = allAccounts
      .filter((account) => account.type === "liability")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const equity = allAccounts
      .filter((account) => account.type === "equity")
      .map((account) => ({
        ...account,
        balance: account.credit - account.debit,
      }));

    const unknownAccounts = allAccounts.filter(
      (account) => account.type === "unknown"
    );

    const totalRevenues = revenues.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const netIncome = totalRevenues - totalExpenses;

    const totalAssets = assets.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const totalLiabilities = liabilities.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const totalEquityBeforeProfit = equity.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const totalEquity = totalEquityBeforeProfit + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      revenues,
      expenses,
      assets,
      liabilities,
      equity,
      unknownAccounts,
      totalRevenues,
      totalExpenses,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquityBeforeProfit,
      totalEquity,
      totalLiabilitiesAndEquity,
    };
  }, [entries, accountsList]);

  const isBalanced =
    statements.totalAssets === statements.totalLiabilitiesAndEquity;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">القوائم المالية</h1>
            <p className="section-subtitle">
              يتم إنشاء قائمة الدخل وقائمة المركز المالي تلقائيًا حسب أنواع
              الحسابات الموجودة في صفحة إدارة الحسابات.
            </p>
          </div>
          <div className="report-actions no-print">
  <button className="primary-btn" onClick={printStatements}>
    <Printer size={18} />
    طباعة / حفظ PDF
  </button>
</div>

          <div className="stats-box">
            <div>
              <span>صافي النتيجة</span>
              <strong
                className={statements.netIncome >= 0 ? "good-text" : "bad-text"}
              >
                {Math.abs(statements.netIncome).toLocaleString()} ريال
              </strong>
            </div>

            <div>
              <span>الحالة</span>
              <strong>{statements.netIncome >= 0 ? "ربح" : "خسارة"}</strong>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="coming-card">
            <h2>لا توجد بيانات بعد</h2>
            <p>
              أضف قيودًا من صفحة دفتر اليومية، وبعدها ستظهر القوائم المالية هنا
              تلقائيًا.
            </p>
          </div>
        ) : (
          <>
            {statements.unknownAccounts.length > 0 && (
              <div className="balance-status error">
                <AlertCircle size={22} />
                <span>
                  توجد حسابات غير مصنفة. افتح صفحة إدارة الحسابات وأضف هذه
                  الحسابات مع تحديد نوعها حتى تظهر القوائم بشكل صحيح.
                </span>
              </div>
            )}

            <div
              className={
                isBalanced ? "balance-status success" : "balance-status error"
              }
            >
              {isBalanced ? (
                <CheckCircle2 size={22} />
              ) : (
                <AlertCircle size={22} />
              )}

              {isBalanced ? (
                <span>قائمة المركز المالي متوازنة</span>
              ) : (
                <span>
                  قائمة المركز المالي غير متوازنة، راجع تصنيف الحسابات أو القيود.
                </span>
              )}
            </div>

            <div className="statements-grid">
              <div className="statement-card">
                <div className="statement-title">
                  <TrendingUp size={24} />
                  <h2>قائمة الدخل</h2>
                </div>

                <div className="statement-section">
                  <h3>الإيرادات</h3>

                  {statements.revenues.length === 0 ? (
                    <p className="empty-text">لا توجد إيرادات.</p>
                  ) : (
                    statements.revenues.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{account.balance.toLocaleString()} ريال</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الإيرادات</span>
                    <strong>
                      {statements.totalRevenues.toLocaleString()} ريال
                    </strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>المصروفات</h3>

                  {statements.expenses.length === 0 ? (
                    <p className="empty-text">لا توجد مصروفات.</p>
                  ) : (
                    statements.expenses.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{account.balance.toLocaleString()} ريال</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي المصروفات</span>
                    <strong>
                      {statements.totalExpenses.toLocaleString()} ريال
                    </strong>
                  </div>
                </div>

                <div
                  className={
                    statements.netIncome >= 0
                      ? "net-result profit"
                      : "net-result loss"
                  }
                >
                  <span>
                    {statements.netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}
                  </span>
                  <strong>
                    {Math.abs(statements.netIncome).toLocaleString()} ريال
                  </strong>
                </div>
              </div>

              <div className="statement-card">
                <div className="statement-title">
                  <Building2 size={24} />
                  <h2>قائمة المركز المالي</h2>
                </div>

                <div className="statement-section">
                  <h3>الأصول</h3>

                  {statements.assets.length === 0 ? (
                    <p className="empty-text">لا توجد أصول.</p>
                  ) : (
                    statements.assets.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{account.balance.toLocaleString()} ريال</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الأصول</span>
                    <strong>{statements.totalAssets.toLocaleString()} ريال</strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>الخصوم</h3>

                  {statements.liabilities.length === 0 ? (
                    <p className="empty-text">لا توجد خصوم.</p>
                  ) : (
                    statements.liabilities.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{account.balance.toLocaleString()} ريال</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-total">
                    <span>إجمالي الخصوم</span>
                    <strong>
                      {statements.totalLiabilities.toLocaleString()} ريال
                    </strong>
                  </div>
                </div>

                <div className="statement-section">
                  <h3>حقوق الملكية</h3>

                  {statements.equity.length === 0 ? (
                    <p className="empty-text">لا توجد حقوق ملكية.</p>
                  ) : (
                    statements.equity.map((account) => (
                      <div className="statement-row" key={account.name}>
                        <span>{account.name}</span>
                        <strong>{account.balance.toLocaleString()} ريال</strong>
                      </div>
                    ))
                  )}

                  <div className="statement-row">
                    <span>
                      {statements.netIncome >= 0
                        ? "صافي الربح"
                        : "صافي الخسارة"}
                    </span>
                    <strong>{statements.netIncome.toLocaleString()} ريال</strong>
                  </div>

                  <div className="statement-total">
                    <span>إجمالي حقوق الملكية</span>
                    <strong>{statements.totalEquity.toLocaleString()} ريال</strong>
                  </div>
                </div>

                <div className="net-result">
                  <span>إجمالي الخصوم وحقوق الملكية</span>
                  <strong>
                    {statements.totalLiabilitiesAndEquity.toLocaleString()} ريال
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StatementsPage;