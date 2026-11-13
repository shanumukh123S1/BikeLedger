import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">BL</div>
        <div>
          <h2>BikeLedger</h2>
          <span>Management System</span>
        </div>
      </div>

      <div className="sidebar-section-title">MAIN MENU</div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>▦</span> Dashboard
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>♙</span> Customers
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>🏍</span>
          Bike Inventory
        </NavLink>

        <NavLink
          to="/bikes"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>▣</span> Bike Details
        </NavLink>

        {/* Billing & EMI - Active */}
        <NavLink
          to="/billing"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>₹</span> Billing & EMI
        </NavLink>

        {/* Payments */}
        <NavLink
          to="/payments"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>↔</span> Payments
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>▤</span> Reports
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="staff-profile">
          <div className="staff-avatar">
            {staff?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="staff-info">
            <strong>{staff?.name}</strong>
            <span>{staff?.role}</span>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          ↪ Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

// import { NavLink, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const Sidebar = () => {
//   const { staff, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login", { replace: true });
//   };

//   const getNavClass = ({ isActive }) =>
//     isActive ? "nav-link active" : "nav-link";

//   return (
//     <aside className="sidebar">
//       <div className="sidebar-brand">
//         <div className="sidebar-logo">BL</div>
//         <div>
//           <h2>BikeLedger</h2>
//           <span>Management System</span>
//         </div>
//       </div>

//       <div className="sidebar-section-title">MAIN MENU</div>

//       <nav className="sidebar-nav">
//         <NavLink to="/dashboard" className={getNavClass}>
//           <span>▦</span> Dashboard
//         </NavLink>

//         <NavLink to="/customers" className={getNavClass}>
//           <span>♙</span> Customers
//         </NavLink>

//         <NavLink to="/inventory" className={getNavClass}>
//           <span>🏍</span> Bike Inventory
//         </NavLink>

//         <NavLink to="/bikes" className={getNavClass}>
//           <span>▣</span> Bike Details
//         </NavLink>

//         <NavLink to="/billing" className={getNavClass}>
//           <span>₹</span> Billing & EMI
//         </NavLink>

//         <NavLink to="/payments" className={getNavClass}>
//           <span>↔</span> Payments
//         </NavLink>

//         <NavLink to="/reports" className={getNavClass}>
//           <span>▤</span> Reports
//         </NavLink>
//       </nav>

//       <div className="sidebar-bottom">
//         <div className="staff-profile">
//           <div className="staff-avatar">
//             {staff?.name?.charAt(0)?.toUpperCase() || "A"}
//           </div>

//           <div className="staff-info">
//             <strong>{staff?.name}</strong>
//             <span>{staff?.role}</span>
//           </div>
//         </div>

//         <button className="logout-button" onClick={handleLogout}>
//           ↪ Sign Out
//         </button>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;
