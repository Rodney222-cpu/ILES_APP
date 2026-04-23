import React from "react"
import "./StudentDashboard.css";

const StudentDashboard = () => {
    return (
        <div>
            <h1>Student Dashboard</h1>

            <div>
                <h2>Welcome , Student</h2>
                <p>Your internship details will appear here.</p>
            </div>

            <div>
                <h3>Internshp Status</h3>
                <p>Status: Ongoing</p>
            </div>

            <div>
                <h3>Supervisor</h3>
                <p>Name:</p>
            </div>
        </div>
    );
};

export default StudentDashboard;
