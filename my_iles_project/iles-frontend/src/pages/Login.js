import { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        {
          username,
          password,
        }
      );

      const { token, role } = response.data;

    
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

    
      if (role === "student") {
        window.location.href = "/student-dashboard";
      } else if (role === "admin") {
        window.location.href = "/admin-dashboard";
      } else if (role === "workplace_supervisor") {
        window.location.href = "/workplace-dashboard";
      } else if (role === "academic_supervisor") {
        window.location.href = "/academic-dashboard";
      }

    } catch (error) {
      alert("Invalid username or password");
    }
  };


  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2>Login</h2>

               <input
          style={styles.input}
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        /> 

                <button style={styles.button} onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}
export default Login;

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    