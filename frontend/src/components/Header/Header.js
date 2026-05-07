import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthToken, getUserRole, removeAuthToken } from '../../services/api';
import NotificationBell from '../NotificationBell/NotificationBell';
import styles from './Header.module.css';

function Header() {
  const navigate = useNavigate();

  const isLoggedIn = !!getAuthToken();
  const role = getUserRole();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const dashboardPathByRole = {
    student: "/dashboard/student",
    workplace_supervisor: "/dashboard/workplace-supervisor",
    academic_supervisor: "/dashboard/academic-supervisor",
    admin: "/dashboard/admin",
  };
  const dashboardPath = dashboardPathByRole[role] || "/";

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>ILES (Internship Logging & Evaluation System)</Link>

        <div className={styles.links}>
          {isLoggedIn && (
            <>
              <Link to={dashboardPath}>Dashboard</Link>
              {role === "student" && (
                <Link to="/submit-log">Submit Log</Link>
              )}
              <NotificationBell />
            </>
          )}

          {!isLoggedIn ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <span className={styles.user}>Hi, {username}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;