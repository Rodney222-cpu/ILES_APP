import React from "react";

const SummaryCard = ({ title, value, color }) => {
  return (
    <div style={{ ...styles.card, backgroundColor: color }}>
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  );
};

const styles = {
  card: {
    padding: "20px",
    borderRadius: "10px",
    color: "white",
    width: "200px",
    textAlign: "center"
  }
};

export default SummaryCard;