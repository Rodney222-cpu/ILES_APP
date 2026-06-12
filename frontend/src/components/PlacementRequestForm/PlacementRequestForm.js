import { useState, useEffect } from 'react';
import { createPlacement, getWorkplaceSupervisors } from '../../services/api';
import styles from './PlacementRequestForm.module.css';

function PlacementRequestForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_contact_person: '',
    company_contact_email: '',
    company_contact_phone: '',
    position_title: '',
    department: '',
    start_date: '',
    end_date: '',
    workplace_supervisor: ''
  });

  const [workplaceSupervisors, setWorkplaceSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWS = async () => {
      try {
        const response = await getWorkplaceSupervisors();
        setWorkplaceSupervisors(response.data || []);
      } catch (err) {
        console.error('Failed to load workplace supervisors');
      }
    };
    fetchWS();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createPlacement(formData);
      alert('Placement request submitted successfully! Waiting for admin approval.');
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Check for specific error messages
        if (errorData.detail && errorData.detail.includes('already have a placement')) {
          setError('You already have a placement request. Students can only have one placement at a time.');
        } else {
          const msg = Object.values(errorData).flat().join(', ');
          setError(msg);
        }
      } else {
        setError('Failed to submit placement request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Submit Internship Placement Request</h3>
      <p className={styles.subtitle}>Fill in your internship details for admin approval</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h4>Company Information</h4>
          
          <div className={styles.formGroup}>
            <label>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Company Address</label>
            <textarea
              name="company_address"
              value={formData.company_address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Contact Person</label>
              <input
                type="text"
                name="company_contact_person"
                value={formData.company_contact_person}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Email</label>
              <input
                type="email"
                name="company_contact_email"
                value={formData.company_contact_email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Contact Phone</label>
            <input
              type="tel"
              name="company_contact_phone"
              value={formData.company_contact_phone}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Workplace Supervisor *</label>
            <select
              name="workplace_supervisor"
              value={formData.workplace_supervisor}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Your Workplace Supervisor --</option>
              {workplaceSupervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.username} ({sup.department || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Position Details</h4>
          
          <div className={styles.formGroup}>
            <label>Position Title *</label>
            <input
              type="text"
              name="position_title"
              value={formData.position_title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>End Date *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Submitting...' : 'Submit Placement Request'}
        </button>
      </form>
    </div>
  );
}

export default PlacementRequestForm;
