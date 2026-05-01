import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student-dashboard" element={<h1>Student Dashboard</h1>} />
        <Route path="/admin-dashboard" element={<h1>Admin Dashboard</h1>} />
        <Route path="/workplace-dashboard" element={<h1>Workplace Supervisor</h1>} />
        <Route path="/academic-dashboard" element={<h1>Academic Supervisor</h1>} />
      </Routes>
    </Router>
  );
}



export default App;



