import { useEffect, useState } from 'react';

export function StatusToast({ message, type = 'info', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900', // Fixed: dark text for better contrast
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 border rounded-lg shadow-lg p-4 ${bgColors[type]} transition-opacity duration-300`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          aria-label="إغلاق"
          className="text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function StatusToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto z-50 space-y-2" aria-live="polite" aria-label="الإشعارات">
      {toasts.map((toast) => (
        <StatusToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

