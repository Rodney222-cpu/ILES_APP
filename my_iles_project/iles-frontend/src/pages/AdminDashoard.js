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
    )
} 