import { useEffect, useState } from "react";
import { Users, ShieldCheck, UserRound, Trash2, RefreshCcw } from "lucide-react";

import { getAuthToken, getCurrentUser } from "../utils/auth";
import AppToast from "../components/AppToast";
import AppConfirm from "../components/AppConfirm";

import { API_BASE_URL } from "../config/api";

function AdminUsersPage() {
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    user: null,
    title: "",
    message: "",
  });

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadUsers() {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحميل المستخدمين.", "error");
        setIsLoading(false);
        return;
      }

      setUsers(data.users || []);
    } catch {
      showToast("تعذر الاتصال بالسيرفر.", "error");
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUserRole(user, role) {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر تحديث صلاحية المستخدم.", "error");
        return;
      }

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id ? { ...item, role: data.user.role } : item
        )
      );

      showToast("تم تحديث صلاحية المستخدم بنجاح.");
    } catch {
      showToast("تعذر الاتصال بالسيرفر.", "error");
    }
  }

  function requestDeleteUser(user) {
    setConfirmState({
      open: true,
      user,
      title: "حذف مستخدم",
      message: `هل تريد حذف المستخدم "${user.name}"؟`,
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      user: null,
      title: "",
      message: "",
    });
  }

  async function confirmDeleteUser() {
    const user = confirmState.user;

    if (!user) return;

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "تعذر حذف المستخدم.", "error");
        closeConfirm();
        return;
      }

      setUsers((prevUsers) => prevUsers.filter((item) => item.id !== user.id));

      closeConfirm();
      showToast("تم حذف المستخدم بنجاح.");
    } catch {
      closeConfirm();
      showToast("تعذر الاتصال بالسيرفر.", "error");
    }
  }

  const adminCount = users.filter((user) => user.role === "admin").length;
  const normalUsersCount = users.filter((user) => user.role === "user").length;

  return (
    <div className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <h1 className="section-title">إدارة المستخدمين</h1>
            <p className="section-subtitle">
              تابع المستخدمين المسجلين في النظام، وغيّر صلاحياتهم من مستخدم عادي
              إلى أدمن أو العكس.
            </p>
          </div>

          <div className="stats-box">
            <div>
              <span>عدد المستخدمين</span>
              <strong>{users.length}</strong>
            </div>

            <div>
              <span>عدد الأدمن</span>
              <strong>{adminCount}</strong>
            </div>
          </div>
        </div>

        <div className="sales-summary">
          <div className="sales-summary-card">
            <Users size={26} />
            <span>إجمالي المستخدمين</span>
            <strong>{users.length}</strong>
          </div>

          <div className="sales-summary-card">
            <ShieldCheck size={26} />
            <span>مدراء النظام</span>
            <strong>{adminCount}</strong>
          </div>

          <div className="sales-summary-card">
            <UserRound size={26} />
            <span>مستخدمون عاديون</span>
            <strong>{normalUsersCount}</strong>
          </div>
        </div>

        <div className="sales-list-card">
          <div className="sales-list-header">
            <div>
              <h2>قائمة المستخدمين</h2>
              <p>لا يمكنك حذف حسابك الحالي أو إزالة صلاحية الأدمن من نفسك.</p>
            </div>

            <button type="button" className="secondary-btn" onClick={loadUsers}>
              <RefreshCcw size={18} />
              تحديث
            </button>
          </div>

          {isLoading ? (
            <div className="empty-search">جاري تحميل المستخدمين...</div>
          ) : users.length === 0 ? (
            <div className="empty-search">لا توجد حسابات مستخدمين حتى الآن.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>م</th>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الصلاحية</th>
                    <th>تاريخ الإنشاء</th>
                    <th>تغيير الصلاحية</th>
                    <th>حذف</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user, index) => {
                    const isCurrentUser = currentUser?.id === user.id;

                    return (
                      <tr key={user.id}>
                        <td>{index + 1}</td>

                        <td>
                          <strong>{user.name}</strong>
                          {isCurrentUser && (
                            <span className="payment-badge">حسابك الحالي</span>
                          )}
                        </td>

                        <td>{user.email}</td>

                        <td>
                          <span
                            className={
                              user.role === "admin"
                                ? "purchase-payment-badge cash"
                                : "purchase-payment-badge credit"
                            }
                          >
                            {user.role === "admin" ? "أدمن" : "مستخدم"}
                          </span>
                        </td>

                        <td>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          <select
                            value={user.role}
                            disabled={isCurrentUser}
                            onChange={(e) => updateUserRole(user, e.target.value)}
                          >
                            <option value="user">مستخدم</option>
                            <option value="admin">أدمن</option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              isCurrentUser
                                ? "delete-btn disabled-delete"
                                : "delete-btn"
                            }
                            disabled={isCurrentUser}
                            onClick={() => requestDeleteUser(user)}
                            title={
                              isCurrentUser
                                ? "لا يمكنك حذف حسابك الحالي"
                                : "حذف المستخدم"
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AppToast toast={toast} onClose={() => setToast(null)} />

      <AppConfirm
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        danger
        onConfirm={confirmDeleteUser}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default AdminUsersPage;