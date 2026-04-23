import React from "react"
import "./StudentDashboard.css";

const StudentDashboard = () => {
    return (
        <div className = "dashboard">
            <h1>Student Dashboard</h1>

            <div className = "card">
                <h2>Welcome , Student</h2>
                <p>Your internship details will appear here.</p>
            </div>

            <div className = "card">
                <h3>Internshp Status</h3>
                <p>Status: Ongoing</p>
            </div>

            <div className = "card">
                <h3>Supervisor</h3>
                <p>Name:</p>
            </div>
        </div>
    );
};

export default StudentDashboard;
