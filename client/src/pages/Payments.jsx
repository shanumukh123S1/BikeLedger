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


// import { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   getDocs,
//   query,
//   orderBy,
// } from "firebase/firestore";

// import { db } from "../firebase";
// import Sidebar from "../components/Sidebar";
// import "../styles/Payments.css";

// const formatCurrency = (amount) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(amount) || 0);

// const toDate = (value) => {
//   if (!value) return null;

//   if (typeof value.toDate === "function") {
//     return value.toDate();
//   }

//   if (value instanceof Date) {
//     return value;
//   }

//   if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     const [year, month, day] = value.split("-").map(Number);
//     return new Date(year, month - 1, day);
//   }

//   const date = new Date(value);
//   return Number.isNaN(date.getTime()) ? null : date;
// };

// const formatDate = (value) => {
//   const date = toDate(value);

//   if (!date) return "—";

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const getCustomerName = (payment) =>
//   payment.customerName ||
//   payment.customer?.name ||
//   payment.customer?.customerName ||
//   "—";

// const getCustomerPhone = (payment) =>
//   payment.customerPhone ||
//   payment.customer?.phone ||
//   "";

// const getInvoiceNumber = (payment) =>
//   payment.invoiceNumber ||
//   payment.invoice?.invoiceNumber ||
//   payment.invoiceId ||
//   "—";

// const getPaymentId = (payment) =>
//   payment.id || payment.paymentId || payment._id || "—";

// const escapeHTML = (value) =>
//   String(value ?? "").replace(/[&<>"']/g, (character) => ({
//     "&": "&amp;",
//     "<": "&lt;",
//     ">": "&gt;",
//     '"': "&quot;",
//     "'": "&#39;",
//   })[character]);

// const Payments = () => {
//   const [payments, setPayments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
//   const [methodFilter, setMethodFilter] = useState("All");
//   const [dateFilter, setDateFilter] = useState("All");

//   // ==========================================
//   // FETCH PAYMENTS DIRECTLY FROM FIRESTORE
//   // ==========================================

//   const fetchPayments = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const paymentsRef = collection(db, "payments");

//       let snapshot;

//       try {
//         snapshot = await getDocs(
//           query(paymentsRef, orderBy("paymentDate", "desc")),
//         );
//       } catch (orderError) {
//         // Fallback for older records without a consistent paymentDate field.
//         console.warn(
//           "Payment date ordering unavailable. Loading without ordering.",
//           orderError,
//         );

//         snapshot = await getDocs(paymentsRef);
//       }

//       const records = snapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       records.sort((a, b) => {
//         const dateA =
//           toDate(a.paymentDate || a.createdAt)?.getTime() || 0;

//         const dateB =
//           toDate(b.paymentDate || b.createdAt)?.getTime() || 0;

//         return dateB - dateA;
//       });

//       setPayments(records);

//       console.log("Firebase payment records loaded:", records);
//     } catch (err) {
//       console.error("Firebase payment loading error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Permission denied. Check the Firestore payments read rules and active staff profile."
//           : err.message || "Unable to load payment records.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPayments();
//   }, [fetchPayments]);

//   // ==========================================
//   // FILTER PAYMENT RECORDS
//   // ==========================================

//   const filteredPayments = useMemo(() => {
//     const now = new Date();
//     const searchText = search.trim().toLowerCase();

//     return payments.filter((payment) => {
//       const customerName = getCustomerName(payment).toLowerCase();
//       const customerPhone = getCustomerPhone(payment).toLowerCase();
//       const invoiceNumber = String(getInvoiceNumber(payment)).toLowerCase();
//       const reference = String(
//         payment.transactionReference || "",
//       ).toLowerCase();

//       const matchesSearch =
//         customerName.includes(searchText) ||
//         customerPhone.includes(searchText) ||
//         invoiceNumber.includes(searchText) ||
//         reference.includes(searchText);

//       const matchesType =
//         paymentTypeFilter === "All" ||
//         payment.paymentType === paymentTypeFilter;

//       const matchesMethod =
//         methodFilter === "All" ||
//         payment.paymentMethod === methodFilter;

//       const paymentDate = toDate(
//         payment.paymentDate || payment.createdAt,
//       );

//       let matchesDate = true;

//       if (dateFilter !== "All") {
//         if (!paymentDate) {
//           matchesDate = false;
//         } else if (dateFilter === "Today") {
//           matchesDate =
//             paymentDate.toDateString() === now.toDateString();
//         } else if (dateFilter === "This Month") {
//           matchesDate =
//             paymentDate.getMonth() === now.getMonth() &&
//             paymentDate.getFullYear() === now.getFullYear();
//         } else if (dateFilter === "This Year") {
//           matchesDate =
//             paymentDate.getFullYear() === now.getFullYear();
//         }
//       }

//       return (
//         matchesSearch &&
//         matchesType &&
//         matchesMethod &&
//         matchesDate
//       );
//     });
//   }, [
//     payments,
//     search,
//     paymentTypeFilter,
//     methodFilter,
//     dateFilter,
//   ]);

//   // ==========================================
//   // PAYMENT STATISTICS
//   // ==========================================

//   const statistics = useMemo(() => {
//     const totalCollected = payments.reduce(
//       (sum, payment) => sum + Number(payment.amount || 0),
//       0,
//     );

//     const today = new Date();

//     const todayCollected = payments
//       .filter((payment) => {
//         const date = toDate(payment.paymentDate || payment.createdAt);

//         return date && date.toDateString() === today.toDateString();
//       })
//       .reduce(
//         (sum, payment) => sum + Number(payment.amount || 0),
//         0,
//       );

//     const currentMonthCollected = payments
//       .filter((payment) => {
//         const date = toDate(payment.paymentDate || payment.createdAt);

//         return (
//           date &&
//           date.getMonth() === today.getMonth() &&
//           date.getFullYear() === today.getFullYear()
//         );
//       })
//       .reduce(
//         (sum, payment) => sum + Number(payment.amount || 0),
//         0,
//       );

//     return {
//       totalTransactions: payments.length,
//       totalCollected,
//       todayCollected,
//       currentMonthCollected,
//     };
//   }, [payments]);

//   // ==========================================
//   // PRINT PAYMENT RECEIPT
//   // ==========================================

//   const printReceipt = (payment) => {
//     const receiptWindow = window.open("", "_blank");

//     if (!receiptWindow) {
//       alert("Please allow pop-ups to print the receipt.");
//       return;
//     }

//     const customer = escapeHTML(getCustomerName(payment));
//     const phone = escapeHTML(getCustomerPhone(payment));
//     const invoice = escapeHTML(getInvoiceNumber(payment));
//     const paymentId = escapeHTML(getPaymentId(payment));
//     const paymentDate = escapeHTML(
//       formatDate(payment.paymentDate || payment.createdAt),
//     );
//     const paymentType = escapeHTML(payment.paymentType || "—");
//     const paymentMethod = escapeHTML(payment.paymentMethod || "—");
//     const reference = escapeHTML(
//       payment.transactionReference || "—",
//     );
//     const notes = escapeHTML(payment.notes || "—");
//     const amount = escapeHTML(formatCurrency(payment.amount));

//     receiptWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>BikeLedger Payment Receipt</title>

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

//           h1 {
//             text-align: center;
//             margin-bottom: 5px;
//           }

//           .subtitle {
//             text-align: center;
//             color: #666;
//           }

//           hr {
//             border: 0;
//             border-top: 1px dashed #aaa;
//             margin: 25px 0;
//           }

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

//           .footer {
//             text-align: center;
//             margin-top: 35px;
//             color: #666;
//           }

//           @media print {
//             body {
//               padding: 0;
//             }

//             .receipt {
//               border: none;
//             }
//           }
//         </style>
//       </head>

//       <body>
//         <div class="receipt">

//           <h1>BikeLedger</h1>
//           <p class="subtitle">Payment Receipt</p>

//           <hr />

//           <div class="line">
//             <strong>Receipt ID</strong>
//             <span>${paymentId}</span>
//           </div>

//           <div class="line">
//             <strong>Customer</strong>
//             <span>${customer}</span>
//           </div>

//           <div class="line">
//             <strong>Phone</strong>
//             <span>${phone || "—"}</span>
//           </div>

//           <div class="line">
//             <strong>Invoice Number</strong>
//             <span>${invoice}</span>
//           </div>

//           <div class="line">
//             <strong>Payment Date</strong>
//             <span>${paymentDate}</span>
//           </div>

//           <div class="line">
//             <strong>Payment Type</strong>
//             <span>${paymentType}</span>
//           </div>

//           <div class="line">
//             <strong>Payment Method</strong>
//             <span>${paymentMethod}</span>
//           </div>

//           <div class="line">
//             <strong>Transaction Reference</strong>
//             <span>${reference}</span>
//           </div>

//           <hr />

//           <div class="amount">${amount}</div>

//           <div class="line">
//             <strong>Notes</strong>
//             <span>${notes}</span>
//           </div>

//           <div class="footer">
//             Thank you for your payment!
//           </div>

//         </div>

//         <script>
//           window.onload = () => window.print();
//         </script>
//       </body>
//       </html>
//     `);

//     receiptWindow.document.close();
//   };

//   // ==========================================
//   // PAGE UI
//   // ==========================================

//   return (
//     <div className="dashboard-layout">
//       <Sidebar />

//       <main className="dashboard-main">
//         <div className="payments-page">

//           <div className="payments-header">
//             <div>
//               <h1>Payments Management</h1>
//               <p>
//                 Track and manage all customer payment transactions.
//               </p>
//             </div>

//             <button
//               className="payments-refresh-btn"
//               onClick={fetchPayments}
//               disabled={loading}
//             >
//               {loading ? "Loading..." : "↻ Refresh"}
//             </button>
//           </div>

//           {/* STATISTICS */}

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
//                 <h2>
//                   {formatCurrency(statistics.currentMonthCollected)}
//                 </h2>
//               </div>
//             </div>

//           </div>

//           {/* TRANSACTION HISTORY */}

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

//             {/* FILTERS */}

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

//             {/* ERROR */}

//             {error && (
//               <div className="payments-error" role="alert">
//                 {error}

//                 <button onClick={fetchPayments}>
//                   Retry
//                 </button>
//               </div>
//             )}

//             {/* LOADING */}

//             {loading ? (
//               <div className="payments-message">
//                 Loading payment records...
//               </div>

//             ) : filteredPayments.length === 0 ? (

//               <div className="payments-empty">
//                 <div>₹</div>

//                 <h3>
//                   {payments.length === 0
//                     ? "No payment records found"
//                     : "No matching payments found"}
//                 </h3>

//                 <p>
//                   {payments.length === 0
//                     ? "Payment records saved in Firebase will appear here."
//                     : "Try changing your search or filters."}
//                 </p>
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

//                       <tr key={payment.id}>

//                         <td className="payment-id">
//                           #{String(payment.id).slice(-7).toUpperCase()}
//                         </td>

//                         <td>
//                           <strong>{getCustomerName(payment)}</strong>
//                           <small>{getCustomerPhone(payment)}</small>
//                         </td>

//                         <td>{getInvoiceNumber(payment)}</td>

//                         <td>
//                           <span className="payment-type-badge">
//                             {payment.paymentType || "—"}

//                             {payment.installmentNumber
//                               ? ` #${payment.installmentNumber}`
//                               : ""}
//                           </span>
//                         </td>

//                         <td>{payment.paymentMethod || "—"}</td>

//                         <td>
//                           {formatDate(
//                             payment.paymentDate || payment.createdAt,
//                           )}
//                         </td>

//                         <td className="payment-amount">
//                           {formatCurrency(payment.amount)}
//                         </td>

//                         <td>
//                           {payment.transactionReference || "—"}
//                         </td>

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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import Sidebar from "../components/Sidebar";
import "../styles/Payments.css";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const toDate = (value) => {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
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

const getCustomerName = (payment) =>
  payment.customerName ||
  payment.customer?.name ||
  payment.customer?.customerName ||
  "—";

const getCustomerPhone = (payment) =>
  payment.customerPhone ||
  payment.customer?.phone ||
  "";

const getInvoiceNumber = (payment) =>
  payment.invoiceNumber ||
  payment.invoice?.invoiceNumber ||
  payment.invoiceId ||
  "—";

const getPaymentId = (payment) =>
  payment.id || payment.paymentId || payment._id || "—";

const escapeHTML = (value) =>
  String(value ?? "—").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const getPaymentDate = (payment) =>
  payment.paymentDate || payment.createdAt || null;

const getPaymentTypeLabel = (payment) => {
  const type = payment.paymentType || "—";

  if (
    type === "EMI Installment" &&
    payment.installmentNumber
  ) {
    return `${type} #${payment.installmentNumber}`;
  }

  return type;
};

/* =========================================================
   COMPONENT
========================================================= */

const Payments = () => {
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] =
    useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  /* =======================================================
     FETCH PAYMENTS FROM FIRESTORE
  ======================================================= */

  const fetchPayments = useCallback(async () => {
    if (!auth.currentUser) {
      setError("Please sign in to view payment records.");
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const paymentsRef = collection(db, "payments");

      let snapshot;

      try {
        snapshot = await getDocs(
          query(
            paymentsRef,
            orderBy("paymentDate", "desc")
          )
        );
      } catch (orderError) {
        console.warn(
          "Could not order payments by paymentDate. Loading all records instead.",
          orderError
        );

        snapshot = await getDocs(paymentsRef);
      }

      const records = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      records.sort((a, b) => {
        const dateA =
          toDate(getPaymentDate(a))?.getTime() || 0;

        const dateB =
          toDate(getPaymentDate(b))?.getTime() || 0;

        return dateB - dateA;
      });

      setPayments(records);

      console.log(
        "BikeLedger payment records loaded:",
        records
      );
    } catch (err) {
      console.error(
        "Firebase payment loading error:",
        err
      );

      setError(
        err.code === "permission-denied"
          ? "Permission denied. Check Firestore payments read rules and your active staff profile."
          : err.message ||
              "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /* =======================================================
     FILTER PAYMENTS
  ======================================================= */

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const searchText = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const customerName = String(
        getCustomerName(payment)
      ).toLowerCase();

      const customerPhone = String(
        getCustomerPhone(payment)
      ).toLowerCase();

      const invoiceNumber = String(
        getInvoiceNumber(payment)
      ).toLowerCase();

      const reference = String(
        payment.transactionReference || ""
      ).toLowerCase();

      const paymentId = String(
        getPaymentId(payment)
      ).toLowerCase();

      const matchesSearch =
        customerName.includes(searchText) ||
        customerPhone.includes(searchText) ||
        invoiceNumber.includes(searchText) ||
        reference.includes(searchText) ||
        paymentId.includes(searchText);

      const matchesType =
        paymentTypeFilter === "All" ||
        payment.paymentType === paymentTypeFilter;

      const matchesMethod =
        methodFilter === "All" ||
        payment.paymentMethod === methodFilter;

      const paymentDate = toDate(
        getPaymentDate(payment)
      );

      let matchesDate = true;

      if (dateFilter !== "All") {
        if (!paymentDate) {
          matchesDate = false;
        } else if (dateFilter === "Today") {
          matchesDate =
            paymentDate.toDateString() ===
            now.toDateString();
        } else if (dateFilter === "This Month") {
          matchesDate =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() ===
              now.getFullYear();
        } else if (dateFilter === "This Year") {
          matchesDate =
            paymentDate.getFullYear() ===
            now.getFullYear();
        }
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesMethod &&
        matchesDate
      );
    });
  }, [
    payments,
    search,
    paymentTypeFilter,
    methodFilter,
    dateFilter,
  ]);

  /* =======================================================
     PAYMENT STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const now = new Date();

    let totalCollected = 0;
    let todayCollected = 0;
    let currentMonthCollected = 0;
    let downPaymentCollected = 0;
    let emiCollected = 0;

    payments.forEach((payment) => {
      const amount = Number(payment.amount || 0);

      totalCollected += amount;

      const paymentDate = toDate(
        getPaymentDate(payment)
      );

      if (paymentDate) {
        if (
          paymentDate.toDateString() ===
          now.toDateString()
        ) {
          todayCollected += amount;
        }

        if (
          paymentDate.getMonth() === now.getMonth() &&
          paymentDate.getFullYear() ===
            now.getFullYear()
        ) {
          currentMonthCollected += amount;
        }
      }

      if (payment.paymentType === "Down Payment") {
        downPaymentCollected += amount;
      }

      if (payment.paymentType === "EMI Installment") {
        emiCollected += amount;
      }
    });

    return {
      totalTransactions: payments.length,
      totalCollected,
      todayCollected,
      currentMonthCollected,
      downPaymentCollected,
      emiCollected,
    };
  }, [payments]);

  /* =======================================================
     PRINT PAYMENT RECEIPT
  ======================================================= */

  const printReceipt = (payment) => {
    const receiptWindow = window.open(
      "",
      "_blank",
      "width=850,height=700"
    );

    if (!receiptWindow) {
      setError(
        "Please allow pop-ups to print the payment receipt."
      );
      return;
    }

    const customer = escapeHTML(
      getCustomerName(payment)
    );

    const phone = escapeHTML(
      getCustomerPhone(payment)
    );

    const invoice = escapeHTML(
      getInvoiceNumber(payment)
    );

    const paymentId = escapeHTML(
      getPaymentId(payment)
    );

    const paymentDate = escapeHTML(
      formatDate(getPaymentDate(payment))
    );

    const paymentType = escapeHTML(
      getPaymentTypeLabel(payment)
    );

    const paymentMethod = escapeHTML(
      payment.paymentMethod || "—"
    );

    const reference = escapeHTML(
      payment.transactionReference || "—"
    );

    const notes = escapeHTML(
      payment.notes || "—"
    );

    const amount = escapeHTML(
      formatCurrency(payment.amount)
    );

    const bike = escapeHTML(
      `${payment.brand || ""} ${payment.model || ""}`.trim() ||
        "—"
    );

    const registration = escapeHTML(
      payment.registrationNumber || "—"
    );

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BikeLedger Payment Receipt</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #172033;
              background: #f5f7fb;
            }

            .receipt {
              max-width: 620px;
              margin: auto;
              border: 1px solid #dce3ed;
              padding: 32px;
              background: white;
            }

            h1 {
              text-align: center;
              margin-bottom: 5px;
              color: #173454;
            }

            .subtitle {
              text-align: center;
              color: #64748b;
            }

            hr {
              border: 0;
              border-top: 1px dashed #aaa;
              margin: 25px 0;
            }

            .line {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin: 15px 0;
              font-size: 14px;
            }

            .line span {
              text-align: right;
              overflow-wrap: anywhere;
            }

            .amount {
              font-size: 28px;
              font-weight: bold;
              text-align: center;
              margin: 25px 0;
              color: #059669;
            }

            .footer {
              text-align: center;
              margin-top: 35px;
              color: #64748b;
            }

            @media print {
              body {
                padding: 0;
                background: white;
              }

              .receipt {
                border: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">

            <h1>BikeLedger</h1>
            <p class="subtitle">Customer Payment Receipt</p>

            <hr />

            <div class="line">
              <strong>Receipt ID</strong>
              <span>${paymentId}</span>
            </div>

            <div class="line">
              <strong>Customer</strong>
              <span>${customer}</span>
            </div>

            <div class="line">
              <strong>Phone</strong>
              <span>${phone || "—"}</span>
            </div>

            <div class="line">
              <strong>Invoice Number</strong>
              <span>${invoice}</span>
            </div>

            <div class="line">
              <strong>Bike</strong>
              <span>${bike}</span>
            </div>

            <div class="line">
              <strong>Registration Number</strong>
              <span>${registration}</span>
            </div>

            <div class="line">
              <strong>Payment Date</strong>
              <span>${paymentDate}</span>
            </div>

            <div class="line">
              <strong>Payment Type</strong>
              <span>${paymentType}</span>
            </div>

            <div class="line">
              <strong>Payment Method</strong>
              <span>${paymentMethod}</span>
            </div>

            <div class="line">
              <strong>Transaction Reference</strong>
              <span>${reference}</span>
            </div>

            <hr />

            <div class="amount">${amount}</div>

            <div class="line">
              <strong>Notes</strong>
              <span>${notes}</span>
            </div>

            <div class="footer">
              Thank you for your payment!
              <br />
              BikeLedger
            </div>

          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    receiptWindow.document.close();
  };

  /* =======================================================
     PAGE UI
  ======================================================= */

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="payments-page">

          {/* HEADER */}

          <div className="payments-header">
            <div>
              <h1>Payments Management</h1>
              <p>
                Track and manage all customer payment
                transactions.
              </p>
            </div>

            <button
              type="button"
              className="payments-refresh-btn"
              onClick={fetchPayments}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {/* ALERTS */}

          {error && (
            <div
              className="payments-error"
              role="alert"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={fetchPayments}
              >
                Retry
              </button>
            </div>
          )}

          {success && (
            <div
              className="payments-success"
              role="status"
            >
              {success}
            </div>
          )}

          {/* STATISTICS */}

          <div className="payments-stats">

            <div className="payment-stat-card">
              <span className="payment-stat-icon">₹</span>
              <div>
                <p>Total Collected</p>
                <h2>
                  {formatCurrency(
                    statistics.totalCollected
                  )}
                </h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">▤</span>
              <div>
                <p>Total Transactions</p>
                <h2>
                  {statistics.totalTransactions}
                </h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">◷</span>
              <div>
                <p>Today's Collection</p>
                <h2>
                  {formatCurrency(
                    statistics.todayCollected
                  )}
                </h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">▥</span>
              <div>
                <p>This Month</p>
                <h2>
                  {formatCurrency(
                    statistics.currentMonthCollected
                  )}
                </h2>
              </div>
            </div>

          </div>

          {/* COLLECTION BREAKDOWN */}

          <div className="payments-stats">
            <div className="payment-stat-card">
              <span className="payment-stat-icon">↓</span>
              <div>
                <p>Down Payments Collected</p>
                <h2>
                  {formatCurrency(
                    statistics.downPaymentCollected
                  )}
                </h2>
              </div>
            </div>

            <div className="payment-stat-card">
              <span className="payment-stat-icon">▣</span>
              <div>
                <p>EMI Collections</p>
                <h2>
                  {formatCurrency(
                    statistics.emiCollected
                  )}
                </h2>
              </div>
            </div>
          </div>

          {/* TRANSACTION HISTORY */}

          <section className="payments-panel">

            <div className="payments-panel-header">
              <div>
                <h2>Transaction History</h2>
                <p>
                  View and print recorded customer payments.
                </p>
              </div>

              <span className="payments-count">
                {filteredPayments.length} Records
              </span>
            </div>

            {/* FILTERS */}

            <div className="payments-filters">

              <input
                type="search"
                placeholder="Search customer, invoice or reference..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                value={paymentTypeFilter}
                onChange={(event) =>
                  setPaymentTypeFilter(event.target.value)
                }
              >
                <option value="All">
                  All Payment Types
                </option>

                <option value="Full Payment">
                  Full Payment
                </option>

                <option value="Down Payment">
                  Down Payment
                </option>

                <option value="EMI Installment">
                  EMI Installment
                </option>
              </select>

              <select
                value={methodFilter}
                onChange={(event) =>
                  setMethodFilter(event.target.value)
                }
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">
                  Bank Transfer
                </option>
                <option value="Cheque">Cheque</option>
              </select>

              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>

            </div>

            {/* LOADING */}

            {loading ? (
              <div className="payments-message">
                Loading payment records...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="payments-empty">
                <div>₹</div>

                <h3>
                  {payments.length === 0
                    ? "No payment records found"
                    : "No matching payments found"}
                </h3>

                <p>
                  {payments.length === 0
                    ? "Payments saved in Firebase will appear here."
                    : "Try changing your search or filters."}
                </p>
              </div>
            ) : (

              /* TABLE */

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
                          #
                          {String(payment.id)
                            .slice(-7)
                            .toUpperCase()}
                        </td>

                        <td>
                          <strong>
                            {getCustomerName(payment)}
                          </strong>

                          <small>
                            {getCustomerPhone(payment)}
                          </small>
                        </td>

                        <td>
                          {getInvoiceNumber(payment)}
                        </td>

                        <td>
                          <span className="payment-type-badge">
                            {getPaymentTypeLabel(payment)}
                          </span>
                        </td>

                        <td>
                          {payment.paymentMethod || "—"}
                        </td>

                        <td>
                          {formatDate(
                            getPaymentDate(payment)
                          )}
                        </td>

                        <td className="payment-amount">
                          {formatCurrency(payment.amount)}
                        </td>

                        <td>
                          {payment.transactionReference || "—"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="payment-receipt-btn"
                            onClick={() =>
                              printReceipt(payment)
                            }
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

