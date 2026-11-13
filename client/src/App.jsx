import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Testing autom
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Bikes from "./pages/Bikes";
import BikeInventory from "./pages/BikeInventory";
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import "./styles/Global.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/bikes" element={<Bikes />} />
            <Route path="/inventory" element={<BikeInventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
