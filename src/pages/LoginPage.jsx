import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, LogIn, UserPlus, Loader2 } from "lucide-react";

import { loginUser, registerUser } from "../utils/auth";
import { setAppToast } from "../utils/notifications";

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setError("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    let result;

    if (mode === "login") {
      result = await loginUser(form.email.trim(), form.password);
    } else {
      if (!form.name.trim()) {
        setError("اكتب اسمك قبل إنشاء الحساب.");
        setIsLoading(false);
        return;
      }

      result = await registerUser(
        form.name.trim(),
        form.email.trim(),
        form.password
      );
    }

    setIsLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (mode === "login") {
      setAppToast(`مرحبًا ${result.user.name}، تم تسجيل الدخول بنجاح.`, "success");
    } else {
      setAppToast(
        `تم إنشاء حسابك بنجاح يا ${result.user.name}. تم تسجيل دخولك كمستخدم عادي.`,
        "success"
      );
    }

    navigate("/");
    window.location.reload();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo-icon">
            <Calculator size={28} />
          </div>

          <div>
            <h1>محاسبتي</h1>
            <p>نظام محاسبي تعليمي وتجاري</p>
          </div>
        </div>

        <div className="login-title">
          {mode === "login" ? <LogIn size={28} /> : <UserPlus size={28} />}

          <h2>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}</h2>

          <p>
            {mode === "login"
              ? "ادخل ببريدك وكلمة المرور المسجلة في النظام."
              : "أنشئ حسابًا جديدًا. سيتم تسجيلك كمستخدم عادي، ويمكن للأدمن تغيير صلاحيتك لاحقًا."}
          </p>
        </div>

        <div className="demo-login-buttons">
          <button
            type="button"
            className={mode === "login" ? "active-auth-tab" : ""}
            onClick={() => switchMode("login")}
          >
            <LogIn size={18} />
            تسجيل الدخول
          </button>

          <button
            type="button"
            className={mode === "register" ? "active-auth-tab" : ""}
            onClick={() => switchMode("register")}
          >
            <UserPlus size={18} />
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === "register" && (
            <label>
              الاسم
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: محمد أحمد"
              />
            </label>
          )}

          <label>
            البريد الإلكتروني
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="اكتب كلمة المرور"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="primary-btn" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={18} className="spin-icon" />
            ) : mode === "login" ? (
              <LogIn size={18} />
            ) : (
              <UserPlus size={18} />
            )}

            {isLoading
              ? "جاري المعالجة..."
              : mode === "login"
              ? "دخول"
              : "إنشاء الحساب"}
          </button>
        </form>

        <div className="login-hint">
          <strong>ملاحظة:</strong>
          <span>أي حساب جديد يتم إنشاؤه بصلاحية مستخدم عادي.</span>
          <span>الأدمن فقط يستطيع تغيير صلاحيات المستخدمين من لوحة الإدارة.</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;