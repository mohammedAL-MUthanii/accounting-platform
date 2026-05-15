import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Activity,
  ServerCog,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";



function AdminDashboardPage() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    online: false,
    message: "جاري فحص الاتصال...",
  });

  useEffect(() => {
    async function checkApiStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/test`, {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setApiStatus({
            loading: false,
            online: true,
            message: data.message || "Laravel API يعمل بنجاح",
          });
        } else {
          setApiStatus({
            loading: false,
            online: false,
            message: "السيرفر يعمل لكن الاستجابة غير متوقعة",
          });
        }
      } catch {
        setApiStatus({
          loading: false,
          online: false,
          message: "تعذر الاتصال بـ Laravel API",
        });
      }
    }

    checkApiStatus();
  }, []);

  const tools = [
    {
      title: "إدارة المستخدمين",
      description:
        "عرض المستخدمين المسجلين وتغيير صلاحياتهم من مستخدم إلى أدمن أو العكس.",
      icon: Users,
      path: "/admin-users",
      status: "active",
      label: "مفعّل",
    },
    {
      title: "الصلاحيات المتقدمة",
      description:
        "تحديد صلاحيات أدق لكل صفحة أو عملية داخل النظام مثل الحذف والتعديل.",
      icon: ShieldCheck,
      path: "",
      status: "soon",
      label: "قريبًا",
    },
    {
      title: "سجل النشاط",
      description:
        "متابعة عمليات تسجيل الدخول، وتغيير الصلاحيات، والحركات المهمة داخل النظام.",
      icon: Activity,
      path: "",
      status: "soon",
      label: "قريبًا",
    },
    {
      title: "حالة النظام",
      description:
        "فحص اتصال React مع Laravel API والتأكد أن الباك إند يعمل بشكل صحيح.",
      icon: ServerCog,
      path: "",
      status: apiStatus.online ? "active" : "warning",
      label: apiStatus.loading
        ? "جاري الفحص"
        : apiStatus.online
        ? "متصل"
        : "غير متصل",
    },
  ];

  function getStatusIcon(status, loading) {
    if (loading) return <Clock3 size={18} />;

    if (status === "active") return <CheckCircle2 size={18} />;

    if (status === "warning") return <XCircle size={18} />;

    return <Clock3 size={18} />;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">لوحة التحكم</h1>
            <p className="section-subtitle">
              مركز تحكم الأدمن لإدارة المستخدمين، متابعة الصلاحيات، وفحص حالة
              الاتصال بين الواجهة والباك إند.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>الأدوات المفعّلة</span>
              <strong>1</strong>
            </div>

            <div>
              <span>حالة API</span>
              <strong>{apiStatus.online ? "متصل" : "غير متصل"}</strong>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-hero">
          <div>
            <span className="admin-dashboard-badge">
              <LayoutDashboard size={18} />
              لوحة تحكم الأدمن
            </span>

            <h2>إدارة النظام من مكان واحد</h2>

            <p>
              هذه الصفحة ستكون مركز التحكم الرئيسي للأدمن. حاليًا تم تفعيل
              إدارة المستخدمين والصلاحيات الأساسية، وبعد ربط باقي الصفحات
              بالباك إند سنضيف أدوات متابعة وتقارير إدارية أكثر.
            </p>
          </div>

          <div
            className={
              apiStatus.online
                ? "admin-api-status online"
                : "admin-api-status offline"
            }
          >
            {getStatusIcon(
              apiStatus.online ? "active" : "warning",
              apiStatus.loading
            )}

            <div>
              <span>Laravel API</span>
              <strong>{apiStatus.message}</strong>
            </div>
          </div>
        </div>

        <div className="admin-tools-grid">
          {tools.map((tool) => {
            const Icon = tool.icon;

            const cardContent = (
              <>
                <div className="admin-tool-top">
                  <div className="admin-tool-icon">
                    <Icon size={28} />
                  </div>

                  <span className={`admin-tool-status ${tool.status}`}>
                    {tool.label}
                  </span>
                </div>

                <div>
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                </div>

                {tool.path ? (
                  <div className="admin-tool-action">
                    <span>فتح الأداة</span>
                    <ArrowLeft size={18} />
                  </div>
                ) : (
                  <div className="admin-tool-action muted">
                    <span>سيتم تفعيلها لاحقًا</span>
                  </div>
                )}
              </>
            );

            if (tool.path) {
              return (
                <Link
                  key={tool.title}
                  to={tool.path}
                  className="admin-tool-card active"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div key={tool.title} className="admin-tool-card">
                {cardContent}
              </div>
            );
          })}
        </div>

        <div
          className={
            apiStatus.online
              ? "balance-status success"
              : "balance-status warning"
          }
        >
          <LayoutDashboard size={22} />
          <span>
            {apiStatus.online
              ? "الاتصال مع Laravel API يعمل بنجاح. يمكنك الآن إدارة المستخدمين والصلاحيات الأساسية."
              : "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت أو من تشغيل خدمة الباك إند."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;