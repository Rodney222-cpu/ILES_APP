import styles from "./AlertComponent.module.css";
import { useEffect } from "react";

function AlertComponent({
  message,
  type = "info",
  onClose,
  autoClose = true,
  duration = 3000,
}) {

  // Auto close logic
  useEffect(() => {
    if (!message || !autoClose) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, autoClose, duration, onClose]);

  if (!message) return null;


  const alertType = styles[type] ? styles[type] : styles.info;

  return (
    <div className={`${styles.alert} ${alertType}`}>
      <span>{message}</span>

      {onClose && (
        <button onClick={onClose} className={styles.closeBtn}>
          ×
        </button>
      )}
    </div>
  );
}

export default AlertComponent;