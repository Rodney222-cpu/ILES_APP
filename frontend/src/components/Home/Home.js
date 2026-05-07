/* src/pages/Home/Home.js */

import React, { useEffect, useState } from "react";
import { getAuthToken } from "../../services/api";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

function Home() {
  const [user, setUser] = useState(null);

  const token = getAuthToken();

  useEffect(() => {
    
    if (token) {
      const storedUsername = localStorage.getItem("username");
      const storedRole = localStorage.getItem("role");

      setUser({
        username: storedUsername,
        role: storedRole,
      });
    } else {
      setUser(null);
    }
  }, [token]);

  return (
    <div className={styles.home}>
      <h1>Welcome to MyApp</h1>

      {token && user ? (
        <div>
          <p>
            Logged in as <strong>{user.username}</strong>
          </p>
          <p>Role: {user.role}</p>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>

          <div className={styles.links}>
            <Link to="/login">Login</Link>
            <span> | </span>
            <Link to="/register">Register</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;