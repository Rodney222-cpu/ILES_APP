import React from "react";

const LogsTable = ({ logs }) => {
  return (
    <div>
      {/* Total Entries */}
      <h3 style={styles.count}>Total Entries: {logs.length}</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            
          </tr>
        </thead>

        <tbody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{log.date}</td>
                <td>{log.description}</td>
                <td>{log.hours}</td>

                {/* Status with color */}
                <td
                  style={{
                    color:
                      log.status === "Approved"
                        ? "green"
                        : log.status === "Pending"
                        ? "orange"
                        : "red",
                    fontWeight: "bold"
                  }}
                >
                  {log.status}
                </td>

                <td>{log.supervisor_feedback || "No feedback yet"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={styles.noData}>
                No logs available
              </td>
            </tr>
          )}
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
  cell: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left"
  }
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    boarder: "1px solid #ddd"
  },
  noData: {
    textAlign: "center",
    padding: "10px"
  }
};

export default LogsTable;