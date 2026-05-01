import React from "react";

const LogsTable = ({ logs }) => {
  return (
    <div>
      {/* Total Entries */}
      <h3 style={styles.count}>Total Entries: {logs.length}</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.cell}>Date</th>
            <th style={styles.cell}>Description</th>
            <th style={styles.cell}>Hours</th>
            <th style={styles.cell}>Status</th>
            <th style={styles.cell}>Supervisor Feedback</th>
            
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={styles.cell}>{log.date}</td>
              <td style={styles.cell}>{log.description}</td>
              <td style={styles.cell}>{log.hours}</td>

            <td
              style={{
                ...styles.cell,
                color:
                  log.status === "Approved"
                    ? "green"
                    : log.status === "Pending"
                    ? "orange"
                    : "red"
              }}
      >
        {log.status}
      </td>

      <td style={styles.cell}>
        {log.supervisor_feedback || "No feedback yet"}
      </td>
    </tr>
  ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  count: {
    marginTop: "20px",
    marginBottom: "10px"
  },
  
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    backgroundColor: "#ffffff",
    boarderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    boarder: "1px solid #ddd"
  },
  cell: {
    border: "1px solid #ddd",
    padding: "12px",
    boarderBottom:"1px solid #e5e7eb",
    textAlign: "left"
  },
  noData: {
    textAlign: "center",
    padding: "10px"
  }
};

export default LogsTable;