import { API_BASE_URL } from "../config/api";
const AUTH_USER_KEY = "mohasbti_current_user";

const AUTH_TOKEN_KEY = "mohasbti_auth_token";



function saveAuthData(user, token) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message:
          data?.message ||
          data?.errors?.email?.[0] ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      };
    }

    saveAuthData(data.user, data.token);

    return {
      success: true,
      user: data.user,
      token: data.token,
      message: data.message || "تم تسجيل الدخول بنجاح.",
    };
  } catch {
    return {
      success: false,
      message:
      "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت أو من تشغيل خدمة الباك إند."
    };
  }
}

export async function registerUser(name, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const firstError =
        data?.errors?.name?.[0] ||
        data?.errors?.email?.[0] ||
        data?.errors?.password?.[0] ||
        data?.message;

      return {
        success: false,
        message: firstError || "تعذر إنشاء الحساب.",
      };
    }

    saveAuthData(data.user, data.token);

    return {
      success: true,
      user: data.user,
      token: data.token,
      message: data.message || "تم إنشاء الحساب بنجاح.",
    };
  } catch {
    return {
      success: false,
      message:
       "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت أو من تشغيل خدمة الباك إند."
    };
  }
}

export async function logoutUser() {
  const token = getAuthToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // حتى لو فشل الاتصال، سنحذف بيانات الدخول محليًا
  }

  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function fetchCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }

    const data = await response.json();

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

    return data.user;
  } catch {
    return getCurrentUser();
  }
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.role === "admin";
}

export function isLoggedIn() {
  return Boolean(getCurrentUser() && getAuthToken());
}