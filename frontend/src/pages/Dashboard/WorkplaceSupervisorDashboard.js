import { useCallback, useEffect, useState } from "react";
import { getWeeklyLogs, reviewWeeklyLog, getPlacement } from "../../services/api";
import EvaluationForm from "../../components/EvaluationForm/EvaluationForm";
import styles from "./SupervisorDashboard.module.css";

function WorkplaceSupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [feedback, setFeedback] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  const fetchPlacements = async () => {
    try {
      const response = await getPlacement();
      setPlacements(response.data || []);
    } catch (err) {
      console.error("Failed to load placements");
    }
  };

  const fetchLogs = useCallback(async (selectedStatus = status) => {
    try {
      const response = await getWeeklyLogs(selectedStatus);
      setLogs(response.data || []);
    } catch (err) {
      setError("Failed to load assigned logs.");
    }
  }, [status]);

  useEffect(() => {
    fetchPlacements();
    fetchLogs("ALL");
  }, [fetchLogs]);

  const handleDecision = async (logId, decisionStatus) => {
    const comment = (feedback[logId] || "").trim();
    if (!comment) {
      setError("Please enter feedback before updating status.");
      return;
    }
    setError("");
    setMessage("");

    try {
      await reviewWeeklyLog(logId, {
        status: decisionStatus,
        supervisor_comment: comment,
      });
      setMessage(`Log ${decisionStatus.toLowerCase()} successfully.`);
      setFeedback((prev) => {
        const updated = { ...prev };
        delete updated[logId];
        return updated;
      });
      fetchLogs();
    } catch (err) {
      if (err.response?.data) {
        const msg = Object.values(err.response.data).flat().join(", ");
        setError(msg);
      } else {
        setError("Failed to update log.");
      }
    }
  };

  const openEvaluationForm = (placement) => {
    setSelectedPlacement(placement);
    setShowEvaluationForm(true);
  };

  const closeEvaluationForm = () => {
    setShowEvaluationForm(false);
    setSelectedPlacement(null);
  };

  if (showEvaluationForm && selectedPlacement) {
    return (
      <EvaluationForm
        placement={selectedPlacement}
        onSuccess={() => {
          closeEvaluationForm();
          setMessage("Evaluation submitted successfully!");
        }}
        onCancel={closeEvaluationForm}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Supervisor Dashboard</h1>
        <p className={styles.subtitle}>Internship Logging & Evaluation System (ILES)</p>
      </div>

      {/* Assigned Students Section */}
      {placements.length > 0 && (
        <div className={styles.placementsSection}>
          <h3>Assigned Students</h3>
          <div className={styles.placementsGrid}>
            {placements.map((placement) => (
              <div key={placement.id} className={styles.placementCard}>
                <div className={styles.placementHeader}>
                  <div className={styles.avatar}>
                    {placement.student_username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.studentName}>{placement.student_username}</div>
                    <div className={styles.companyName}>{placement.company_name}</div>
                  </div>
                </div>
                <div className={styles.placementInfo}>
                  <div className={styles.infoRow}>
                    <span>Position:</span>
                    <span>{placement.position_title || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Duration:</span>
                    <span>{placement.start_date} to {placement.end_date}</span>
                  </div>
                </div>
                <button
                  className={styles.evaluateBtn}
                  onClick={() => openEvaluationForm(placement)}
                >
                  Evaluate Student
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterBar}>
        <label htmlFor="statusFilter" className={styles.filterLabel}>
          Filter by Status:
        </label>
        <select
          id="statusFilter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">All Logs</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button
          type="button"
          className={styles.filterBtn}
          onClick={() => fetchLogs(status)}
        >
          Filter
        </button>
      </div>

      {message && <div className={styles.successAlert}>{message}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Log Entry</th>
              <th>Status</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        {(log.student_username || "S").charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.studentName}>
                        {log.student_username || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.logEntry}>
                      <div className={styles.logDescription}>
                        {log.activities || log.description || "No description"}
                      </div>
                      <div className={styles.logMeta}>
                        Week {log.week_number} • {log.log_date} • {log.hours_spent}h
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[(log.status || "").toLowerCase()] || styles.submitted
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.feedbackCell}>
                      {log.supervisor_comment && !feedback[log.id] ? (
                        <div className={styles.existingFeedback}>
                          {log.supervisor_comment}
                        </div>
                      ) : (
                        <textarea
                          value={feedback[log.id] ?? ""}
                          onChange={(e) =>
                            setFeedback((prev) => ({
                              ...prev,
                              [log.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter your feedback..."
                          className={styles.feedbackInput}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.reviewBtn}`}
                        onClick={() => handleDecision(log.id, "REVIEWED")}
                        title="Review Log"
                      >
                        Review Log
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                        onClick={() => handleDecision(log.id, "APPROVED")}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                        onClick={() => handleDecision(log.id, "REJECTED")}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkplaceSupervisorDashboard;
