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
            } catch (err) {
                setError('You are not authorized or the server is down');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p>Loading Dashboard...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return(
        <div style={{ padding: '20px'}}>    
            <h1>Admin Dashboard</h1>

            <h2>React Placements</h2>
            <table border="1" cellPadding="10">
                <thread>
                    <tr>
                        <th>student</th>
                        <th>company_name</th>
                        <th>status</th>
                        <th>Action</th>
                    </tr>
                </thread> 
                <tbody>
                   {placements.map((p) => (
                     <th key={p.id}>
                        <td>{p.student_name}</td>
                        <td>{p.company_name}</td>
                        <td>{p.status}</td>
                     </th>
                   ))}
                </tbody>   
            </table>
        </div>    
    );
};

export default AdminDashboard;