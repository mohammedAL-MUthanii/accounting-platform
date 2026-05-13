import { useMemo, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Brain,
  Target,
} from "lucide-react";

const questionsBank = [
  {
    level: "beginner",
    question: "إذا بدأ صاحب المنشأة نشاطه بإيداع مبلغ نقدي في الصندوق، فما الحساب المدين؟",
    options: ["الصندوق", "رأس المال", "المبيعات", "الموردون"],
    answer: "الصندوق",
    explanation: "الصندوق زاد، والأصول إذا زادت تكون مدينة.",
  },
  {
    level: "beginner",
    question: "إذا اشترت المنشأة بضاعة نقدًا، فما الحساب الدائن؟",
    options: ["المشتريات", "المخزون", "الصندوق", "العملاء"],
    answer: "الصندوق",
    explanation: "تم دفع نقدية، لذلك الصندوق نقص، والنقص في الأصل يكون دائنًا.",
  },
  {
    level: "beginner",
    question: "إذا باعت المنشأة بضاعة نقدًا، فما الحساب المدين؟",
    options: ["المبيعات", "الصندوق", "الموردون", "رأس المال"],
    answer: "الصندوق",
    explanation: "استلمت المنشأة نقدية، لذلك الصندوق مدين.",
  },
  {
    level: "beginner",
    question: "أي من الحسابات التالية يعتبر أصلًا؟",
    options: ["الصندوق", "الموردون", "رأس المال", "المبيعات"],
    answer: "الصندوق",
    explanation: "الصندوق يمثل نقدية تملكها المنشأة، لذلك هو أصل.",
  },
  {
    level: "beginner",
    question: "أي من الحسابات التالية يعتبر خصمًا؟",
    options: ["العملاء", "الموردون", "الصندوق", "المبيعات"],
    answer: "الموردون",
    explanation: "الموردون يمثلون مبالغ مستحقة على المنشأة للغير.",
  },
  {
    level: "beginner",
    question: "أي من الحسابات التالية يعتبر إيرادًا؟",
    options: ["المبيعات", "المشتريات", "الصندوق", "العملاء"],
    answer: "المبيعات",
    explanation: "المبيعات تمثل إيرادًا ناتجًا عن نشاط المنشأة.",
  },
  {
    level: "beginner",
    question: "أي من الحسابات التالية يعتبر مصروفًا؟",
    options: ["مصروف الإيجار", "رأس المال", "الصندوق", "المبيعات"],
    answer: "مصروف الإيجار",
    explanation: "الإيجار تكلفة تتحملها المنشأة مقابل استخدام المكان.",
  },
  {
    level: "beginner",
    question: "عند زيادة الأصول، يكون الحساب:",
    options: ["مدين", "دائن", "لا يتأثر", "يُغلق مباشرة"],
    answer: "مدين",
    explanation: "القاعدة: الأصول تزيد في الجانب المدين.",
  },
  {
    level: "beginner",
    question: "عند زيادة الخصوم، يكون الحساب:",
    options: ["مدين", "دائن", "لا يتأثر", "مصروف"],
    answer: "دائن",
    explanation: "الخصوم تزيد في الجانب الدائن.",
  },
  {
    level: "beginner",
    question: "عند زيادة الإيرادات، يكون الحساب:",
    options: ["مدين", "دائن", "أصل", "مصروف"],
    answer: "دائن",
    explanation: "الإيرادات تزيد في الجانب الدائن.",
  },
  {
    level: "beginner",
    question: "عند زيادة المصروفات، يكون الحساب:",
    options: ["مدين", "دائن", "خصم", "حقوق ملكية"],
    answer: "مدين",
    explanation: "المصروفات تزيد في الجانب المدين.",
  },
  {
    level: "beginner",
    question: "دفتر اليومية يستخدم لتسجيل:",
    options: ["القيود المحاسبية", "المنتجات فقط", "أسماء العملاء فقط", "الضرائب فقط"],
    answer: "القيود المحاسبية",
    explanation: "دفتر اليومية هو أول دفتر تسجل فيه العمليات المالية.",
  },
  {
    level: "beginner",
    question: "دفتر الأستاذ يستخدم لمعرفة:",
    options: ["حركة كل حساب", "اسم الموظف", "كلمة المرور", "شكل الفاتورة فقط"],
    answer: "حركة كل حساب",
    explanation: "دفتر الأستاذ يجمع كل الحركات الخاصة بكل حساب.",
  },
  {
    level: "beginner",
    question: "ميزان المراجعة يتحقق من:",
    options: ["تساوي المدين والدائن", "عدد المنتجات", "اسم العميل", "ألوان النظام"],
    answer: "تساوي المدين والدائن",
    explanation: "ميزان المراجعة يساعد على التأكد من توازن القيود.",
  },
  {
    level: "beginner",
    question: "إذا دفعنا رواتب نقدًا، فما الحساب المدين؟",
    options: ["مصروف الرواتب", "الصندوق", "المبيعات", "رأس المال"],
    answer: "مصروف الرواتب",
    explanation: "الرواتب مصروف زاد، والمصروفات تزيد مدينة.",
  },
  {
    level: "beginner",
    question: "إذا دفعنا إيجار نقدًا، فما الحساب الدائن؟",
    options: ["مصروف الإيجار", "الصندوق", "المبيعات", "العملاء"],
    answer: "الصندوق",
    explanation: "الصندوق نقص بسبب الدفع، لذلك يكون دائنًا.",
  },
  {
    level: "beginner",
    question: "رأس المال يعتبر من:",
    options: ["حقوق الملكية", "الأصول", "المصروفات", "الخصوم المتداولة"],
    answer: "حقوق الملكية",
    explanation: "رأس المال يمثل حق صاحب المنشأة في المنشأة.",
  },
  {
    level: "beginner",
    question: "العملاء غالبًا يمثلون:",
    options: ["أصل", "خصم", "مصروف", "إيراد"],
    answer: "أصل",
    explanation: "العملاء يمثلون مبالغ مستحقة للمنشأة عند البيع الآجل.",
  },
  {
    level: "beginner",
    question: "البيع النقدي يؤدي إلى زيادة:",
    options: ["الصندوق والمبيعات", "الموردين والمشتريات", "المصروفات فقط", "رأس المال فقط"],
    answer: "الصندوق والمبيعات",
    explanation: "نستلم نقدية وتتحقق مبيعات.",
  },
  {
    level: "beginner",
    question: "الشراء النقدي يؤدي إلى:",
    options: ["زيادة المخزون ونقص الصندوق", "زيادة المبيعات", "زيادة رأس المال", "نقص المصروفات"],
    answer: "زيادة المخزون ونقص الصندوق",
    explanation: "المنشأة حصلت على بضاعة ودفعت نقدًا.",
  },

  {
    level: "intermediate",
    question: "باعت المنشأة بضاعة آجلًا بمبلغ 30,000 ريال. ما القيد الصحيح؟",
    options: [
      "من حـ/ العملاء إلى حـ/ المبيعات",
      "من حـ/ الصندوق إلى حـ/ المبيعات",
      "من حـ/ المبيعات إلى حـ/ العملاء",
      "من حـ/ الموردون إلى حـ/ الصندوق",
    ],
    answer: "من حـ/ العملاء إلى حـ/ المبيعات",
    explanation: "في البيع الآجل يزيد العملاء مدينًا وتزيد المبيعات دائنًا.",
  },
  {
    level: "intermediate",
    question: "حصلت المنشأة من عميل مبلغ 15,000 ريال نقدًا. ما القيد الصحيح؟",
    options: [
      "من حـ/ الصندوق إلى حـ/ العملاء",
      "من حـ/ العملاء إلى حـ/ الصندوق",
      "من حـ/ المبيعات إلى حـ/ الصندوق",
      "من حـ/ الموردون إلى حـ/ العملاء",
    ],
    answer: "من حـ/ الصندوق إلى حـ/ العملاء",
    explanation: "استلمنا نقدية، فالصندوق مدين، وانخفضت مديونية العميل، فالعملاء دائن.",
  },
  {
    level: "intermediate",
    question: "اشترت المنشأة بضاعة آجلًا من مورد بمبلغ 50,000 ريال. ما القيد الصحيح؟",
    options: [
      "من حـ/ المخزون إلى حـ/ الموردون",
      "من حـ/ الموردون إلى حـ/ المخزون",
      "من حـ/ الصندوق إلى حـ/ المخزون",
      "من حـ/ المبيعات إلى حـ/ الموردون",
    ],
    answer: "من حـ/ المخزون إلى حـ/ الموردون",
    explanation: "المخزون زاد مدينًا، والالتزام تجاه المورد زاد دائنًا.",
  },
  {
    level: "intermediate",
    question: "سددت المنشأة للمورد مبلغ 20,000 ريال نقدًا. ما القيد الصحيح؟",
    options: [
      "من حـ/ الموردون إلى حـ/ الصندوق",
      "من حـ/ الصندوق إلى حـ/ الموردون",
      "من حـ/ المخزون إلى حـ/ الموردون",
      "من حـ/ المبيعات إلى حـ/ الصندوق",
    ],
    answer: "من حـ/ الموردون إلى حـ/ الصندوق",
    explanation: "الموردون نقصوا مدينًا، والصندوق نقص دائنًا.",
  },
  {
    level: "intermediate",
    question: "إذا كان إجمالي المدين في ميزان المراجعة 100,000 وإجمالي الدائن 100,000، فالميزان:",
    options: ["متوازن", "غير متوازن", "خاسر", "مغلق"],
    answer: "متوازن",
    explanation: "تساوي المدين والدائن يعني أن الميزان متوازن من حيث الشكل.",
  },
  {
    level: "intermediate",
    question: "إذا ظهر حساب الصندوق مدينًا بمبلغ 40,000، فهذا يعني:",
    options: [
      "يوجد رصيد نقدي في الصندوق",
      "الصندوق عليه دين",
      "الصندوق إيراد",
      "الصندوق مصروف",
    ],
    answer: "يوجد رصيد نقدي في الصندوق",
    explanation: "الصندوق أصل، ورصيده الطبيعي مدين.",
  },
  {
    level: "intermediate",
    question: "إذا ظهر حساب الموردون دائنًا بمبلغ 25,000، فهذا يعني:",
    options: [
      "على المنشأة مبلغ مستحق للموردين",
      "لدى المنشأة نقدية",
      "حققت المنشأة ربحًا",
      "زادت المصروفات",
    ],
    answer: "على المنشأة مبلغ مستحق للموردين",
    explanation: "الموردون خصم، ورصيده الدائن يدل على التزام على المنشأة.",
  },
  {
    level: "intermediate",
    question: "إذا حققت المنشأة مبيعات بمبلغ 80,000 وتكلفة البضاعة المباعة 50,000، فالربح الإجمالي:",
    options: ["30,000", "50,000", "80,000", "130,000"],
    answer: "30,000",
    explanation: "الربح الإجمالي = المبيعات - تكلفة البضاعة المباعة.",
  },
  {
    level: "intermediate",
    question: "إذا كان سعر بيع الوحدة 10,000 وتكلفتها 7,000، فربح الوحدة:",
    options: ["3,000", "7,000", "10,000", "17,000"],
    answer: "3,000",
    explanation: "ربح الوحدة = سعر البيع - التكلفة.",
  },
  {
    level: "intermediate",
    question: "إذا تم بيع 5 وحدات وسعر بيع الوحدة 2,000، فإجمالي البيع:",
    options: ["10,000", "5,000", "2,000", "7,000"],
    answer: "10,000",
    explanation: "إجمالي البيع = 5 × 2,000.",
  },
  {
    level: "intermediate",
    question: "إذا تم شراء 10 وحدات بتكلفة 3,000 للوحدة، فإجمالي الشراء:",
    options: ["30,000", "10,000", "3,000", "13,000"],
    answer: "30,000",
    explanation: "إجمالي الشراء = 10 × 3,000.",
  },
  {
    level: "intermediate",
    question: "في سند القبض من عميل، الحساب المدين غالبًا هو:",
    options: ["الصندوق أو البنك", "العملاء", "المبيعات", "الموردون"],
    answer: "الصندوق أو البنك",
    explanation: "لأن المنشأة استلمت نقدية أو إيداعًا بنكيًا.",
  },
  {
    level: "intermediate",
    question: "في سند الصرف لسداد مورد، الحساب المدين غالبًا هو:",
    options: ["الموردون", "الصندوق", "المبيعات", "رأس المال"],
    answer: "الموردون",
    explanation: "سداد المورد يقلل الالتزام، لذلك الموردون مدين.",
  },
  {
    level: "intermediate",
    question: "أي عملية تؤدي إلى زيادة رصيد العملاء؟",
    options: ["بيع آجل", "بيع نقدي", "سداد مورد", "دفع إيجار"],
    answer: "بيع آجل",
    explanation: "البيع الآجل يجعل العميل مدينًا للمنشأة.",
  },
  {
    level: "intermediate",
    question: "أي عملية تؤدي إلى زيادة رصيد الموردين؟",
    options: ["شراء آجل", "بيع نقدي", "تحصيل من عميل", "دفع رواتب"],
    answer: "شراء آجل",
    explanation: "الشراء الآجل يزيد الالتزام تجاه الموردين.",
  },
  {
    level: "intermediate",
    question: "إذا كان العميل مدينًا 60,000 ثم سدد 20,000، فالرصيد المتبقي عليه:",
    options: ["40,000", "20,000", "60,000", "80,000"],
    answer: "40,000",
    explanation: "الرصيد = 60,000 - 20,000.",
  },
  {
    level: "intermediate",
    question: "إذا كان المورد دائنًا 70,000 وتم السداد له 25,000، فالرصيد المتبقي للمورد:",
    options: ["45,000", "25,000", "70,000", "95,000"],
    answer: "45,000",
    explanation: "رصيد المورد = 70,000 - 25,000.",
  },
  {
    level: "intermediate",
    question: "أي من التالي يظهر في قائمة الدخل؟",
    options: ["المبيعات والمصروفات", "الصندوق فقط", "المخزون فقط", "رأس المال فقط"],
    answer: "المبيعات والمصروفات",
    explanation: "قائمة الدخل تعرض الإيرادات والمصروفات للوصول إلى الربح أو الخسارة.",
  },
  {
    level: "intermediate",
    question: "أي من التالي يظهر في قائمة المركز المالي؟",
    options: ["الأصول والخصوم وحقوق الملكية", "المبيعات فقط", "المصروفات فقط", "الربح فقط"],
    answer: "الأصول والخصوم وحقوق الملكية",
    explanation: "المركز المالي يوضح وضع المنشأة المالي في تاريخ معين.",
  },
  {
    level: "intermediate",
    question: "إذا زادت المبيعات ولم تتغير المصروفات، فإن صافي الربح غالبًا:",
    options: ["يزيد", "ينقص", "لا يتغير", "يصبح صفرًا"],
    answer: "يزيد",
    explanation: "زيادة الإيرادات مع ثبات المصروفات تؤدي غالبًا إلى زيادة الربح.",
  },

  {
    level: "advanced",
    question: "إذا كان المخزون أول المدة 20,000 والمشتريات 80,000 ومخزون آخر المدة 30,000، فإن تكلفة البضاعة المباعة:",
    options: ["70,000", "100,000", "30,000", "130,000"],
    answer: "70,000",
    explanation: "تكلفة البضاعة المباعة = مخزون أول + مشتريات - مخزون آخر.",
  },
  {
    level: "advanced",
    question: "إذا كانت المبيعات 150,000 وتكلفة البضاعة المباعة 90,000 والمصروفات 25,000، فإن صافي الربح:",
    options: ["35,000", "60,000", "125,000", "25,000"],
    answer: "35,000",
    explanation: "صافي الربح = المبيعات - تكلفة البضاعة المباعة - المصروفات.",
  },
  {
    level: "advanced",
    question: "إذا تم منح خصم بيع للعميل، فإن صافي المبيعات:",
    options: ["ينخفض", "يزيد", "لا يتأثر", "يتحول إلى أصل"],
    answer: "ينخفض",
    explanation: "الخصم يقلل المبلغ النهائي للمبيعات.",
  },
  {
    level: "advanced",
    question: "إذا اشترت المنشأة بضاعة بتكلفة 100,000 ثم باعتها بـ 130,000، فالربح الإجمالي:",
    options: ["30,000", "100,000", "130,000", "230,000"],
    answer: "30,000",
    explanation: "الربح الإجمالي = 130,000 - 100,000.",
  },
  {
    level: "advanced",
    question: "إذا كان رصيد العملاء 120,000 وتم تحصيل 50,000، فما أثر العملية؟",
    options: [
      "ينخفض العملاء ويزيد الصندوق",
      "يزيد العملاء ويزيد الصندوق",
      "ينخفض الصندوق ويزيد العملاء",
      "لا يتأثر أي حساب",
    ],
    answer: "ينخفض العملاء ويزيد الصندوق",
    explanation: "التحصيل يقلل مديونية العملاء ويزيد النقدية.",
  },
  {
    level: "advanced",
    question: "إذا تم شراء بضاعة آجلًا ثم سداد جزء منها لاحقًا، فما الحساب الذي ينخفض عند السداد؟",
    options: ["الموردون", "المخزون", "المبيعات", "العملاء"],
    answer: "الموردون",
    explanation: "سداد الدين للمورد يقلل رصيد الموردين.",
  },
  {
    level: "advanced",
    question: "في نظام الجرد المستمر، عند بيع بضاعة، أي أثر إضافي يحدث غير قيد البيع؟",
    options: [
      "تسجيل تكلفة البضاعة المباعة ونقص المخزون",
      "زيادة رأس المال",
      "زيادة الموردين",
      "إلغاء المبيعات",
    ],
    answer: "تسجيل تكلفة البضاعة المباعة ونقص المخزون",
    explanation: "الجرد المستمر يسجل أثر خروج المخزون عند البيع.",
  },
  {
    level: "advanced",
    question: "إذا كان سعر بيع المنتج 5,000 وتكلفته 3,500 وتم بيع 20 وحدة، فالربح الإجمالي:",
    options: ["30,000", "100,000", "70,000", "1,500"],
    answer: "30,000",
    explanation: "ربح الوحدة = 1,500، والربح الإجمالي = 1,500 × 20.",
  },
  {
    level: "advanced",
    question: "إذا زادت قيمة المخزون بسبب شراء آجل، فما الطرف الدائن؟",
    options: ["الموردون", "المخزون", "الصندوق", "المبيعات"],
    answer: "الموردون",
    explanation: "في الشراء الآجل يزيد الالتزام على المنشأة للموردين.",
  },
  {
    level: "advanced",
    question: "إذا تم بيع بضاعة آجلًا، فما أثر العملية على العملاء؟",
    options: ["يزيدون مدينًا", "يزيدون دائنًا", "ينخفضون مدينًا", "لا يتأثرون"],
    answer: "يزيدون مدينًا",
    explanation: "العميل أصبح مدينًا للمنشأة.",
  },
  {
    level: "advanced",
    question: "إذا كان إجمالي الأصول 500,000 والخصوم 180,000، فإن حقوق الملكية:",
    options: ["320,000", "680,000", "180,000", "500,000"],
    answer: "320,000",
    explanation: "حقوق الملكية = الأصول - الخصوم.",
  },
  {
    level: "advanced",
    question: "إذا كانت الأصول 700,000 وحقوق الملكية 450,000، فإن الخصوم:",
    options: ["250,000", "450,000", "700,000", "1,150,000"],
    answer: "250,000",
    explanation: "الخصوم = الأصول - حقوق الملكية.",
  },
  {
    level: "advanced",
    question: "أي معادلة تمثل أساس قائمة المركز المالي؟",
    options: [
      "الأصول = الخصوم + حقوق الملكية",
      "المبيعات = الأصول + المصروفات",
      "المصروفات = الإيرادات - الخصوم",
      "الصندوق = المبيعات فقط",
    ],
    answer: "الأصول = الخصوم + حقوق الملكية",
    explanation: "هذه هي المعادلة المحاسبية الأساسية.",
  },
  {
    level: "advanced",
    question: "إذا زادت المصروفات، فما أثرها على صافي الربح؟",
    options: ["ينخفض", "يزيد", "لا يتأثر", "يتحول إلى أصل"],
    answer: "ينخفض",
    explanation: "زيادة المصروفات تقلل صافي الربح.",
  },
  {
    level: "advanced",
    question: "إذا تم تسجيل قيد من الصندوق إلى الصندوق، فهذا القيد:",
    options: ["غير منطقي غالبًا", "صحيح دائمًا", "يزيد الربح", "يزيد المخزون"],
    answer: "غير منطقي غالبًا",
    explanation: "لا معنى غالبًا لأن يكون نفس الحساب مدينًا ودائنًا بنفس العملية.",
  },
  {
    level: "advanced",
    question: "إذا كانت فواتير البيع الآجلة أكثر من سندات القبض، فغالبًا رصيد العملاء:",
    options: ["مدين", "دائن", "صفر دائمًا", "مصروف"],
    answer: "مدين",
    explanation: "العملاء يكونون مدينين عندما تكون عليهم مبالغ لم تُحصّل بعد.",
  },
  {
    level: "advanced",
    question: "إذا كانت فواتير الشراء الآجلة أكثر من سندات الصرف للموردين، فغالبًا رصيد الموردين:",
    options: ["دائن", "مدين", "صفر دائمًا", "إيراد"],
    answer: "دائن",
    explanation: "الموردون يكونون دائنين عندما علينا مبالغ لهم.",
  },
  {
    level: "advanced",
    question: "إذا كان صافي الربح موجبًا، فهذا يعني غالبًا:",
    options: [
      "الإيرادات أكبر من المصروفات والتكاليف",
      "المصروفات أكبر من الإيرادات",
      "لا توجد مبيعات",
      "كل الأصول اختفت",
    ],
    answer: "الإيرادات أكبر من المصروفات والتكاليف",
    explanation: "الربح ينتج عندما تتجاوز الإيرادات التكاليف والمصروفات.",
  },
  {
    level: "advanced",
    question: "إذا كانت تكلفة المخزون المتبقي 200,000 وقيمة بيعه المتوقعة 260,000، فالربح المتوقع من المخزون:",
    options: ["60,000", "200,000", "260,000", "460,000"],
    answer: "60,000",
    explanation: "الربح المتوقع = قيمة البيع المتوقعة - تكلفة المخزون.",
  },
  {
    level: "advanced",
    question: "أي تقرير يعطي ملخصًا للمبيعات والمشتريات والمخزون والسندات؟",
    options: ["تقرير النشاط التجاري", "دفتر الأستاذ فقط", "صفحة الدروس", "اختبار المستوى"],
    answer: "تقرير النشاط التجاري",
    explanation: "تقرير النشاط التجاري يجمع مؤشرات النظام في صفحة واحدة.",
  },

  {
    level: "mixed",
    question: "اشترت المنشأة معدات نقدًا بمبلغ 75,000. ما الحساب الدائن؟",
    options: ["الصندوق", "المعدات", "المبيعات", "العملاء"],
    answer: "الصندوق",
    explanation: "تم دفع نقدية، لذلك الصندوق دائن.",
  },
  {
    level: "mixed",
    question: "اشترت المنشأة أثاثًا آجلًا بمبلغ 40,000. ما الحساب الدائن؟",
    options: ["الموردون", "الأثاث", "الصندوق", "المبيعات"],
    answer: "الموردون",
    explanation: "الشراء الآجل يزيد الالتزام للموردين.",
  },
  {
    level: "mixed",
    question: "باع صاحب المنشأة خدمة نقدًا بمبلغ 12,000. ما الحساب الدائن؟",
    options: ["إيرادات الخدمات", "الصندوق", "العملاء", "الموردون"],
    answer: "إيرادات الخدمات",
    explanation: "الإيراد زاد، والإيرادات طبيعتها دائنة.",
  },
  {
    level: "mixed",
    question: "إذا تم رد جزء من بضاعة مباعة للعميل، فهذا غالبًا يقلل:",
    options: ["المبيعات", "الموردون", "رأس المال", "المخزون فقط دائمًا"],
    answer: "المبيعات",
    explanation: "مردودات المبيعات تقلل صافي المبيعات.",
  },
  {
    level: "mixed",
    question: "إذا دفع صاحب المنشأة مصروف كهرباء نقدًا، فهذا يؤدي إلى:",
    options: [
      "زيادة المصروف ونقص الصندوق",
      "زيادة الصندوق وزيادة الإيراد",
      "زيادة الموردين فقط",
      "نقص المصروف",
    ],
    answer: "زيادة المصروف ونقص الصندوق",
    explanation: "المصروف مدين، والصندوق دائن.",
  },
  {
    level: "mixed",
    question: "إذا أضاف صاحب المنشأة رأس مال جديدًا في البنك، فما الحساب المدين؟",
    options: ["البنك", "رأس المال", "المبيعات", "الموردون"],
    answer: "البنك",
    explanation: "البنك أصل زاد، لذلك مدين.",
  },
  {
    level: "mixed",
    question: "إذا سحب صاحب المنشأة مبلغًا للاستخدام الشخصي، فهذا يسمى غالبًا:",
    options: ["مسحوبات شخصية", "مبيعات", "موردون", "مخزون"],
    answer: "مسحوبات شخصية",
    explanation: "المبالغ التي يأخذها المالك لاستخدامه الشخصي تسمى مسحوبات.",
  },
  {
    level: "mixed",
    question: "الخصم المسموح به للعميل يؤثر على:",
    options: ["صافي المبيعات", "الموردون", "الأصول الثابتة", "رأس المال مباشرة فقط"],
    answer: "صافي المبيعات",
    explanation: "الخصم المسموح به يقلل المبلغ المحصل من العميل.",
  },
  {
    level: "mixed",
    question: "إذا كان حساب البنك مدينًا، فهذا يعني غالبًا:",
    options: ["رصيد متاح في البنك", "دين على المنشأة للبنك دائمًا", "مصروف", "إيراد"],
    answer: "رصيد متاح في البنك",
    explanation: "البنك أصل، ورصيده الطبيعي مدين.",
  },
  {
    level: "mixed",
    question: "إذا كان حساب المبيعات دائنًا، فهذا طبيعي لأن المبيعات:",
    options: ["إيراد", "أصل", "مصروف", "خصم"],
    answer: "إيراد",
    explanation: "المبيعات من حسابات الإيرادات، وطبيعتها دائنة.",
  },
];

const levelOptions = {
  all: "كل المستويات",
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function buildExam(level) {
  const source =
    level === "all"
      ? questionsBank
      : questionsBank.filter((question) => question.level === level);

  const shuffledQuestions = shuffleArray(source);

  return shuffledQuestions.slice(0, Math.min(50, shuffledQuestions.length)).map((question) => ({
    ...question,
    options: shuffleArray(question.options),
  }));
}

function PracticePage() {
  const [level, setLevel] = useState("all");
  const [examQuestions, setExamQuestions] = useState(() => buildExam("all"));
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const result = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    examQuestions.forEach((question, index) => {
      const userAnswer = answers[index];

      if (!userAnswer) {
        unanswered += 1;
      } else if (userAnswer === question.answer) {
        correct += 1;
      } else {
        wrong += 1;
      }
    });

    const percentage =
      examQuestions.length > 0
        ? Math.round((correct / examQuestions.length) * 100)
        : 0;

    return {
      correct,
      wrong,
      unanswered,
      percentage,
    };
  }, [answers, examQuestions]);

  function startNewExam(selectedLevel = level) {
    setExamQuestions(buildExam(selectedLevel));
    setAnswers({});
    setIsSubmitted(false);
  }

  function handleLevelChange(e) {
    const selectedLevel = e.target.value;
    setLevel(selectedLevel);
    startNewExam(selectedLevel);
  }

  function chooseAnswer(questionIndex, option) {
    if (isSubmitted) return;

    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  }

  function submitExam() {
    const confirmSubmit = window.confirm(
      "هل تريد إنهاء الاختبار وتصحيح الإجابات؟"
    );

    if (!confirmSubmit) return;

    setIsSubmitted(true);
  }

  function getGradeText() {
    if (result.percentage >= 90) return "ممتاز جدًا";
    if (result.percentage >= 80) return "ممتاز";
    if (result.percentage >= 70) return "جيد جدًا";
    if (result.percentage >= 60) return "جيد";
    if (result.percentage >= 50) return "مقبول";
    return "تحتاج مراجعة";
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">التمارين</h1>
            <p className="section-subtitle">
              اختبار محاسبي ديناميكي من 50 سؤالًا عشوائيًا غير مكرر، مع تصحيح
              فوري وشرح لكل إجابة بعد إنهاء الاختبار.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد الأسئلة</span>
              <strong>{examQuestions.length}</strong>
            </div>

            <div>
              <span>النتيجة</span>
              <strong>{isSubmitted ? `${result.percentage}%` : "-"}</strong>
            </div>
          </div>
        </div>

        <div className="practice-control-panel">
          <div className="practice-filter">
            <label>مستوى الاختبار</label>
            <select value={level} onChange={handleLevelChange}>
              <option value="all">{levelOptions.all}</option>
              <option value="beginner">{levelOptions.beginner}</option>
              <option value="intermediate">{levelOptions.intermediate}</option>
              <option value="advanced">{levelOptions.advanced}</option>
            </select>
          </div>

          <div className="practice-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => startNewExam()}
            >
              <RotateCcw size={18} />
              اختبار جديد
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={submitExam}
              disabled={isSubmitted}
            >
              <CheckCircle2 size={18} />
              تصحيح الاختبار
            </button>
          </div>
        </div>

        <div className="practice-summary-grid">
          <div className="practice-summary-card">
            <Brain size={28} />
            <span>المستوى</span>
            <strong>{levelOptions[level]}</strong>
          </div>

          <div className="practice-summary-card">
            <Target size={28} />
            <span>تمت الإجابة</span>
            <strong>
              {Object.keys(answers).length} / {examQuestions.length}
            </strong>
          </div>

          <div className="practice-summary-card">
            <CheckCircle2 size={28} />
            <span>الصحيح</span>
            <strong className="good-text">
              {isSubmitted ? result.correct : "-"}
            </strong>
          </div>

          <div className="practice-summary-card">
            <XCircle size={28} />
            <span>الخطأ</span>
            <strong className="bad-text">
              {isSubmitted ? result.wrong : "-"}
            </strong>
          </div>
        </div>

        {isSubmitted && (
          <div className="practice-result-card">
            <div>
              <Trophy size={34} />
              <h2>{getGradeText()}</h2>
              <p>
                نتيجتك {result.correct} من {examQuestions.length}، بنسبة{" "}
                {result.percentage}%.
              </p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => startNewExam()}
            >
              اختبار جديد بأسئلة مختلفة
            </button>
          </div>
        )}

        <div className="practice-questions-list">
          {examQuestions.map((question, questionIndex) => {
            const userAnswer = answers[questionIndex];
            const isCorrect = userAnswer === question.answer;

            return (
              <div className="practice-question-card" key={`${question.question}-${questionIndex}`}>
                <div className="practice-question-header">
                  <span>سؤال {questionIndex + 1}</span>
                  <b>{levelOptions[question.level] || "متنوع"}</b>
                </div>

                <h2>{question.question}</h2>

                <div className="practice-options">
                  {question.options.map((option) => {
                    const selected = userAnswer === option;
                    const correctOption = question.answer === option;

                    let optionClass = "practice-option";

                    if (selected) optionClass += " selected";

                    if (isSubmitted && correctOption) {
                      optionClass += " correct";
                    }

                    if (isSubmitted && selected && !correctOption) {
                      optionClass += " wrong";
                    }

                    return (
                      <button
                        type="button"
                        key={option}
                        className={optionClass}
                        onClick={() => chooseAnswer(questionIndex, option)}
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
                        ? "practice-explanation correct"
                        : "practice-explanation wrong"
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

        <div className="practice-bottom-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => startNewExam()}
          >
            <RotateCcw size={18} />
            اختبار جديد
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={submitExam}
            disabled={isSubmitted}
          >
            <CheckCircle2 size={18} />
            تصحيح الاختبار
          </button>
        </div>
      </div>
    </div>
  );
}

export default PracticePage;