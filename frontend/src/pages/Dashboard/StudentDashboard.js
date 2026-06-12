import { useEffect, useState } from "react";
import { createWeeklyLog, getWeeklyLogs, getPlacement } from "../../services/api";
import PlacementRequestForm from "../../components/PlacementRequestForm/PlacementRequestForm";
import styles from "./StudentDashboard.module.css";

const PAGE_SIZE = 5;

function StudentDashboard() {
  const [logs, setLogs] = useState([]);
  const [placement, setPlacement] = useState(null);
  const [placementLoading, setPlacementLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    description: "",
    hours_spent: "",
    challenges: "",
    activities: "",
    learning: "",
    week_number: "",
    attachment: null,
  });

  const fetchPlacement = async () => {
    try {
      const response = await getPlacement();
      if (response.data && response.data.length > 0) {
        setPlacement(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch placement:", err);
    } finally {
      setPlacementLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await getWeeklyLogs();
      setLogs(response.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  useEffect(() => {
    fetchPlacement();
    fetchLogs();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [logs, currentPage]);

  // TODO: These handlers are ready for a future inline log submission form
  // eslint-disable-next-line no-unused-vars
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      
      // Add form data (placement and deadline are auto-assigned by backend)
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          payload.append(key, value);
        }
      });

      await createWeeklyLog(payload);
      setFormData({
        description: "",
        hours_spent: "",
        challenges: "",
        activities: "",
        learning: "",
        week_number: "",
        attachment: null,
      });
      setCurrentPage(1);
      fetchLogs();
    } catch (err) {
      console.error("Failed to submit log:", err);
    }
  };

  const totalLogs = logs.length;
  const pendingLogs = logs.filter((log) =>
    ["DRAFT", "SUBMITTED", "PENDING", "REVIEWED"].includes(
      String(log.status || "").toUpperCase()
    )
  ).length;
  const approvedLogs = logs.filter(
    (log) => String(log.status || "").toUpperCase() === "APPROVED"
  ).length;

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedLogs = logs.slice(start, start + PAGE_SIZE);

  const statusClassMap = {
    APPROVED: styles.approved,
    REVIEWED: styles.reviewed,
    SUBMITTED: styles.pending,
    DRAFT: styles.pending,
    PENDING: styles.pending,
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>Student Dashboard</h2>
        <p className={styles.subtitle}>
          Welcome, <strong>{localStorage.getItem("username") || "Student"}</strong>.
          Track your internship progress and weekly logs.
        </p>
      </div>

      {/* Placement Status/Form Section - Always visible */}
      {placementLoading ? (
        <div className={styles.placementCard}>
          <p>Loading placement information...</p>
        </div>
      ) : !placement ? (
        <PlacementRequestForm onSuccess={fetchPlacement} />
      ) : (
        <div className={styles.placementCard}>
          <h3>Internship Placement Status</h3>
          <div className={styles.placementInfo}>
            <div className={styles.placementRow}>
              <span className={styles.placementLabel}>Company:</span>
              <span className={styles.placementValue}>{placement.company_name}</span>
            </div>
            <div className={styles.placementRow}>
              <span className={styles.placementLabel}>Position:</span>
              <span className={styles.placementValue}>{placement.position_title || 'N/A'}</span>
            </div>
            <div className={styles.placementRow}>
              <span className={styles.placementLabel}>Duration:</span>
              <span className={styles.placementValue}>
                {placement.start_date} to {placement.end_date}
              </span>
            </div>
            <div className={styles.placementRow}>
              <span className={styles.placementLabel}>Status:</span>
              <span className={`${styles.statusBadge} ${styles[placement.status]}`}>
                {placement.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {placement.academic_supervisor_username && (
              <div className={styles.placementRow}>
                <span className={styles.placementLabel}>Academic Supervisor:</span>
                <span className={styles.placementValue}>{placement.academic_supervisor_username}</span>
              </div>
            )}
            {placement.admin_comment && (
              <div className={styles.placementRow}>
                <span className={styles.placementLabel}>Admin Comment:</span>
                <span className={styles.placementValue}>{placement.admin_comment}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards - Show if placement exists */}
      {placement && (
        <div className={styles.cards}>
          <div className={`${styles.card} ${styles.green}`}>
            <p className={styles.cardValue}>{totalLogs}</p>
            <p className={styles.cardLabel}>Total Logs</p>
          </div>
          <div className={`${styles.card} ${styles.yellow}`}>
            <p className={styles.cardValue}>{pendingLogs}</p>
            <p className={styles.cardLabel}>Pending Reviews</p>
          </div>
          <div className={`${styles.card} ${styles.blue}`}>
            <p className={styles.cardValue}>{approvedLogs}</p>
            <p className={styles.cardLabel}>Approved Logs</p>
          </div>
        </div>
      )}

      {/* Logs Table - Always visible */}
      <h3 className={styles.tableTitle}>My Internship Logs</h3>
      {logs.length === 0 ? (
        <p className={styles.empty}>No logs yet. Click "Submit Log" in the header to submit your first log.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Supervisor Feedback</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const status = String(log.status || "PENDING").toUpperCase();
                return (
                  <tr key={log.id}>
                    <td>{log.log_date || "-"}</td>
                    <td>{log.description || "-"}</td>
                    <td>{log.hours_spent || 0}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          statusClassMap[status] || styles.pending
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>{log.supervisor_comment || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={styles.pagination}>
            <span>
              Showing {start + 1} to {Math.min(start + PAGE_SIZE, totalLogs)} of{" "}
              {totalLogs} entries
            </span>
            <div className={styles.pageButtons}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? styles.activePage : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
