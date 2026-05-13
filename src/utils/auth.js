const AUTH_KEY = "mohasbti_current_user";

export const demoUsers = [
  {
    id: 1,
    name: "مدير النظام",
    email: "admin@mohasbti.com",
    password: "123456",
    role: "admin",
  },
  {
    id: 2,
    name: "طالب تجريبي",
    email: "user@mohasbti.com",
    password: "123456",
    role: "user",
  },
];

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loginUser(email, password) {
  const user = demoUsers.find((item) => {
    return item.email === email && item.password === password;
  });

  if (!user) {
    return {
      success: false,
      message: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));

  return {
    success: true,
    user: safeUser,
  };
}

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.role === "admin";
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}