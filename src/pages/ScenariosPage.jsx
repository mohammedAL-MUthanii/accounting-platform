import { useMemo, useState } from "react";
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Layers,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";

const accounts = [
  "الصندوق",
  "البنك",
  "العملاء",
  "المخزون",
  "الأثاث",
  "معدات",
  "الموردون",
  "رأس المال",
  "المبيعات",
  "المشتريات",
  "مصروف الإيجار",
  "مصروف الرواتب",
  "مصروف الكهرباء",
  "مصروف الإعلان",
  "إيرادات خدمات",
  "مسحوبات شخصية",
];

const scenarioBank = [
  {
    level: "beginner",
    title: "رأس مال المنشأة",
    text: "بدأ صاحب المنشأة نشاطه بإيداع 100,000 ريال نقدًا في الصندوق.",
    debit: "الصندوق",
    credit: "رأس المال",
    explanation: "الصندوق زاد وهو أصل، لذلك يكون مدينًا. ورأس المال زاد وهو حقوق ملكية، لذلك يكون دائنًا.",
  },
  {
    level: "beginner",
    title: "إيداع رأس مال في البنك",
    text: "أودع صاحب المنشأة 250,000 ريال في حساب البنك كرأس مال.",
    debit: "البنك",
    credit: "رأس المال",
    explanation: "البنك أصل زاد، ورأس المال زاد كحقوق ملكية.",
  },
  {
    level: "beginner",
    title: "شراء أثاث نقدًا",
    text: "اشترت المنشأة أثاثًا نقدًا بمبلغ 35,000 ريال.",
    debit: "الأثاث",
    credit: "الصندوق",
    explanation: "الأثاث أصل زاد، والصندوق أصل نقص بسبب الدفع النقدي.",
  },
  {
    level: "beginner",
    title: "شراء معدات نقدًا",
    text: "اشترت المنشأة معدات نقدًا بمبلغ 70,000 ريال.",
    debit: "معدات",
    credit: "الصندوق",
    explanation: "المعدات أصل زاد، والصندوق نقص لأنه تم الدفع نقدًا.",
  },
  {
    level: "beginner",
    title: "دفع إيجار",
    text: "دفعت المنشأة إيجار المحل نقدًا بمبلغ 12,000 ريال.",
    debit: "مصروف الإيجار",
    credit: "الصندوق",
    explanation: "مصروف الإيجار زاد وهو مدين، والصندوق نقص وهو دائن.",
  },
  {
    level: "beginner",
    title: "دفع رواتب",
    text: "دفعت المنشأة رواتب الموظفين نقدًا بمبلغ 30,000 ريال.",
    debit: "مصروف الرواتب",
    credit: "الصندوق",
    explanation: "الرواتب مصروف زاد، والصندوق نقص.",
  },
  {
    level: "beginner",
    title: "دفع كهرباء",
    text: "دفعت المنشأة فاتورة الكهرباء نقدًا بمبلغ 8,000 ريال.",
    debit: "مصروف الكهرباء",
    credit: "الصندوق",
    explanation: "مصروف الكهرباء زاد، والصندوق نقص.",
  },
  {
    level: "beginner",
    title: "بيع نقدي",
    text: "باعت المنشأة بضاعة نقدًا بمبلغ 45,000 ريال.",
    debit: "الصندوق",
    credit: "المبيعات",
    explanation: "استلمت المنشأة نقدية، فالصندوق مدين. وحققت مبيعات، فالمبيعات دائن.",
  },
  {
    level: "beginner",
    title: "بيع عن طريق البنك",
    text: "باعت المنشأة بضاعة واستلمت المبلغ في البنك بقيمة 60,000 ريال.",
    debit: "البنك",
    credit: "المبيعات",
    explanation: "البنك زاد لأنه تم الاستلام فيه، والمبيعات زادت كإيراد.",
  },
  {
    level: "beginner",
    title: "تقديم خدمة نقدًا",
    text: "قدمت المنشأة خدمة لعميل واستلمت 15,000 ريال نقدًا.",
    debit: "الصندوق",
    credit: "إيرادات خدمات",
    explanation: "الصندوق زاد، وإيرادات الخدمات زادت كإيراد دائن.",
  },
  {
    level: "beginner",
    title: "سحب شخصي",
    text: "سحب صاحب المنشأة 10,000 ريال من الصندوق لاستخدامه الشخصي.",
    debit: "مسحوبات شخصية",
    credit: "الصندوق",
    explanation: "المسحوبات الشخصية تزيد مدينة، والصندوق ينقص دائنًا.",
  },
  {
    level: "beginner",
    title: "إعلان نقدي",
    text: "دفعت المنشأة مصروف إعلان نقدًا بمبلغ 5,000 ريال.",
    debit: "مصروف الإعلان",
    credit: "الصندوق",
    explanation: "مصروف الإعلان زاد، والصندوق نقص.",
  },

  {
    level: "intermediate",
    title: "بيع آجل",
    text: "باعت المنشأة بضاعة آجلًا لأحد العملاء بمبلغ 80,000 ريال.",
    debit: "العملاء",
    credit: "المبيعات",
    explanation: "العميل أصبح مدينًا للمنشأة، والمبيعات زادت.",
  },
  {
    level: "intermediate",
    title: "تحصيل من عميل",
    text: "حصلت المنشأة 25,000 ريال نقدًا من عميل كان عليه مبلغ سابق.",
    debit: "الصندوق",
    credit: "العملاء",
    explanation: "الصندوق زاد، ورصيد العملاء نقص لأن العميل سدد جزءًا من الدين.",
  },
  {
    level: "intermediate",
    title: "تحصيل من عميل في البنك",
    text: "حول أحد العملاء مبلغ 40,000 ريال إلى حساب البنك سدادًا من حسابه.",
    debit: "البنك",
    credit: "العملاء",
    explanation: "البنك زاد، والعملاء نقصوا لأن العميل سدد.",
  },
  {
    level: "intermediate",
    title: "شراء بضاعة نقدًا",
    text: "اشترت المنشأة بضاعة للمخزون نقدًا بمبلغ 90,000 ريال.",
    debit: "المخزون",
    credit: "الصندوق",
    explanation: "المخزون زاد، والصندوق نقص بسبب الدفع النقدي.",
  },
  {
    level: "intermediate",
    title: "شراء بضاعة آجلًا",
    text: "اشترت المنشأة بضاعة من مورد آجلًا بمبلغ 120,000 ريال.",
    debit: "المخزون",
    credit: "الموردون",
    explanation: "المخزون زاد، والموردون زادوا كالتزام على المنشأة.",
  },
  {
    level: "intermediate",
    title: "سداد مورد نقدًا",
    text: "سددت المنشأة للمورد مبلغ 50,000 ريال نقدًا.",
    debit: "الموردون",
    credit: "الصندوق",
    explanation: "الموردون نقصوا لأننا سددنا الدين، والصندوق نقص.",
  },
  {
    level: "intermediate",
    title: "سداد مورد من البنك",
    text: "سددت المنشأة للمورد مبلغ 75,000 ريال من حساب البنك.",
    debit: "الموردون",
    credit: "البنك",
    explanation: "الموردون نقصوا، والبنك نقص بسبب الدفع.",
  },
  {
    level: "intermediate",
    title: "شراء أثاث آجلًا",
    text: "اشترت المنشأة أثاثًا من مورد آجلًا بمبلغ 55,000 ريال.",
    debit: "الأثاث",
    credit: "الموردون",
    explanation: "الأثاث أصل زاد، والموردون زادوا لأن الشراء آجل.",
  },
  {
    level: "intermediate",
    title: "شراء معدات آجلًا",
    text: "اشترت المنشأة معدات آجلًا بمبلغ 160,000 ريال.",
    debit: "معدات",
    credit: "الموردون",
    explanation: "المعدات أصل زاد، والموردون التزام زاد.",
  },
  {
    level: "intermediate",
    title: "مبيعات خدمة آجلًا",
    text: "قدمت المنشأة خدمات لأحد العملاء آجلًا بمبلغ 22,000 ريال.",
    debit: "العملاء",
    credit: "إيرادات خدمات",
    explanation: "العميل أصبح مدينًا، والإيراد تحقق.",
  },
  {
    level: "intermediate",
    title: "دفع إعلان من البنك",
    text: "دفعت المنشأة مصروف إعلان من البنك بمبلغ 18,000 ريال.",
    debit: "مصروف الإعلان",
    credit: "البنك",
    explanation: "مصروف الإعلان زاد، والبنك نقص.",
  },
  {
    level: "intermediate",
    title: "دفع رواتب من البنك",
    text: "دفعت المنشأة رواتب الموظفين من البنك بمبلغ 65,000 ريال.",
    debit: "مصروف الرواتب",
    credit: "البنك",
    explanation: "الرواتب مصروف زاد، والبنك نقص.",
  },
  {
    level: "intermediate",
    title: "شراء بضاعة وسداد نقدًا",
    text: "اشترت المنشأة بضاعة للمخزون وسددت قيمتها نقدًا بمبلغ 33,000 ريال.",
    debit: "المخزون",
    credit: "الصندوق",
    explanation: "المخزون زاد، والصندوق نقص.",
  },
  {
    level: "intermediate",
    title: "تحصيل إيراد خدمة",
    text: "استلمت المنشأة 9,000 ريال نقدًا مقابل خدمة محاسبية.",
    debit: "الصندوق",
    credit: "إيرادات خدمات",
    explanation: "تم استلام نقدية وتحقق إيراد خدمة.",
  },

  {
    level: "advanced",
    title: "بيع آجل وتحليل العملاء",
    text: "باعت المنشأة بضاعة آجلًا للعميل علي بمبلغ 135,000 ريال.",
    debit: "العملاء",
    credit: "المبيعات",
    explanation: "البيع الآجل يزيد رصيد العملاء مدينًا ويزيد المبيعات دائنًا.",
  },
  {
    level: "advanced",
    title: "تحصيل جزئي من عميل",
    text: "كان على العميل محمد مبلغ سابق، وحصلت المنشأة منه 45,000 ريال في البنك.",
    debit: "البنك",
    credit: "العملاء",
    explanation: "البنك زاد، وحساب العملاء نقص بسبب التحصيل.",
  },
  {
    level: "advanced",
    title: "شراء آجل من مورد",
    text: "اشترت المنشأة بضاعة من مورد حوالات آجلًا بمبلغ 210,000 ريال.",
    debit: "المخزون",
    credit: "الموردون",
    explanation: "زادت البضاعة في المخزون، وزاد الالتزام للمورد.",
  },
  {
    level: "advanced",
    title: "سداد جزء من المورد",
    text: "سددت المنشأة 60,000 ريال من البنك لمورد كانت عليه مديونية.",
    debit: "الموردون",
    credit: "البنك",
    explanation: "الموردون نقصوا، والبنك نقص.",
  },
  {
    level: "advanced",
    title: "مصروف تشغيلي",
    text: "دفعت المنشأة 24,000 ريال مصروف كهرباء من البنك.",
    debit: "مصروف الكهرباء",
    credit: "البنك",
    explanation: "المصروف زاد، والبنك نقص.",
  },
  {
    level: "advanced",
    title: "إيداع نقدية في البنك",
    text: "أودعت المنشأة 100,000 ريال من الصندوق إلى البنك.",
    debit: "البنك",
    credit: "الصندوق",
    explanation: "البنك زاد والصندوق نقص. كلاهما أصول لكن أحدهما زاد والآخر نقص.",
  },
  {
    level: "advanced",
    title: "سحب نقدية من البنك",
    text: "سحبت المنشأة 40,000 ريال من البنك وأودعتها في الصندوق.",
    debit: "الصندوق",
    credit: "البنك",
    explanation: "الصندوق زاد والبنك نقص.",
  },
  {
    level: "advanced",
    title: "شراء معدات نقدًا من البنك",
    text: "اشترت المنشأة معدات تشغيلية وسددت قيمتها من البنك بمبلغ 95,000 ريال.",
    debit: "معدات",
    credit: "البنك",
    explanation: "المعدات أصل زاد، والبنك نقص.",
  },
  {
    level: "advanced",
    title: "مسحوبات من البنك",
    text: "سحب صاحب المنشأة 30,000 ريال من البنك لاستخدامه الشخصي.",
    debit: "مسحوبات شخصية",
    credit: "البنك",
    explanation: "المسحوبات الشخصية مدينة، والبنك دائن لأنه نقص.",
  },
  {
    level: "advanced",
    title: "إعلان آجل",
    text: "حصلت المنشأة على خدمة إعلان آجلًا بمبلغ 16,000 ريال من جهة خارجية.",
    debit: "مصروف الإعلان",
    credit: "الموردون",
    explanation: "المصروف زاد، والالتزام للمورد أو الجهة زاد.",
  },
  {
    level: "advanced",
    title: "إيجار مستحق آجلًا",
    text: "استحق على المنشأة إيجار محل بمبلغ 20,000 ريال ولم يتم سداده بعد.",
    debit: "مصروف الإيجار",
    credit: "الموردون",
    explanation: "الإيجار مصروف زاد، وبما أنه لم يدفع بعد فيسجل كالتزام.",
  },
  {
    level: "advanced",
    title: "خدمات آجلًا",
    text: "قدمت المنشأة خدمات لأحد العملاء بقيمة 48,000 ريال ولم تستلم المبلغ بعد.",
    debit: "العملاء",
    credit: "إيرادات خدمات",
    explanation: "العميل مدين، والإيراد تحقق.",
  },
  {
    level: "advanced",
    title: "شراء مخزون من البنك",
    text: "اشترت المنشأة مخزونًا جديدًا وسددت قيمته من البنك بمبلغ 180,000 ريال.",
    debit: "المخزون",
    credit: "البنك",
    explanation: "المخزون زاد، والبنك نقص.",
  },
  {
    level: "advanced",
    title: "بيع نقدي كبير",
    text: "باعت المنشأة بضاعة واستلمت قيمتها نقدًا بمبلغ 220,000 ريال.",
    debit: "الصندوق",
    credit: "المبيعات",
    explanation: "الصندوق زاد بسبب الاستلام، والمبيعات زادت كإيراد.",
  },
  {
    level: "advanced",
    title: "بيع بنكي كبير",
    text: "باعت المنشأة بضاعة وتم تحويل مبلغ 300,000 ريال إلى البنك.",
    debit: "البنك",
    credit: "المبيعات",
    explanation: "البنك زاد، والمبيعات زادت.",
  },
];

const levelOptions = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all: "كل المستويات",
};

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function buildScenarioExam(level) {
  const source =
    level === "all"
      ? scenarioBank
      : scenarioBank.filter((scenario) => scenario.level === level);

  return shuffleArray(source).slice(0, Math.min(15, source.length));
}

function ScenariosPage() {
  const [level, setLevel] = useState("beginner");
  const [scenarioQuestions, setScenarioQuestions] = useState(() =>
    buildScenarioExam("beginner")
  );
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);

  const result = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    scenarioQuestions.forEach((scenario, index) => {
      const answer = answers[index];

      if (!answer?.debit || !answer?.credit) {
        unanswered += 1;
        return;
      }

      if (answer.debit === scenario.debit && answer.credit === scenario.credit) {
        correct += 1;
      } else {
        wrong += 1;
      }
    });

    const percentage =
      scenarioQuestions.length > 0
        ? Math.round((correct / scenarioQuestions.length) * 100)
        : 0;

    return {
      correct,
      wrong,
      unanswered,
      percentage,
    };
  }, [answers, scenarioQuestions]);

  function startNewExam(selectedLevel = level) {
    setScenarioQuestions(buildScenarioExam(selectedLevel));
    setAnswers({});
    setIsSubmitted(false);
    setShowSolutions(false);
  }

  function handleLevelChange(e) {
    const selectedLevel = e.target.value;
    setLevel(selectedLevel);
    startNewExam(selectedLevel);
  }

  function updateAnswer(index, field, value) {
    if (isSubmitted) return;

    setAnswers((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  }

  function submitExam() {
    const confirmSubmit = window.confirm("هل تريد تصحيح السيناريوهات الآن؟");

    if (!confirmSubmit) return;

    setIsSubmitted(true);

    const savedResult = {
      type: "scenarios",
      level,
      total: scenarioQuestions.length,
      correct: result.correct,
      wrong: result.wrong,
      percentage: result.percentage,
      date: new Date().toISOString(),
    };

    localStorage.setItem("scenariosResult", JSON.stringify(savedResult));
  }

  function getGradeText() {
    if (result.percentage >= 90) return "تحليل ممتاز جدًا";
    if (result.percentage >= 80) return "تحليل ممتاز";
    if (result.percentage >= 70) return "جيد جدًا";
    if (result.percentage >= 60) return "جيد";
    if (result.percentage >= 50) return "مقبول";
    return "تحتاج تدريب أكثر";
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">السيناريوهات التدريبية</h1>
            <p className="section-subtitle">
              اختبر فهمك العملي للقيود المحاسبية من خلال 15 سيناريو عشوائيًا.
              اختر الحساب المدين والدائن، ثم شاهد التصحيح والشرح.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد السيناريوهات</span>
              <strong>{scenarioQuestions.length}</strong>
            </div>

            <div>
              <span>النتيجة</span>
              <strong>{isSubmitted ? `${result.percentage}%` : "-"}</strong>
            </div>
          </div>
        </div>

        <div className="scenario-control-panel">
          <div className="scenario-filter">
            <label>مستوى السيناريوهات</label>
            <select value={level} onChange={handleLevelChange}>
              <option value="beginner">{levelOptions.beginner}</option>
              <option value="intermediate">{levelOptions.intermediate}</option>
              <option value="advanced">{levelOptions.advanced}</option>
              <option value="all">{levelOptions.all}</option>
            </select>
          </div>

          <div className="scenario-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => startNewExam()}
            >
              <RotateCcw size={18} />
              سيناريوهات جديدة
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowSolutions(!showSolutions)}
            >
              {showSolutions ? <EyeOff size={18} /> : <Eye size={18} />}
              {showSolutions ? "إخفاء الحلول" : "عرض الحلول"}
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={submitExam}
              disabled={isSubmitted}
            >
              <CheckCircle2 size={18} />
              تصحيح السيناريوهات
            </button>
          </div>
        </div>

        <div className="scenario-summary-grid">
          <div className="scenario-summary-card">
            <GraduationCap size={28} />
            <span>المستوى</span>
            <strong>{levelOptions[level]}</strong>
          </div>

          <div className="scenario-summary-card">
            <Target size={28} />
            <span>تمت الإجابة</span>
            <strong>
              {Object.keys(answers).filter((key) => {
                return answers[key]?.debit && answers[key]?.credit;
              }).length}{" "}
              / {scenarioQuestions.length}
            </strong>
          </div>

          <div className="scenario-summary-card">
            <CheckCircle2 size={28} />
            <span>الصحيح</span>
            <strong className="good-text">
              {isSubmitted ? result.correct : "-"}
            </strong>
          </div>

          <div className="scenario-summary-card">
            <XCircle size={28} />
            <span>الخطأ</span>
            <strong className="bad-text">
              {isSubmitted ? result.wrong : "-"}
            </strong>
          </div>
        </div>

        {isSubmitted && (
          <div className="scenario-result-card">
            <div>
              <Trophy size={34} />
              <h2>{getGradeText()}</h2>
              <p>
                نتيجتك {result.correct} من {scenarioQuestions.length}، بنسبة{" "}
                {result.percentage}%.
              </p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => startNewExam()}
            >
              تدريب جديد بسيناريوهات مختلفة
            </button>
          </div>
        )}

        <div className="scenario-list">
          {scenarioQuestions.map((scenario, index) => {
            const answer = answers[index] || {};
            const isCorrect =
              answer.debit === scenario.debit && answer.credit === scenario.credit;

            return (
              <div className="scenario-card" key={`${scenario.title}-${index}`}>
                <div className="scenario-card-header">
                  <div>
                    <span>سيناريو {index + 1}</span>
                    <h2>{scenario.title}</h2>
                  </div>

                  <b>{levelOptions[scenario.level]}</b>
                </div>

                <p>{scenario.text}</p>

                <div className="scenario-answer-grid">
                  <label>
                    الحساب المدين
                    <select
                      value={answer.debit || ""}
                      onChange={(e) =>
                        updateAnswer(index, "debit", e.target.value)
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">اختر الحساب المدين</option>
                      {accounts.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    الحساب الدائن
                    <select
                      value={answer.credit || ""}
                      onChange={(e) =>
                        updateAnswer(index, "credit", e.target.value)
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">اختر الحساب الدائن</option>
                      {accounts.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {(isSubmitted || showSolutions) && (
                  <div
                    className={
                      isCorrect || showSolutions
                        ? "scenario-feedback correct"
                        : "scenario-feedback wrong"
                    }
                  >
                    {isSubmitted && (
                      <strong>
                        {isCorrect
                          ? "إجابة صحيحة ✅"
                          : "إجابة غير صحيحة ❌"}
                      </strong>
                    )}

                    <div className="correct-entry-box">
                      <div>
                        <span>من حـ/</span>
                        <b>{scenario.debit}</b>
                      </div>

                      <div>
                        <span>إلى حـ/</span>
                        <b>{scenario.credit}</b>
                      </div>
                    </div>

                    <p>{scenario.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="scenario-bottom-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => startNewExam()}
          >
            <RotateCcw size={18} />
            سيناريوهات جديدة
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={submitExam}
            disabled={isSubmitted}
          >
            <CheckCircle2 size={18} />
            تصحيح السيناريوهات
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenariosPage;