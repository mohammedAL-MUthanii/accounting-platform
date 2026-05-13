import { useEffect, useState } from "react";
import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";
import { getAndClearAppToast, setAppToast } from "../utils/notifications";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  ClipboardList,
  NotebookPen,
  BarChart3,
  Calculator,
  BookMarked,
  FileText,
  GraduationCap,
  Brain,
  Menu,
  X,
  Wand2,
  Package,
  ShoppingCart,
  ReceiptText,
  WalletCards,
  Receipt,
  Users,
  ShoppingBag,
  Settings,
  LogIn,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getCurrentUser, logoutUser } from "../utils/auth";

function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

useEffect(() => {
  const savedToast = getAndClearAppToast();

  if (savedToast) {
    setToast(savedToast);

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }
}, []);
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const isAdminUser = currentUser?.role === "admin";

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleLogout() {
  setLogoutConfirmOpen(true);
}

function confirmLogout() {
  logoutUser();
  closeMenu();
  setAppToast("تم تسجيل الخروج بنجاح.", "success");
  navigate("/login");
  window.location.reload();
}

  return (
    <div className="app">
      <header className="navbar">
        <div className="container nav-content">
          <NavLink to="/" className="logo" onClick={closeMenu}>
            <div className="logo-icon">
              <Calculator size={24} />
              <AppToast toast={toast} onClose={() => setToast(null)} />

<AppConfirm
  open={logoutConfirmOpen}
  title="تسجيل الخروج"
  message="هل تريد تسجيل الخروج من منصة محاسبتي؟"
  confirmText="نعم، خروج"
  cancelText="إلغاء"
  danger
  onConfirm={confirmLogout}
  onCancel={() => setLogoutConfirmOpen(false)}
/>
            </div>

            <div>
              <strong>محاسبتي</strong>
              <span>نظام محاسبي تعليمي وتجاري</span>
            </div>
          </NavLink>

          <div className="top-actions">
            {currentUser ? (
              <div className="user-chip">
                {isAdminUser ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                <div>
                  <strong>{currentUser.name}</strong>
                  <span>{isAdminUser ? "أدمن" : "طالب"}</span>
                </div>
              </div>
            ) : (
              <NavLink to="/login" className="home-shortcut" onClick={closeMenu}>
                <LogIn size={18} />
                دخول
              </NavLink>
            )}

            <NavLink to="/" className="home-shortcut" onClick={closeMenu}>
              <Home size={18} />
              الرئيسية
            </NavLink>

            {currentUser && (
              <button type="button" className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                خروج
              </button>
            )}

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              القائمة
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="menu-panel">
            <div className="container grouped-menu">
              <div className="menu-section">
                <h3>التعليم والتدريب</h3>

                <div className="menu-grid">
                  <NavLink to="/lessons" onClick={closeMenu}>
                    <BookOpen size={22} />
                    <div>
                      <strong>الدروس</strong>
                      <span>تعلم أساسيات المحاسبة</span>
                    </div>
                  </NavLink>

                  <NavLink to="/practice" onClick={closeMenu}>
                    <ClipboardList size={22} />
                    <div>
                      <strong>التمارين</strong>
                      <span>اختبار تدريبي بأسئلة عشوائية</span>
                    </div>
                  </NavLink>

                  <NavLink to="/scenarios" onClick={closeMenu}>
                    <GraduationCap size={22} />
                    <div>
                      <strong>السيناريوهات</strong>
                      <span>تطبيق عملي على القيود</span>
                    </div>
                  </NavLink>

                  <NavLink to="/placement-test" onClick={closeMenu}>
                    <Brain size={22} />
                    <div>
                      <strong>اختبار المستوى</strong>
                      <span>اعرف مستواك الحالي</span>
                    </div>
                  </NavLink>
                </div>
              </div>

              {isAdminUser && (
                <>
                  <div className="menu-section">
                    <h3>النظام التجاري</h3>

                    <div className="menu-grid">
                      <NavLink to="/inventory" onClick={closeMenu}>
                        <Package size={22} />
                        <div>
                          <strong>المخزون</strong>
                          <span>إدارة المنتجات والكميات</span>
                        </div>
                      </NavLink>

                      <NavLink to="/purchases" onClick={closeMenu}>
                        <ShoppingBag size={22} />
                        <div>
                          <strong>المشتريات</strong>
                          <span>شراء بضاعة وتحديث المخزون</span>
                        </div>
                      </NavLink>

                      <NavLink to="/purchase-invoices" onClick={closeMenu}>
                        <ShoppingBag size={22} />
                        <div>
                          <strong>فواتير المشتريات</strong>
                          <span>عرض فواتير الشراء</span>
                        </div>
                      </NavLink>

                      <NavLink to="/pos" onClick={closeMenu}>
                        <ShoppingCart size={22} />
                        <div>
                          <strong>نقطة البيع</strong>
                          <span>بيع المنتجات وتحديث المخزون</span>
                        </div>
                      </NavLink>

                      <NavLink to="/sales-invoices" onClick={closeMenu}>
                        <ReceiptText size={22} />
                        <div>
                          <strong>فواتير المبيعات</strong>
                          <span>عرض فواتير نقطة البيع</span>
                        </div>
                      </NavLink>
                    </div>
                  </div>

                  <div className="menu-section">
                    <h3>المحاسبة والتقارير المالية</h3>

                    <div className="menu-grid">
                      <NavLink to="/accounts" onClick={closeMenu}>
                        <WalletCards size={22} />
                        <div>
                          <strong>إدارة الحسابات</strong>
                          <span>أضف وعدّل حساباتك المحاسبية</span>
                        </div>
                      </NavLink>

                      <NavLink to="/entry-generator" onClick={closeMenu}>
                        <Wand2 size={22} />
                        <div>
                          <strong>مولّد القيود</strong>
                          <span>أنشئ القيد تلقائيًا</span>
                        </div>
                      </NavLink>

                      <NavLink to="/journal" onClick={closeMenu}>
                        <NotebookPen size={22} />
                        <div>
                          <strong>دفتر اليومية</strong>
                          <span>إدخال القيود المحاسبية</span>
                        </div>
                      </NavLink>

                      <NavLink to="/ledger" onClick={closeMenu}>
                        <BookMarked size={22} />
                        <div>
                          <strong>دفتر الأستاذ</strong>
                          <span>حركات كل حساب</span>
                        </div>
                      </NavLink>

                      <NavLink to="/trial-balance" onClick={closeMenu}>
                        <BarChart3 size={22} />
                        <div>
                          <strong>ميزان المراجعة</strong>
                          <span>تحقق من توازن القيود</span>
                        </div>
                      </NavLink>

                      <NavLink to="/statements" onClick={closeMenu}>
                        <FileText size={22} />
                        <div>
                          <strong>القوائم المالية</strong>
                          <span>قائمة الدخل والمركز المالي</span>
                        </div>
                      </NavLink>
                    </div>
                  </div>

                  <div className="menu-section">
                    <h3>الإدارة والتحليل</h3>

                    <div className="menu-grid">
                      <NavLink to="/vouchers" onClick={closeMenu}>
                        <Receipt size={22} />
                        <div>
                          <strong>السندات</strong>
                          <span>سند قبض وسند صرف</span>
                        </div>
                      </NavLink>

                      <NavLink to="/parties" onClick={closeMenu}>
                        <Users size={22} />
                        <div>
                          <strong>العملاء والموردون</strong>
                          <span>أرصدة وحركات الجهات</span>
                        </div>
                      </NavLink>

                      <NavLink to="/business-report" onClick={closeMenu}>
                        <BarChart3 size={22} />
                        <div>
                          <strong>تقرير النشاط</strong>
                          <span>ملخص المبيعات والمشتريات والمخزون</span>
                        </div>
                      </NavLink>

                      <NavLink to="/settings" onClick={closeMenu}>
                        <Settings size={22} />
                        <div>
                          <strong>الإعدادات</strong>
                          <span>النسخ الاحتياطي ومسح البيانات</span>
                        </div>
                      </NavLink>
                    </div>
                  </div>
                </>
              )}

              {!isAdminUser && currentUser && (
                <div className="menu-section student-note">
                  <h3>وضع الطالب</h3>
                  <p>
                    أنت داخل كطالب، لذلك تظهر لك صفحات التعليم والتدريب فقط.
                    صفحات النظام التجاري والمحاسبة تظهر لحساب الأدمن.
                  </p>
                </div>
              )}

              {!currentUser && (
                <div className="menu-section student-note">
                  <h3>لم تسجل الدخول</h3>
                  <p>
                    تستطيع تصفح الصفحات التعليمية، وللوصول للنظام التجاري سجّل
                    الدخول كأدمن.
                  </p>

                  <NavLink to="/login" className="primary-btn" onClick={closeMenu}>
                    <LogIn size={18} />
                    تسجيل الدخول
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;