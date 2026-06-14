import { useCallback, useEffect, useState } from "react";
import { getWeeklyLogs, evaluateWeeklyLog, getPlacement } from "../../services/api";
import EvaluationForm from "../../components/EvaluationForm/EvaluationForm";
import styles from "./SupervisorDashboard.module.css";

function AcademicSupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [feedback, setFeedback] = useState({});
  const [marks, setMarks] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

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

  const handleEvaluate = async (logId) => {
    const comment = (feedback[logId] || "").trim();
    const marksValue = marks[logId];

    if (!comment) {
      setError("Please enter evaluation comments before submitting.");
      return;
    }

    if (marksValue === undefined || marksValue === "") {
      setError("Please enter marks before submitting.");
      return;
    }

    const marksNum = parseFloat(marksValue);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setError("Marks must be a number between 0 and 100.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await evaluateWeeklyLog(logId, {
        academic_supervisor_comment: comment,
        marks_awarded: marksNum,
      });
      setMessage(`Log evaluated successfully with ${marksNum} marks.`);
      setFeedback((prev) => {
        const updated = { ...prev };
        delete updated[logId];
        return updated;
      });
      setMarks((prev) => {
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
        setError("Failed to evaluate log.");
      }
    }
  };

  const openLogModal = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const closeLogModal = () => {
    setSelectedLog(null);
    setShowLogModal(false);
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
        <h1 className={styles.title}>Academic Supervisor Dashboard</h1>
        <p className={styles.subtitle}>Evaluate and grade student weekly logs (after workplace review)</p>
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
          <option value="PENDING_EVALUATION">Awaiting Evaluation</option>
          <option value="EVALUATED">Evaluated</option>
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
              <th>Workplace Review</th>
              <th>Status</th>
              <th>Feedback & Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
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
                      <button
                        type="button"
                        className={styles.viewDetailsBtn}
                        onClick={() => openLogModal(log)}
                      >
                        View Full Details
                      </button>
                    </div>
                  </td>
                  <td>
                    {log.workplace_supervisor_comment ? (
                      <div className={styles.workplaceReview}>
                        <div className={styles.reviewLabel}>✓ Authorized by Workplace</div>
                        <div className={styles.reviewComment}>
                          {log.workplace_supervisor_comment}
                        </div>
                        {log.workplace_reviewer_name && (
                          <div className={styles.reviewMeta}>
                            — {log.workplace_reviewer_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.notReviewed}>Not reviewed yet</span>
                    )}
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
                      {log.status === "EVALUATED" ? (
                        <div className={styles.evaluatedInfo}>
                          <div className={styles.marksDisplay}>
                            <strong>Marks: {log.marks_awarded}/100</strong>
                          </div>
                          <div className={styles.existingFeedback}>
                            {log.academic_supervisor_comment}
                          </div>
                          {log.academic_evaluator_name && (
                            <div className={styles.evaluatorName}>
                              — {log.academic_evaluator_name}
                            </div>
                          )}
                        </div>
                      ) : log.status === "PENDING_EVALUATION" ? (
                        <>
                          <textarea
                            value={feedback[log.id] ?? ""}
                            onChange={(e) =>
                              setFeedback((prev) => ({
                                ...prev,
                                [log.id]: e.target.value,
                              }))
                            }
                            placeholder="Enter your evaluation comments..."
                            className={styles.feedbackInput}
                            rows="3"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={marks[log.id] ?? ""}
                            onChange={(e) =>
                              setMarks((prev) => ({
                                ...prev,
                                [log.id]: e.target.value,
                              }))
                            }
                            placeholder="Marks (0-100)"
                            className={styles.marksInput}
                          />
                        </>
                      ) : (
                        <span className={styles.notApplicable}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {log.status === "PENDING_EVALUATION" ? (
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.evaluateBtn}`}
                          onClick={() => handleEvaluate(log.id)}
                          title="Submit evaluation and marks"
                        >
                          Submit Evaluation
                        </button>
                      ) : log.status === "EVALUATED" ? (
                        <span className={styles.completeBadge}>✓ Completed</span>
                      ) : (
                        <span className={styles.statusInfo}>{log.status}</span>
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
      {showLogModal && selectedLog && (
        <div className={styles.modalOverlay} onClick={closeLogModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Week {selectedLog.week_number} Log Details</h2>
              <button className={styles.closeBtn} onClick={closeLogModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Student Information</h3>
                <p><strong>Student:</strong> {selectedLog.student_username}</p>
                <p><strong>Log Date:</strong> {selectedLog.log_date}</p>
                <p><strong>Hours:</strong> {selectedLog.hours_spent} hours</p>
              </div>

              <div className={styles.detailSection}>
                <h3>Activities</h3>
                <p>{selectedLog.activities || "No activities recorded"}</p>
              </div>

              <div className={styles.detailSection}>
                <h3>Challenges</h3>
                <p>{selectedLog.challenges || "No challenges recorded"}</p>
              </div>

              <div className={styles.detailSection}>
                <h3>Learning Outcomes</h3>
                <p>{selectedLog.learning || "No learning outcomes recorded"}</p>
              </div>

              {selectedLog.workplace_supervisor_comment && (
                <div className={styles.detailSection}>
                  <h3>Workplace Supervisor Review</h3>
                  <p className={styles.reviewComment}>{selectedLog.workplace_supervisor_comment}</p>
                  {selectedLog.workplace_reviewer_name && (
                    <p className={styles.reviewerName}>— {selectedLog.workplace_reviewer_name}</p>
                  )}
                  {selectedLog.workplace_review_date && (
                    <p className={styles.reviewDate}>
                      {new Date(selectedLog.workplace_review_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcademicSupervisorDashboard;
