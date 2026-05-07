import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, setAuthToken } from "../../services/api";
import AlertComponent from "../../components/AlertComponent/AlertComponent";
import styles from "./LoginForm.module.css";

function LoginForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
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
    let newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage("Please fix the errors below");
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
      const response = await loginUser(formData);

      const { access, refresh, role, username } = response.data;

      setAuthToken(access, refresh, role, username);

      setType("success");
      setMessage("Login successful");

      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      setType("error");

      if (error.response?.data) {
        const backendErrors = Object.values(error.response.data)
          .flat()
          .join(", ");
        setMessage(backendErrors);
      } else {
        setMessage("Network error. Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to continue</p>
        </div>

        <AlertComponent
          message={message}
          type={type}
          onClose={handleCloseAlert}
        />

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>

            <input
              id="username"
              className={`${styles.input} ${errors.username ? styles.errorInput : ""}`}
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
            />

            {errors.username && (
              <small style={{ color: "red" }}>{errors.username}</small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>

            <input
              id="password"
              className={`${styles.input} ${errors.password ? styles.errorInput : ""}`}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />

            {errors.password && (
              <small style={{ color: "red" }}>{errors.password}</small>
            )}
          </div>

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.loadingText}>
                <span className={styles.spinner}></span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            No account?{" "}
            <Link to="/register" className={styles.link}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;