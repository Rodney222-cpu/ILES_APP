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
    ["DRAFT", "SUBMITTED", "PENDING_EVALUATION", "AUTHORIZED"].includes(
      String(log.status || "").toUpperCase()
    )
  ).length;
  const evaluatedLogs = logs.filter(
    (log) => String(log.status || "").toUpperCase() === "EVALUATED"
  ).length;
  
  // Calculate average marks
  const logsWithMarks = logs.filter(log => log.marks_awarded !== null && log.marks_awarded !== undefined);
  const averageMarks = logsWithMarks.length > 0 
    ? (logsWithMarks.reduce((sum, log) => sum + parseFloat(log.marks_awarded || 0), 0) / logsWithMarks.length).toFixed(1)
    : 0;

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedLogs = logs.slice(start, start + PAGE_SIZE);

  const statusClassMap = {
    EVALUATED: styles.approved,
    PENDING_EVALUATION: styles.reviewed,
    AUTHORIZED: styles.authorized,
    SUBMITTED: styles.pending,
    DRAFT: styles.draft,
  };

  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const openLogDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedLog(null);
    setShowDetailModal(false);
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
            <p className={styles.cardValue}>{evaluatedLogs}</p>
            <p className={styles.cardLabel}>Evaluated Logs</p>
          </div>
          <div className={`${styles.card} ${styles.purple}`}>
            <p className={styles.cardValue}>{averageMarks}%</p>
            <p className={styles.cardLabel}>Average Marks</p>
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
                <th>Week</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Workplace Review</th>
                <th>Academic Evaluation</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const status = String(log.status || "DRAFT").toUpperCase();
                return (
                  <tr key={log.id}>
                    <td><strong>Week {log.week_number}</strong></td>
                    <td>{log.log_date || "-"}</td>
                    <td>{log.hours_spent || 0}h</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          statusClassMap[status] || styles.pending
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {log.workplace_supervisor_comment ? (
                        <div className={styles.feedbackPreview}>
                          <span className={styles.feedbackIcon}>✓</span>
                          <span className={styles.feedbackText}>
                            {log.workplace_supervisor_comment.substring(0, 50)}
                            {log.workplace_supervisor_comment.length > 50 ? '...' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.noFeedback}>Not reviewed</span>
                      )}
                    </td>
                    <td>
                      {log.academic_supervisor_comment ? (
                        <div className={styles.feedbackPreview}>
                          <span className={styles.feedbackIcon}>✓</span>
                          <span className={styles.feedbackText}>
                            {log.academic_supervisor_comment.substring(0, 50)}
                            {log.academic_supervisor_comment.length > 50 ? '...' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.noFeedback}>Not evaluated</span>
                      )}
                    </td>
                    <td>
                      {log.marks_awarded !== null && log.marks_awarded !== undefined ? (
                        <div className={styles.marksDisplay}>
                          <strong className={`${styles.marksBadge} ${
                            log.marks_awarded >= 75 ? styles.marksExcellent :
                            log.marks_awarded >= 50 ? styles.marksGood :
                            styles.marksPoor
                          }`}>
                            {log.marks_awarded}/100
                          </strong>
                        </div>
                      ) : (
                        <span className={styles.noMarks}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewDetailsBtn}
                        onClick={() => openLogDetail(log)}
                      >
                        View Details
                      </button>
                    </td>
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

      {/* Log Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Week {selectedLog.week_number} - Log Details</h2>
              <button className={styles.closeBtn} onClick={closeDetailModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              {/* Basic Info */}
              <div className={styles.detailSection}>
                <h3>Log Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Week Number:</span>
                  <span className={styles.detailValue}>Week {selectedLog.week_number}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Submission Date:</span>
                  <span className={styles.detailValue}>{selectedLog.log_date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hours Worked:</span>
                  <span className={styles.detailValue}>{selectedLog.hours_spent} hours</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={`${styles.statusBadge} ${statusClassMap[selectedLog.status?.toUpperCase()]}`}>
                    {selectedLog.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Activities */}
              <div className={styles.detailSection}>
                <h3>Activities Performed</h3>
                <p className={styles.detailText}>{selectedLog.activities || 'No activities recorded'}</p>
              </div>

              {/* Challenges */}
              <div className={styles.detailSection}>
                <h3>Challenges Faced</h3>
                <p className={styles.detailText}>{selectedLog.challenges || 'No challenges recorded'}</p>
              </div>

              {/* Learning */}
              <div className={styles.detailSection}>
                <h3>Learning Outcomes</h3>
                <p className={styles.detailText}>{selectedLog.learning || 'No learning outcomes recorded'}</p>
              </div>

              {/* Workplace Supervisor Review */}
              {selectedLog.workplace_supervisor_comment && (
                <div className={styles.detailSection}>
                  <h3>Workplace Supervisor Review</h3>
                  <p className={styles.feedbackText}>{selectedLog.workplace_supervisor_comment}</p>
                  {selectedLog.workplace_reviewer_name && (
                    <p className={styles.reviewerInfo}>
                      <strong>Reviewed by:</strong> {selectedLog.workplace_reviewer_name}
                    </p>
                  )}
                  {selectedLog.workplace_review_date && (
                    <p className={styles.reviewerInfo}>
                      <strong>Review Date:</strong> {new Date(selectedLog.workplace_review_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Academic Supervisor Evaluation */}
              {selectedLog.academic_supervisor_comment && (
                <div className={styles.detailSection}>
                  <h3>Academic Supervisor Evaluation</h3>
                  <p className={styles.feedbackText}>{selectedLog.academic_supervisor_comment}</p>
                  {selectedLog.academic_evaluator_name && (
                    <p className={styles.reviewerInfo}>
                      <strong>Evaluated by:</strong> {selectedLog.academic_evaluator_name}
                    </p>
                  )}
                  {selectedLog.academic_evaluation_date && (
                    <p className={styles.reviewerInfo}>
                      <strong>Evaluation Date:</strong> {new Date(selectedLog.academic_evaluation_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Marks Awarded */}
              {selectedLog.marks_awarded !== null && selectedLog.marks_awarded !== undefined && (
                <div className={styles.detailSection}>
                  <h3>Marks Awarded</h3>
                  <div className={styles.marksDisplayLarge}>
                    <span className={`${styles.marksBadgeLarge} ${
                      selectedLog.marks_awarded >= 75 ? styles.marksExcellent :
                      selectedLog.marks_awarded >= 50 ? styles.marksGood :
                      styles.marksPoor
                    }`}>
                      {selectedLog.marks_awarded}/100
                    </span>
                    <span className={styles.marksPerformance}>
                      {selectedLog.marks_awarded >= 75 ? 'Excellent Performance' :
                       selectedLog.marks_awarded >= 50 ? 'Good Performance' :
                       'Needs Improvement'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnClose} onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
