import React from "react";

const LogsTable = ({ logs }) => {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Activity</th>
          <th>Hours</th>
          <th>Status</th>
          <th>Feedback</th>
        </tr>
      </thead>

      <tbody>
        {logs.map((log, index) => (
          <tr key={index}>
            <td>{log.date}</td>
            <td>{log.activity}</td>
            <td>{log.hours}</td>
            <td>
              <span style={getStatusStyle(log.status)}>
                {log.status}
              </span>
            </td>
            <td>{log.feedback}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const getStatusStyle = (status) => {
  let color = "gray";

  if (status === "Approved") color = "green";
  if (status === "Pending") color = "orange";
  if (status === "Reviewed") color = "blue";

  return {
    padding: "5px",
    color: "white",
    backgroundColor: color,
    borderRadius: "5px"
  };
};

const styles = {
    table: {
        width: "100%",
        borderCollapse: "collapse",
        background: "white",
        borderRadius: "10px",
        overflow: "hidden"
  },
  th: {
    background: "#1e3a8a",
    color: "white",
    padding: "10px",
    textAlign: "left"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd"
  }
};
  
  

export default LogsTable;