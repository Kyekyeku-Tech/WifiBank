import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ZionWifiBank from "./pages/ZionWifiBank";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ZionWifiBank />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
