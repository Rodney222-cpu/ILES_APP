import { useCallback, useEffect, useState } from "react";
import { getWeeklyLogs, reviewWeeklyLog, getPlacement } from "../../services/api";
import styles from "./SupervisorDashboard.module.css";

function WorkplaceSupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState('pending');
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

  const fetchLogs = useCallback(async () => {
    try {
      // Fetch ALL logs to show complete history
      const response = await getWeeklyLogs("ALL");
      setLogs(response.data || []);
    } catch (err) {
      setError("Failed to load assigned logs.");
    }
  }, []);

  useEffect(() => {
    fetchPlacements();
    fetchLogs();
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

      {/* Tabs for different sections */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({logs.filter(l => l.status === 'SUBMITTED').length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'authorized' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('authorized')}
        >
          Authorized ({logs.filter(l => ['AUTHORIZED', 'PENDING_EVALUATION', 'EVALUATED'].includes(l.status)).length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Reviewed ({logs.filter(l => l.workplace_supervisor_comment).length})
        </button>
      </div>

      {message && <div className={styles.successAlert}>{message}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* Pending Review Section */}
      {activeTab === 'pending' && (
        <div className={styles.section}>
          <h3>Pending Review</h3>
          {logs.filter(l => l.status === 'SUBMITTED').length === 0 ? (
            <p className={styles.emptyState}>No logs awaiting review</p>
          ) : (
            <div className={styles.placementsGrid}>
              {logs.filter(l => l.status === 'SUBMITTED').map((log) => (
                <div key={log.id} className={styles.placementCard} onClick={() => openLogModal(log)}>
                  <div className={styles.placementHeader}>
                    <div className={styles.avatar}>
                      {log.student_username?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div>
                      <div className={styles.studentName}>{log.student_username}</div>
                      <div className={styles.weekInfo}>Week {log.week_number} • {log.log_date}</div>
                    </div>
                  </div>
                  <div className={styles.placementInfo}>
                    <div className={styles.infoRow}>
                      <span>Hours:</span>
                      <span>{log.hours_spent}h</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Status:</span>
                      <span className={`${styles.statusBadge} ${styles.submitted}`}>
                        Awaiting Review
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Authorized Section */}
      {activeTab === 'authorized' && (
        <div className={styles.section}>
          <h3>Authorized Logs</h3>
          {logs.filter(l => ['AUTHORIZED', 'PENDING_EVALUATION', 'EVALUATED'].includes(l.status)).length === 0 ? (
            <p className={styles.emptyState}>No authorized logs yet</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Week</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>My Review</th>
                    <th>Review Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.filter(l => ['AUTHORIZED', 'PENDING_EVALUATION', 'EVALUATED'].includes(l.status)).map((log) => (
                    <tr key={log.id}>
                      <td>{log.student_username}</td>
                      <td><strong>Week {log.week_number}</strong></td>
                      <td>{log.log_date}</td>
                      <td>{log.hours_spent}h</td>
                      <td>
                        <div className={styles.reviewPreview}>
                          {log.workplace_supervisor_comment?.substring(0, 50)}
                          {log.workplace_supervisor_comment?.length > 50 ? '...' : ''}
                        </div>
                      </td>
                      <td>
                        {log.workplace_review_date 
                          ? new Date(log.workplace_review_date).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          log.status === 'EVALUATED' ? styles.evaluated :
                          log.status === 'PENDING_EVALUATION' ? styles.pending_evaluation :
                          styles.authorized
                        }`}>
                          {log.status === 'EVALUATED' ? 'Evaluated' :
                           log.status === 'PENDING_EVALUATION' ? 'With Academic' :
                           'Authorized'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.viewBtn}
                          onClick={() => openLogModal(log)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Reviewed Section */}
      {activeTab === 'all' && (
        <div className={styles.section}>
          <h3>Complete Review History</h3>
          {logs.filter(l => l.workplace_supervisor_comment).length === 0 ? (
            <p className={styles.emptyState}>No reviewed logs yet</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Week</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>My Review</th>
                    <th>Review Date</th>
                    <th>Current Status</th>
                    <th>Academic Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.filter(l => l.workplace_supervisor_comment).map((log) => (
                    <tr key={log.id}>
                      <td>{log.student_username}</td>
                      <td><strong>Week {log.week_number}</strong></td>
                      <td>{log.log_date}</td>
                      <td>{log.hours_spent}h</td>
                      <td>
                        <div className={styles.reviewPreview}>
                          {log.workplace_supervisor_comment?.substring(0, 50)}
                          {log.workplace_supervisor_comment?.length > 50 ? '...' : ''}
                        </div>
                      </td>
                      <td>
                        {log.workplace_review_date 
                          ? new Date(log.workplace_review_date).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          log.status === 'EVALUATED' ? styles.evaluated :
                          log.status === 'PENDING_EVALUATION' ? styles.pending_evaluation :
                          styles.authorized
                        }`}>
                          {log.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {log.marks_awarded !== null && log.marks_awarded !== undefined ? (
                          <strong className={`${styles.marksBadge} ${
                            log.marks_awarded >= 75 ? styles.marksExcellent :
                            log.marks_awarded >= 50 ? styles.marksGood :
                            styles.marksPoor
                          }`}>
                            {log.marks_awarded}/100
                          </strong>
                        ) : (
                          <span className={styles.noMarks}>Not yet</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={styles.viewBtn}
                          onClick={() => openLogModal(log)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        </div>
      )}

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
