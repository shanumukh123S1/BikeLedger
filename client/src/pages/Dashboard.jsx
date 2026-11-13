// import { useEffect, useState } from "react";
// import Sidebar from "../components/Sidebar";
// import api from "../services/api";
// import "../styles/Dashboard.css";

// const Dashboard = () => {
//   const [totalCustomers, setTotalCustomers] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Fetch dashboard statistics
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const response = await api.get("/customers");

//         const customers = response.data.customers || [];

//         setTotalCustomers(customers.length);
//       } catch (err) {
//         console.error(
//           "Dashboard Data Error:",
//           err.response?.data || err.message,
//         );

//         setError("Unable to load customer statistics.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, []);

//   return (
//     <div className="dashboard-layout">
//       <Sidebar />

//       <main className="dashboard-main">
//         {/* Dashboard Header */}
//         <header className="dashboard-header">
//           <div>
//             <h1>Dashboard</h1>
//             <p>Welcome to your BikeLedger workspace.</p>
//           </div>

//           <div className="header-date">
//             {new Date().toLocaleDateString("en-IN", {
//               day: "2-digit",
//               month: "long",
//               year: "numeric",
//             })}
//           </div>
//         </header>

//         {/* Welcome Section */}
//         <section className="dashboard-welcome">
//           <div>
//             <h2>Welcome to BikeLedger!</h2>

//             <p>
//               Manage customer billing, EMI schedules and payment collections
//               from one place.
//             </p>
//           </div>

//           <div className="welcome-icon">₹</div>
//         </section>

//         {/* Dashboard Statistics */}
//         <section className="stats-grid">
//           {/* Total Customers */}
//           <div className="stat-card">
//             <span className="stat-label">Total Customers</span>

//             <h2>{loading ? "..." : totalCustomers}</h2>

//             <p>Active customer records</p>
//           </div>

//           {/* Total Collections */}
//           <div className="stat-card">
//             <span className="stat-label">Total Collections</span>

//             <h2>₹ --</h2>

//             <p>Recorded payments</p>
//           </div>

//           {/* Pending Payments */}
//           <div className="stat-card">
//             <span className="stat-label">Pending Payments</span>

//             <h2>--</h2>

//             <p>Outstanding instalments</p>
//           </div>

//           {/* Overdue Accounts */}
//           <div className="stat-card">
//             <span className="stat-label">Overdue Accounts</span>

//             <h2>--</h2>

//             <p>Accounts requiring attention</p>
//           </div>
//         </section>

//         {/* Error Message */}
//         {error && <div className="dashboard-error">{error}</div>}

//         {/* Dashboard Information */}
//         <section className="dashboard-information">
//           <div className="information-card">
//             <h3>Application Status</h3>

//             <p>
//               Your BikeLedger workspace is ready. Customer management is
//               available, and bike, billing and payment modules are being
//               developed.
//             </p>
//           </div>

//           <div className="information-card">
//             <h3>Quick Information</h3>

//             <p>
//               Use the sidebar to navigate between application modules as they
//               become available.
//             </p>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/Dashboard.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalCollections: 0,
    pendingPayments: 0,
    overdueAccounts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          api.get("/customers"),
          api.get("/billing"),
          api.get("/payments"),
        ]);

        if (!mounted) return;

        const failedRequests = results.filter(
          (result) => result.status === "rejected",
        );

        if (failedRequests.length > 0) {
          console.error("Dashboard API errors:", failedRequests);
          setError(
            "Some dashboard information could not be loaded. Please refresh.",
          );
        }

        const customers =
          results[0].status === "fulfilled"
            ? results[0].value.data?.customers || []
            : [];

        const invoices =
          results[1].status === "fulfilled"
            ? results[1].value.data?.invoices || []
            : [];

        const payments =
          results[2].status === "fulfilled"
            ? results[2].value.data?.payments || []
            : [];

        const totalCollections = payments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0,
        );

        const pendingPayments = invoices.reduce(
          (sum, invoice) => sum + Math.max(0, Number(invoice.balanceDue || 0)),
          0,
        );

        const overdueAccounts = invoices.filter(
          (invoice) =>
            invoice.paymentStatus === "Overdue" ||
            invoice.emiSchedule?.some(
              (installment) => installment.status === "Overdue",
            ),
        ).length;

        setDashboardData({
          totalCustomers: customers.length,
          totalInvoices: invoices.length,
          totalCollections,
          pendingPayments,
          overdueAccounts,
        });
      } catch (err) {
        console.error(
          "Dashboard Data Error:",
          err.response?.data || err.message,
        );

        if (mounted) {
          setError("Unable to load dashboard information.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to your BikeLedger workspace.</p>
          </div>

          <div className="header-date">
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <h2>Welcome to BikeLedger!</h2>
            <p>
              Manage customer billing, EMI schedules and payment collections
              from one place.
            </p>
          </div>

          <div className="welcome-icon">₹</div>
        </section>

        {error && <div className="dashboard-error">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Customers</span>
            <h2>{loading ? "..." : dashboardData.totalCustomers}</h2>
            <p>Customer records</p>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Collections</span>
            <h2>
              {loading ? "..." : formatCurrency(dashboardData.totalCollections)}
            </h2>
            <p>Payments received</p>
          </div>

          <div className="stat-card">
            <span className="stat-label">Pending Payments</span>
            <h2>
              {loading ? "..." : formatCurrency(dashboardData.pendingPayments)}
            </h2>
            <p>Outstanding invoice balances</p>
          </div>

          <div className="stat-card">
            <span className="stat-label">Overdue Accounts</span>
            <h2>{loading ? "..." : dashboardData.overdueAccounts}</h2>
            <p>Accounts requiring attention</p>
          </div>
        </section>

        <section className="dashboard-information">
          <div className="information-card">
            <h3>Application Status</h3>
            <p>
              Your BikeLedger workspace is connected to customer management,
              bike inventory, billing, EMI and payment records.
            </p>
          </div>

          <div className="information-card">
            <h3>Business Overview</h3>
            <p>
              {loading
                ? "Loading business information..."
                : `${dashboardData.totalInvoices} invoices recorded, with ${formatCurrency(
                    dashboardData.totalCollections,
                  )} collected and ${formatCurrency(
                    dashboardData.pendingPayments,
                  )} outstanding.`}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
