// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import StudentPanel from "./pages/StudentPanel.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

import DriverDashboard from "./pages/DriverDashboard.jsx";
import DriverPanel from "./pages/DriverPanel.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/panel" element={<StudentPanel />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/panel" element={<DriverPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
