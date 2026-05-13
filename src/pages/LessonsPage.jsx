const lessons = [
  {
    title: "معادلة المحاسبة",
    tag: "Accounting Equation",
    text: "الأصول = الخصوم + حقوق الملكية. هذه المعادلة هي الأساس الذي تقوم عليه المحاسبة.",
  },
  {
    title: "الأصول",
    tag: "Assets",
    text: "الأصول هي كل ما تمتلكه المنشأة وله قيمة، مثل الصندوق، البنك، المباني، السيارات، والمخزون.",
  },
  {
    title: "الخصوم",
    tag: "Liabilities",
    text: "الخصوم هي الالتزامات التي على المنشأة للغير، مثل القروض والموردين والدائنين.",
  },
  {
    title: "حقوق الملكية",
    tag: "Equity",
    text: "حقوق الملكية تمثل حق صاحب المنشأة في أصول المشروع بعد خصم الالتزامات.",
  },
  {
    title: "المدين والدائن",
    tag: "Debit & Credit",
    text: "كل عملية مالية لها طرف مدين وطرف دائن، ويجب أن يكون مجموع المدين مساويًا لمجموع الدائن.",
  },
  {
    title: "القيد المحاسبي",
    tag: "Journal Entry",
    text: "القيد المحاسبي هو تسجيل العملية المالية بتحديد الحساب المدين والحساب الدائن والمبلغ والبيان.",
  },
];

function LessonsPage() {
  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title">الدروس المحاسبية</h1>
        <p className="section-subtitle">
          هنا نبدأ بأساسيات المحاسبة قبل الدخول في التطبيق العملي.
        </p>

        <div className="lessons-grid">
          {lessons.map((lesson, index) => (
            <div className="lesson-card" key={lesson.title}>
              <div className="lesson-number">{index + 1}</div>
              <span>{lesson.tag}</span>
              <h3>{lesson.title}</h3>
              <p>{lesson.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LessonsPage;