import React from "react"
const Navbar = () => {
  return (
    <div style={styles.nav}>
      <h2 style={styles.logo}>ILES (Internship Login and Evaluation System)</h2>

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
  btn: {
    padding: "6px 12px",
    background: "red",
    color: "white",
    border: "none",
    cursor: "pointer"
  }
};

export default Navbar;  