import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { loginUser } from "../utils/auth";
import { setAppToast } from "../utils/notifications";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@mohasbti.com",
    password: "123456",
  });

  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const result = loginUser(form.email.trim(), form.password);

    if (!result.success) {
      setError(result.message);
      return;
    }

   setAppToast(`مرحبًا ${result.user.name}، تم تسجيل الدخول بنجاح.`, "success");
navigate("/");
window.location.reload();
  }

  function fillDemoUser(type) {
    if (type === "admin") {
      setForm({
        email: "admin@mohasbti.com",
        password: "123456",
      });
    } else {
      setForm({
        email: "user@mohasbti.com",
        password: "123456",
      });
    }

    setError("");
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
          <LogIn size={28} />
          <h2>تسجيل الدخول</h2>
          <p>
            هذه نسخة تجريبية Frontend فقط. الصلاحيات الحقيقية سننفذها لاحقًا في
            Laravel.
          </p>
        </div>

        <div className="demo-login-buttons">
          <button type="button" onClick={() => fillDemoUser("admin")}>
            <ShieldCheck size={18} />
            دخول كأدمن
          </button>

          <button type="button" onClick={() => fillDemoUser("user")}>
            <UserRound size={18} />
            دخول كطالب
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            البريد الإلكتروني
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@mohasbti.com"
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="123456"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="primary-btn">
            <LogIn size={18} />
            دخول
          </button>
        </form>

        <div className="login-hint">
          <strong>بيانات الدخول التجريبية:</strong>
          <span>Admin: admin@mohasbti.com / 123456</span>
          <span>User: user@mohasbti.com / 123456</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;