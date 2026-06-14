import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/api";
import AlertComponent from "../../components/AlertComponent/AlertComponent";
import styles from "./RegistrationForm.module.css";

function RegistrationForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    student_number: "",
    staff_number: "",
    department: "",
    company_name: "",
  });

  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCloseAlert = () => {
    setMessage("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.email) {
      setMessage("Username, email, and password are required");
      setType("error");
      return false;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("Please enter a valid email address");
      setType("error");
      return false;
    }

    if (formData.password.length < 8) {
      setMessage("Password must be at least 8 characters");
      setType("error");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setType("error");
      return false;
    }

    if (formData.role === "student" && !formData.student_number) {
      setMessage("Student number is required");
      setType("error");
      return false;
    }

    if (
      (formData.role === "workplace_supervisor" ||
        formData.role === "academic_supervisor" ||
        formData.role === "admin") &&
      !formData.staff_number
    ) {
      setMessage("Staff number is required");
      setType("error");
      return false;
    }

    if (formData.role === "workplace_supervisor" && !formData.company_name) {
      setMessage("Company name is required for workplace supervisors");
      setType("error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const { confirmPassword, ...payload } = formData;

      // Clean up payload - only send relevant fields based on role
      const cleanPayload = {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        department: payload.department || undefined,
      };

      // Add role-specific fields
      if (payload.role === 'student') {
        cleanPayload.student_number = payload.student_number;
      } else if (payload.role === 'workplace_supervisor') {
        cleanPayload.staff_number = payload.staff_number;
        cleanPayload.company_name = payload.company_name;
      } else if (payload.role === 'academic_supervisor') {
        cleanPayload.staff_number = payload.staff_number;
      }

      const response = await registerUser(cleanPayload);

      setMessage(response.data.message || "Registration successful");
      setType("success");

      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
        student_number: "",
        staff_number: "",
        department: "",
        company_name: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      if (error.response?.data) {
        const backendErrors = Object.values(error.response.data)
          .flat()
          .join(", ");
        setMessage(backendErrors);
      } else {
        setMessage("Something went wrong");
      }

      setType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Join us today</p>
        </div>

        <AlertComponent
          message={message}
          type={type}
          onClose={handleCloseAlert}
        />

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              name="username"
              value={formData.username}
              placeholder="Choose a username"
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              name="email"
              type="email"
              value={formData.email}
              placeholder="Enter your email address"
              onChange={handleChange}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                name="password"
                value={formData.password}
                type="password"
                placeholder="Min. 8 characters"
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                name="confirmPassword"
                value={formData.confirmPassword}
                type="password"
                placeholder="Re-enter password"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <select 
              className={styles.select}
              name="role" 
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="workplace_supervisor">Workplace Supervisor</option>
              <option value="academic_supervisor">Academic Supervisor</option>
              <option value="admin">Internship Administrator</option>
            </select>
          </div>

          {formData.role === "student" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Student Number</label>
              <input
                className={styles.input}
                name="student_number"
                value={formData.student_number}
                placeholder="Enter your student number"
                onChange={handleChange}
              />
            </div>
          )}

          {(formData.role === "workplace_supervisor" ||
            formData.role === "academic_supervisor" ||
            formData.role === "admin") && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Staff Number</label>
              <input
                className={styles.input}
                name="staff_number"
                value={formData.staff_number}
                placeholder="Enter your staff number"
                onChange={handleChange}
              />
            </div>
          )}

          {formData.role === "workplace_supervisor" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Company Name</label>
              <input
                className={styles.input}
                name="company_name"
                value={formData.company_name}
                placeholder="Enter your company name"
                onChange={handleChange}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Department</label>
            <input
              className={styles.input}
              name="department"
              value={formData.department}
              placeholder="Enter your department"
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <span className={styles.loadingText}>
                <span className={styles.spinner}></span>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;