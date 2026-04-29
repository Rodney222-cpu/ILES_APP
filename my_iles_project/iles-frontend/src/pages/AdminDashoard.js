import { useEffect, useState } from "react";
import axios from 'axios';

function Dashboard() {
    const [placements, setPlacements] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0')
          .then(res => setPlacements(res.data));
    }, []);

    return(
        <div>
            <h1>Admin Dashboard</h1>
            {placements.map(p => <p key={p.id}>{p.student_name} - {p.status}</p>)}
    )
} 