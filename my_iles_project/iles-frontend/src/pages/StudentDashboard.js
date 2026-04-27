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
  
  
  
  return (
    <div>
      <Navbar />

      <div style={styles.container}>
        <h2>Student Dashboard</h2>
        <h3>Welcome {student?.name}</h3>
        <p>Your internship progress overview</p>

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
 