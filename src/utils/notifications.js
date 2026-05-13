const TOAST_KEY = "mohasbti_app_toast";

export function setAppToast(message, type = "success") {
  localStorage.setItem(
    TOAST_KEY,
    JSON.stringify({
      message,
      type,
      createdAt: new Date().toISOString(),
    })
  );
}

export function getAndClearAppToast() {
  try {
    const raw = localStorage.getItem(TOAST_KEY);

    if (!raw) return null;

    const toast = JSON.parse(raw);
    localStorage.removeItem(TOAST_KEY);

    return toast;
  } catch {
    localStorage.removeItem(TOAST_KEY);
    return null;
  }
}