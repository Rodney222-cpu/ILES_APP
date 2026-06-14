import { useCallback, useEffect, useState } from "react";
import { getWeeklyLogs, reviewWeeklyLog, getPlacement } from "../../services/api";
import styles from "./SupervisorDashboard.module.css";

function WorkplaceSupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [feedback, setFeedback] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

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
        workplace_supervisor_comment: comment,
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

  const openLogModal = (log) => {
    setSelectedLog(log);
    setReviewComment(log.workplace_supervisor_comment || log.supervisor_comment || "");
    setShowModal(true);
    setError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLog(null);
    setReviewComment("");
    setError("");
  };

  const handleAuthorizeFromModal = async () => {
    if (!reviewComment.trim()) {
      setError("Please enter your review comments before authorizing.");
      return;
    }

    try {
      await reviewWeeklyLog(selectedLog.id, {
        status: "AUTHORIZED",
        workplace_supervisor_comment: reviewComment,
      });
      setMessage("Log authorized successfully!");
      closeModal();
      fetchLogs();
    } catch (err) {
      if (err.response?.data) {
        const msg = Object.values(err.response.data).flat().join(", ");
        setError(msg);
      } else {
        setError("Failed to authorize log.");
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Workplace Supervisor Dashboard</h1>
        <p className={styles.subtitle}>Review student weekly logs from your workplace</p>
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
          <option value="SUBMITTED">Submitted (Pending Review)</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
                      {log.status === "SUBMITTED" ? (
                        <>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.viewBtn}`}
                            onClick={() => openLogModal(log)}
                            title="View full log details"
                          >
                            View & Authorize
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.viewBtn}`}
                            onClick={() => openLogModal(log)}
                            title="View log details"
                          >
                            View Details
                          </button>
                          <span className={styles.statusBadge}>
                            {log.status}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Details Modal */}
      {showModal && selectedLog && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Weekly Log - Week {selectedLog.week_number}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {/* Student Info */}
              <div className={styles.detailsSection}>
                <h3>Student Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Student:</span>
                  <span>{selectedLog.student_username}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Week Number:</span>
                  <span>{selectedLog.week_number}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span>{selectedLog.log_date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hours Spent:</span>
                  <span>{selectedLog.hours_spent} hours</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={`${styles.statusBadge} ${styles[(selectedLog.status || "").toLowerCase()]}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              {/* Log Content */}
              <div className={styles.detailsSection}>
                <h3>Activities Performed</h3>
                <div className={styles.detailContent}>
                  {selectedLog.activities || selectedLog.description || "No activities recorded"}
                </div>
              </div>

              {selectedLog.challenges && (
                <div className={styles.detailsSection}>
                  <h3>Challenges Faced</h3>
                  <div className={styles.detailContent}>
                    {selectedLog.challenges}
                  </div>
                </div>
              )}

              {selectedLog.learning && (
                <div className={styles.detailsSection}>
                  <h3>Learning Outcomes</h3>
                  <div className={styles.detailContent}>
                    {selectedLog.learning}
                  </div>
                </div>
              )}

              {selectedLog.attachment && (
                <div className={styles.detailsSection}>
                  <h3>Attachment</h3>
                  <a 
                    href={selectedLog.attachment} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.attachmentLink}
                  >
                    📎 View Attachment
                  </a>
                </div>
              )}

              {/* Existing Comments */}
              {selectedLog.workplace_supervisor_comment && (
                <div className={styles.detailsSection}>
                  <h3>Previous Workplace Review</h3>
                  <div className={styles.existingComment}>
                    {selectedLog.workplace_supervisor_comment}
                  </div>
                </div>
              )}

              {selectedLog.academic_supervisor_comment && (
                <div className={styles.detailsSection}>
                  <h3>Academic Supervisor Feedback</h3>
                  <div className={styles.existingComment}>
                    {selectedLog.academic_supervisor_comment}
                  </div>
                  {selectedLog.marks_awarded !== null && selectedLog.marks_awarded !== undefined && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Marks Awarded:</span>
                      <span className={styles.marksAwarded}>{selectedLog.marks_awarded}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Authorization Form */}
              {selectedLog.status === "SUBMITTED" && (
                <div className={styles.authorizationSection}>
                  <h3>Workplace Supervisor Authorization</h3>
                  {error && <div className={styles.errorAlert}>{error}</div>}
                  <p className={styles.authNote}>
                    Review the student's log and provide your comments. Authorizing this log will allow the student to submit it to their academic supervisor for evaluation.
                  </p>
                  <label className={styles.formLabel}>
                    Your Review Comments <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Enter your feedback about the student's work this week..."
                    rows="5"
                    className={styles.reviewTextarea}
                    required
                  />
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnAuthorize}`}
                      onClick={handleAuthorizeFromModal}
                    >
                      Authorize Log
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnCancel}`}
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* View Only for Already Authorized/Reviewed Logs */}
              {selectedLog.status !== "SUBMITTED" && (
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnCancel}`}
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkplaceSupervisorDashboard;
