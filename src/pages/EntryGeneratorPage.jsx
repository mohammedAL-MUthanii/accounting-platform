import { useMemo, useState } from "react";
import {
  Wand2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

import AppToast from "../components/AppToast";

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
};

const operationTypes = [
  {
    value: "capital_cash",
    label: "إثبات رأس مال نقدي",
    description: "عندما يبدأ صاحب المنشأة النشاط بإيداع مبلغ نقدي.",
  },
  {
    value: "cash_sale",
    label: "بيع نقدي",
    description: "عندما تبيع المنشأة وتحصل المبلغ نقدًا فورًا.",
  },
  {
    value: "credit_sale",
    label: "بيع آجل",
    description: "عندما تبيع المنشأة للعميل على الحساب.",
  },
  {
    value: "cash_purchase",
    label: "شراء نقدي",
    description: "عندما تشتري المنشأة بضاعة أو أصلًا وتدفع نقدًا.",
  },
  {
    value: "credit_purchase",
    label: "شراء آجل",
    description: "عندما تشتري المنشأة بضاعة أو أصلًا من المورد على الحساب.",
  },
  {
    value: "pay_expense",
    label: "دفع مصروف",
    description: "عندما تدفع المنشأة مصروفًا مثل الإيجار أو الرواتب.",
  },
  {
    value: "collect_customer",
    label: "تحصيل من عميل",
    description: "عندما تحصل المنشأة مبلغًا من عميل كان عليه دين.",
  },
  {
    value: "pay_supplier",
    label: "سداد مورد",
    description: "عندما تسدد المنشأة مبلغًا لمورد.",
  },
];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function EntryGeneratorPage() {
  const accounts = readArray("accounts").length > 0
    ? readArray("accounts")
    : defaultAccounts;

  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    operationType: "capital_cash",
    mainAccount: "",
    paymentAccount: "الصندوق",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const selectedOperation = operationTypes.find(
    (operation) => operation.value === form.operationType
  );

  const assetAccounts = accounts.filter((account) => account.type === "asset");
  const expenseAccounts = accounts.filter((account) => account.type === "expense");
  const revenueAccounts = accounts.filter((account) => account.type === "revenue");
  const equityAccounts = accounts.filter((account) => account.type === "equity");
  const liabilityAccounts = accounts.filter(
    (account) => account.type === "liability"
  );

  const cashLikeAccounts = accounts.filter((account) => {
    return account.name === "الصندوق" || account.name === "البنك";
  });

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  function getDefaultDescription() {
    switch (form.operationType) {
      case "capital_cash":
        return "إثبات رأس مال نقدي";
      case "cash_sale":
        return "بيع نقدي";
      case "credit_sale":
        return "بيع آجل";
      case "cash_purchase":
        return "شراء نقدي";
      case "credit_purchase":
        return "شراء آجل";
      case "pay_expense":
        return "دفع مصروف";
      case "collect_customer":
        return "تحصيل من عميل";
      case "pay_supplier":
        return "سداد مورد";
      default:
        return "قيد محاسبي مولد";
    }
  }

  const generatedEntry = useMemo(() => {
    const amount = Number(form.amount);

    if (!form.operationType || !amount || amount <= 0) {
      return null;
    }

    switch (form.operationType) {
      case "capital_cash":
        return {
          debitAccount: form.paymentAccount,
          creditAccount: form.mainAccount || "رأس المال",
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "cash_sale":
        return {
          debitAccount: form.paymentAccount,
          creditAccount: form.mainAccount || "المبيعات",
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "credit_sale":
        return {
          debitAccount: form.mainAccount || "العملاء",
          creditAccount: "المبيعات",
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "cash_purchase":
        return {
          debitAccount: form.mainAccount,
          creditAccount: form.paymentAccount,
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "credit_purchase":
        return {
          debitAccount: form.mainAccount,
          creditAccount: form.paymentAccount || "الموردون",
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "pay_expense":
        return {
          debitAccount: form.mainAccount,
          creditAccount: form.paymentAccount,
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "collect_customer":
        return {
          debitAccount: form.paymentAccount,
          creditAccount: form.mainAccount || "العملاء",
          description: form.description || getDefaultDescription(),
          amount,
        };

      case "pay_supplier":
        return {
          debitAccount: form.mainAccount || "الموردون",
          creditAccount: form.paymentAccount,
          description: form.description || getDefaultDescription(),
          amount,
        };

      default:
        return null;
    }
  }, [form]);

  function getMainAccountOptions() {
    switch (form.operationType) {
      case "capital_cash":
        return equityAccounts;
      case "cash_sale":
        return revenueAccounts;
      case "credit_sale":
        return accounts.filter((account) => account.name === "العملاء");
      case "cash_purchase":
        return accounts.filter((account) => {
          return account.type === "asset" || account.type === "expense";
        });
      case "credit_purchase":
        return accounts.filter((account) => {
          return account.type === "asset" || account.type === "expense";
        });
      case "pay_expense":
        return expenseAccounts;
      case "collect_customer":
        return accounts.filter((account) => account.name === "العملاء");
      case "pay_supplier":
        return liabilityAccounts;
      default:
        return accounts;
    }
  }

  function getPaymentAccountOptions() {
    switch (form.operationType) {
      case "credit_purchase":
        return liabilityAccounts;
      default:
        return cashLikeAccounts.length > 0 ? cashLikeAccounts : assetAccounts;
    }
  }

  function getMainAccountLabel() {
    switch (form.operationType) {
      case "capital_cash":
        return "حساب رأس المال";
      case "cash_sale":
        return "حساب الإيراد";
      case "credit_sale":
        return "حساب العميل";
      case "cash_purchase":
        return "الحساب المشترى";
      case "credit_purchase":
        return "الحساب المشترى";
      case "pay_expense":
        return "حساب المصروف";
      case "collect_customer":
        return "حساب العميل";
      case "pay_supplier":
        return "حساب المورد";
      default:
        return "الحساب";
    }
  }

  function getPaymentAccountLabel() {
    switch (form.operationType) {
      case "credit_purchase":
        return "حساب المورد";
      default:
        return "حساب الدفع / التحصيل";
    }
  }

  function validateGeneratedEntry() {
    if (!form.date) {
      showToast("اختر تاريخ العملية قبل حفظ القيد.", "warning");
      return false;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      showToast("أدخل مبلغًا صحيحًا أكبر من صفر.", "warning");
      return false;
    }

    if (!generatedEntry) {
      showToast("أكمل البيانات المطلوبة أولًا حتى يتم توليد القيد.", "warning");
      return false;
    }

    if (!generatedEntry.debitAccount || !generatedEntry.creditAccount) {
      showToast("اختر الحسابات المطلوبة قبل حفظ القيد.", "warning");
      return false;
    }

    if (generatedEntry.debitAccount === generatedEntry.creditAccount) {
      showToast("لا يمكن أن يكون الحساب المدين هو نفسه الحساب الدائن.", "error");
      return false;
    }

    return true;
  }

  function saveEntryToJournal() {
    if (!validateGeneratedEntry()) return;

    const savedEntries = readArray("journalEntries");

    const maxNumber = savedEntries.length
      ? Math.max(...savedEntries.map((entry) => Number(entry.number || 0)))
      : 0;

    const newEntry = {
      id: Date.now(),
      number: maxNumber + 1,
      date: form.date,
      debitAccount: generatedEntry.debitAccount,
      creditAccount: generatedEntry.creditAccount,
      description: generatedEntry.description,
      amount: generatedEntry.amount,
      source: "entry-generator",
    };

    localStorage.setItem(
      "journalEntries",
      JSON.stringify([newEntry, ...savedEntries])
    );

    showToast("تم حفظ القيد في دفتر اليومية بنجاح.");
  }

  function resetGenerator() {
    setForm({
      operationType: "capital_cash",
      mainAccount: "",
      paymentAccount: "الصندوق",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
    });

    showToast("تمت إعادة ضبط مولّد القيود.", "success");
  }

  const mainOptions = getMainAccountOptions();
  const paymentOptions = getPaymentAccountOptions();

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">مولّد القيود المحاسبية</h1>
            <p className="section-subtitle">
              اختر نوع العملية، ثم أدخل الحسابات والمبلغ، وسيقوم النظام بتوليد
              القيد المحاسبي الصحيح تلقائيًا.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الحسابات</span>
              <strong>{accounts.length}</strong>
            </div>

            <div>
              <span>أنواع العمليات</span>
              <strong>{operationTypes.length}</strong>
            </div>
          </div>
        </div>

        <div className="generator-layout">
          <form className="generator-form">
            <div className="form-title">
              <Wand2 size={22} />
              <h2>بيانات العملية</h2>
            </div>

            <label>
              نوع العملية
              <select
                name="operationType"
                value={form.operationType}
                onChange={handleChange}
              >
                {operationTypes.map((operation) => (
                  <option key={operation.value} value={operation.value}>
                    {operation.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="operation-help">
              <AlertCircle size={18} />
              <span>{selectedOperation?.description}</span>
            </div>

            <label>
              التاريخ
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </label>

            <label>
              {getMainAccountLabel()}
              <select
                name="mainAccount"
                value={form.mainAccount}
                onChange={handleChange}
              >
                <option value="">اختر الحساب</option>
                {mainOptions.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name} - {accountTypeNames[account.type]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {getPaymentAccountLabel()}
              <select
                name="paymentAccount"
                value={form.paymentAccount}
                onChange={handleChange}
              >
                <option value="">اختر الحساب</option>
                {paymentOptions.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name} - {accountTypeNames[account.type]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              البيان
              <textarea
                name="description"
                placeholder={`مثال: ${getDefaultDescription()}`}
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <label>
              المبلغ
              <input
                type="number"
                name="amount"
                placeholder="مثال: 50000"
                value={form.amount}
                onChange={handleChange}
              />
            </label>

            <div className="generator-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={saveEntryToJournal}
              >
                <Save size={18} />
                حفظ في دفتر اليومية
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={resetGenerator}
              >
                <RefreshCcw size={18} />
                إعادة ضبط
              </button>
            </div>
          </form>

          <div className="generated-entry-card">
            <div className="form-title">
              <CheckCircle2 size={22} />
              <h2>القيد الناتج</h2>
            </div>

            {!generatedEntry ? (
              <p className="empty-text">
                أدخل نوع العملية والمبلغ والحسابات حتى يظهر القيد هنا.
              </p>
            ) : (
              <>
                <div className="generated-entry-preview">
                  <div>
                    <span>من حـ/</span>
                    <strong>{generatedEntry.debitAccount || "غير محدد"}</strong>
                  </div>

                  <div>
                    <span>إلى حـ/</span>
                    <strong>{generatedEntry.creditAccount || "غير محدد"}</strong>
                  </div>

                  <div>
                    <span>البيان</span>
                    <strong>{generatedEntry.description}</strong>
                  </div>

                  <div>
                    <span>المبلغ</span>
                    <strong>
                      {generatedEntry.amount.toLocaleString()} ريال
                    </strong>
                  </div>
                </div>

                <div className="balance-status success">
                  <CheckCircle2 size={20} />
                  <span>القيد متوازن: المدين يساوي الدائن</span>
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

export default EntryGeneratorPage;