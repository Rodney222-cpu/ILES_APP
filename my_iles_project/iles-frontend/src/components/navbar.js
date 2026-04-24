import React from "react"
const Navbar = () => {
  return (
    <div style={styles.nav}>
      <h2 style={styles.logo}>ILES</h2>

      <div style={styles.links}>
        <a href="#">Dashboard</a>
        <a href="#">Submit Log</a>
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