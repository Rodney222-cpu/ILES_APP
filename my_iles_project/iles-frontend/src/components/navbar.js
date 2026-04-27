import React from "react"
import logo from "../assets/logo.png";
const Navbar = () => {
  return (
    
    <div style={styles.logoContainer}>
      <img src={logo} alt="ILES Logo" style={styles.logoImage} />
      <h2 style={styles.logoText}>
        ILES (Internship Login and Evaluation System)
      </h2>
    </div>

      <div style={styles.links}>
        <button>Dashboard</button>
        <button>Submit Log</button>
        <button style={styles.btn}>Logout</button>
        </div>
    </div>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px",
    background: "#1e3a8a",
    color: "white"
  },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  logo: {
    margin: 0
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoImage: {
    width: "40px",
    height: "40px",
    objectFit: "cover"
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "bold"
  },
  btn: {
    padding: "6px 12px",
    background: "red",
    color: "white",
    border: "none",
    cursor: "pointer"
  }
};

export default Navbar;  