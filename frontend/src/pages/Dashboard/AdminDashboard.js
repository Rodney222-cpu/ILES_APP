import { useEffect, useState } from 'react';
import { getPendingPlacements, approvePlacement, rejectPlacement, assignSupervisor, getSupervisors } from '../../services/api';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
  const [placements, setPlacements] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'approve', 'reject', 'assign'
  const [adminComment, setAdminComment] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPlacements = async () => {
    try {
      const response = await getPendingPlacements();
      setPlacements(response.data || []);
    } catch (err) {
      setError('Failed to load placements');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await getSupervisors();
      setSupervisors(response.data || []);
    } catch (err) {
      console.error('Failed to load supervisors');
    }
  };

  useEffect(() => {
    fetchPlacements();
    fetchSupervisors();
  }, []);

  const openModal = (placement, type) => {
    setSelectedPlacement(placement);
    setModalType(type);
    setShowModal(true);
    setAdminComment('');
    setSelectedSupervisor('');
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlacement(null);
    setModalType('');
    setAdminComment('');
    setSelectedSupervisor('');
  };

  const handleApprove = async () => {
    try {
      await approvePlacement(selectedPlacement.id, { admin_comment: adminComment });
      setMessage('Placement approved successfully!');
      fetchPlacements();
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setError('Failed to approve placement');
    }
  };

  const handleReject = async () => {
    if (!adminComment.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectPlacement(selectedPlacement.id, { admin_comment: adminComment });
      setMessage('Placement rejected');
      fetchPlacements();
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setError('Failed to reject placement');
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisor) {
      setError('Please select a supervisor');
      return;
    }
    try {
      await assignSupervisor(selectedPlacement.id, { academic_supervisor_id: selectedSupervisor });
      setMessage('Supervisor assigned successfully!');
      fetchPlacements();
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      setError('Failed to assign supervisor');
    }
  };

  if (loading) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage Internship Placements</p>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{placements.length}</div>
          <div className={styles.statLabel}>Pending Approvals</div>
        </div>
      </div>

      {message && <div className={styles.successAlert}>{message}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.tableContainer}>
        <h3>Pending Placement Requests</h3>
        {placements.length === 0 ? (
          <p className={styles.emptyState}>No pending placements</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Position</th>
                <th>Duration</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        {placement.student_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.studentName}>{placement.student_username}</div>
                        <div className={styles.studentNumber}>{placement.student_number}</div>
                      </div>
                    </div>
                  </td>
                  <td>{placement.company_name}</td>
                  <td>{placement.position_title || 'N/A'}</td>
                  <td>
                    {placement.start_date} to {placement.end_date}
                  </td>
                  <td>{new Date(placement.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.btn} ${styles.btnView}`}
                        onClick={() => openModal(placement, 'view')}
                      >
                        View
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnApprove}`}
                        onClick={() => openModal(placement, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => openModal(placement, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPlacement && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {modalType === 'view' && 'Placement Details'}
                {modalType === 'approve' && 'Approve Placement'}
                {modalType === 'reject' && 'Reject Placement'}
                {modalType === 'assign' && 'Assign Supervisor'}
              </h3>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {/* Placement Details */}
              <div className={styles.detailsSection}>
                <h4>Student Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span>{selectedPlacement.student_username}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Student Number:</span>
                  <span>{selectedPlacement.student_number}</span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Company Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Company:</span>
                  <span>{selectedPlacement.company_name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Address:</span>
                  <span>{selectedPlacement.company_address || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Person:</span>
                  <span>{selectedPlacement.company_contact_person || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Email:</span>
                  <span>{selectedPlacement.company_contact_email || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Phone:</span>
                  <span>{selectedPlacement.company_contact_phone || 'N/A'}</span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Position Details</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Position:</span>
                  <span>{selectedPlacement.position_title || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Department:</span>
                  <span>{selectedPlacement.department || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Start Date:</span>
                  <span>{selectedPlacement.start_date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>End Date:</span>
                  <span>{selectedPlacement.end_date}</span>
                </div>
              </div>

              {/* Action Forms */}
              {modalType === 'approve' && (
                <div className={styles.actionForm}>
                  <label>Comment (Optional)</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add any comments..."
                    rows="3"
                  />
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnApprove} onClick={handleApprove}>
                      Confirm Approval
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'reject' && (
                <div className={styles.actionForm}>
                  <label>Reason for Rejection *</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows="3"
                    required
                  />
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnReject} onClick={handleReject}>
                      Confirm Rejection
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'assign' && (
                <div className={styles.actionForm}>
                  <label>Select Academic Supervisor *</label>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                  >
                    <option value="">-- Select Supervisor --</option>
                    {supervisors.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.username} - {sup.department || 'N/A'}
                      </option>
                    ))}
                  </select>
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnApprove} onClick={handleAssignSupervisor}>
                      Assign Supervisor
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'view' && (
                <div className={styles.actionFormButtons}>
                  <button className={styles.btnApprove} onClick={() => setModalType('approve')}>
                    Approve
                  </button>
                  <button className={styles.btnReject} onClick={() => setModalType('reject')}>
                    Reject
                  </button>
                  <button className={styles.btnCancel} onClick={closeModal}>
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

export default AdminDashboard;
