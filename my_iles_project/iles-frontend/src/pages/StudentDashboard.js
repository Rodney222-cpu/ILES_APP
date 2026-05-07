
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import LogsTable from "../components/LogsTable";


const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStudentData();
    fetchLogs();
  }, []); 
  const fetchStudentData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/student/");
      setStudent(res.data);
    } catch (error) {
      console.error("Error fetching student:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/logs/");
      setLogs(res.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
    setLoading(false);
    }
  };
  if (loading) {
    return <h2 style={{ padding: "20px" }}>Loading dashboard...</h2>;
  }
  
  const totalLogs = logs.length;
  const approvedLogs = logs.filter(log => log.status === "Approved").length;
  const pendingLogs = logs.filter(log => log.status === "Pending").length;
  return (
    <div>
      <Navbar />

      <div style={styles.container}>
        <h2>Student Dashboard</h2>
        <h3>Welcome {student?.name}</h3>
        <p>Your internship progress overview</p>

        {/* Summary Cards */}
        <div style={styles.cards}>
          <SummaryCard title="Total Logs" value={totalLogs} color="#22c55e" />
          <SummaryCard title="Pending Reviews" value={pendingLogs} color="#f59e0b" />
          <SummaryCard title="Approved Logs" value={approvedLogs} color="#3b82f6" />
        </div>

        {/* Table */}
        <LogsTable logs={logs} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#f1f5f9",
    minHeight: "100vh"
  },
  cards: {
    display: "flex",
    gap: "15px",
    marginTop: "20px",
    marginBottom: "20px"
  }
};

export default StudentDashboard;
 