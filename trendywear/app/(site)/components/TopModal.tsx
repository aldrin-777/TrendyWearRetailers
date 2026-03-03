"use client";

import { useEffect, useState } from "react";

type TopModalProps = {
  message: string;
  type?: "success" | "error"; 
  autoCloseMs?: number;
  onClose?: () => void;
};

export default function TopModal({ message, type = "success", autoCloseMs = 3500, onClose }: TopModalProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  if (!visible) return null;

  const bgColor = type === "success" ? "bg-white" : "bg-white";
  const borderColor = type === "success" ? "border-green-500" : "border-red-500";
  const dotColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg pointer-events-auto">
        <div className={`rounded-xl border ${borderColor} ${bgColor} shadow-xl px-4 py-3`}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${dotColor}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#003049]">{message}</p>
            </div>
            <button
              onClick={() => { setVisible(false); onClose?.(); }}
              className="text-gray-400 hover:text-gray-700 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}