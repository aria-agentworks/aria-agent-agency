import { COOKIE_NAME } from "@shared/const";
export function sessionHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const pair = raw
      ?.split(";")
      .find(s => s.trim().startsWith(`${COOKIE_NAME}=`));
    const token = pair?.trim().slice(COOKIE_NAME.length + 1);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      ...sessionHeaders(),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error ||
        data.message ||
        (response.status === 401
          ? "Please sign in to continue."
          : "Something went wrong. Please try again.")
    );
  return data as T;
}
export type Order = {
  id: string | number;
  createdAt: string;
  status: string;
  items: string[];
  amount: number;
  currency: string;
};
export type DemoResult = {
  scenario: string;
  status: string;
  title: string;
  message: string;
  steps: { label: string; status: string; detail: string }[];
  output: Record<string, unknown>;
  correlationId: string;
  aiPowered: boolean;
};

export async function downloadKit(
  orderId: string | number,
  automationId: string
) {
  const response = await fetch(
    `/api/store/download/${encodeURIComponent(String(orderId))}/${encodeURIComponent(automationId)}`,
    { credentials: "include", headers: sessionHeaders() }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ||
        "Download is not available. Please refresh your purchase record."
    );
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aria-${automationId}-kit.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Fire-and-forget first-party analytics. Never blocks or throws. */
export function trackEvent(type: string, meta?: Record<string, unknown>) {
  try {
    let sessionId = localStorage.getItem("aria-session");
    if (!sessionId) {
      sessionId = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem("aria-session", sessionId);
    }
    const body = JSON.stringify({
      type,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      sessionId,
      meta,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/marketing/event",
        new Blob([body], { type: "application/json" })
      );
    } else {
      void fetch("/api/marketing/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the page */
  }
}
