import React, { useEffect, useState } from "react";
import api from './api';

const AdminDashboard = () => {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://127.0.0')
          .then(res => setPlacements(res.data));
    }, []);

    return(
        <div>
            <h1>Admin Dashboard</h1>
            {placements.map(p => <p key={p.id}>{p.student_name} - {p.status}</p>)}
        </div>    
    );
} 