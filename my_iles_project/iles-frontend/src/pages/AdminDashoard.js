import React, { useEffect, useState } from "react";
import api from './api';

const AdminDashboard = () => {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('placements/');
                setPlacements(response.data);
                setLoading(false);
            } catch (err) {}
        }
    }, []);

    return(
        <div>
            <h1>Admin Dashboard</h1>
            {placements.map(p => <p key={p.id}>{p.student_name} - {p.status}</p>)}
        </div>    
    );
} 