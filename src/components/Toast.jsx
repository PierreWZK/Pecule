import { useEffect } from 'react';

export default function Toast({ message, tone, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast ${tone}`} role="status">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Fermer">×</button>
    </div>
  );
}
