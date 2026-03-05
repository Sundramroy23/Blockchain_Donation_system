// src/context/ToastContext.jsx
import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = (msg, type = "success") => {
    const normalizedMsg = String(msg || "");
    const safeMsg = /Cannot read properties of undefined \(reading 'bankId'\)/i.test(normalizedMsg)
      ? "Unable to load bank data right now. Please refresh once."
      : normalizedMsg;

    const id = Date.now();
    setToasts((t) => [...t, { id, msg: safeMsg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icons[t.type]}</span> {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
