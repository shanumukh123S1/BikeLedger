// import React, { useEffect, useMemo, useState } from "react";
// import api from "../services/api";
// import "../styles/Payments.css";
// import Sidebar from "../components/Sidebar";
// const formatCurrency = (amount) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(amount) || 0);

// const formatDate = (date) => {
//   if (!date) return "—";

//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const Payments = () => {
//   const [payments, setPayments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
//   const [methodFilter, setMethodFilter] = useState("All");
//   const [dateFilter, setDateFilter] = useState("All");

//   const fetchPayments = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await api.get("/payments");

//       setPayments(response.data?.payments || []);
//     } catch (err) {
//       console.error("Fetch payments error:", err);

//       setError(
//         err.response?.data?.message ||
//           "Unable to load payment records. Please try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, []);

//   const filteredPayments = useMemo(() => {
//     const now = new Date();

//     return payments.filter((payment) => {
//       const customerName = payment.customer?.name || "";
//       const invoiceNumber = payment.invoice?.invoiceNumber || "";
//       const reference = payment.transactionReference || "";
//       const query = search.trim().toLowerCase();

//       const matchesSearch =
//         customerName.toLowerCase().includes(query) ||
//         invoiceNumber.toLowerCase().includes(query) ||
//         reference.toLowerCase().includes(query);

//       const matchesType =
//         paymentTypeFilter === "All" ||
//         payment.paymentType === paymentTypeFilter;

//       const matchesMethod =
//         methodFilter === "All" || payment.paymentMethod === methodFilter;

//       const paymentDate = new Date(payment.paymentDate);

//       let matchesDate = true;

//       if (dateFilter === "Today") {
//         matchesDate = paymentDate.toDateString() === now.toDateString();
//       } else if (dateFilter === "This Month") {
//         matchesDate =
//           paymentDate.getMonth() === now.getMonth() &&
//           paymentDate.getFullYear() === now.getFullYear();
//       } else if (dateFilter === "This Year") {
//         matchesDate = paymentDate.getFullYear() === now.getFullYear();
//       }

//       return matchesSearch && matchesType && matchesMethod && matchesDate;
//     });
//   }, [payments, search, paymentTypeFilter, methodFilter, dateFilter]);

//   const statistics = useMemo(() => {
//     const totalCollected = payments.reduce(
//       (sum, payment) => sum + Number(payment.amount || 0),
//       0,
//     );

//     const today = new Date();

//     const todayCollected = payments
//       .filter(
//         (payment) =>
//           new Date(payment.paymentDate).toDateString() === today.toDateString(),
//       )
//       .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

//     const currentMonthCollected = payments
//       .filter((payment) => {
//         const date = new Date(payment.paymentDate);

//         return (
//           date.getMonth() === today.getMonth() &&
//           date.getFullYear() === today.getFullYear()
//         );
//       })
//       .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

//     return {
//       totalTransactions: payments.length,
//       totalCollected,
//       todayCollected,
//       currentMonthCollected,
//     };
//   }, [payments]);

//   const printReceipt = (payment) => {
//     const receiptWindow = window.open("", "_blank");

//     if (!receiptWindow) {
//       alert("Please allow pop-ups to print the receipt.");
//       return;
//     }

//     const customer = payment.customer?.name || "Customer";
//     const invoice = payment.invoice?.invoiceNumber || "—";

//     receiptWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Payment Receipt</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             padding: 35px;
//             color: #172033;
//           }
//           .receipt {
//             max-width: 600px;
//             margin: auto;
//             border: 1px solid #ddd;
//             padding: 30px;
//           }
//           h1 { text-align: center; margin-bottom: 5px; }
//           .subtitle { text-align: center; color: #666; }
//           hr { border: 0; border-top: 1px dashed #aaa; margin: 25px 0; }
//           .line {
//             display: flex;
//             justify-content: space-between;
//             gap: 20px;
//             margin: 15px 0;
//           }
//           .amount {
//             font-size: 24px;
//             font-weight: bold;
//             text-align: center;
//             margin: 25px 0;
//           }
//           .footer { text-align: center; margin-top: 35px; color: #666; }
//           @media print {
//             body { padding: 0; }
//             .receipt { border: none; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="receipt">
//           <h1>BikeLedger</h1>
//           <p class="subtitle">Payment Receipt</p>
//           <hr />
//           <div class="line"><strong>Receipt ID</strong><span>${payment._id}</span></div>
//           <div class="line"><strong>Customer</strong><span>${customer}</span></div>
//           <div class="line"><strong>Invoice Number</strong><span>${invoice}</span></div>
//           <div class="line"><strong>Payment Date</strong><span>${formatDate(payment.paymentDate)}</span></div>
//           <div class="line"><strong>Payment Type</strong><span>${payment.paymentType}</span></div>
//           <div class="line"><strong>Payment Method</strong><span>${payment.paymentMethod}</span></div>
//           <div class="line"><strong>Transaction Reference</strong><span>${payment.transactionReference || "—"}</span></div>
//           <hr />
//           <div class="amount">${formatCurrency(payment.amount)}</div>
//           <div class="line"><strong>Notes</strong><span>${payment.notes || "—"}</span></div>
//           <div class="footer">Thank you for your payment!</div>
//         </div>
//         <script>
//           window.onload = () => window.print();
//         </script>
//       </body>
//       </html>
//     `);

//     receiptWindow.document.close();
//   };

//   return (
//     <div className="dashboard-layout">
//       <Sidebar />

//       <main className="dashboard-main">
//         <div className="payments-page">
//           <div className="payments-header">
//             <div>
//               <h1>Payments Management</h1>
//               <p>Track and manage all customer payment transactions.</p>
//             </div>

//             <button
//               className="payments-refresh-btn"
//               onClick={fetchPayments}
//               disabled={loading}
//             >
//               ↻ Refresh
//             </button>
//           </div>

//           <div className="payments-stats">
//             <div className="payment-stat-card">
//               <span className="payment-stat-icon">₹</span>
//               <div>
//                 <p>Total Collected</p>
//                 <h2>{formatCurrency(statistics.totalCollected)}</h2>
//               </div>
//             </div>

//             <div className="payment-stat-card">
//               <span className="payment-stat-icon">▤</span>
//               <div>
//                 <p>Total Transactions</p>
//                 <h2>{statistics.totalTransactions}</h2>
//               </div>
//             </div>

//             <div className="payment-stat-card">
//               <span className="payment-stat-icon">◷</span>
//               <div>
//                 <p>Today's Collection</p>
//                 <h2>{formatCurrency(statistics.todayCollected)}</h2>
//               </div>
//             </div>

//             <div className="payment-stat-card">
//               <span className="payment-stat-icon">▥</span>
//               <div>
//                 <p>This Month</p>
//                 <h2>{formatCurrency(statistics.currentMonthCollected)}</h2>
//               </div>
//             </div>
//           </div>

//           <section className="payments-panel">
//             <div className="payments-panel-header">
//               <div>
//                 <h2>Transaction History</h2>
//                 <p>View and manage recorded payments.</p>
//               </div>

//               <span className="payments-count">
//                 {filteredPayments.length} Records
//               </span>
//             </div>

//             <div className="payments-filters">
//               <input
//                 type="search"
//                 placeholder="Search customer, invoice or reference..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />

//               <select
//                 value={paymentTypeFilter}
//                 onChange={(e) => setPaymentTypeFilter(e.target.value)}
//               >
//                 <option value="All">All Payment Types</option>
//                 <option value="Full Payment">Full Payment</option>
//                 <option value="Down Payment">Down Payment</option>
//                 <option value="EMI Installment">EMI Installment</option>
//               </select>

//               <select
//                 value={methodFilter}
//                 onChange={(e) => setMethodFilter(e.target.value)}
//               >
//                 <option value="All">All Methods</option>
//                 <option value="Cash">Cash</option>
//                 <option value="UPI">UPI</option>
//                 <option value="Card">Card</option>
//                 <option value="Bank Transfer">Bank Transfer</option>
//                 <option value="Cheque">Cheque</option>
//               </select>

//               <select
//                 value={dateFilter}
//                 onChange={(e) => setDateFilter(e.target.value)}
//               >
//                 <option value="All">All Dates</option>
//                 <option value="Today">Today</option>
//                 <option value="This Month">This Month</option>
//                 <option value="This Year">This Year</option>
//               </select>
//             </div>

//             {error && (
//               <div className="payments-error">
//                 {error}
//                 <button onClick={fetchPayments}>Retry</button>
//               </div>
//             )}

//             {loading ? (
//               <div className="payments-message">Loading payment records...</div>
//             ) : filteredPayments.length === 0 ? (
//               <div className="payments-empty">
//                 <div>₹</div>
//                 <h3>No payment records found</h3>
//                 <p>Payments recorded through Billing & EMI will appear here.</p>
//               </div>
//             ) : (
//               <div className="payments-table-wrapper">
//                 <table className="payments-table">
//                   <thead>
//                     <tr>
//                       <th>Payment ID</th>
//                       <th>Customer</th>
//                       <th>Invoice</th>
//                       <th>Payment Type</th>
//                       <th>Method</th>
//                       <th>Date</th>
//                       <th>Amount</th>
//                       <th>Reference</th>
//                       <th>Receipt</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredPayments.map((payment) => (
//                       <tr key={payment._id}>
//                         <td className="payment-id">
//                           #{String(payment._id).slice(-7).toUpperCase()}
//                         </td>

//                         <td>{payment.customer?.name || "—"}</td>

//                         <td>{payment.invoice?.invoiceNumber || "—"}</td>

//                         <td>
//                           <span className="payment-type-badge">
//                             {payment.paymentType}
//                             {payment.installmentNumber
//                               ? ` #${payment.installmentNumber}`
//                               : ""}
//                           </span>
//                         </td>

//                         <td>{payment.paymentMethod}</td>

//                         <td>{formatDate(payment.paymentDate)}</td>

//                         <td className="payment-amount">
//                           {formatCurrency(payment.amount)}
//                         </td>

//                         <td>{payment.transactionReference || "—"}</td>

//                         <td>
//                           <button
//                             className="payment-receipt-btn"
//                             onClick={() => printReceipt(payment)}
//                           >
//                             Print
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Payments;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import "../styles/Payments.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const toDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentSnapshot, invoiceSnapshot, customerSnapshot] =
        await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "invoices")),
          getDocs(collection(db, "customers")),
        ]);

      const invoices = invoiceSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const customers = customerSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const invoiceMap = new Map(invoices.map((item) => [item.id, item]));
      const customerMap = new Map(customers.map((item) => [item.id, item]));

      const records = paymentSnapshot.docs.map((item) => {
        const data = item.data();

        const invoice =
          invoiceMap.get(data.invoiceId) ||
          (data.invoice && typeof data.invoice === "object"
            ? data.invoice
            : {});

        const customer =
          customerMap.get(data.customerId) ||
          (data.customer && typeof data.customer === "object"
            ? data.customer
            : {});

        return {
          id: item.id,
          ...data,
          customerName:
            data.customerName ||
            customer.name ||
            data.customer?.name ||
            "—",
          customerPhone:
            data.customerPhone ||
            customer.phone ||
            data.customer?.phone ||
            "",
          invoiceNumber:
            data.invoiceNumber ||
            invoice.invoiceNumber ||
            data.invoice?.invoiceNumber ||
            "—",
          paymentType: data.paymentType || "—",
          paymentMethod: data.paymentMethod || "—",
          paymentDate: data.paymentDate || data.createdAt || null,
          amount: Number(data.amount || 0),
          transactionReference: data.transactionReference || "",
          notes: data.notes || "",
        };
      });

      records.sort((a, b) => {
        const dateA = toDate(a.paymentDate)?.getTime() || 0;
        const dateB = toDate(b.paymentDate)?.getTime() || 0;
        return dateB - dateA;
      });

      setPayments(records);
    } catch (err) {
      console.error("Fetch Firebase payments error:", err);

      setError(
        err.code === "permission-denied"
          ? "Permission denied. Check Firestore read rules for payments, invoices and customers."
          : err.message || "Unable to load payment records. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch = [
        payment.customerName,
        payment.invoiceNumber,
        payment.transactionReference,
        payment.id,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesType =
        paymentTypeFilter === "All" ||
        payment.paymentType === paymentTypeFilter;

      const matchesMethod =
        methodFilter === "All" ||
        payment.paymentMethod === methodFilter;

      const paymentDate = toDate(payment.paymentDate);
      let matchesDate = true;

      if (dateFilter !== "All") {
        if (!paymentDate) {
          matchesDate = false;
        } else if (dateFilter === "Today") {
          matchesDate = paymentDate.toDateString() === now.toDateString();
        } else if (dateFilter === "This Month") {
          matchesDate =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "This Year") {
          matchesDate = paymentDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesType && matchesMethod && matchesDate;
    });
  }, [payments, search, paymentTypeFilter, methodFilter, dateFilter]);

  const statistics = useMemo(() => {
    const today = new Date();

    const totalCollected = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const todayCollected = payments
      .filter((payment) => {
        const date = toDate(payment.paymentDate);
        return date && date.toDateString() === today.toDateString();
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const currentMonthCollected = payments
      .filter((payment) => {
        const date = toDate(payment.paymentDate);

        return (
          date &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      totalTransactions: payments.length,
      totalCollected,
      todayCollected,
      currentMonthCollected,
    };
  }, [payments]);

  const printReceipt = (payment) => {
    const receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const customer = escapeHtml(payment.customerName);
    const invoice = escapeHtml(payment.invoiceNumber);
    const paymentId = escapeHtml(payment.id);
    const paymentType = escapeHtml(payment.paymentType);
    const paymentMethod = escapeHtml(payment.paymentMethod);
    const paymentDate = escapeHtml(formatDate(payment.paymentDate));
    const reference = escapeHtml(payment.transactionReference || "—");
    const notes = escapeHtml(payment.notes || "—");
    const amount = escapeHtml(formatCurrency(payment.amount));

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>BikeLedger Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            color: #172033;
          }
          .receipt {
            max-width: 600px;
            margin: auto;
            border: 1px solid #ddd;
            padding: 30px;
          }
          h1 { text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; }
          hr { border: 0; border-top: 1px dashed #aaa; margin: 25px 0; }
          .line {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin: 15px 0;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
          }
          .footer { text-align: center; margin-top: 35px; color: #666; }
          @media print {
            body { padding: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>BikeLedger</h1>
          <p class="subtitle">Payment Receipt</p>
          <hr />
          <div class="line"><strong>Receipt ID</strong><span>${paymentId}</span></div>
          <div class="line"><strong>Customer</strong><span>${customer}</span></div>
          <div class="line"><strong>Invoice Number</strong><span>${invoice}</span></div>
          <div class="line"><strong>Payment Date</strong><span>${paymentDate}</span></div>
          <div class="line"><strong>Payment Type</strong><span>${paymentType}</span></div>
          <div class="line"><strong>Payment Method</strong><span>${paymentMethod}</span></div>
          <div class="line"><strong>Transaction Reference</strong><span>${reference}</span></div>
          <hr />
          <div class="amount">${amount}</div>
          <div class="line"><strong>Notes</strong><span>${notes}</span></div>
          <div class="footer">Thank you for your payment!</div>
        </div>
        <script>
          window.onload = () => window.print();
        </script>
      </body>
      </html>
    `);

    receiptWindow.document.close();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="payments-page">
          <div className="payments-header">
            <div>
              <h1>Payments Management</h1>
              <p>Track and manage all customer payment transactions.</p>
            </div>

            <button
              className="payments-refresh-btn"
              onClick={fetchPayments}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="payments-stats">
            <div className="payment-stat-card">
              <span className="payment-stat-icon">₹</span>
              <div>
                <p>Total Collected</p>
                <h2>{formatCurrency(statistics.totalCollected)}</h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">▤</span>
              <div>
                <p>Total Transactions</p>
                <h2>{statistics.totalTransactions}</h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">◷</span>
              <div>
                <p>Today's Collection</p>
                <h2>{formatCurrency(statistics.todayCollected)}</h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">▥</span>
              <div>
                <p>This Month</p>
                <h2>{formatCurrency(statistics.currentMonthCollected)}</h2>
              </div>
            </div>
          </div>

          <section className="payments-panel">
            <div className="payments-panel-header">
              <div>
                <h2>Transaction History</h2>
                <p>View and manage recorded payments.</p>
              </div>

              <span className="payments-count">
                {filteredPayments.length} Records
              </span>
            </div>

            <div className="payments-filters">
              <input
                type="search"
                placeholder="Search customer, invoice or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
              >
                <option value="All">All Payment Types</option>
                <option value="Full Payment">Full Payment</option>
                <option value="Down Payment">Down Payment</option>
                <option value="EMI Installment">EMI Installment</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            {error && (
              <div className="payments-error" role="alert">
                {error}
                <button onClick={fetchPayments}>Retry</button>
              </div>
            )}

            {loading ? (
              <div className="payments-message">Loading payment records...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="payments-empty">
                <div>₹</div>
                <h3>No payment records found</h3>
                <p>Payments recorded through Billing & EMI will appear here.</p>
              </div>
            ) : (
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Customer</th>
                      <th>Invoice</th>
                      <th>Payment Type</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="payment-id">
                          #{payment.id.slice(-7).toUpperCase()}
                        </td>

                        <td>{payment.customerName}</td>
                        <td>{payment.invoiceNumber}</td>

                        <td>
                          <span className="payment-type-badge">
                            {payment.paymentType}
                            {payment.installmentNumber
                              ? ` #${payment.installmentNumber}`
                              : ""}
                          </span>
                        </td>

                        <td>{payment.paymentMethod}</td>
                        <td>{formatDate(payment.paymentDate)}</td>

                        <td className="payment-amount">
                          {formatCurrency(payment.amount)}
                        </td>

                        <td>{payment.transactionReference || "—"}</td>

                        <td>
                          <button
                            className="payment-receipt-btn"
                            onClick={() => printReceipt(payment)}
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Payments;


