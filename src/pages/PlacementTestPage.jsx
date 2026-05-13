import { useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Target,
  Save,
} from "lucide-react";

const questionBank = [
  {
    level: "beginner",
    question: "أي حساب يزيد في الجانب المدين؟",
    options: ["الأصول", "الإيرادات", "الخصوم", "رأس المال"],
    answer: "الأصول",
    explanation: "الأصول تزيد في الجانب المدين وتنقص في الجانب الدائن.",
  },
  {
    level: "beginner",
    question: "أي حساب يزيد في الجانب الدائن؟",
    options: ["الإيرادات", "المصروفات", "الصندوق", "العملاء"],
    answer: "الإيرادات",
    explanation: "الإيرادات تزيد دائنة لأنها تمثل زيادة في حقوق الملكية.",
  },
  {
    level: "beginner",
    question: "إذا بدأ صاحب المنشأة برأس مال نقدي، فما الحساب المدين؟",
    options: ["الصندوق", "رأس المال", "المبيعات", "الموردون"],
    answer: "الصندوق",
    explanation: "الصندوق أصل زاد، لذلك يكون مدينًا.",
  },
  {
    level: "beginner",
    question: "رأس المال يعتبر من:",
    options: ["حقوق الملكية", "الأصول", "المصروفات", "الإيرادات"],
    answer: "حقوق الملكية",
    explanation: "رأس المال يمثل حق صاحب المنشأة في المنشأة.",
  },
  {
    level: "beginner",
    question: "حساب الموردون يعتبر:",
    options: ["خصم", "أصل", "مصروف", "إيراد"],
    answer: "خصم",
    explanation: "الموردون يمثلون التزامات على المنشأة.",
  },
  {
    level: "beginner",
    question: "حساب العملاء غالبًا يعتبر:",
    options: ["أصل", "خصم", "إيراد", "مصروف"],
    answer: "أصل",
    explanation: "العملاء يمثلون مبالغ مستحقة للمنشأة.",
  },
  {
    level: "beginner",
    question: "دفتر اليومية يستخدم في:",
    options: ["تسجيل القيود", "حساب الرواتب فقط", "حفظ الصور", "إدارة المستخدمين"],
    answer: "تسجيل القيود",
    explanation: "دفتر اليومية هو أول دفتر تسجل فيه العمليات المالية.",
  },
  {
    level: "beginner",
    question: "ميزان المراجعة يتحقق من:",
    options: ["تساوي المدين والدائن", "زيادة المخزون فقط", "عدد العملاء", "شكل الفاتورة"],
    answer: "تساوي المدين والدائن",
    explanation: "ميزان المراجعة يساعد على التأكد من توازن القيود.",
  },
  {
    level: "beginner",
    question: "إذا دفعت المنشأة إيجارًا نقدًا، فما الحساب الدائن؟",
    options: ["الصندوق", "مصروف الإيجار", "المبيعات", "العملاء"],
    answer: "الصندوق",
    explanation: "الصندوق نقص بسبب الدفع، لذلك يكون دائنًا.",
  },
  {
    level: "beginner",
    question: "إذا حققت المنشأة مبيعات نقدية، فما الحساب المدين؟",
    options: ["الصندوق", "المبيعات", "الموردون", "رأس المال"],
    answer: "الصندوق",
    explanation: "استلمت المنشأة نقدًا، لذلك الصندوق مدين.",
  },

  {
    level: "intermediate",
    question: "باعت المنشأة بضاعة آجلًا بمبلغ 50,000 ريال. ما القيد الصحيح؟",
    options: [
      "من حـ/ العملاء إلى حـ/ المبيعات",
      "من حـ/ الصندوق إلى حـ/ المبيعات",
      "من حـ/ المبيعات إلى حـ/ العملاء",
      "من حـ/ الموردون إلى حـ/ المبيعات",
    ],
    answer: "من حـ/ العملاء إلى حـ/ المبيعات",
    explanation: "في البيع الآجل يزيد العملاء مدينًا وتزيد المبيعات دائنًا.",
  },
  {
    level: "intermediate",
    question: "اشترت المنشأة مخزونًا آجلًا من مورد. ما الحساب الدائن؟",
    options: ["الموردون", "المخزون", "الصندوق", "المبيعات"],
    answer: "الموردون",
    explanation: "الشراء الآجل يزيد الالتزام تجاه الموردين.",
  },
  {
    level: "intermediate",
    question: "حصلت المنشأة من عميل مبلغًا نقديًا. ما القيد الصحيح؟",
    options: [
      "من حـ/ الصندوق إلى حـ/ العملاء",
      "من حـ/ العملاء إلى حـ/ الصندوق",
      "من حـ/ المبيعات إلى حـ/ العملاء",
      "من حـ/ الموردون إلى حـ/ الصندوق",
    ],
    answer: "من حـ/ الصندوق إلى حـ/ العملاء",
    explanation: "الصندوق زاد، ورصيد العميل نقص.",
  },
  {
    level: "intermediate",
    question: "سددت المنشأة للمورد نقدًا. ما الحساب المدين؟",
    options: ["الموردون", "الصندوق", "المبيعات", "العملاء"],
    answer: "الموردون",
    explanation: "سداد المورد يقلل الالتزام، لذلك الموردون مدين.",
  },
  {
    level: "intermediate",
    question: "إذا كانت المبيعات 100,000 والتكلفة 65,000، فالربح الإجمالي:",
    options: ["35,000", "65,000", "100,000", "165,000"],
    answer: "35,000",
    explanation: "الربح الإجمالي = المبيعات - التكلفة.",
  },
  {
    level: "intermediate",
    question: "إذا كان سعر البيع 8,000 والتكلفة 5,500، فربح الوحدة:",
    options: ["2,500", "5,500", "8,000", "13,500"],
    answer: "2,500",
    explanation: "ربح الوحدة = سعر البيع - التكلفة.",
  },
  {
    level: "intermediate",
    question: "إذا تم بيع 6 وحدات بسعر 4,000 للوحدة، فإجمالي البيع:",
    options: ["24,000", "10,000", "4,000", "6,000"],
    answer: "24,000",
    explanation: "إجمالي البيع = 6 × 4,000.",
  },
  {
    level: "intermediate",
    question: "إذا كان العميل مدينًا 90,000 وسدد 30,000، فالرصيد المتبقي:",
    options: ["60,000", "30,000", "90,000", "120,000"],
    answer: "60,000",
    explanation: "الرصيد = 90,000 - 30,000.",
  },
  {
    level: "intermediate",
    question: "قائمة الدخل تعرض غالبًا:",
    options: ["الإيرادات والمصروفات", "الأصول فقط", "الخصوم فقط", "المخزون فقط"],
    answer: "الإيرادات والمصروفات",
    explanation: "قائمة الدخل تقيس نتيجة النشاط من ربح أو خسارة.",
  },
  {
    level: "intermediate",
    question: "قائمة المركز المالي تعرض:",
    options: [
      "الأصول والخصوم وحقوق الملكية",
      "الإيرادات فقط",
      "المبيعات فقط",
      "المصروفات فقط",
    ],
    answer: "الأصول والخصوم وحقوق الملكية",
    explanation: "قائمة المركز المالي توضح الوضع المالي للمنشأة.",
  },

  {
    level: "advanced",
    question: "إذا كان مخزون أول المدة 30,000 والمشتريات 120,000 ومخزون آخر المدة 40,000، فتكلفة البضاعة المباعة:",
    options: ["110,000", "150,000", "80,000", "40,000"],
    answer: "110,000",
    explanation: "التكلفة = مخزون أول + مشتريات - مخزون آخر.",
  },
  {
    level: "advanced",
    question: "إذا كانت المبيعات 250,000 والتكلفة 150,000 والمصروفات 60,000، فصافي الربح:",
    options: ["40,000", "100,000", "190,000", "60,000"],
    answer: "40,000",
    explanation: "صافي الربح = 250,000 - 150,000 - 60,000.",
  },
  {
    level: "advanced",
    question: "إذا كانت الأصول 800,000 والخصوم 300,000، فحقوق الملكية:",
    options: ["500,000", "300,000", "800,000", "1,100,000"],
    answer: "500,000",
    explanation: "حقوق الملكية = الأصول - الخصوم.",
  },
  {
    level: "advanced",
    question: "إذا كانت الأصول 900,000 وحقوق الملكية 550,000، فالخصوم:",
    options: ["350,000", "550,000", "900,000", "1,450,000"],
    answer: "350,000",
    explanation: "الخصوم = الأصول - حقوق الملكية.",
  },
  {
    level: "advanced",
    question: "في نظام الجرد المستمر، عند بيع بضاعة، يجب أيضًا تسجيل:",
    options: [
      "تكلفة البضاعة المباعة ونقص المخزون",
      "زيادة رأس المال",
      "زيادة الموردين",
      "إلغاء المبيعات",
    ],
    answer: "تكلفة البضاعة المباعة ونقص المخزون",
    explanation: "الجرد المستمر يسجل خروج المخزون وتكلفة البضاعة المباعة عند البيع.",
  },
  {
    level: "advanced",
    question: "إذا باعت المنشأة 20 وحدة، سعر الوحدة 7,000 وتكلفتها 4,500، فالربح:",
    options: ["50,000", "140,000", "90,000", "2,500"],
    answer: "50,000",
    explanation: "ربح الوحدة 2,500، والربح الإجمالي = 2,500 × 20.",
  },
  {
    level: "advanced",
    question: "إذا كانت فواتير الشراء الآجلة أكثر من سندات الصرف للموردين، فغالبًا رصيد الموردين:",
    options: ["دائن", "مدين", "صفر دائمًا", "مصروف"],
    answer: "دائن",
    explanation: "الموردون يكونون دائنين عندما لا تزال هناك مبالغ مستحقة لهم.",
  },
  {
    level: "advanced",
    question: "إذا كانت فواتير البيع الآجلة أكثر من سندات القبض، فغالبًا رصيد العملاء:",
    options: ["مدين", "دائن", "صفر دائمًا", "خصم"],
    answer: "مدين",
    explanation: "العملاء يكونون مدينين عندما لا تزال عليهم مبالغ للمنشأة.",
  },
  {
    level: "advanced",
    question: "إذا كان قيد محاسبي من الصندوق إلى الصندوق، فهذا غالبًا:",
    options: ["غير منطقي", "صحيح دائمًا", "يزيد الربح", "يزيد المخزون"],
    answer: "غير منطقي",
    explanation: "لا معنى غالبًا لأن يكون نفس الحساب مدينًا ودائنًا في نفس العملية.",
  },
  {
    level: "advanced",
    question: "المعادلة المحاسبية الأساسية هي:",
    options: [
      "الأصول = الخصوم + حقوق الملكية",
      "المبيعات = الأصول + المصروفات",
      "المصروفات = الخصوم - الإيرادات",
      "الصندوق = المبيعات فقط",
    ],
    answer: "الأصول = الخصوم + حقوق الملكية",
    explanation: "هذه المعادلة أساس إعداد قائمة المركز المالي.",
  },

  {
    level: "beginner",
    question: "المبيعات تعتبر:",
    options: ["إيراد", "أصل", "خصم", "مصروف"],
    answer: "إيراد",
    explanation: "المبيعات من حسابات الإيرادات.",
  },
  {
    level: "beginner",
    question: "المشتريات أو تكلفة البضاعة غالبًا تعتبر:",
    options: ["مصروف أو تكلفة", "إيراد", "حقوق ملكية", "خصم دائمًا"],
    answer: "مصروف أو تكلفة",
    explanation: "المشتريات تمثل تكلفة مرتبطة بالحصول على البضاعة.",
  },
  {
    level: "intermediate",
    question: "إيداع مبلغ من الصندوق إلى البنك يعني:",
    options: [
      "زيادة البنك ونقص الصندوق",
      "زيادة الصندوق ونقص البنك",
      "زيادة المبيعات",
      "زيادة الموردين",
    ],
    answer: "زيادة البنك ونقص الصندوق",
    explanation: "تحويل داخلي بين أصلين: البنك يزيد والصندوق ينقص.",
  },
  {
    level: "advanced",
    question: "إذا كانت قيمة المخزون بالتكلفة 200,000 وقيمة بيعه المتوقعة 270,000، فالربح المتوقع:",
    options: ["70,000", "200,000", "270,000", "470,000"],
    answer: "70,000",
    explanation: "الربح المتوقع = قيمة البيع المتوقعة - التكلفة.",
  },
  {
    level: "intermediate",
    question: "سند القبض من عميل غالبًا يكون:",
    options: [
      "من حـ/ الصندوق أو البنك إلى حـ/ العملاء",
      "من حـ/ العملاء إلى حـ/ الصندوق",
      "من حـ/ الموردون إلى حـ/ البنك",
      "من حـ/ المبيعات إلى حـ/ الصندوق",
    ],
    answer: "من حـ/ الصندوق أو البنك إلى حـ/ العملاء",
    explanation: "نستلم نقدًا أو في البنك ونخفض رصيد العميل.",
  },
  {
    level: "intermediate",
    question: "سند الصرف لسداد مورد غالبًا يكون:",
    options: [
      "من حـ/ الموردون إلى حـ/ الصندوق أو البنك",
      "من حـ/ الصندوق إلى حـ/ الموردون",
      "من حـ/ العملاء إلى حـ/ المبيعات",
      "من حـ/ المبيعات إلى حـ/ البنك",
    ],
    answer: "من حـ/ الموردون إلى حـ/ الصندوق أو البنك",
    explanation: "نخفض التزام المورد ونخفض النقد أو البنك.",
  },
];

const levelInfo = {
  beginner: {
    label: "مبتدئ",
    description: "تحتاج تثبيت أساسيات المدين والدائن وتصنيف الحسابات.",
  },
  intermediate: {
    label: "متوسط",
    description: "عندك فهم جيد وتحتاج تطبيق أكثر على العمليات الواقعية.",
  },
  advanced: {
    label: "متقدم",
    description: "مستواك قوي وتقدر تنتقل لتحليل التقارير والأنظمة التجارية.",
  },
};

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function buildPlacementExam() {
  const beginners = shuffleArray(
    questionBank.filter((question) => question.level === "beginner")
  ).slice(0, 10);

  const intermediates = shuffleArray(
    questionBank.filter((question) => question.level === "intermediate")
  ).slice(0, 10);

  const advanced = shuffleArray(
    questionBank.filter((question) => question.level === "advanced")
  ).slice(0, 10);

  return shuffleArray([...beginners, ...intermediates, ...advanced]).map(
    (question) => ({
      ...question,
      options: shuffleArray(question.options),
    })
  );
}

function PlacementTestPage() {
  const [questions, setQuestions] = useState(() => buildPlacementExam());
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const result = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const levelScores = {
      beginner: { total: 0, correct: 0 },
      intermediate: { total: 0, correct: 0 },
      advanced: { total: 0, correct: 0 },
    };

    questions.forEach((question, index) => {
      levelScores[question.level].total += 1;

      const userAnswer = answers[index];

      if (!userAnswer) {
        unanswered += 1;
        return;
      }

      if (userAnswer === question.answer) {
        correct += 1;
        levelScores[question.level].correct += 1;
      } else {
        wrong += 1;
      }
    });

    const percentage =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    let finalLevel = "beginner";

    if (percentage >= 80 && levelScores.advanced.correct >= 7) {
      finalLevel = "advanced";
    } else if (percentage >= 55 && levelScores.intermediate.correct >= 5) {
      finalLevel = "intermediate";
    }

    return {
      correct,
      wrong,
      unanswered,
      percentage,
      levelScores,
      finalLevel,
      levelLabel: levelInfo[finalLevel].label,
      description: levelInfo[finalLevel].description,
    };
  }, [answers, questions]);

  function chooseAnswer(questionIndex, option) {
    if (isSubmitted) return;

    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  }

  function submitTest() {
    const confirmSubmit = window.confirm(
      "هل تريد إنهاء اختبار المستوى وحفظ النتيجة؟"
    );

    if (!confirmSubmit) return;

    const placementResult = {
      level: result.finalLevel,
      levelLabel: result.levelLabel,
      percentage: result.percentage,
      correct: result.correct,
      total: questions.length,
      date: new Date().toISOString(),
      description: result.description,
      levelScores: result.levelScores,
    };

    localStorage.setItem("placementResult", JSON.stringify(placementResult));

    setIsSubmitted(true);
    setSavedMessage("تم حفظ نتيجة اختبار المستوى وستظهر في الرئيسية ✅");
  }

  function restartTest() {
    setQuestions(buildPlacementExam());
    setAnswers({});
    setIsSubmitted(false);
    setSavedMessage("");
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">اختبار المستوى</h1>
            <p className="section-subtitle">
              اختبار عشوائي من 30 سؤالًا موزعة بين مبتدئ ومتوسط ومتقدم لتحديد
              مستواك المحاسبي بشكل أدق.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الأسئلة</span>
              <strong>{questions.length}</strong>
            </div>

            <div>
              <span>النتيجة</span>
              <strong>{isSubmitted ? `${result.percentage}%` : "-"}</strong>
            </div>
          </div>
        </div>

        {savedMessage && (
          <div className="balance-status success">
            <Save size={22} />
            <span>{savedMessage}</span>
          </div>
        )}

        <div className="placement-summary-grid">
          <div className="placement-summary-card">
            <Brain size={28} />
            <span>المستوى المتوقع</span>
            <strong>{isSubmitted ? result.levelLabel : "غير محدد"}</strong>
          </div>

          <div className="placement-summary-card">
            <Target size={28} />
            <span>تمت الإجابة</span>
            <strong>
              {Object.keys(answers).length} / {questions.length}
            </strong>
          </div>

          <div className="placement-summary-card">
            <CheckCircle2 size={28} />
            <span>الصحيح</span>
            <strong className="good-text">
              {isSubmitted ? result.correct : "-"}
            </strong>
          </div>

          <div className="placement-summary-card">
            <XCircle size={28} />
            <span>الخطأ</span>
            <strong className="bad-text">
              {isSubmitted ? result.wrong : "-"}
            </strong>
          </div>
        </div>

        {isSubmitted && (
          <div className="placement-result-card">
            <div>
              <Trophy size={38} />
              <h2>مستواك: {result.levelLabel}</h2>
              <p>{result.description}</p>
              <strong>
                نتيجتك {result.correct} من {questions.length}، بنسبة{" "}
                {result.percentage}%.
              </strong>
            </div>

            <button type="button" className="primary-btn" onClick={restartTest}>
              <RotateCcw size={18} />
              إعادة الاختبار
            </button>
          </div>
        )}

        <div className="placement-level-breakdown">
          <div>
            <span>أسئلة المبتدئ</span>
            <strong>
              {isSubmitted
                ? `${result.levelScores.beginner.correct} / ${result.levelScores.beginner.total}`
                : "10 أسئلة"}
            </strong>
          </div>

          <div>
            <span>أسئلة المتوسط</span>
            <strong>
              {isSubmitted
                ? `${result.levelScores.intermediate.correct} / ${result.levelScores.intermediate.total}`
                : "10 أسئلة"}
            </strong>
          </div>

          <div>
            <span>أسئلة المتقدم</span>
            <strong>
              {isSubmitted
                ? `${result.levelScores.advanced.correct} / ${result.levelScores.advanced.total}`
                : "10 أسئلة"}
            </strong>
          </div>
        </div>

        <div className="placement-questions-list">
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.answer;

            return (
              <div className="placement-question-card" key={`${question.question}-${index}`}>
                <div className="placement-question-header">
                  <span>سؤال {index + 1}</span>
                  <b>{levelInfo[question.level].label}</b>
                </div>

                <h2>{question.question}</h2>

                <div className="placement-options">
                  {question.options.map((option) => {
                    const selected = userAnswer === option;
                    const correctOption = question.answer === option;

                    let className = "placement-option";

                    if (selected) className += " selected";
                    if (isSubmitted && correctOption) className += " correct";
                    if (isSubmitted && selected && !correctOption) {
                      className += " wrong";
                    }

                    return (
                      <button
                        type="button"
                        key={option}
                        className={className}
                        onClick={() => chooseAnswer(index, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div
                    className={
                      isCorrect
                        ? "placement-explanation correct"
                        : "placement-explanation wrong"
                    }
                  >
                    {isCorrect ? (
                      <strong>إجابة صحيحة ✅</strong>
                    ) : (
                      <strong>
                        إجابة خاطئة ❌ — الإجابة الصحيحة: {question.answer}
                      </strong>
                    )}
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="placement-bottom-actions">
          <button type="button" className="secondary-btn" onClick={restartTest}>
            <RotateCcw size={18} />
            اختبار جديد
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={submitTest}
            disabled={isSubmitted}
          >
            <CheckCircle2 size={18} />
            إنهاء الاختبار وحفظ النتيجة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlacementTestPage;