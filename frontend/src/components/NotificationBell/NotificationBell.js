import { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '../../services/api';
import styles from './NotificationBell.module.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = async () => {
    if (!showDropdown) {
      await fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'placement_approved':
        return '✅';
      case 'placement_rejected':
        return '❌';
      case 'placement_submitted':
        return '📝';
      case 'supervisor_assigned':
        return '👨‍🏫';
      case 'log_submitted':
        return '📄';
      case 'log_approved':
        return '✅';
      case 'log_rejected':
        return '❌';
      case 'log_reviewed':
        return '👀';
      case 'evaluation_submitted':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={styles.container}>
      <button className={styles.bellButton} onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className={styles.overlay} onClick={() => setShowDropdown(false)} />
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className={styles.markAllBtn}
                >
                  {loading ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`${styles.item} ${notif.is_read ? styles.read : styles.unread}`}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                  >
                    <div className={styles.icon}>{getNotificationIcon(notif.notification_type)}</div>
                    <div className={styles.content}>
                      <div className={styles.title}>{notif.title}</div>
                      <div className={styles.message}>{notif.message}</div>
                      <div className={styles.time}>{formatTime(notif.created_at)}</div>
                    </div>
                    {!notif.is_read && <div className={styles.dot} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
