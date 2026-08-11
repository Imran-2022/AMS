"use client";

import * as React from "react";

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

export function emitToast(message: string, type: "success" | "error" | "info" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ams-toast", { detail: { message, type } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    function onToast(e: Event) {
      const ev = e as CustomEvent;
      const { message, type } = ev.detail;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3500);
    }

    window.addEventListener("ams-toast", onToast as EventListener);
    return () => window.removeEventListener("ams-toast", onToast as EventListener);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-xs rounded-lg px-4 py-2 shadow-md text-sm text-white ${
            t.type === "error" ? "bg-rose-600" : t.type === "info" ? "bg-sky-600" : "bg-brand-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
