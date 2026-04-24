import { useEffect } from "react";

function App() {

  useEffect(() => {
    fetch("http://127.0.0.1:8000/weeklylogs/weeklylogs/")
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>ILES System</h1>
    </div>
  );
}

export default App;