import React from "react";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import LogsTable from "../components/LogsTable";
import logs from "../data/dummyLogs";

const StudentDashboard = () => {
  return (
    <div>
      <Navbar />

      <div style={styles.container}>
        <h2>Student Dashboard</h2>

        {/* Summary Cards */}
        <div style={styles.cards}>
          <SummaryCard title="Total Logs" value="12" color="#22c55e" />
          <SummaryCard title="Pending Reviews" value="3" color="#f59e0b" />
          <SummaryCard title="Approved Logs" value="7" color="#3b82f6" />
        </div>

        {/* Table */}
        <LogsTable logs={logs} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px"
  },
  cards: {
    display: "flex",
    gap: "15px"
  }
};

export default StudentDashboard;
