import { useState } from "react";
import axios from "axios";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
      if (!username || !password || !confirmPassword) {



     if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
    try {
      await axios.post("http://127.0.0.1:8000/api/register/", {
        username,
        password,
        role,
      });

      alert("Registered successfully");

      // Redirect to login page
      window.location.href = "/";

    } catch (error) {
      alert("Registration failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2>Register</h2>

        <input
          style={styles.input}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
  style={styles.input}
  type="password"
  placeholder="Confirm Password"
  onChange={(e) => setConfirmPassword(e.target.value)}
/>

        <select
          style={styles.input}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="workplace_supervisor">Workplace Supervisor</option>
          <option value="academic_supervisor">Academic Supervisor</option>
        </select>

        <button style={styles.button} onClick={handleRegister}>
          Register
        
        </button>

        <p onClick={() => window.location.href = "/"} style={{cursor: "pointer"}}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Register;


// ✅ same styling as login
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "30px",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "300px",
    textAlign: "center",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};