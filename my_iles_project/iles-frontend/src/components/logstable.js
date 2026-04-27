import React from "react";

const LogsTable = ({ logs }) => {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Activity</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {logs.length > 0 ? (
          logs.map((log) => (
            <tr key={log.id}>
              <td>{log.date}</td>
              <td>{log.activity}</td>
              <td
                style={{
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
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="3">No logs available</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px"
  }
};

export default LogsTable;  
