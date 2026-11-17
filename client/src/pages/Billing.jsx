// import { useCallback, useEffect, useMemo, useState } from "react";
// import Sidebar from "../components/Sidebar";
// import api from "../services/api";
// import "../styles/Billing.css";

// const money = (value) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(value) || 0);

// const dateText = (value) =>
//   value ? new Date(value).toLocaleDateString("en-IN") : "—";

// const today = () => {
//   const date = new Date();
//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
// };

// const nextMonthDate = () => {
//   const date = new Date();
//   const day = date.getDate();
//   date.setDate(1);
//   date.setMonth(date.getMonth() + 1);
//   const lastDay = new Date(
//     date.getFullYear(),
//     date.getMonth() + 1,
//     0,
//   ).getDate();
//   date.setDate(Math.min(day, lastDay));

//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
// };

// const roundMoney = (value) =>
//   Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// const calculateEMI = (principal, rate, months) => {
//   if (!principal || !rate || !months) return 0;

//   const monthlyRate = Number(rate) / 100;
//   const factor = Math.pow(1 + monthlyRate, Number(months));

//   return roundMoney((Number(principal) * monthlyRate * factor) / (factor - 1));
// };

// const statusClass = (status) =>
//   `billing-status billing-status-${String(status || "Pending")
//     .toLowerCase()
//     .replace(/\s+/g, "-")}`;

// function Billing() {
//   const [activeTab, setActiveTab] = useState("invoices");
//   const [invoices, setInvoices] = useState([]);
//   const [availableBikes, setAvailableBikes] = useState([]);
//   const [payments, setPayments] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [showInvoiceForm, setShowInvoiceForm] = useState(false);
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");

//   const [invoiceForm, setInvoiceForm] = useState({
//     bikeId: "",
//     paymentType: "Full Payment",
//     downPayment: "",
//     tenureMonths: "12",
//     monthlyInterestRate: "2",
//     processingFeePercentage: "3",
//     documentationFee: "3000",
//     otherChargesAmount: "0",
//     otherChargesDescription: "",
//     firstDueDate: nextMonthDate(),
//     notes: "",
//   });

//   const [paymentForm, setPaymentForm] = useState({
//     paymentType: "Full Payment",
//     amount: "",
//     paymentMethod: "UPI",
//     installmentNumber: "",
//     transactionReference: "",
//     paymentDate: today(),
//     notes: "",
//   });

//   const fetchBillingData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const [invoiceResponse, bikeResponse, paymentResponse] =
//         await Promise.all([
//           api.get("/billing"),
//           api.get("/billing/available-bikes"),
//           api.get("/payments"),
//         ]);

//       setInvoices(invoiceResponse.data.invoices || []);
//       setAvailableBikes(bikeResponse.data.bikes || []);
//       setPayments(paymentResponse.data.payments || []);
//     } catch (err) {
//       console.error("Billing data error:", err);
//       setError(
//         err.response?.data?.message || "Unable to load billing information.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBillingData();
//   }, [fetchBillingData]);

//   const selectedBike = useMemo(
//     () => availableBikes.find((bike) => bike._id === invoiceForm.bikeId),
//     [availableBikes, invoiceForm.bikeId],
//   );

//   const bikePrice = Number(selectedBike?.bikePrice || 0);
//   const downPayment = Number(invoiceForm.downPayment || 0);
//   const financedBalance = Math.max(0, bikePrice - downPayment);

//   const processingFeeAmount = roundMoney(
//     financedBalance * (Number(invoiceForm.processingFeePercentage || 0) / 100),
//   );

//   const documentationFee = Number(invoiceForm.documentationFee || 0);
//   const otherChargesAmount = Number(invoiceForm.otherChargesAmount || 0);

//   const totalFees = processingFeeAmount + documentationFee + otherChargesAmount;

//   const calculatedPrincipal = financedBalance + totalFees;

//   const monthlyEMI = calculateEMI(
//     calculatedPrincipal,
//     Number(invoiceForm.monthlyInterestRate),
//     Number(invoiceForm.tenureMonths),
//   );

//   const estimatedInterest =
//     monthlyEMI * Number(invoiceForm.tenureMonths || 0) - calculatedPrincipal;

//   const estimatedTotalPayable = roundMoney(
//     downPayment + monthlyEMI * Number(invoiceForm.tenureMonths || 0),
//   );

//   const overdueInstallments = useMemo(
//     () =>
//       invoices.reduce(
//         (total, invoice) =>
//           total +
//           (invoice.emiSchedule || []).filter(
//             (item) => item.status === "Overdue",
//           ).length,
//         0,
//       ),
//     [invoices],
//   );

//   const filteredInvoices = useMemo(() => {
//     return invoices.filter((invoice) => {
//       const customer = invoice.customer?.name || "";
//       const invoiceNumber = invoice.invoiceNumber || "";
//       const bike = invoice.bike || {};
//       const bikeName = `${bike.brand || ""} ${bike.model || ""}`;

//       const matchesSearch = [
//         customer,
//         invoiceNumber,
//         bikeName,
//         bike.registrationNumber || "",
//       ]
//         .join(" ")
//         .toLowerCase()
//         .includes(search.toLowerCase());

//       const matchesStatus =
//         statusFilter === "All" || invoice.paymentStatus === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [invoices, search, statusFilter]);

//   const stats = useMemo(
//     () => ({
//       totalInvoices: invoices.length,
//       collected: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.totalPaid || 0),
//         0,
//       ),
//       outstanding: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.balanceDue || 0),
//         0,
//       ),
//       paid: invoices.filter((invoice) => invoice.paymentStatus === "Paid")
//         .length,
//     }),
//     [invoices],
//   );

//   const getInvoicePayments = (invoiceId) =>
//     payments.filter(
//       (payment) =>
//         String(payment.invoice?._id || payment.invoice) === String(invoiceId),
//     );

//   const getDownPaymentPaid = (invoice) =>
//     getInvoicePayments(invoice._id)
//       .filter((payment) => payment.paymentType === "Down Payment")
//       .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

//   const getNextInstallment = (invoice) =>
//     (invoice.emiSchedule || []).find((item) => item.status !== "Paid");

//   const resetInvoiceForm = () => {
//     setInvoiceForm({
//       bikeId: "",
//       paymentType: "Full Payment",
//       downPayment: "",
//       tenureMonths: "12",
//       monthlyInterestRate: "2",
//       processingFeePercentage: "3",
//       documentationFee: "3000",
//       otherChargesAmount: "0",
//       otherChargesDescription: "",
//       firstDueDate: nextMonthDate(),
//       notes: "",
//     });
//   };

//   const handleInvoiceChange = (event) => {
//     const { name, value } = event.target;

//     setInvoiceForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   const closeForms = () => {
//     setShowInvoiceForm(false);
//     setShowPaymentForm(false);
//     setSelectedInvoice(null);
//     setError("");
//   };

//   const handleCreateInvoice = async (event) => {
//     event.preventDefault();
//     setError("");
//     setSuccess("");

//     if (!invoiceForm.bikeId) {
//       setError("Please select a registered bike.");
//       return;
//     }

//     if (invoiceForm.paymentType === "EMI") {
//       if (
//         !Number.isFinite(downPayment) ||
//         downPayment < 0 ||
//         downPayment >= bikePrice
//       ) {
//         setError("Down payment must be less than the bike price.");
//         return;
//       }

//       if (
//         !Number.isFinite(Number(invoiceForm.monthlyInterestRate)) ||
//         Number(invoiceForm.monthlyInterestRate) <= 0
//       ) {
//         setError("Monthly interest rate must be greater than zero.");
//         return;
//       }

//       if (
//         !Number.isFinite(Number(invoiceForm.processingFeePercentage)) ||
//         Number(invoiceForm.processingFeePercentage) < 0
//       ) {
//         setError("Enter a valid processing fee percentage.");
//         return;
//       }

//       if (
//         !Number.isFinite(documentationFee) ||
//         documentationFee < 0 ||
//         !Number.isFinite(otherChargesAmount) ||
//         otherChargesAmount < 0
//       ) {
//         setError("Documentation and other charges cannot be negative.");
//         return;
//       }
//     }

//     try {
//       setSaving(true);

//       const payload = {
//         bikeId: invoiceForm.bikeId,
//         paymentType: invoiceForm.paymentType,
//         notes: invoiceForm.notes,
//       };

//       if (invoiceForm.paymentType === "EMI") {
//         payload.downPayment = downPayment;
//         payload.tenureMonths = Number(invoiceForm.tenureMonths);
//         payload.monthlyInterestRate = Number(invoiceForm.monthlyInterestRate);
//         payload.processingFeePercentage = Number(
//           invoiceForm.processingFeePercentage,
//         );
//         payload.documentationFee = documentationFee;
//         payload.otherChargesAmount = otherChargesAmount;
//         payload.otherChargesDescription = invoiceForm.otherChargesDescription;
//         payload.firstDueDate = invoiceForm.firstDueDate;
//       }

//       const response = await api.post("/billing", payload);

//       setSuccess(response.data.message || "Invoice created successfully.");

//       setShowInvoiceForm(false);
//       resetInvoiceForm();
//       await fetchBillingData();
//     } catch (err) {
//       console.error("Create invoice error:", err);
//       setError(err.response?.data?.message || "Failed to create invoice.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const openPaymentForm = (invoice, installment = null) => {
//     setSelectedInvoice(invoice);
//     setError("");
//     setSuccess("");

//     let paymentType = "Full Payment";
//     let amount = invoice.balanceDue || "";

//     if (invoice.paymentType === "EMI") {
//       const downPaymentRemaining =
//         Number(invoice.downPayment || 0) - getDownPaymentPaid(invoice);

//       if (downPaymentRemaining > 0.01 && !installment) {
//         paymentType = "Down Payment";
//         amount = roundMoney(downPaymentRemaining).toFixed(2);
//       } else {
//         const nextInstallment = installment || getNextInstallment(invoice);

//         paymentType = "EMI Installment";
//         amount = nextInstallment
//           ? roundMoney(
//               Number(nextInstallment.installmentAmount) -
//                 Number(nextInstallment.paidAmount || 0),
//             ).toFixed(2)
//           : "";

//         setPaymentForm((previous) => ({
//           ...previous,
//           paymentType,
//           amount,
//           installmentNumber: String(nextInstallment?.installmentNumber || ""),
//         }));
//         setShowPaymentForm(true);
//         return;
//       }
//     }

//     setPaymentForm({
//       paymentType,
//       amount: String(amount),
//       paymentMethod: "UPI",
//       installmentNumber: "",
//       transactionReference: "",
//       paymentDate: today(),
//       notes: "",
//     });

//     setShowPaymentForm(true);
//   };

//   const handlePaymentTypeChange = (value) => {
//     if (!selectedInvoice) return;

//     let amount = "";
//     let installmentNumber = "";

//     if (value === "Full Payment") {
//       amount = selectedInvoice.balanceDue;
//     } else if (value === "Down Payment") {
//       amount = Math.max(
//         0,
//         Number(selectedInvoice.downPayment || 0) -
//           getDownPaymentPaid(selectedInvoice),
//       ).toFixed(2);
//     } else if (value === "EMI Installment") {
//       const installment = getNextInstallment(selectedInvoice);
//       installmentNumber = String(installment?.installmentNumber || "");
//       amount = installment
//         ? (
//             Number(installment.installmentAmount) -
//             Number(installment.paidAmount || 0)
//           ).toFixed(2)
//         : "";
//     }

//     setPaymentForm((previous) => ({
//       ...previous,
//       paymentType: value,
//       amount: String(amount),
//       installmentNumber,
//     }));
//   };

//   const handlePaymentChange = (event) => {
//     const { name, value } = event.target;

//     setPaymentForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   const handleRecordPayment = async (event) => {
//     event.preventDefault();

//     if (!selectedInvoice) return;

//     setError("");
//     setSuccess("");

//     try {
//       setSaving(true);

//       const payload = {
//         invoiceId: selectedInvoice._id,
//         amount: Number(paymentForm.amount),
//         paymentType: paymentForm.paymentType,
//         paymentMethod: paymentForm.paymentMethod,
//         transactionReference: paymentForm.transactionReference,
//         paymentDate: paymentForm.paymentDate,
//         notes: paymentForm.notes,
//       };

//       if (paymentForm.paymentType === "EMI Installment") {
//         payload.installmentNumber = Number(paymentForm.installmentNumber);
//       }

//       const response = await api.post("/payments", payload);

//       setSuccess(response.data.message || "Payment recorded successfully.");

//       setShowPaymentForm(false);
//       setSelectedInvoice(null);
//       await fetchBillingData();
//     } catch (err) {
//       console.error("Record payment error:", err);
//       setError(err.response?.data?.message || "Failed to record payment.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="billing-layout">
//       <Sidebar />

//       <main className="billing-main">
//         <div className="billing-header">
//           <div>
//             <p className="billing-eyebrow">FINANCE MANAGEMENT</p>
//             <h1>Billing & EMI</h1>
//             <p className="billing-subtitle">
//               Manage invoices, showroom charges, installments and overdue
//               payments.
//             </p>
//           </div>

//           <button
//             className="billing-primary-btn"
//             onClick={() => {
//               setError("");
//               setSuccess("");
//               setShowInvoiceForm(true);
//             }}
//             disabled={availableBikes.length === 0}
//           >
//             + Create Invoice
//           </button>
//         </div>

//         {error && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-error">{error}</div>
//         )}

//         {success && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-success">{success}</div>
//         )}

//         <section className="billing-stats">
//           <div className="billing-stat-card">
//             <div className="billing-stat-icon invoice-icon">▤</div>
//             <div>
//               <p>Total Invoices</p>
//               <h2>{stats.totalInvoices}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon revenue-icon">₹</div>
//             <div>
//               <p>Amount Collected</p>
//               <h2>{money(stats.collected)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon due-icon">◷</div>
//             <div>
//               <p>Outstanding Balance</p>
//               <h2>{money(stats.outstanding)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon overdue-icon">!</div>
//             <div>
//               <p>Overdue Installments</p>
//               <h2>{overdueInstallments}</h2>
//             </div>
//           </div>
//         </section>

//         <div className="billing-tabs">
//           <button
//             className={activeTab === "invoices" ? "active" : ""}
//             onClick={() => setActiveTab("invoices")}
//           >
//             Invoices
//           </button>
//           <button
//             className={activeTab === "payments" ? "active" : ""}
//             onClick={() => setActiveTab("payments")}
//           >
//             Payment History
//           </button>
//         </div>

//         {activeTab === "invoices" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Customer Invoices</h2>
//                 <p>View invoices and expand EMI schedules.</p>
//               </div>

//               <div className="billing-filters">
//                 <input
//                   type="search"
//                   placeholder="Search customer, bike or invoice..."
//                   value={search}
//                   onChange={(event) => setSearch(event.target.value)}
//                 />

//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                 >
//                   <option value="All">All Status</option>
//                   <option value="Pending">Pending</option>
//                   <option value="Partial">Partial</option>
//                   <option value="Paid">Paid</option>
//                   <option value="Overdue">Overdue</option>
//                 </select>
//               </div>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading billing data...</div>
//             ) : filteredInvoices.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">▤</div>
//                 <h3>No invoices found</h3>
//                 <p>
//                   {invoices.length === 0
//                     ? "Create an invoice for a registered bike to get started."
//                     : "Try another search or status filter."}
//                 </p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Invoice</th>
//                       <th>Customer</th>
//                       <th>Bike</th>
//                       <th>Type</th>
//                       <th>Total Payable</th>
//                       <th>Paid</th>
//                       <th>Balance</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredInvoices.map((invoice) => (
//                       <>
//                         <tr key={invoice._id}>
//                           <td>
//                             <strong>{invoice.invoiceNumber}</strong>
//                             <small>{dateText(invoice.invoiceDate)}</small>
//                           </td>
//                           <td>
//                             <strong>{invoice.customer?.name || "—"}</strong>
//                             <small>{invoice.customer?.phone || ""}</small>
//                           </td>
//                           <td>
//                             <strong>
//                               {invoice.bike?.brand} {invoice.bike?.model}
//                             </strong>
//                             <small>
//                               {invoice.bike?.registrationNumber || ""}
//                             </small>
//                           </td>
//                           <td>
//                             <span className="billing-type-chip">
//                               {invoice.paymentType}
//                             </span>
//                           </td>
//                           <td>{money(invoice.totalPayable)}</td>
//                           <td className="billing-paid-amount">
//                             {money(invoice.totalPaid)}
//                           </td>
//                           <td className="billing-due-amount">
//                             {money(invoice.balanceDue)}
//                           </td>
//                           <td>
//                             <span
//                               className={statusClass(invoice.paymentStatus)}
//                             >
//                               {invoice.paymentStatus}
//                             </span>
//                           </td>
//                           <td>
//                             <div className="billing-row-actions">
//                               {invoice.paymentType === "EMI" && (
//                                 <button
//                                   className="billing-view-btn"
//                                   onClick={() =>
//                                     setExpandedInvoiceId(
//                                       expandedInvoiceId === invoice._id
//                                         ? null
//                                         : invoice._id,
//                                     )
//                                   }
//                                 >
//                                   {expandedInvoiceId === invoice._id
//                                     ? "Hide Schedule"
//                                     : "View EMI"}
//                                 </button>
//                               )}

//                               <button
//                                 className="billing-action-btn"
//                                 onClick={() => openPaymentForm(invoice)}
//                                 disabled={
//                                   invoice.paymentStatus === "Paid" ||
//                                   Number(invoice.balanceDue) <= 0
//                                 }
//                               >
//                                 Record Payment
//                               </button>
//                             </div>
//                           </td>
//                         </tr>

//                         {expandedInvoiceId === invoice._id && (
//                           <tr key={`${invoice._id}-schedule`}>
//                             <td colSpan="9">
//                               <div className="billing-schedule">
//                                 <div className="billing-schedule-header">
//                                   <div>
//                                     <h3>EMI Installment Schedule</h3>
//                                     <p>
//                                       {invoice.tenureMonths} installments ·{" "}
//                                       {invoice.monthlyInterestRate}% monthly
//                                       interest
//                                     </p>
//                                   </div>
//                                   <strong>
//                                     Monthly EMI: {money(invoice.monthlyEMI)}
//                                   </strong>
//                                 </div>

//                                 <div className="billing-fee-summary">
//                                   <div>
//                                     <span>Down Payment</span>
//                                     <strong>
//                                       {money(invoice.downPayment)}
//                                     </strong>
//                                   </div>
//                                   <div>
//                                     <span>Processing Fee</span>
//                                     <strong>
//                                       {money(invoice.processingFeeAmount)} (
//                                       {invoice.processingFeePercentage}%)
//                                     </strong>
//                                   </div>
//                                   <div>
//                                     <span>Documentation Fee</span>
//                                     <strong>
//                                       {money(invoice.documentationFee)}
//                                     </strong>
//                                   </div>
//                                   <div>
//                                     <span>Other Charges</span>
//                                     <strong>
//                                       {money(invoice.otherChargesAmount)}
//                                     </strong>
//                                   </div>
//                                   <div>
//                                     <span>Total Fees</span>
//                                     <strong>{money(invoice.totalFees)}</strong>
//                                   </div>
//                                 </div>

//                                 {invoice.otherChargesDescription && (
//                                   <p className="billing-other-charge-note">
//                                     Other charges:{" "}
//                                     {invoice.otherChargesDescription}
//                                   </p>
//                                 )}

//                                 <div className="billing-table-wrapper">
//                                   <table className="billing-installment-table">
//                                     <thead>
//                                       <tr>
//                                         <th>Installment</th>
//                                         <th>Due Date</th>
//                                         <th>Principal</th>
//                                         <th>Interest</th>
//                                         <th>Amount Due</th>
//                                         <th>Paid</th>
//                                         <th>Remaining</th>
//                                         <th>Status</th>
//                                         <th>Action</th>
//                                       </tr>
//                                     </thead>
//                                     <tbody>
//                                       {(invoice.emiSchedule || []).map(
//                                         (item) => {
//                                           const remaining = Math.max(
//                                             0,
//                                             Number(item.installmentAmount) -
//                                               Number(item.paidAmount || 0),
//                                           );

//                                           return (
//                                             <tr
//                                               key={
//                                                 item._id ||
//                                                 item.installmentNumber
//                                               }
//                                             >
//                                               <td>#{item.installmentNumber}</td>
//                                               <td>{dateText(item.dueDate)}</td>
//                                               <td>
//                                                 {money(item.principalAmount)}
//                                               </td>
//                                               <td>
//                                                 {money(item.interestAmount)}
//                                               </td>
//                                               <td>
//                                                 {money(item.installmentAmount)}
//                                               </td>
//                                               <td className="billing-paid-amount">
//                                                 {money(item.paidAmount)}
//                                               </td>
//                                               <td className="billing-due-amount">
//                                                 {money(remaining)}
//                                               </td>
//                                               <td>
//                                                 <span
//                                                   className={statusClass(
//                                                     item.status,
//                                                   )}
//                                                 >
//                                                   {item.status}
//                                                 </span>
//                                               </td>
//                                               <td>
//                                                 {item.status !== "Paid" && (
//                                                   <button
//                                                     className="billing-action-btn"
//                                                     onClick={() =>
//                                                       openPaymentForm(
//                                                         invoice,
//                                                         item,
//                                                       )
//                                                     }
//                                                     disabled={remaining <= 0}
//                                                   >
//                                                     Pay
//                                                   </button>
//                                                 )}
//                                               </td>
//                                             </tr>
//                                           );
//                                         },
//                                       )}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}

//         {activeTab === "payments" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Payment History</h2>
//                 <p>All recorded customer transactions.</p>
//               </div>
//               <span className="billing-record-count">
//                 {payments.length} transactions
//               </span>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading payment history...</div>
//             ) : payments.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">₹</div>
//                 <h3>No payments recorded</h3>
//                 <p>Transactions will appear here after collection.</p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Date</th>
//                       <th>Customer</th>
//                       <th>Invoice</th>
//                       <th>Payment Type</th>
//                       <th>Method</th>
//                       <th>Reference</th>
//                       <th>Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {payments.map((payment) => (
//                       <tr key={payment._id}>
//                         <td>{dateText(payment.paymentDate)}</td>
//                         <td>
//                           <strong>{payment.customer?.name || "—"}</strong>
//                           <small>{payment.customer?.phone || ""}</small>
//                         </td>
//                         <td>{payment.invoice?.invoiceNumber || "—"}</td>
//                         <td>{payment.paymentType}</td>
//                         <td>{payment.paymentMethod}</td>
//                         <td>{payment.transactionReference || "—"}</td>
//                         <td className="billing-paid-amount">
//                           {money(payment.amount)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}
//       </main>

//       {showInvoiceForm && (
//         <div className="billing-modal-overlay" onClick={closeForms}>
//           <div
//             className="billing-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">NEW TRANSACTION</p>
//                 <h2>Create Invoice</h2>
//               </div>
//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">{error}</div>
//             )}

//             <form onSubmit={handleCreateInvoice}>
//               <div className="billing-form-group">
//                 <label>Select Registered Bike *</label>
//                 <select
//                   name="bikeId"
//                   value={invoiceForm.bikeId}
//                   onChange={handleInvoiceChange}
//                   required
//                 >
//                   <option value="">Choose a registered bike</option>
//                   {availableBikes.map((bike) => (
//                     <option key={bike._id} value={bike._id}>
//                       {bike.brand} {bike.model} —{" "}
//                       {bike.customer?.name || "Customer"} —{" "}
//                       {bike.registrationNumber || "No registration"}
//                     </option>
//                   ))}
//                 </select>
//                 {availableBikes.length === 0 && (
//                   <small>No uninvoiced registered bikes are available.</small>
//                 )}
//               </div>

//               {selectedBike && (
//                 <div className="billing-selected-bike">
//                   <div>
//                     <span>Customer</span>
//                     <strong>{selectedBike.customer?.name || "—"}</strong>
//                   </div>
//                   <div>
//                     <span>Phone</span>
//                     <strong>{selectedBike.customer?.phone || "—"}</strong>
//                   </div>
//                   <div>
//                     <span>Registration</span>
//                     <strong>{selectedBike.registrationNumber || "—"}</strong>
//                   </div>
//                   <div>
//                     <span>Bike Price</span>
//                     <strong>{money(bikePrice)}</strong>
//                   </div>
//                 </div>
//               )}

//               <div className="billing-form-group">
//                 <label>Payment Type *</label>
//                 <div className="billing-payment-options">
//                   <label
//                     className={
//                       invoiceForm.paymentType === "Full Payment"
//                         ? "selected"
//                         : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="Full Payment"
//                       checked={invoiceForm.paymentType === "Full Payment"}
//                       onChange={handleInvoiceChange}
//                     />
//                     <span>
//                       <strong>Full Payment</strong>
//                       <small>Pay the complete bike price at once.</small>
//                     </span>
//                   </label>

//                   <label
//                     className={
//                       invoiceForm.paymentType === "EMI" ? "selected" : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="EMI"
//                       checked={invoiceForm.paymentType === "EMI"}
//                       onChange={handleInvoiceChange}
//                     />
//                     <span>
//                       <strong>EMI Payment</strong>
//                       <small>Configure charges and monthly installments.</small>
//                     </span>
//                   </label>
//                 </div>
//               </div>

//               {invoiceForm.paymentType === "EMI" && (
//                 <>
//                   <h3 className="billing-section-heading">EMI Configuration</h3>

//                   <div className="billing-form-grid">
//                     <div className="billing-form-group">
//                       <label>Down Payment (₹) *</label>
//                       <input
//                         type="number"
//                         name="downPayment"
//                         min="0"
//                         max={Math.max(0, bikePrice - 0.01)}
//                         step="0.01"
//                         value={invoiceForm.downPayment}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Tenure (Months) *</label>
//                       <select
//                         name="tenureMonths"
//                         value={invoiceForm.tenureMonths}
//                         onChange={handleInvoiceChange}
//                       >
//                         {[3, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60].map(
//                           (month) => (
//                             <option key={month} value={month}>
//                               {month} Months
//                             </option>
//                           ),
//                         )}
//                       </select>
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Monthly Interest Rate (%) *</label>
//                       <input
//                         type="number"
//                         name="monthlyInterestRate"
//                         min="0.01"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.monthlyInterestRate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>First EMI Due Date *</label>
//                       <input
//                         type="date"
//                         name="firstDueDate"
//                         min={today()}
//                         value={invoiceForm.firstDueDate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>
//                   </div>

//                   <h3 className="billing-section-heading">
//                     Staff-configured Charges
//                   </h3>

//                   <div className="billing-form-grid">
//                     <div className="billing-form-group">
//                       <label>Processing Fee (%) *</label>
//                       <input
//                         type="number"
//                         name="processingFeePercentage"
//                         min="0"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.processingFeePercentage}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Documentation Fee (₹) *</label>
//                       <input
//                         type="number"
//                         name="documentationFee"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.documentationFee}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges (₹)</label>
//                       <input
//                         type="number"
//                         name="otherChargesAmount"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.otherChargesAmount}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges Description</label>
//                       <input
//                         type="text"
//                         name="otherChargesDescription"
//                         maxLength="250"
//                         placeholder="e.g. Insurance or additional service"
//                         value={invoiceForm.otherChargesDescription}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="billing-emi-preview">
//                     <div className="billing-preview-heading">
//                       <div>
//                         <h3>EMI Calculation Preview</h3>
//                         <p>Estimated customer payment details</p>
//                       </div>
//                       <span className="billing-preview-chip">
//                         Reducing Balance
//                       </span>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Bike Price</span>
//                       <strong>{money(bikePrice)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Down Payment</span>
//                       <strong>{money(downPayment)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>
//                         Processing Fee ({invoiceForm.processingFeePercentage}%)
//                       </span>
//                       <strong>{money(processingFeeAmount)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Documentation Fee</span>
//                       <strong>{money(documentationFee)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Other Charges</span>
//                       <strong>{money(otherChargesAmount)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Total Additional Fees</span>
//                       <strong>{money(totalFees)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Monthly Interest Rate</span>
//                       <strong>{invoiceForm.monthlyInterestRate}%</strong>
//                     </div>
//                     <div className="billing-preview-row billing-preview-highlight">
//                       <span>Monthly Installment</span>
//                       <strong>{money(monthlyEMI)}</strong>
//                     </div>
//                     <div className="billing-preview-row">
//                       <span>Estimated Total Interest</span>
//                       <strong>{money(estimatedInterest)}</strong>
//                     </div>
//                     <div className="billing-preview-row billing-preview-total">
//                       <span>Estimated Total Payable</span>
//                       <strong>{money(estimatedTotalPayable)}</strong>
//                     </div>

//                     <small>
//                       This is an estimate. The backend generates and stores the
//                       official installment schedule when the invoice is created.
//                     </small>
//                   </div>
//                 </>
//               )}

//               <div className="billing-form-group">
//                 <label>Notes</label>
//                 <textarea
//                   name="notes"
//                   rows="3"
//                   placeholder="Optional invoice notes..."
//                   value={invoiceForm.notes}
//                   onChange={handleInvoiceChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !invoiceForm.bikeId ||
//                     (invoiceForm.paymentType === "EMI" &&
//                       (!invoiceForm.downPayment ||
//                         downPayment >= bikePrice ||
//                         Number(invoiceForm.monthlyInterestRate) <= 0 ||
//                         Number(invoiceForm.tenureMonths) < 1 ||
//                         !invoiceForm.firstDueDate))
//                   }
//                 >
//                   {saving ? "Creating..." : "Create Invoice"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {showPaymentForm && selectedInvoice && (
//         <div className="billing-modal-overlay" onClick={closeForms}>
//           <div
//             className="billing-modal billing-payment-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">COLLECT PAYMENT</p>
//                 <h2>Record Payment</h2>
//               </div>
//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">{error}</div>
//             )}

//             <div className="billing-payment-summary">
//               <div>
//                 <span>Invoice</span>
//                 <strong>{selectedInvoice.invoiceNumber}</strong>
//               </div>
//               <div>
//                 <span>Customer</span>
//                 <strong>{selectedInvoice.customer?.name || "—"}</strong>
//               </div>
//               <div>
//                 <span>Total Payable</span>
//                 <strong>{money(selectedInvoice.totalPayable)}</strong>
//               </div>
//               <div>
//                 <span>Balance Due</span>
//                 <strong className="billing-due-amount">
//                   {money(selectedInvoice.balanceDue)}
//                 </strong>
//               </div>
//             </div>

//             <form onSubmit={handleRecordPayment}>
//               {selectedInvoice.paymentType === "EMI" && (
//                 <div className="billing-form-group">
//                   <label>Payment Type *</label>
//                   <select
//                     name="paymentType"
//                     value={paymentForm.paymentType}
//                     onChange={(event) =>
//                       handlePaymentTypeChange(event.target.value)
//                     }
//                   >
//                     <option value="Down Payment">Down Payment</option>
//                     <option value="EMI Installment">EMI Installment</option>
//                   </select>
//                 </div>
//               )}

//               {paymentForm.paymentType === "EMI Installment" && (
//                 <div className="billing-form-group">
//                   <label>Installment Number</label>
//                   <input
//                     type="number"
//                     value={paymentForm.installmentNumber}
//                     readOnly
//                   />
//                 </div>
//               )}

//               <div className="billing-form-grid">
//                 <div className="billing-form-group">
//                   <label>Payment Amount (₹) *</label>
//                   <input
//                     type="number"
//                     name="amount"
//                     min="0.01"
//                     max={selectedInvoice.balanceDue}
//                     step="0.01"
//                     value={paymentForm.amount}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Method *</label>
//                   <select
//                     name="paymentMethod"
//                     value={paymentForm.paymentMethod}
//                     onChange={handlePaymentChange}
//                     required
//                   >
//                     <option value="Cash">Cash</option>
//                     <option value="UPI">UPI</option>
//                     <option value="Card">Card</option>
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                   </select>
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Date *</label>
//                   <input
//                     type="date"
//                     name="paymentDate"
//                     max={today()}
//                     value={paymentForm.paymentDate}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Transaction Reference</label>
//                   <input
//                     type="text"
//                     name="transactionReference"
//                     placeholder="UPI ID / transaction number"
//                     value={paymentForm.transactionReference}
//                     onChange={handlePaymentChange}
//                   />
//                 </div>
//               </div>

//               <div className="billing-form-group">
//                 <label>Notes</label>
//                 <textarea
//                   name="notes"
//                   rows="2"
//                   placeholder="Optional payment notes..."
//                   value={paymentForm.notes}
//                   onChange={handlePaymentChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !paymentForm.amount ||
//                     Number(paymentForm.amount) <= 0
//                   }
//                 >
//                   {saving ? "Recording..." : "Record Payment"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Billing;

// import { useCallback, useEffect, useMemo, useState } from "react";
// import Sidebar from "../components/Sidebar";
// import api from "../services/api";
// import "../styles/Billing.css";

// const money = (value) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(value) || 0);

// const dateText = (value) =>
//   value ? new Date(value).toLocaleDateString("en-IN") : "—";

// const today = () => {
//   const date = new Date();
//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
// };

// const nextMonthDate = () => {
//   const date = new Date();
//   const day = date.getDate();

//   date.setDate(1);
//   date.setMonth(date.getMonth() + 1);

//   const lastDay = new Date(
//     date.getFullYear(),
//     date.getMonth() + 1,
//     0,
//   ).getDate();

//   date.setDate(Math.min(day, lastDay));

//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
// };

// const roundMoney = (value) =>
//   Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// // Annual simple interest calculation.
// const calculateSimpleInterest = (principal, annualRate, months) => {
//   if (!principal || !months) return 0;

//   return roundMoney(
//     Number(principal) * (Number(annualRate || 0) / 100) * (Number(months) / 12),
//   );
// };

// // Monthly installment = (Principal + Total Interest) / Tenure.
// const calculateEMI = (principal, annualRate, months) => {
//   if (!principal || !months) return 0;

//   const totalInterest = calculateSimpleInterest(principal, annualRate, months);

//   return roundMoney((Number(principal) + totalInterest) / Number(months));
// };

// const statusClass = (status) =>
//   `billing-status billing-status-${String(status || "Pending")
//     .toLowerCase()
//     .replace(/\s+/g, "-")}`;

// function Billing() {
//   const [activeTab, setActiveTab] = useState("invoices");
//   const [invoices, setInvoices] = useState([]);
//   const [availableBikes, setAvailableBikes] = useState([]);
//   const [payments, setPayments] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [showInvoiceForm, setShowInvoiceForm] = useState(false);
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");

//   const [invoiceForm, setInvoiceForm] = useState({
//     bikeId: "",
//     paymentType: "Full Payment",
//     downPayment: "",
//     tenureMonths: "12",
//     annualInterestRate: "2",
//     processingFeePercentage: "3",
//     documentationFee: "3000",
//     otherChargesAmount: "0",
//     otherChargesDescription: "",
//     firstDueDate: nextMonthDate(),
//     notes: "",
//   });

//   const [paymentForm, setPaymentForm] = useState({
//     paymentType: "Full Payment",
//     amount: "",
//     paymentMethod: "UPI",
//     installmentNumber: "",
//     transactionReference: "",
//     paymentDate: today(),
//     notes: "",
//   });

//   // Fetch invoices, available bikes and payment history.
//   const fetchBillingData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const [invoiceResponse, bikeResponse, paymentResponse] =
//         await Promise.all([
//           api.get("/billing"),
//           api.get("/billing/available-bikes"),
//           api.get("/payments"),
//         ]);

//       setInvoices(invoiceResponse.data.invoices || []);
//       setAvailableBikes(bikeResponse.data.bikes || []);
//       setPayments(paymentResponse.data.payments || []);
//     } catch (err) {
//       console.error("Billing data error:", err);

//       setError(
//         err.response?.data?.message || "Unable to load billing information.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBillingData();
//   }, [fetchBillingData]);

//   // Selected registered bike.
//   const selectedBike = useMemo(
//     () => availableBikes.find((bike) => bike._id === invoiceForm.bikeId),
//     [availableBikes, invoiceForm.bikeId],
//   );

//   const bikePrice = Number(selectedBike?.bikePrice || 0);
//   const downPayment = Number(invoiceForm.downPayment || 0);

//   // Amount remaining after down payment.
//   const financedBalance = Math.max(0, bikePrice - downPayment);

//   // Processing fee is calculated on the financed balance.
//   const processingFeeAmount = roundMoney(
//     financedBalance * (Number(invoiceForm.processingFeePercentage || 0) / 100),
//   );

//   const documentationFee = Number(invoiceForm.documentationFee || 0);

//   const otherChargesAmount = Number(invoiceForm.otherChargesAmount || 0);

//   const totalFees = roundMoney(
//     processingFeeAmount + documentationFee + otherChargesAmount,
//   );

//   // Add applicable fees before calculating interest.
//   const calculatedPrincipal = roundMoney(financedBalance + totalFees);

//   // Annual simple interest preview.
//   const estimatedInterest = calculateSimpleInterest(
//     calculatedPrincipal,
//     Number(invoiceForm.annualInterestRate),
//     Number(invoiceForm.tenureMonths),
//   );

//   const monthlyEMI = calculateEMI(
//     calculatedPrincipal,
//     Number(invoiceForm.annualInterestRate),
//     Number(invoiceForm.tenureMonths),
//   );

//   const estimatedInstallmentTotal = roundMoney(
//     calculatedPrincipal + estimatedInterest,
//   );

//   const estimatedTotalPayable = roundMoney(
//     downPayment + estimatedInstallmentTotal,
//   );

//   // Count overdue installments.
//   const overdueInstallments = useMemo(
//     () =>
//       invoices.reduce(
//         (total, invoice) =>
//           total +
//           (invoice.emiSchedule || []).filter(
//             (item) => item.status === "Overdue",
//           ).length,
//         0,
//       ),
//     [invoices],
//   );

//   // Search and filter invoices.
//   const filteredInvoices = useMemo(() => {
//     return invoices.filter((invoice) => {
//       const customer = invoice.customer?.name || "";
//       const invoiceNumber = invoice.invoiceNumber || "";
//       const bike = invoice.bike || {};

//       const bikeName = `${bike.brand || ""} ${bike.model || ""}`;

//       const matchesSearch = [
//         customer,
//         invoiceNumber,
//         bikeName,
//         bike.registrationNumber || "",
//       ]
//         .join(" ")
//         .toLowerCase()
//         .includes(search.toLowerCase());

//       const matchesStatus =
//         statusFilter === "All" || invoice.paymentStatus === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [invoices, search, statusFilter]);

//   // Dashboard statistics.
//   const stats = useMemo(
//     () => ({
//       totalInvoices: invoices.length,

//       collected: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.totalPaid || 0),
//         0,
//       ),

//       outstanding: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.balanceDue || 0),
//         0,
//       ),

//       paid: invoices.filter((invoice) => invoice.paymentStatus === "Paid")
//         .length,
//     }),
//     [invoices],
//   );

//   const getInvoicePayments = (invoiceId) =>
//     payments.filter(
//       (payment) =>
//         String(payment.invoice?._id || payment.invoice) === String(invoiceId),
//     );

//   const getDownPaymentPaid = (invoice) =>
//     getInvoicePayments(invoice._id)
//       .filter((payment) => payment.paymentType === "Down Payment")
//       .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

//   const getNextInstallment = (invoice) =>
//     (invoice.emiSchedule || []).find((item) => item.status !== "Paid");

//   const resetInvoiceForm = () => {
//     setInvoiceForm({
//       bikeId: "",
//       paymentType: "Full Payment",
//       downPayment: "",
//       tenureMonths: "12",
//       annualInterestRate: "2",
//       processingFeePercentage: "3",
//       documentationFee: "3000",
//       otherChargesAmount: "0",
//       otherChargesDescription: "",
//       firstDueDate: nextMonthDate(),
//       notes: "",
//     });
//   };

//   const handleInvoiceChange = (event) => {
//     const { name, value } = event.target;

//     setInvoiceForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   const closeForms = () => {
//     setShowInvoiceForm(false);
//     setShowPaymentForm(false);
//     setSelectedInvoice(null);
//     setError("");
//   };

//   // Create invoice.
//   const handleCreateInvoice = async (event) => {
//     event.preventDefault();

//     setError("");
//     setSuccess("");

//     if (!invoiceForm.bikeId) {
//       setError("Please select a registered bike.");
//       return;
//     }

//     if (invoiceForm.paymentType === "EMI") {
//       if (
//         !Number.isFinite(downPayment) ||
//         downPayment < 0 ||
//         downPayment >= bikePrice
//       ) {
//         setError("Down payment must be less than the bike price.");
//         return;
//       }

//       if (
//         !Number.isFinite(Number(invoiceForm.annualInterestRate)) ||
//         Number(invoiceForm.annualInterestRate) < 0
//       ) {
//         setError("Enter a valid annual interest rate.");
//         return;
//       }

//       if (
//         !Number.isFinite(Number(invoiceForm.processingFeePercentage)) ||
//         Number(invoiceForm.processingFeePercentage) < 0
//       ) {
//         setError("Enter a valid processing fee percentage.");
//         return;
//       }

//       if (
//         !Number.isFinite(documentationFee) ||
//         documentationFee < 0 ||
//         !Number.isFinite(otherChargesAmount) ||
//         otherChargesAmount < 0
//       ) {
//         setError("Documentation and other charges cannot be negative.");
//         return;
//       }

//       if (
//         !Number.isInteger(Number(invoiceForm.tenureMonths)) ||
//         Number(invoiceForm.tenureMonths) < 1 ||
//         Number(invoiceForm.tenureMonths) > 60
//       ) {
//         setError("Tenure must be between 1 and 60 months.");
//         return;
//       }

//       if (!invoiceForm.firstDueDate) {
//         setError("Please select the first EMI due date.");
//         return;
//       }
//     }

//     try {
//       setSaving(true);

//       const payload = {
//         bikeId: invoiceForm.bikeId,
//         paymentType: invoiceForm.paymentType,
//         notes: invoiceForm.notes,
//       };

//       if (invoiceForm.paymentType === "EMI") {
//         payload.downPayment = downPayment;
//         payload.tenureMonths = Number(invoiceForm.tenureMonths);

//         // Backend now expects annualInterestRate.
//         payload.annualInterestRate = Number(invoiceForm.annualInterestRate);

//         payload.processingFeePercentage = Number(
//           invoiceForm.processingFeePercentage,
//         );

//         payload.documentationFee = documentationFee;
//         payload.otherChargesAmount = otherChargesAmount;

//         payload.otherChargesDescription = invoiceForm.otherChargesDescription;

//         payload.firstDueDate = invoiceForm.firstDueDate;
//       }

//       const response = await api.post("/billing", payload);

//       setSuccess(response.data.message || "Invoice created successfully.");

//       setShowInvoiceForm(false);
//       resetInvoiceForm();

//       await fetchBillingData();
//     } catch (err) {
//       console.error("Create invoice error:", err);

//       setError(err.response?.data?.message || "Failed to create invoice.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Open payment form.
//   const openPaymentForm = (invoice, installment = null) => {
//     setSelectedInvoice(invoice);
//     setError("");
//     setSuccess("");

//     let paymentType = "Full Payment";
//     let amount = invoice.balanceDue || "";

//     if (invoice.paymentType === "EMI") {
//       const downPaymentRemaining =
//         Number(invoice.downPayment || 0) - getDownPaymentPaid(invoice);

//       if (downPaymentRemaining > 0.01 && !installment) {
//         paymentType = "Down Payment";
//         amount = roundMoney(downPaymentRemaining).toFixed(2);
//       } else {
//         const nextInstallment = installment || getNextInstallment(invoice);

//         paymentType = "EMI Installment";

//         amount = nextInstallment
//           ? roundMoney(
//               Number(nextInstallment.installmentAmount) -
//                 Number(nextInstallment.paidAmount || 0),
//             ).toFixed(2)
//           : "";

//         setPaymentForm((previous) => ({
//           ...previous,
//           paymentType,
//           amount,
//           installmentNumber: String(nextInstallment?.installmentNumber || ""),
//         }));

//         setShowPaymentForm(true);
//         return;
//       }
//     }

//     setPaymentForm({
//       paymentType,
//       amount: String(amount),
//       paymentMethod: "UPI",
//       installmentNumber: "",
//       transactionReference: "",
//       paymentDate: today(),
//       notes: "",
//     });

//     setShowPaymentForm(true);
//   };

//   const handlePaymentTypeChange = (value) => {
//     if (!selectedInvoice) return;

//     let amount = "";
//     let installmentNumber = "";

//     if (value === "Full Payment") {
//       amount = selectedInvoice.balanceDue;
//     } else if (value === "Down Payment") {
//       amount = Math.max(
//         0,
//         Number(selectedInvoice.downPayment || 0) -
//           getDownPaymentPaid(selectedInvoice),
//       ).toFixed(2);
//     } else if (value === "EMI Installment") {
//       const installment = getNextInstallment(selectedInvoice);

//       installmentNumber = String(installment?.installmentNumber || "");

//       amount = installment
//         ? (
//             Number(installment.installmentAmount) -
//             Number(installment.paidAmount || 0)
//           ).toFixed(2)
//         : "";
//     }

//     setPaymentForm((previous) => ({
//       ...previous,
//       paymentType: value,
//       amount: String(amount),
//       installmentNumber,
//     }));
//   };

//   const handlePaymentChange = (event) => {
//     const { name, value } = event.target;

//     setPaymentForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   // Record payment.
//   const handleRecordPayment = async (event) => {
//     event.preventDefault();

//     if (!selectedInvoice) return;

//     setError("");
//     setSuccess("");

//     try {
//       setSaving(true);

//       const payload = {
//         invoiceId: selectedInvoice._id,
//         amount: Number(paymentForm.amount),
//         paymentType: paymentForm.paymentType,
//         paymentMethod: paymentForm.paymentMethod,
//         transactionReference: paymentForm.transactionReference,
//         paymentDate: paymentForm.paymentDate,
//         notes: paymentForm.notes,
//       };

//       if (paymentForm.paymentType === "EMI Installment") {
//         payload.installmentNumber = Number(paymentForm.installmentNumber);
//       }

//       const response = await api.post("/payments", payload);

//       setSuccess(response.data.message || "Payment recorded successfully.");

//       setShowPaymentForm(false);
//       setSelectedInvoice(null);

//       await fetchBillingData();
//     } catch (err) {
//       console.error("Record payment error:", err);

//       setError(err.response?.data?.message || "Failed to record payment.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="billing-layout">
//       <Sidebar />

//       <main className="billing-main">
//         <div className="billing-header">
//           <div>
//             <p className="billing-eyebrow">FINANCE MANAGEMENT</p>

//             <h1>Billing & EMI</h1>

//             <p className="billing-subtitle">
//               Manage invoices, showroom charges, installments and overdue
//               payments.
//             </p>
//           </div>

//           <button
//             className="billing-primary-btn"
//             onClick={() => {
//               setError("");
//               setSuccess("");
//               setShowInvoiceForm(true);
//             }}
//             disabled={availableBikes.length === 0}
//           >
//             + Create Invoice
//           </button>
//         </div>

//         {error && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-error">{error}</div>
//         )}

//         {success && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-success">{success}</div>
//         )}

//         {/* Dashboard statistics */}
//         <section className="billing-stats">
//           <div className="billing-stat-card">
//             <div className="billing-stat-icon invoice-icon">▤</div>
//             <div>
//               <p>Total Invoices</p>
//               <h2>{stats.totalInvoices}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon revenue-icon">₹</div>
//             <div>
//               <p>Amount Collected</p>
//               <h2>{money(stats.collected)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon due-icon">◷</div>
//             <div>
//               <p>Outstanding Balance</p>
//               <h2>{money(stats.outstanding)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon overdue-icon">!</div>
//             <div>
//               <p>Overdue Installments</p>
//               <h2>{overdueInstallments}</h2>
//             </div>
//           </div>
//         </section>

//         {/* Main tabs */}
//         <div className="billing-tabs">
//           <button
//             className={activeTab === "invoices" ? "active" : ""}
//             onClick={() => setActiveTab("invoices")}
//           >
//             Invoices
//           </button>

//           <button
//             className={activeTab === "payments" ? "active" : ""}
//             onClick={() => setActiveTab("payments")}
//           >
//             Payment History
//           </button>
//         </div>

//         {/* Invoice list */}
//         {activeTab === "invoices" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Customer Invoices</h2>
//                 <p>View invoices and expand EMI schedules.</p>
//               </div>

//               <div className="billing-filters">
//                 <input
//                   type="search"
//                   placeholder="Search customer, bike or invoice..."
//                   value={search}
//                   onChange={(event) => setSearch(event.target.value)}
//                 />

//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                 >
//                   <option value="All">All Status</option>
//                   <option value="Pending">Pending</option>
//                   <option value="Partial">Partial</option>
//                   <option value="Paid">Paid</option>
//                   <option value="Overdue">Overdue</option>
//                 </select>
//               </div>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading billing data...</div>
//             ) : filteredInvoices.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">▤</div>
//                 <h3>No invoices found</h3>
//                 <p>
//                   {invoices.length === 0
//                     ? "Create an invoice for a registered bike to get started."
//                     : "Try another search or status filter."}
//                 </p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Invoice</th>
//                       <th>Customer</th>
//                       <th>Bike</th>
//                       <th>Type</th>
//                       <th>Total Payable</th>
//                       <th>Paid</th>
//                       <th>Balance</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredInvoices.map((invoice) => (
//                       <>
//                         <tr key={invoice._id}>
//                           <td>
//                             <strong>{invoice.invoiceNumber}</strong>
//                             <small>{dateText(invoice.invoiceDate)}</small>
//                           </td>

//                           <td>
//                             <strong>{invoice.customer?.name || "—"}</strong>
//                             <small>{invoice.customer?.phone || ""}</small>
//                           </td>

//                           <td>
//                             <strong>
//                               {invoice.bike?.brand} {invoice.bike?.model}
//                             </strong>
//                             <small>
//                               {invoice.bike?.registrationNumber || ""}
//                             </small>
//                           </td>

//                           <td>
//                             <span className="billing-type-chip">
//                               {invoice.paymentType}
//                             </span>
//                           </td>

//                           <td>{money(invoice.totalPayable)}</td>

//                           <td className="billing-paid-amount">
//                             {money(invoice.totalPaid)}
//                           </td>

//                           <td className="billing-due-amount">
//                             {money(invoice.balanceDue)}
//                           </td>

//                           <td>
//                             <span
//                               className={statusClass(invoice.paymentStatus)}
//                             >
//                               {invoice.paymentStatus}
//                             </span>
//                           </td>

//                           <td>
//                             <div className="billing-row-actions">
//                               {invoice.paymentType === "EMI" && (
//                                 <button
//                                   className="billing-view-btn"
//                                   onClick={() =>
//                                     setExpandedInvoiceId(
//                                       expandedInvoiceId === invoice._id
//                                         ? null
//                                         : invoice._id,
//                                     )
//                                   }
//                                 >
//                                   {expandedInvoiceId === invoice._id
//                                     ? "Hide Schedule"
//                                     : "View EMI"}
//                                 </button>
//                               )}

//                               <button
//                                 className="billing-action-btn"
//                                 onClick={() => openPaymentForm(invoice)}
//                                 disabled={
//                                   invoice.paymentStatus === "Paid" ||
//                                   Number(invoice.balanceDue) <= 0
//                                 }
//                               >
//                                 Record Payment
//                               </button>
//                             </div>
//                           </td>
//                         </tr>

//                         {/* EMI schedule */}
//                         {expandedInvoiceId === invoice._id && (
//                           <tr key={`${invoice._id}-schedule`}>
//                             <td colSpan="9">
//                               <div className="billing-schedule">
//                                 <div className="billing-schedule-header">
//                                   <div>
//                                     <h3>EMI Installment Schedule</h3>

//                                     <p>
//                                       {invoice.tenureMonths} installments
//                                       {" · "}
//                                       {invoice.annualInterestRate}% annual
//                                       interest
//                                     </p>
//                                   </div>

//                                   <strong>
//                                     Monthly EMI: {money(invoice.monthlyEMI)}
//                                   </strong>
//                                 </div>

//                                 <div className="billing-fee-summary">
//                                   <div>
//                                     <span>Down Payment</span>
//                                     <strong>
//                                       {money(invoice.downPayment)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Processing Fee</span>
//                                     <strong>
//                                       {money(invoice.processingFeeAmount)} (
//                                       {invoice.processingFeePercentage}%)
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Documentation Fee</span>
//                                     <strong>
//                                       {money(invoice.documentationFee)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Other Charges</span>
//                                     <strong>
//                                       {money(invoice.otherChargesAmount)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Total Fees</span>
//                                     <strong>{money(invoice.totalFees)}</strong>
//                                   </div>
//                                 </div>

//                                 {invoice.otherChargesDescription && (
//                                   <p className="billing-other-charge-note">
//                                     Other charges:{" "}
//                                     {invoice.otherChargesDescription}
//                                   </p>
//                                 )}

//                                 <div className="billing-table-wrapper">
//                                   <table className="billing-installment-table">
//                                     <thead>
//                                       <tr>
//                                         <th>Installment</th>
//                                         <th>Due Date</th>
//                                         <th>Principal</th>
//                                         <th>Interest</th>
//                                         <th>Amount Due</th>
//                                         <th>Paid</th>
//                                         <th>Remaining</th>
//                                         <th>Status</th>
//                                         <th>Action</th>
//                                       </tr>
//                                     </thead>

//                                     <tbody>
//                                       {(invoice.emiSchedule || []).map(
//                                         (item) => {
//                                           const remaining = Math.max(
//                                             0,
//                                             Number(item.installmentAmount) -
//                                               Number(item.paidAmount || 0),
//                                           );

//                                           return (
//                                             <tr
//                                               key={
//                                                 item._id ||
//                                                 item.installmentNumber
//                                               }
//                                             >
//                                               <td>#{item.installmentNumber}</td>

//                                               <td>{dateText(item.dueDate)}</td>

//                                               <td>
//                                                 {money(item.principalAmount)}
//                                               </td>

//                                               <td>
//                                                 {money(item.interestAmount)}
//                                               </td>

//                                               <td>
//                                                 {money(item.installmentAmount)}
//                                               </td>

//                                               <td className="billing-paid-amount">
//                                                 {money(item.paidAmount)}
//                                               </td>

//                                               <td className="billing-due-amount">
//                                                 {money(remaining)}
//                                               </td>

//                                               <td>
//                                                 <span
//                                                   className={statusClass(
//                                                     item.status,
//                                                   )}
//                                                 >
//                                                   {item.status}
//                                                 </span>
//                                               </td>

//                                               <td>
//                                                 {item.status !== "Paid" && (
//                                                   <button
//                                                     className="billing-action-btn"
//                                                     onClick={() =>
//                                                       openPaymentForm(
//                                                         invoice,
//                                                         item,
//                                                       )
//                                                     }
//                                                     disabled={remaining <= 0}
//                                                   >
//                                                     Pay
//                                                   </button>
//                                                 )}
//                                               </td>
//                                             </tr>
//                                           );
//                                         },
//                                       )}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}

//         {/* Payment history */}
//         {activeTab === "payments" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Payment History</h2>
//                 <p>All recorded customer transactions.</p>
//               </div>

//               <span className="billing-record-count">
//                 {payments.length} transactions
//               </span>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading payment history...</div>
//             ) : payments.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">₹</div>
//                 <h3>No payments recorded</h3>
//                 <p>Transactions will appear here after collection.</p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Date</th>
//                       <th>Customer</th>
//                       <th>Invoice</th>
//                       <th>Payment Type</th>
//                       <th>Method</th>
//                       <th>Reference</th>
//                       <th>Amount</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {payments.map((payment) => (
//                       <tr key={payment._id}>
//                         <td>{dateText(payment.paymentDate)}</td>

//                         <td>
//                           <strong>{payment.customer?.name || "—"}</strong>
//                           <small>{payment.customer?.phone || ""}</small>
//                         </td>

//                         <td>{payment.invoice?.invoiceNumber || "—"}</td>

//                         <td>{payment.paymentType}</td>
//                         <td>{payment.paymentMethod}</td>

//                         <td>{payment.transactionReference || "—"}</td>

//                         <td className="billing-paid-amount">
//                           {money(payment.amount)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}
//       </main>

//       {/* Create invoice modal */}
//       {showInvoiceForm && (
//         <div className="billing-modal-overlay" onClick={closeForms}>
//           <div
//             className="billing-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">NEW TRANSACTION</p>
//                 <h2>Create Invoice</h2>
//               </div>

//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">{error}</div>
//             )}

//             <form onSubmit={handleCreateInvoice}>
//               <div className="billing-form-group">
//                 <label>Select Registered Bike *</label>

//                 <select
//                   name="bikeId"
//                   value={invoiceForm.bikeId}
//                   onChange={handleInvoiceChange}
//                   required
//                 >
//                   <option value="">Choose a registered bike</option>

//                   {availableBikes.map((bike) => (
//                     <option key={bike._id} value={bike._id}>
//                       {bike.brand} {bike.model} —{" "}
//                       {bike.customer?.name || "Customer"} —{" "}
//                       {bike.registrationNumber || "No registration"}
//                     </option>
//                   ))}
//                 </select>

//                 {availableBikes.length === 0 && (
//                   <small>No uninvoiced registered bikes are available.</small>
//                 )}
//               </div>

//               {selectedBike && (
//                 <div className="billing-selected-bike">
//                   <div>
//                     <span>Customer</span>
//                     <strong>{selectedBike.customer?.name || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Phone</span>
//                     <strong>{selectedBike.customer?.phone || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Registration</span>
//                     <strong>{selectedBike.registrationNumber || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Bike Price</span>
//                     <strong>{money(bikePrice)}</strong>
//                   </div>
//                 </div>
//               )}

//               <div className="billing-form-group">
//                 <label>Payment Type *</label>

//                 <div className="billing-payment-options">
//                   <label
//                     className={
//                       invoiceForm.paymentType === "Full Payment"
//                         ? "selected"
//                         : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="Full Payment"
//                       checked={invoiceForm.paymentType === "Full Payment"}
//                       onChange={handleInvoiceChange}
//                     />

//                     <span>
//                       <strong>Full Payment</strong>
//                       <small>Pay the complete bike price at once.</small>
//                     </span>
//                   </label>

//                   <label
//                     className={
//                       invoiceForm.paymentType === "EMI" ? "selected" : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="EMI"
//                       checked={invoiceForm.paymentType === "EMI"}
//                       onChange={handleInvoiceChange}
//                     />

//                     <span>
//                       <strong>EMI Payment</strong>
//                       <small>Configure charges and monthly installments.</small>
//                     </span>
//                   </label>
//                 </div>
//               </div>

//               {/* EMI configuration */}
//               {invoiceForm.paymentType === "EMI" && (
//                 <>
//                   <h3 className="billing-section-heading">EMI Configuration</h3>

//                   <div className="billing-form-grid">
//                     <div className="billing-form-group">
//                       <label>Down Payment (₹) *</label>

//                       <input
//                         type="number"
//                         name="downPayment"
//                         min="0"
//                         max={Math.max(0, bikePrice - 0.01)}
//                         step="0.01"
//                         value={invoiceForm.downPayment}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Tenure (Months) *</label>

//                       <select
//                         name="tenureMonths"
//                         value={invoiceForm.tenureMonths}
//                         onChange={handleInvoiceChange}
//                       >
//                         {[3, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60].map(
//                           (month) => (
//                             <option key={month} value={month}>
//                               {month} Months
//                             </option>
//                           ),
//                         )}
//                       </select>
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Annual Interest Rate (%) *</label>

//                       <input
//                         type="number"
//                         name="annualInterestRate"
//                         min="0"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.annualInterestRate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />

//                       <small>
//                         Staff can set a different annual rate for each customer.
//                       </small>
//                     </div>

//                     <div className="billing-form-group">
//                       <label>First EMI Due Date *</label>

//                       <input
//                         type="date"
//                         name="firstDueDate"
//                         min={today()}
//                         value={invoiceForm.firstDueDate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>
//                   </div>

//                   <h3 className="billing-section-heading">
//                     Staff-configured Charges
//                   </h3>

//                   <div className="billing-form-grid">
//                     <div className="billing-form-group">
//                       <label>Processing Fee (%) *</label>

//                       <input
//                         type="number"
//                         name="processingFeePercentage"
//                         min="0"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.processingFeePercentage}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Documentation Fee (₹) *</label>

//                       <input
//                         type="number"
//                         name="documentationFee"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.documentationFee}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges (₹)</label>

//                       <input
//                         type="number"
//                         name="otherChargesAmount"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.otherChargesAmount}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges Description</label>

//                       <input
//                         type="text"
//                         name="otherChargesDescription"
//                         maxLength="250"
//                         placeholder="e.g. Insurance or additional service"
//                         value={invoiceForm.otherChargesDescription}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>
//                   </div>

//                   {/* Live EMI preview */}
//                   <div className="billing-emi-preview">
//                     <div className="billing-preview-heading">
//                       <div>
//                         <h3>EMI Calculation Preview</h3>
//                         <p>Estimated customer payment details</p>
//                       </div>

//                       <span className="billing-preview-chip">
//                         Annual Simple Interest
//                       </span>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Bike Price</span>
//                       <strong>{money(bikePrice)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Down Payment</span>
//                       <strong>{money(downPayment)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>
//                         Processing Fee ({invoiceForm.processingFeePercentage}%)
//                       </span>
//                       <strong>{money(processingFeeAmount)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Documentation Fee</span>
//                       <strong>{money(documentationFee)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Other Charges</span>
//                       <strong>{money(otherChargesAmount)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Total Additional Fees</span>
//                       <strong>{money(totalFees)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Annual Interest Rate</span>
//                       <strong>{invoiceForm.annualInterestRate}%</strong>
//                     </div>

//                     <div className="billing-preview-row billing-preview-highlight">
//                       <span>Monthly Installment</span>
//                       <strong>{money(monthlyEMI)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Estimated Total Interest</span>
//                       <strong>{money(estimatedInterest)}</strong>
//                     </div>

//                     <div className="billing-preview-row billing-preview-total">
//                       <span>Estimated Total Payable</span>
//                       <strong>{money(estimatedTotalPayable)}</strong>
//                     </div>

//                     <small>
//                       Calculation: financed balance plus applicable fees, plus
//                       annual simple interest for the selected tenure. The
//                       backend generates the official installment schedule.
//                     </small>
//                   </div>
//                 </>
//               )}

//               <div className="billing-form-group">
//                 <label>Notes</label>

//                 <textarea
//                   name="notes"
//                   rows="3"
//                   placeholder="Optional invoice notes..."
//                   value={invoiceForm.notes}
//                   onChange={handleInvoiceChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !invoiceForm.bikeId ||
//                     (invoiceForm.paymentType === "EMI" &&
//                       (!invoiceForm.downPayment ||
//                         downPayment >= bikePrice ||
//                         Number(invoiceForm.annualInterestRate) < 0 ||
//                         Number(invoiceForm.tenureMonths) < 1 ||
//                         !invoiceForm.firstDueDate))
//                   }
//                 >
//                   {saving ? "Creating..." : "Create Invoice"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Record payment modal */}
//       {showPaymentForm && selectedInvoice && (
//         <div className="billing-modal-overlay" onClick={closeForms}>
//           <div
//             className="billing-modal billing-payment-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">COLLECT PAYMENT</p>
//                 <h2>Record Payment</h2>
//               </div>

//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">{error}</div>
//             )}

//             <div className="billing-payment-summary">
//               <div>
//                 <span>Invoice</span>
//                 <strong>{selectedInvoice.invoiceNumber}</strong>
//               </div>

//               <div>
//                 <span>Customer</span>
//                 <strong>{selectedInvoice.customer?.name || "—"}</strong>
//               </div>

//               <div>
//                 <span>Total Payable</span>
//                 <strong>{money(selectedInvoice.totalPayable)}</strong>
//               </div>

//               <div>
//                 <span>Balance Due</span>
//                 <strong className="billing-due-amount">
//                   {money(selectedInvoice.balanceDue)}
//                 </strong>
//               </div>
//             </div>

//             <form onSubmit={handleRecordPayment}>
//               {selectedInvoice.paymentType === "EMI" && (
//                 <div className="billing-form-group">
//                   <label>Payment Type *</label>

//                   <select
//                     name="paymentType"
//                     value={paymentForm.paymentType}
//                     onChange={(event) =>
//                       handlePaymentTypeChange(event.target.value)
//                     }
//                   >
//                     <option value="Down Payment">Down Payment</option>

//                     <option value="EMI Installment">EMI Installment</option>
//                   </select>
//                 </div>
//               )}

//               {paymentForm.paymentType === "EMI Installment" && (
//                 <div className="billing-form-group">
//                   <label>Installment Number</label>

//                   <input
//                     type="number"
//                     value={paymentForm.installmentNumber}
//                     readOnly
//                   />
//                 </div>
//               )}

//               <div className="billing-form-grid">
//                 <div className="billing-form-group">
//                   <label>Payment Amount (₹) *</label>

//                   <input
//                     type="number"
//                     name="amount"
//                     min="0.01"
//                     max={selectedInvoice.balanceDue}
//                     step="0.01"
//                     value={paymentForm.amount}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Method *</label>

//                   <select
//                     name="paymentMethod"
//                     value={paymentForm.paymentMethod}
//                     onChange={handlePaymentChange}
//                     required
//                   >
//                     <option value="Cash">Cash</option>
//                     <option value="UPI">UPI</option>
//                     <option value="Card">Card</option>
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                   </select>
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Date *</label>

//                   <input
//                     type="date"
//                     name="paymentDate"
//                     max={today()}
//                     value={paymentForm.paymentDate}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Transaction Reference</label>

//                   <input
//                     type="text"
//                     name="transactionReference"
//                     placeholder="UPI ID / transaction number"
//                     value={paymentForm.transactionReference}
//                     onChange={handlePaymentChange}
//                   />
//                 </div>
//               </div>

//               <div className="billing-form-group">
//                 <label>Notes</label>

//                 <textarea
//                   name="notes"
//                   rows="2"
//                   placeholder="Optional payment notes..."
//                   value={paymentForm.notes}
//                   onChange={handlePaymentChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !paymentForm.amount ||
//                     Number(paymentForm.amount) <= 0
//                   }
//                 >
//                   {saving ? "Recording..." : "Record Payment"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Billing;

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { auth, db } from "../firebase";
// import {
//   collection,
//   doc,
//   getDocs,
//   runTransaction,
//   serverTimestamp,
// } from "firebase/firestore";
// import Sidebar from "../components/Sidebar";
// import "../styles/Billing.css";

// const money = (value) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 2,
//   }).format(Number(value) || 0);

// const today = () => {
//   const date = new Date();
//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000)
//     .toISOString()
//     .split("T")[0];
// };

// const nextMonthDate = () => {
//   const date = new Date();
//   const day = date.getDate();
//   date.setDate(1);
//   date.setMonth(date.getMonth() + 1);

//   const lastDay = new Date(
//     date.getFullYear(),
//     date.getMonth() + 1,
//     0,
//   ).getDate();

//   date.setDate(Math.min(day, lastDay));

//   const offset = date.getTimezoneOffset();
//   return new Date(date.getTime() - offset * 60000)
//     .toISOString()
//     .split("T")[0];
// };

// const roundMoney = (value) =>
//   Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// const calculateInterest = (principal, rate, months) =>
//   roundMoney(principal * (rate / 100) * (months / 12));

// const calculateEMI = (principal, rate, months) => {
//   if (!months) return 0;

//   const interest = calculateInterest(principal, rate, months);
//   return roundMoney((principal + interest) / months);
// };

// const getStatus = (totalPaid, totalPayable, schedule = []) => {
//   if (totalPaid >= totalPayable - 0.01) return "Paid";

//   const hasOverdue = schedule.some(
//     (item) =>
//       item.status !== "Paid" &&
//       item.dueDate < today() &&
//       Number(item.installmentAmount) - Number(item.paidAmount || 0) > 0.01,
//   );

//   if (hasOverdue) return "Overdue";
//   if (totalPaid > 0) return "Partial";
//   return "Pending";
// };

// const statusClass = (status) =>
//   `billing-status billing-status-${String(status || "Pending")
//     .toLowerCase()
//     .replace(/\s+/g, "-")}`;

// const addMonths = (dateString, months) => {
//   const date = new Date(`${dateString}T12:00:00`);
//   const originalDay = date.getDate();

//   date.setDate(1);
//   date.setMonth(date.getMonth() + months);

//   const lastDay = new Date(
//     date.getFullYear(),
//     date.getMonth() + 1,
//     0,
//   ).getDate();

//   date.setDate(Math.min(originalDay, lastDay));

//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// function Billing() {
//   const [invoices, setInvoices] = useState([]);
//   const [availableBikes, setAvailableBikes] = useState([]);
//   const [payments, setPayments] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [activeTab, setActiveTab] = useState("invoices");
//   const [showInvoiceForm, setShowInvoiceForm] = useState(false);
//   const [showPaymentForm, setShowPaymentForm] = useState(false);

//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");

//   const [invoiceForm, setInvoiceForm] = useState({
//     bikeId: "",
//     paymentType: "Full Payment",
//     downPayment: "",
//     tenureMonths: "12",
//     annualInterestRate: "2",
//     processingFeePercentage: "3",
//     documentationFee: "3000",
//     otherChargesAmount: "0",
//     otherChargesDescription: "",
//     firstDueDate: nextMonthDate(),
//     notes: "",
//   });

//   const [paymentForm, setPaymentForm] = useState({
//     paymentType: "Full Payment",
//     amount: "",
//     paymentMethod: "UPI",
//     installmentNumber: "",
//     transactionReference: "",
//     paymentDate: today(),
//     notes: "",
//   });

//   const currentUser = auth.currentUser;

//   // --------------------------------------------------
//   // FETCH FIRESTORE DATA
//   // --------------------------------------------------

//   const fetchBillingData = useCallback(async () => {
//     if (!auth.currentUser) {
//       setError("Please sign in to access billing.");
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       const [invoiceSnapshot, bikeSnapshot, paymentSnapshot] =
//         await Promise.all([
//           getDocs(collection(db, "invoices")),
//           getDocs(collection(db, "bikes")),
//           getDocs(collection(db, "payments")),
//         ]);

//       const invoiceData = invoiceSnapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       const bikeData = bikeSnapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       const paymentData = paymentSnapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       invoiceData.sort(
//         (a, b) =>
//           String(b.createdAt?.toDate?.() || b.invoiceDate || "").localeCompare(
//             String(a.createdAt?.toDate?.() || a.invoiceDate || ""),
//           ),
//       );

//       paymentData.sort((a, b) =>
//         String(b.paymentDate || "").localeCompare(String(a.paymentDate || "")),
//       );

//       // A bike can have only one invoice.
//       const invoiceBikeIds = new Set(
//         invoiceData.map((invoice) => invoice.bikeId),
//       );

//       const available = bikeData.filter(
//         (bike) =>
//           bike.isActive !== false &&
//           !bike.invoiceId &&
//           !invoiceBikeIds.has(bike.id),
//       );

//       setInvoices(invoiceData);
//       setAvailableBikes(available);
//       setPayments(paymentData);
//     } catch (err) {
//       console.error("Firestore billing error:", err);
//       setError(
//         err.message || "Unable to load billing information from Firestore.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBillingData();
//   }, [fetchBillingData]);

//   // --------------------------------------------------
//   // SELECTED BIKE AND LIVE EMI CALCULATIONS
//   // --------------------------------------------------

//   const selectedBike = useMemo(
//     () => availableBikes.find((bike) => bike.id === invoiceForm.bikeId),
//     [availableBikes, invoiceForm.bikeId],
//   );

//   const bikePrice = Number(selectedBike?.bikePrice || 0);
//   const downPayment = Number(invoiceForm.downPayment || 0);

//   const financedBalance = Math.max(0, bikePrice - downPayment);

//   const processingFeeAmount = roundMoney(
//     financedBalance *
//       (Number(invoiceForm.processingFeePercentage || 0) / 100),
//   );

//   const documentationFee = Number(invoiceForm.documentationFee || 0);
//   const otherChargesAmount = Number(invoiceForm.otherChargesAmount || 0);

//   const totalFees = roundMoney(
//     processingFeeAmount + documentationFee + otherChargesAmount,
//   );

//   const principal = roundMoney(financedBalance + totalFees);

//   const estimatedInterest = calculateInterest(
//     principal,
//     Number(invoiceForm.annualInterestRate || 0),
//     Number(invoiceForm.tenureMonths || 0),
//   );

//   const monthlyEMI = calculateEMI(
//     principal,
//     Number(invoiceForm.annualInterestRate || 0),
//     Number(invoiceForm.tenureMonths || 0),
//   );

//   const estimatedTotalPayable = roundMoney(
//     downPayment + principal + estimatedInterest,
//   );

//   // --------------------------------------------------
//   // DASHBOARD STATISTICS
//   // --------------------------------------------------

//   const overdueInstallments = invoices.reduce(
//     (total, invoice) =>
//       total +
//       (invoice.emiSchedule || []).filter(
//         (item) =>
//           item.status !== "Paid" &&
//           item.dueDate < today() &&
//           Number(item.installmentAmount) - Number(item.paidAmount || 0) > 0.01,
//       ).length,
//     0,
//   );

//   const stats = useMemo(
//     () => ({
//       totalInvoices: invoices.length,
//       collected: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.totalPaid || 0),
//         0,
//       ),
//       outstanding: invoices.reduce(
//         (sum, invoice) => sum + Number(invoice.balanceDue || 0),
//         0,
//       ),
//       paid: invoices.filter((invoice) => invoice.paymentStatus === "Paid")
//         .length,
//     }),
//     [invoices],
//   );

//   const filteredInvoices = useMemo(() => {
//     return invoices.filter((invoice) => {
//       const searchText = [
//         invoice.customerName,
//         invoice.invoiceNumber,
//         invoice.brand,
//         invoice.model,
//         invoice.registrationNumber,
//       ]
//         .join(" ")
//         .toLowerCase();

//       const matchesSearch = searchText.includes(search.toLowerCase());

//       const matchesStatus =
//         statusFilter === "All" ||
//         invoice.paymentStatus === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [invoices, search, statusFilter]);

//   // --------------------------------------------------
//   // FORM HELPERS
//   // --------------------------------------------------

//   const resetInvoiceForm = () => {
//     setInvoiceForm({
//       bikeId: "",
//       paymentType: "Full Payment",
//       downPayment: "",
//       tenureMonths: "12",
//       annualInterestRate: "2",
//       processingFeePercentage: "3",
//       documentationFee: "3000",
//       otherChargesAmount: "0",
//       otherChargesDescription: "",
//       firstDueDate: nextMonthDate(),
//       notes: "",
//     });
//   };

//   const closeForms = () => {
//     setShowInvoiceForm(false);
//     setShowPaymentForm(false);
//     setSelectedInvoice(null);
//     setError("");
//   };

//   const handleInvoiceChange = (event) => {
//     const { name, value } = event.target;

//     setInvoiceForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   // --------------------------------------------------
//   // CREATE EMI SCHEDULE
//   // --------------------------------------------------

//   const createEMISchedule = (
//     amount,
//     interest,
//     months,
//     firstDueDate,
//   ) => {
//     const total = roundMoney(amount + interest);
//     const regularInstallment = roundMoney(total / months);

//     let allocated = 0;

//     return Array.from({ length: months }, (_, index) => {
//       const installmentAmount =
//         index === months - 1
//           ? roundMoney(total - allocated)
//           : regularInstallment;

//       allocated = roundMoney(allocated + installmentAmount);

//       return {
//         installmentNumber: index + 1,
//         dueDate: addMonths(firstDueDate, index),
//         principalAmount: roundMoney(amount / months),
//         interestAmount: roundMoney(interest / months),
//         installmentAmount,
//         paidAmount: 0,
//         status: "Pending",
//       };
//     });
//   };

//   // --------------------------------------------------
//   // CREATE INVOICE
//   // --------------------------------------------------

//   const handleCreateInvoice = async (event) => {
//     event.preventDefault();

//     if (!auth.currentUser) {
//       setError("Your session has expired. Please sign in again.");
//       return;
//     }

//     if (!selectedBike) {
//       setError("Please select a registered bike.");
//       return;
//     }

//     if (!selectedBike.customerId || !selectedBike.customerName) {
//       setError("Customer information is missing from this bike record.");
//       return;
//     }

//     if (!Number.isFinite(bikePrice) || bikePrice <= 0) {
//       setError("The registered bike must have a valid purchase price.");
//       return;
//     }

//     let invoiceData;

//     if (invoiceForm.paymentType === "EMI") {
//       if (
//         !Number.isFinite(downPayment) ||
//         downPayment < 0 ||
//         downPayment >= bikePrice
//       ) {
//         setError("Down payment must be less than the bike price.");
//         return;
//       }

//       const rate = Number(invoiceForm.annualInterestRate);
//       const tenure = Number(invoiceForm.tenureMonths);
//       const processing = Number(invoiceForm.processingFeePercentage);

//       if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
//         setError("Enter a valid annual interest rate.");
//         return;
//       }

//       if (!Number.isFinite(processing) || processing < 0 || processing > 100) {
//         setError("Enter a valid processing fee percentage.");
//         return;
//       }

//       if (
//         !Number.isFinite(documentationFee) ||
//         documentationFee < 0 ||
//         !Number.isFinite(otherChargesAmount) ||
//         otherChargesAmount < 0
//       ) {
//         setError("Charges must be valid non-negative amounts.");
//         return;
//       }

//       if (!Number.isInteger(tenure) || tenure < 1 || tenure > 60) {
//         setError("Tenure must be between 1 and 60 months.");
//         return;
//       }

//       if (!invoiceForm.firstDueDate) {
//         setError("Please select the first EMI due date.");
//         return;
//       }

//       if (invoiceForm.firstDueDate < today()) {
//         setError("The first EMI due date cannot be in the past.");
//         return;
//       }

//       const interest = calculateInterest(principal, rate, tenure);

//       invoiceData = {
//         paymentType: "EMI",
//         downPayment,
//         tenureMonths: tenure,
//         annualInterestRate: rate,
//         processingFeePercentage: processing,
//         processingFeeAmount,
//         documentationFee,
//         otherChargesAmount,
//         otherChargesDescription:
//           invoiceForm.otherChargesDescription.trim(),
//         totalFees,
//         financedBalance,
//         principal,
//         totalInterest: interest,
//         monthlyEMI: calculateEMI(principal, rate, tenure),
//         emiSchedule: createEMISchedule(
//           principal,
//           interest,
//           tenure,
//           invoiceForm.firstDueDate,
//         ),
//         totalPayable: roundMoney(downPayment + principal + interest),
//         firstDueDate: invoiceForm.firstDueDate,
//       };
//     } else {
//       invoiceData = {
//         paymentType: "Full Payment",
//         downPayment: 0,
//         tenureMonths: 0,
//         annualInterestRate: 0,
//         processingFeePercentage: 0,
//         processingFeeAmount: 0,
//         documentationFee: 0,
//         otherChargesAmount: 0,
//         totalFees: 0,
//         financedBalance: 0,
//         principal: bikePrice,
//         totalInterest: 0,
//         monthlyEMI: 0,
//         emiSchedule: [],
//         totalPayable: bikePrice,
//       };
//     }

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       const bikeRef = doc(db, "bikes", selectedBike.id);
//       const invoiceRef = doc(collection(db, "invoices"));

//       await runTransaction(db, async (transaction) => {
//         const bikeSnapshot = await transaction.get(bikeRef);

//         if (!bikeSnapshot.exists()) {
//           throw new Error("Registered bike no longer exists.");
//         }

//         const currentBike = bikeSnapshot.data();

//         if (currentBike.invoiceId) {
//           throw new Error("An invoice already exists for this bike.");
//         }

//         const invoiceNumber = `BL-${today().replaceAll("-", "")}-${invoiceRef.id
//           .slice(0, 6)
//           .toUpperCase()}`;

//         const finalInvoice = {
//           ...invoiceData,

//           invoiceNumber,
//           bikeId: selectedBike.id,
//           customerId: currentBike.customerId,
//           customerName: currentBike.customerName,
//           customerPhone: currentBike.customerPhone || "",

//           brand: currentBike.brand || "",
//           model: currentBike.model || "",
//           colour: currentBike.colour || "",
//           registrationNumber: currentBike.registrationNumber || "",
//           chassisNumber: currentBike.chassisNumber || "",
//           engineNumber: currentBike.engineNumber || "",
//           bikePrice: Number(currentBike.bikePrice),

//           invoiceDate: today(),
//           notes: invoiceForm.notes.trim(),

//           totalPaid: 0,
//           balanceDue: invoiceData.totalPayable,
//           paymentStatus: "Pending",

//           createdBy: auth.currentUser.uid,
//           createdAt: serverTimestamp(),
//         };

//         transaction.set(invoiceRef, finalInvoice);

//         transaction.update(bikeRef, {
//           invoiceId: invoiceRef.id,
//           invoiceNumber,
//           updatedAt: serverTimestamp(),
//         });
//       });

//       setSuccess("Invoice created successfully.");

//       setShowInvoiceForm(false);
//       resetInvoiceForm();

//       await fetchBillingData();
//     } catch (err) {
//       console.error("Invoice creation error:", err);
//       setError(err.message || "Unable to create invoice.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // --------------------------------------------------
//   // PAYMENT HELPERS
//   // --------------------------------------------------

//   const getInvoicePayments = (invoiceId) =>
//     payments.filter((payment) => payment.invoiceId === invoiceId);

//   const getDownPaymentPaid = (invoice) =>
//     getInvoicePayments(invoice.id)
//       .filter((payment) => payment.paymentType === "Down Payment")
//       .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

//   const getNextInstallment = (invoice) =>
//     (invoice.emiSchedule || []).find(
//       (item) => Number(item.installmentAmount) - Number(item.paidAmount || 0) > 0.01,
//     );

//   const openPaymentForm = (invoice, installment = null) => {
//     setSelectedInvoice(invoice);
//     setError("");
//     setSuccess("");

//     let paymentType = "Full Payment";
//     let amount = Number(invoice.balanceDue || 0);
//     let installmentNumber = "";

//     if (invoice.paymentType === "EMI") {
//       const downPaymentRemaining = Math.max(
//         0,
//         Number(invoice.downPayment || 0) - getDownPaymentPaid(invoice),
//       );

//       if (downPaymentRemaining > 0.01 && !installment) {
//         paymentType = "Down Payment";
//         amount = downPaymentRemaining;
//       } else {
//         const nextInstallment = installment || getNextInstallment(invoice);

//         paymentType = "EMI Installment";
//         amount = nextInstallment
//           ? Number(nextInstallment.installmentAmount) -
//             Number(nextInstallment.paidAmount || 0)
//           : 0;

//         installmentNumber = String(
//           nextInstallment?.installmentNumber || "",
//         );
//       }
//     }

//     setPaymentForm({
//       paymentType,
//       amount: amount > 0 ? roundMoney(amount).toFixed(2) : "",
//       paymentMethod: "UPI",
//       installmentNumber,
//       transactionReference: "",
//       paymentDate: today(),
//       notes: "",
//     });

//     setShowPaymentForm(true);
//   };

//   const handlePaymentTypeChange = (value) => {
//     if (!selectedInvoice) return;

//     let amount = 0;
//     let installmentNumber = "";

//     if (value === "Full Payment") {
//       amount = Number(selectedInvoice.balanceDue || 0);
//     } else if (value === "Down Payment") {
//       amount = Math.max(
//         0,
//         Number(selectedInvoice.downPayment || 0) -
//           getDownPaymentPaid(selectedInvoice),
//       );
//     } else if (value === "EMI Installment") {
//       const installment = getNextInstallment(selectedInvoice);

//       installmentNumber = String(
//         installment?.installmentNumber || "",
//       );

//       amount = installment
//         ? Number(installment.installmentAmount) -
//           Number(installment.paidAmount || 0)
//         : 0;
//     }

//     setPaymentForm((previous) => ({
//       ...previous,
//       paymentType: value,
//       amount: amount > 0 ? roundMoney(amount).toFixed(2) : "",
//       installmentNumber,
//     }));
//   };

//   const handlePaymentChange = (event) => {
//     const { name, value } = event.target;

//     setPaymentForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   // --------------------------------------------------
//   // RECORD PAYMENT
//   // --------------------------------------------------

//   const handleRecordPayment = async (event) => {
//     event.preventDefault();

//     if (!selectedInvoice || !auth.currentUser) {
//       setError("Please sign in and select an invoice.");
//       return;
//     }

//     const amount = Number(paymentForm.amount);

//     if (!Number.isFinite(amount) || amount <= 0) {
//       setError("Enter a valid payment amount.");
//       return;
//     }

//     if (!paymentForm.paymentDate || paymentForm.paymentDate > today()) {
//       setError("Enter a valid payment date.");
//       return;
//     }

//     if (amount > Number(selectedInvoice.balanceDue) + 0.01) {
//       setError("Payment cannot exceed the outstanding balance.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       const invoiceRef = doc(db, "invoices", selectedInvoice.id);
//       const paymentRef = doc(collection(db, "payments"));

//       await runTransaction(db, async (transaction) => {
//         const invoiceSnapshot = await transaction.get(invoiceRef);

//         if (!invoiceSnapshot.exists()) {
//           throw new Error("Invoice not found.");
//         }

//         const invoice = invoiceSnapshot.data();
//         const balance = Number(invoice.balanceDue || 0);

//         if (amount > balance + 0.01) {
//           throw new Error("Payment exceeds the current balance.");
//         }

//         let schedule = [...(invoice.emiSchedule || [])];
//         let updatedDownPaymentPaid = getDownPaymentPaid(selectedInvoice);

//         if (paymentForm.paymentType === "Down Payment") {
//           const remainingDownPayment =
//             Number(invoice.downPayment || 0) - updatedDownPaymentPaid;

//           if (amount > remainingDownPayment + 0.01) {
//             throw new Error("Payment exceeds the remaining down payment.");
//           }

//           updatedDownPaymentPaid = roundMoney(
//             updatedDownPaymentPaid + amount,
//           );
//         } else if (paymentForm.paymentType === "EMI Installment") {
//           const installmentIndex = schedule.findIndex(
//             (item) =>
//               Number(item.installmentNumber) ===
//               Number(paymentForm.installmentNumber),
//           );

//           if (installmentIndex === -1) {
//             throw new Error("EMI installment not found.");
//           }

//           const installment = { ...schedule[installmentIndex] };

//           const remaining =
//             Number(installment.installmentAmount) -
//             Number(installment.paidAmount || 0);

//           if (amount > remaining + 0.01) {
//             throw new Error("Payment exceeds the installment balance.");
//           }

//           installment.paidAmount = roundMoney(
//             Number(installment.paidAmount || 0) + amount,
//           );

//           installment.status =
//             installment.paidAmount >= installment.installmentAmount - 0.01
//               ? "Paid"
//               : "Partial";

//           schedule[installmentIndex] = installment;
//         }

//         const totalPaid = roundMoney(
//           Number(invoice.totalPaid || 0) + amount,
//         );

//         const balanceDue = Math.max(
//           0,
//           roundMoney(Number(invoice.totalPayable) - totalPaid),
//         );

//         const paymentStatus = getStatus(
//           totalPaid,
//           Number(invoice.totalPayable),
//           schedule,
//         );

//         transaction.set(paymentRef, {
//           invoiceId: selectedInvoice.id,
//           invoiceNumber: invoice.invoiceNumber,
//           customerId: invoice.customerId,
//           customerName: invoice.customerName,
//           customerPhone: invoice.customerPhone || "",

//           bikeId: invoice.bikeId,
//           brand: invoice.brand,
//           model: invoice.model,
//           registrationNumber: invoice.registrationNumber || "",

//           amount,
//           paymentType: paymentForm.paymentType,
//           paymentMethod: paymentForm.paymentMethod,
//           installmentNumber:
//             paymentForm.paymentType === "EMI Installment"
//               ? Number(paymentForm.installmentNumber)
//               : null,

//           transactionReference: paymentForm.transactionReference.trim(),
//           paymentDate: paymentForm.paymentDate,
//           notes: paymentForm.notes.trim(),

//           createdBy: auth.currentUser.uid,
//           createdAt: serverTimestamp(),
//         });

//         transaction.update(invoiceRef, {
//           totalPaid,
//           balanceDue,
//           paymentStatus,
//           emiSchedule: schedule,
//           updatedAt: serverTimestamp(),
//         });
//       });

//       setSuccess("Payment recorded successfully.");

//       setShowPaymentForm(false);
//       setSelectedInvoice(null);

//       await fetchBillingData();
//     } catch (err) {
//       console.error("Payment recording error:", err);
//       setError(err.message || "Unable to record payment.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // --------------------------------------------------
//   // PRINT INVOICE
//   // --------------------------------------------------

//   const printInvoice = (invoice) => {
//     const printWindow = window.open("", "_blank", "width=850,height=700");

//     if (!printWindow) {
//       setError("Please allow pop-ups to print the invoice.");
//       return;
//     }

//     const rows = [
//       ["Invoice Number", invoice.invoiceNumber],
//       ["Invoice Date", invoice.invoiceDate],
//       ["Customer", invoice.customerName],
//       ["Phone", invoice.customerPhone || "—"],
//       ["Bike", `${invoice.brand || ""} ${invoice.model || ""}`],
//       ["Registration Number", invoice.registrationNumber || "—"],
//       ["Bike Price", money(invoice.bikePrice)],
//       ["Payment Type", invoice.paymentType],
//       ["Down Payment", money(invoice.downPayment)],
//       ["Total Fees", money(invoice.totalFees)],
//       ["Total Interest", money(invoice.totalInterest)],
//       ["Total Payable", money(invoice.totalPayable)],
//       ["Amount Paid", money(invoice.totalPaid)],
//       ["Balance Due", money(invoice.balanceDue)],
//       ["Payment Status", invoice.paymentStatus],
//     ];

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>${invoice.invoiceNumber}</title>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 35px; color: #172b45; }
//             h1 { margin-bottom: 5px; }
//             p { color: #64748b; }
//             table { width: 100%; border-collapse: collapse; margin-top: 25px; }
//             td { padding: 12px; border: 1px solid #dbe3ed; }
//             td:first-child { font-weight: bold; width: 40%; background: #f5f7fb; }
//             .footer { margin-top: 35px; text-align: center; }
//             @media print { button { display: none; } }
//           </style>
//         </head>
//         <body>
//           <h1>BikeLedger</h1>
//           <p>Two-Wheeler Billing Management System</p>
//           <h2>Customer Invoice</h2>
//           <table>
//             ${rows
//               .map(
//                 ([label, value]) =>
//                   `<tr><td>${String(label)}</td><td>${String(value ?? "—")}</td></tr>`,
//               )
//               .join("")}
//           </table>
//           <div class="footer">
//             <p>Thank you for your business.</p>
//             <button onclick="window.print()">Print Invoice</button>
//           </div>
//         </body>
//       </html>
//     `);

//     printWindow.document.close();
//     printWindow.focus();
//   };

//   // --------------------------------------------------
//   // RENDER
//   // --------------------------------------------------

//   return (
//     <div className="billing-layout">
//       <Sidebar />

//       <main className="billing-main">
//         <div className="billing-header">
//           <div>
//             <p className="billing-eyebrow">FINANCE MANAGEMENT</p>
//             <h1>Billing & EMI</h1>
//             <p className="billing-subtitle">
//               Manage invoices, showroom charges, installments and overdue
//               payments.
//             </p>
//           </div>

//           <button
//             type="button"
//             className="billing-primary-btn"
//             onClick={() => {
//               setError("");
//               setSuccess("");
//               resetInvoiceForm();
//               setShowInvoiceForm(true);
//             }}
//             disabled={availableBikes.length === 0 || loading}
//           >
//             + Create Invoice
//           </button>
//         </div>

//         {error && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-error">{error}</div>
//         )}

//         {success && !showInvoiceForm && !showPaymentForm && (
//           <div className="billing-alert billing-alert-success">{success}</div>
//         )}

//         <section className="billing-stats">
//           <div className="billing-stat-card">
//             <div className="billing-stat-icon invoice-icon">▤</div>
//             <div>
//               <p>Total Invoices</p>
//               <h2>{stats.totalInvoices}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon revenue-icon">₹</div>
//             <div>
//               <p>Amount Collected</p>
//               <h2>{money(stats.collected)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon due-icon">◷</div>
//             <div>
//               <p>Outstanding Balance</p>
//               <h2>{money(stats.outstanding)}</h2>
//             </div>
//           </div>

//           <div className="billing-stat-card">
//             <div className="billing-stat-icon overdue-icon">!</div>
//             <div>
//               <p>Overdue Installments</p>
//               <h2>{overdueInstallments}</h2>
//             </div>
//           </div>
//         </section>

//         <div className="billing-tabs">
//           <button
//             className={activeTab === "invoices" ? "active" : ""}
//             onClick={() => setActiveTab("invoices")}
//           >
//             Invoices
//           </button>

//           <button
//             className={activeTab === "payments" ? "active" : ""}
//             onClick={() => setActiveTab("payments")}
//           >
//             Payment History
//           </button>
//         </div>

//         {/* INVOICES */}

//         {activeTab === "invoices" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Customer Invoices</h2>
//                 <p>View invoices and expand EMI schedules.</p>
//               </div>

//               <div className="billing-filters">
//                 <input
//                   type="search"
//                   placeholder="Search customer, bike or invoice..."
//                   value={search}
//                   onChange={(event) => setSearch(event.target.value)}
//                 />

//                 <select
//                   value={statusFilter}
//                   onChange={(event) => setStatusFilter(event.target.value)}
//                 >
//                   <option value="All">All Status</option>
//                   <option value="Pending">Pending</option>
//                   <option value="Partial">Partial</option>
//                   <option value="Paid">Paid</option>
//                   <option value="Overdue">Overdue</option>
//                 </select>
//               </div>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading billing data...</div>
//             ) : filteredInvoices.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">▤</div>
//                 <h3>No invoices found</h3>
//                 <p>
//                   {invoices.length === 0
//                     ? "Create an invoice for a registered bike to get started."
//                     : "Try another search or status filter."}
//                 </p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Invoice</th>
//                       <th>Customer</th>
//                       <th>Bike</th>
//                       <th>Type</th>
//                       <th>Total Payable</th>
//                       <th>Paid</th>
//                       <th>Balance</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredInvoices.map((invoice) => (
//                       <React.Fragment key={invoice.id}>
//                         <tr>
//                           <td>
//                             <strong>{invoice.invoiceNumber}</strong>
//                             <small>{invoice.invoiceDate}</small>
//                           </td>

//                           <td>
//                             <strong>{invoice.customerName || "—"}</strong>
//                             <small>{invoice.customerPhone || ""}</small>
//                           </td>

//                           <td>
//                             <strong>
//                               {invoice.brand} {invoice.model}
//                             </strong>
//                             <small>{invoice.registrationNumber || ""}</small>
//                           </td>

//                           <td>
//                             <span className="billing-type-chip">
//                               {invoice.paymentType}
//                             </span>
//                           </td>

//                           <td>{money(invoice.totalPayable)}</td>

//                           <td className="billing-paid-amount">
//                             {money(invoice.totalPaid)}
//                           </td>

//                           <td className="billing-due-amount">
//                             {money(invoice.balanceDue)}
//                           </td>

//                           <td>
//                             <span className={statusClass(invoice.paymentStatus)}>
//                               {invoice.paymentStatus}
//                             </span>
//                           </td>

//                           <td>
//                             <div className="billing-row-actions">
//                               {invoice.paymentType === "EMI" && (
//                                 <button
//                                   className="billing-view-btn"
//                                   onClick={() =>
//                                     setExpandedInvoiceId(
//                                       expandedInvoiceId === invoice.id
//                                         ? null
//                                         : invoice.id,
//                                     )
//                                   }
//                                 >
//                                   {expandedInvoiceId === invoice.id
//                                     ? "Hide Schedule"
//                                     : "View EMI"}
//                                 </button>
//                               )}

//                               <button
//                                 className="billing-action-btn"
//                                 onClick={() => openPaymentForm(invoice)}
//                                 disabled={
//                                   invoice.paymentStatus === "Paid" ||
//                                   Number(invoice.balanceDue) <= 0
//                                 }
//                               >
//                                 Record Payment
//                               </button>

//                               <button
//                                 className="billing-view-btn"
//                                 onClick={() => printInvoice(invoice)}
//                               >
//                                 Print Invoice
//                               </button>
//                             </div>
//                           </td>
//                         </tr>

//                         {expandedInvoiceId === invoice.id && (
//                           <tr>
//                             <td colSpan="9">
//                               <div className="billing-schedule">
//                                 <div className="billing-schedule-header">
//                                   <div>
//                                     <h3>EMI Installment Schedule</h3>
//                                     <p>
//                                       {invoice.tenureMonths} installments ·{" "}
//                                       {invoice.annualInterestRate}% annual
//                                       interest
//                                     </p>
//                                   </div>

//                                   <strong>
//                                     Monthly EMI: {money(invoice.monthlyEMI)}
//                                   </strong>
//                                 </div>

//                                 <div className="billing-fee-summary">
//                                   <div>
//                                     <span>Down Payment</span>
//                                     <strong>{money(invoice.downPayment)}</strong>
//                                   </div>

//                                   <div>
//                                     <span>Processing Fee</span>
//                                     <strong>
//                                       {money(invoice.processingFeeAmount)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Documentation Fee</span>
//                                     <strong>
//                                       {money(invoice.documentationFee)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Other Charges</span>
//                                     <strong>
//                                       {money(invoice.otherChargesAmount)}
//                                     </strong>
//                                   </div>

//                                   <div>
//                                     <span>Total Fees</span>
//                                     <strong>{money(invoice.totalFees)}</strong>
//                                   </div>
//                                 </div>

//                                 {invoice.otherChargesDescription && (
//                                   <p className="billing-other-charge-note">
//                                     Other charges:{" "}
//                                     {invoice.otherChargesDescription}
//                                   </p>
//                                 )}

//                                 <div className="billing-table-wrapper">
//                                   <table className="billing-installment-table">
//                                     <thead>
//                                       <tr>
//                                         <th>Installment</th>
//                                         <th>Due Date</th>
//                                         <th>Principal</th>
//                                         <th>Interest</th>
//                                         <th>Amount Due</th>
//                                         <th>Paid</th>
//                                         <th>Remaining</th>
//                                         <th>Status</th>
//                                         <th>Action</th>
//                                       </tr>
//                                     </thead>

//                                     <tbody>
//                                       {(invoice.emiSchedule || []).map(
//                                         (item) => {
//                                           const remaining = Math.max(
//                                             0,
//                                             Number(item.installmentAmount) -
//                                               Number(item.paidAmount || 0),
//                                           );

//                                           const displayStatus =
//                                             item.status !== "Paid" &&
//                                             item.dueDate < today() &&
//                                             remaining > 0.01
//                                               ? "Overdue"
//                                               : item.status;

//                                           return (
//                                             <tr key={item.installmentNumber}>
//                                               <td>
//                                                 #{item.installmentNumber}
//                                               </td>
//                                               <td>{item.dueDate}</td>
//                                               <td>
//                                                 {money(item.principalAmount)}
//                                               </td>
//                                               <td>
//                                                 {money(item.interestAmount)}
//                                               </td>
//                                               <td>
//                                                 {money(item.installmentAmount)}
//                                               </td>
//                                               <td className="billing-paid-amount">
//                                                 {money(item.paidAmount)}
//                                               </td>
//                                               <td className="billing-due-amount">
//                                                 {money(remaining)}
//                                               </td>
//                                               <td>
//                                                 <span
//                                                   className={statusClass(
//                                                     displayStatus,
//                                                   )}
//                                                 >
//                                                   {displayStatus}
//                                                 </span>
//                                               </td>
//                                               <td>
//                                                 {remaining > 0.01 && (
//                                                   <button
//                                                     className="billing-action-btn"
//                                                     onClick={() =>
//                                                       openPaymentForm(
//                                                         invoice,
//                                                         item,
//                                                       )
//                                                     }
//                                                   >
//                                                     Pay
//                                                   </button>
//                                                 )}
//                                               </td>
//                                             </tr>
//                                           );
//                                         },
//                                       )}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </React.Fragment>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}

//         {/* PAYMENT HISTORY */}

//         {activeTab === "payments" && (
//           <section className="billing-content">
//             <div className="billing-toolbar">
//               <div>
//                 <h2>Payment History</h2>
//                 <p>All recorded customer transactions.</p>
//               </div>

//               <span className="billing-record-count">
//                 {payments.length} transactions
//               </span>
//             </div>

//             {loading ? (
//               <div className="billing-empty">Loading payment history...</div>
//             ) : payments.length === 0 ? (
//               <div className="billing-empty">
//                 <div className="billing-empty-icon">₹</div>
//                 <h3>No payments recorded</h3>
//                 <p>Transactions will appear here after collection.</p>
//               </div>
//             ) : (
//               <div className="billing-table-wrapper">
//                 <table className="billing-table">
//                   <thead>
//                     <tr>
//                       <th>Date</th>
//                       <th>Customer</th>
//                       <th>Invoice</th>
//                       <th>Payment Type</th>
//                       <th>Method</th>
//                       <th>Reference</th>
//                       <th>Amount</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {payments.map((payment) => (
//                       <tr key={payment.id}>
//                         <td>{payment.paymentDate}</td>
//                         <td>
//                           <strong>{payment.customerName || "—"}</strong>
//                           <small>{payment.customerPhone || ""}</small>
//                         </td>
//                         <td>{payment.invoiceNumber || "—"}</td>
//                         <td>{payment.paymentType}</td>
//                         <td>{payment.paymentMethod}</td>
//                         <td>{payment.transactionReference || "—"}</td>
//                         <td className="billing-paid-amount">
//                           {money(payment.amount)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         )}
//       </main>

//       {/* CREATE INVOICE MODAL */}

//       {showInvoiceForm && (
//         <div
//           className="billing-modal-overlay"
//           onClick={closeForms}
//         >
//           <div
//             className="billing-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">NEW TRANSACTION</p>
//                 <h2>Create Invoice</h2>
//               </div>

//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">
//                 {error}
//               </div>
//             )}

//             <form onSubmit={handleCreateInvoice}>
//               <div className="billing-form-group">
//                 <label>Select Registered Bike *</label>

//                 <select
//                   name="bikeId"
//                   value={invoiceForm.bikeId}
//                   onChange={handleInvoiceChange}
//                   required
//                 >
//                   <option value="">Choose a registered bike</option>

//                   {availableBikes.map((bike) => (
//                     <option key={bike.id} value={bike.id}>
//                       {bike.brand} {bike.model} —{" "}
//                       {bike.customerName || "Customer"} —{" "}
//                       {bike.registrationNumber || "No registration"}
//                     </option>
//                   ))}
//                 </select>

//                 {availableBikes.length === 0 && (
//                   <small>
//                     No uninvoiced registered bikes are available. Register a
//                     bike first.
//                   </small>
//                 )}
//               </div>

//               {selectedBike && (
//                 <div className="billing-selected-bike">
//                   <div>
//                     <span>Customer</span>
//                     <strong>{selectedBike.customerName || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Phone</span>
//                     <strong>{selectedBike.customerPhone || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Registration</span>
//                     <strong>{selectedBike.registrationNumber || "—"}</strong>
//                   </div>

//                   <div>
//                     <span>Bike Price</span>
//                     <strong>{money(bikePrice)}</strong>
//                   </div>
//                 </div>
//               )}

//               <div className="billing-form-group">
//                 <label>Payment Type *</label>

//                 <div className="billing-payment-options">
//                   <label
//                     className={
//                       invoiceForm.paymentType === "Full Payment"
//                         ? "selected"
//                         : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="Full Payment"
//                       checked={invoiceForm.paymentType === "Full Payment"}
//                       onChange={handleInvoiceChange}
//                     />
//                     <span>
//                       <strong>Full Payment</strong>
//                       <small>Pay the complete bike price at once.</small>
//                     </span>
//                   </label>

//                   <label
//                     className={
//                       invoiceForm.paymentType === "EMI" ? "selected" : ""
//                     }
//                   >
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="EMI"
//                       checked={invoiceForm.paymentType === "EMI"}
//                       onChange={handleInvoiceChange}
//                     />
//                     <span>
//                       <strong>EMI Payment</strong>
//                       <small>Configure charges and monthly installments.</small>
//                     </span>
//                   </label>
//                 </div>
//               </div>

//               {invoiceForm.paymentType === "EMI" && (
//                 <>
//                   <h3 className="billing-section-heading">
//                     EMI Configuration
//                   </h3>

//                   <div className="billing-form-grid">
//                     <div className="billing-form-group">
//                       <label>Down Payment (₹) *</label>
//                       <input
//                         type="number"
//                         name="downPayment"
//                         min="0"
//                         max={Math.max(0, bikePrice - 0.01)}
//                         step="0.01"
//                         value={invoiceForm.downPayment}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Tenure (Months) *</label>
//                       <select
//                         name="tenureMonths"
//                         value={invoiceForm.tenureMonths}
//                         onChange={handleInvoiceChange}
//                       >
//                         {[3, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60].map(
//                           (month) => (
//                             <option key={month} value={month}>
//                               {month} Months
//                             </option>
//                           ),
//                         )}
//                       </select>
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Annual Interest Rate (%) *</label>
//                       <input
//                         type="number"
//                         name="annualInterestRate"
//                         min="0"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.annualInterestRate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>First EMI Due Date *</label>
//                       <input
//                         type="date"
//                         name="firstDueDate"
//                         min={today()}
//                         value={invoiceForm.firstDueDate}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Processing Fee (%) *</label>
//                       <input
//                         type="number"
//                         name="processingFeePercentage"
//                         min="0"
//                         max="100"
//                         step="0.01"
//                         value={invoiceForm.processingFeePercentage}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Documentation Fee (₹) *</label>
//                       <input
//                         type="number"
//                         name="documentationFee"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.documentationFee}
//                         onChange={handleInvoiceChange}
//                         required
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges (₹)</label>
//                       <input
//                         type="number"
//                         name="otherChargesAmount"
//                         min="0"
//                         step="0.01"
//                         value={invoiceForm.otherChargesAmount}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>

//                     <div className="billing-form-group">
//                       <label>Other Charges Description</label>
//                       <input
//                         type="text"
//                         name="otherChargesDescription"
//                         maxLength="250"
//                         placeholder="e.g. Insurance or additional service"
//                         value={invoiceForm.otherChargesDescription}
//                         onChange={handleInvoiceChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="billing-emi-preview">
//                     <div className="billing-preview-heading">
//                       <div>
//                         <h3>EMI Calculation Preview</h3>
//                         <p>Estimated customer payment details</p>
//                       </div>
//                       <span className="billing-preview-chip">
//                         Annual Simple Interest
//                       </span>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Bike Price</span>
//                       <strong>{money(bikePrice)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Down Payment</span>
//                       <strong>{money(downPayment)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Financed Balance</span>
//                       <strong>{money(financedBalance)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Processing Fee</span>
//                       <strong>{money(processingFeeAmount)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Documentation Fee</span>
//                       <strong>{money(documentationFee)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Other Charges</span>
//                       <strong>{money(otherChargesAmount)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Total Additional Fees</span>
//                       <strong>{money(totalFees)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Annual Interest Rate</span>
//                       <strong>{invoiceForm.annualInterestRate}%</strong>
//                     </div>

//                     <div className="billing-preview-row billing-preview-highlight">
//                       <span>Monthly Installment</span>
//                       <strong>{money(monthlyEMI)}</strong>
//                     </div>

//                     <div className="billing-preview-row">
//                       <span>Estimated Total Interest</span>
//                       <strong>{money(estimatedInterest)}</strong>
//                     </div>

//                     <div className="billing-preview-row billing-preview-total">
//                       <span>Estimated Total Payable</span>
//                       <strong>{money(estimatedTotalPayable)}</strong>
//                     </div>

//                     <small>
//                       Interest is calculated using annual simple interest.
//                       The final schedule is saved with the invoice.
//                     </small>
//                   </div>
//                 </>
//               )}

//               <div className="billing-form-group">
//                 <label>Notes</label>
//                 <textarea
//                   name="notes"
//                   rows="3"
//                   placeholder="Optional invoice notes..."
//                   value={invoiceForm.notes}
//                   onChange={handleInvoiceChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !invoiceForm.bikeId ||
//                     (invoiceForm.paymentType === "EMI" &&
//                       (invoiceForm.downPayment === "" ||
//                         downPayment < 0 ||
//                         downPayment >= bikePrice ||
//                         !invoiceForm.firstDueDate))
//                   }
//                 >
//                   {saving ? "Creating..." : "Create Invoice"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* RECORD PAYMENT MODAL */}

//       {showPaymentForm && selectedInvoice && (
//         <div className="billing-modal-overlay" onClick={closeForms}>
//           <div
//             className="billing-modal billing-payment-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="billing-modal-header">
//               <div>
//                 <p className="billing-eyebrow">COLLECT PAYMENT</p>
//                 <h2>Record Payment</h2>
//               </div>

//               <button
//                 className="billing-close-btn"
//                 onClick={closeForms}
//                 type="button"
//               >
//                 ×
//               </button>
//             </div>

//             {error && (
//               <div className="billing-alert billing-alert-error">
//                 {error}
//               </div>
//             )}

//             <div className="billing-payment-summary">
//               <div>
//                 <span>Invoice</span>
//                 <strong>{selectedInvoice.invoiceNumber}</strong>
//               </div>
//               <div>
//                 <span>Customer</span>
//                 <strong>{selectedInvoice.customerName || "—"}</strong>
//               </div>
//               <div>
//                 <span>Total Payable</span>
//                 <strong>{money(selectedInvoice.totalPayable)}</strong>
//               </div>
//               <div>
//                 <span>Balance Due</span>
//                 <strong className="billing-due-amount">
//                   {money(selectedInvoice.balanceDue)}
//                 </strong>
//               </div>
//             </div>

//             <form onSubmit={handleRecordPayment}>
//               {selectedInvoice.paymentType === "EMI" && (
//                 <div className="billing-form-group">
//                   <label>Payment Type *</label>
//                   <select
//                     value={paymentForm.paymentType}
//                     onChange={(event) =>
//                       handlePaymentTypeChange(event.target.value)
//                     }
//                   >
//                     <option value="Down Payment">Down Payment</option>
//                     <option value="EMI Installment">EMI Installment</option>
//                   </select>
//                 </div>
//               )}

//               {paymentForm.paymentType === "EMI Installment" && (
//                 <div className="billing-form-group">
//                   <label>Installment Number</label>
//                   <input
//                     type="number"
//                     value={paymentForm.installmentNumber}
//                     readOnly
//                   />
//                 </div>
//               )}

//               <div className="billing-form-grid">
//                 <div className="billing-form-group">
//                   <label>Payment Amount (₹) *</label>
//                   <input
//                     type="number"
//                     name="amount"
//                     min="0.01"
//                     max={selectedInvoice.balanceDue}
//                     step="0.01"
//                     value={paymentForm.amount}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Method *</label>
//                   <select
//                     name="paymentMethod"
//                     value={paymentForm.paymentMethod}
//                     onChange={handlePaymentChange}
//                     required
//                   >
//                     <option value="Cash">Cash</option>
//                     <option value="UPI">UPI</option>
//                     <option value="Card">Card</option>
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                   </select>
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Payment Date *</label>
//                   <input
//                     type="date"
//                     name="paymentDate"
//                     max={today()}
//                     value={paymentForm.paymentDate}
//                     onChange={handlePaymentChange}
//                     required
//                   />
//                 </div>

//                 <div className="billing-form-group">
//                   <label>Transaction Reference</label>
//                   <input
//                     type="text"
//                     name="transactionReference"
//                     placeholder="UPI ID / transaction number"
//                     value={paymentForm.transactionReference}
//                     onChange={handlePaymentChange}
//                   />
//                 </div>
//               </div>

//               <div className="billing-form-group">
//                 <label>Notes</label>
//                 <textarea
//                   name="notes"
//                   rows="2"
//                   placeholder="Optional payment notes..."
//                   value={paymentForm.notes}
//                   onChange={handlePaymentChange}
//                 />
//               </div>

//               <div className="billing-modal-actions">
//                 <button
//                   type="button"
//                   className="billing-secondary-btn"
//                   onClick={closeForms}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="billing-primary-btn"
//                   disabled={
//                     saving ||
//                     !paymentForm.amount ||
//                     Number(paymentForm.amount) <= 0
//                   }
//                 >
//                   {saving ? "Recording..." : "Record Payment"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Billing;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import "../styles/Billing.css";

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
};

const nextMonthDate = () => {
  const date = new Date();
  const day = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + 1);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(Math.min(day, lastDay));

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
};

const addMonths = (dateString, months) => {
  const date = new Date(`${dateString}T12:00:00`);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(Math.min(originalDay, lastDay));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const calculateInterest = (principal, rate, months) =>
  roundMoney(
    Number(principal) *
      (Number(rate) / 100) *
      (Number(months) / 12)
  );

const calculateEMI = (principal, rate, months) => {
  if (!months) return 0;

  const interest = calculateInterest(principal, rate, months);

  return roundMoney(
    (Number(principal) + interest) / Number(months)
  );
};

const getStatus = (totalPaid, totalPayable, schedule = []) => {
  if (totalPaid >= totalPayable - 0.01) return "Paid";

  const hasOverdue = schedule.some(
    (item) =>
      item.status !== "Paid" &&
      item.dueDate < today() &&
      Number(item.installmentAmount) -
        Number(item.paidAmount || 0) >
        0.01
  );

  if (hasOverdue) return "Overdue";
  if (totalPaid > 0) return "Partial";

  return "Pending";
};

const statusClass = (status) =>
  `billing-status billing-status-${String(status || "Pending")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

const createEMISchedule = (
  amount,
  interest,
  months,
  firstDueDate
) => {
  const total = roundMoney(Number(amount) + Number(interest));
  const regularInstallment = roundMoney(total / months);

  let allocated = 0;

  return Array.from({ length: months }, (_, index) => {
    const installmentAmount =
      index === months - 1
        ? roundMoney(total - allocated)
        : regularInstallment;

    allocated = roundMoney(allocated + installmentAmount);

    return {
      installmentNumber: index + 1,
      dueDate: addMonths(firstDueDate, index),
      principalAmount: roundMoney(Number(amount) / months),
      interestAmount: roundMoney(Number(interest) / months),
      installmentAmount,
      paidAmount: 0,
      status: "Pending",
    };
  });
};

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

/* =========================================================
   COMPONENT
========================================================= */

function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [availableBikes, setAvailableBikes] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("invoices");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [invoiceForm, setInvoiceForm] = useState({
    bikeId: "",
    paymentType: "Full Payment",
    downPayment: "",
    tenureMonths: "12",
    annualInterestRate: "2",
    processingFeePercentage: "3",
    documentationFee: "3000",
    otherChargesAmount: "0",
    otherChargesDescription: "",
    firstDueDate: nextMonthDate(),
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentType: "Full Payment",
    amount: "",
    paymentMethod: "UPI",
    installmentNumber: "",
    transactionReference: "",
    paymentDate: today(),
    notes: "",
  });

  /* =======================================================
     FETCH FIRESTORE DATA
  ======================================================= */

  const fetchBillingData = useCallback(async () => {
    if (!auth.currentUser) {
      setError("Please sign in to access billing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [invoiceSnapshot, bikeSnapshot, paymentSnapshot] =
        await Promise.all([
          getDocs(collection(db, "invoices")),
          getDocs(collection(db, "bikes")),
          getDocs(collection(db, "payments")),
        ]);

      const invoiceData = invoiceSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const bikeData = bikeSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const paymentData = paymentSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      invoiceData.sort((a, b) =>
        String(b.invoiceDate || "").localeCompare(
          String(a.invoiceDate || "")
        )
      );

      paymentData.sort((a, b) =>
        String(b.paymentDate || "").localeCompare(
          String(a.paymentDate || "")
        )
      );

      const invoiceBikeIds = new Set(
        invoiceData.map((invoice) => invoice.bikeId)
      );

      const available = bikeData.filter(
        (bike) =>
          bike.isActive !== false &&
          !bike.invoiceId &&
          !invoiceBikeIds.has(bike.id)
      );

      setInvoices(invoiceData);
      setAvailableBikes(available);
      setPayments(paymentData);
    } catch (err) {
      console.error("Firestore billing error:", err);
      setError(
        err.message || "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);
    /* =======================================================
     SELECTED BIKE AND EMI CALCULATIONS
  ======================================================= */

  const selectedBike = useMemo(
    () =>
      availableBikes.find(
        (bike) => bike.id === invoiceForm.bikeId
      ),
    [availableBikes, invoiceForm.bikeId]
  );

  const bikePrice = Number(selectedBike?.bikePrice || 0);
  const downPayment = Number(invoiceForm.downPayment || 0);

  const financedBalance = Math.max(
    0,
    bikePrice - downPayment
  );

  const processingFeeAmount = roundMoney(
    financedBalance *
      (Number(invoiceForm.processingFeePercentage || 0) / 100)
  );

  const documentationFee = Number(
    invoiceForm.documentationFee || 0
  );

  const otherChargesAmount = Number(
    invoiceForm.otherChargesAmount || 0
  );

  const totalFees = roundMoney(
    processingFeeAmount +
      documentationFee +
      otherChargesAmount
  );

  const principal = roundMoney(
    financedBalance + totalFees
  );

  const estimatedInterest = calculateInterest(
    principal,
    Number(invoiceForm.annualInterestRate || 0),
    Number(invoiceForm.tenureMonths || 0)
  );

  const monthlyEMI = calculateEMI(
    principal,
    Number(invoiceForm.annualInterestRate || 0),
    Number(invoiceForm.tenureMonths || 0)
  );

  const estimatedTotalPayable = roundMoney(
    downPayment + principal + estimatedInterest
  );

  /* =======================================================
     STATISTICS AND FILTERING
  ======================================================= */

  const overdueInstallments = invoices.reduce(
    (total, invoice) =>
      total +
      (invoice.emiSchedule || []).filter(
        (item) =>
          item.status !== "Paid" &&
          item.dueDate < today() &&
          Number(item.installmentAmount) -
            Number(item.paidAmount || 0) >
            0.01
      ).length,
    0
  );

  const stats = useMemo(
    () => ({
      totalInvoices: invoices.length,
      collected: invoices.reduce(
        (sum, invoice) =>
          sum + Number(invoice.totalPaid || 0),
        0
      ),
      outstanding: invoices.reduce(
        (sum, invoice) =>
          sum + Number(invoice.balanceDue || 0),
        0
      ),
    }),
    [invoices]
  );

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const searchText = [
          invoice.customerName,
          invoice.invoiceNumber,
          invoice.brand,
          invoice.model,
          invoice.registrationNumber,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchText.includes(
          search.toLowerCase()
        );

        const matchesStatus =
          statusFilter === "All" ||
          invoice.paymentStatus === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [invoices, search, statusFilter]
  );

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  const resetInvoiceForm = () => {
    setInvoiceForm({
      bikeId: "",
      paymentType: "Full Payment",
      downPayment: "",
      tenureMonths: "12",
      annualInterestRate: "2",
      processingFeePercentage: "3",
      documentationFee: "3000",
      otherChargesAmount: "0",
      otherChargesDescription: "",
      firstDueDate: nextMonthDate(),
      notes: "",
    });
  };

  const closeForms = () => {
    if (saving) return;

    setShowInvoiceForm(false);
    setShowPaymentForm(false);
    setSelectedInvoice(null);
    setError("");
  };

  const handleInvoiceChange = (event) => {
    const { name, value } = event.target;

    setInvoiceForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     CREATE INVOICE
     EMI DOWN PAYMENT IS AUTOMATICALLY RECORDED
  ======================================================= */

  const handleCreateInvoice = async (event) => {
    event.preventDefault();

    if (!auth.currentUser) {
      setError("Please sign in to continue.");
      return;
    }

    if (!selectedBike) {
      setError("Please select a registered bike.");
      return;
    }

    if (!selectedBike.customerId || !selectedBike.customerName) {
      setError("Customer information is missing from this bike.");
      return;
    }

    if (!Number.isFinite(bikePrice) || bikePrice <= 0) {
      setError("The bike must have a valid purchase price.");
      return;
    }

    let invoiceData;

    if (invoiceForm.paymentType === "EMI") {
      const rate = Number(invoiceForm.annualInterestRate);
      const tenure = Number(invoiceForm.tenureMonths);
      const processing = Number(
        invoiceForm.processingFeePercentage
      );

      if (
        !Number.isFinite(downPayment) ||
        downPayment < 0 ||
        downPayment >= bikePrice
      ) {
        setError(
          "Down payment must be zero or greater and less than the bike price."
        );
        return;
      }

      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setError("Enter a valid annual interest rate.");
        return;
      }

      if (
        !Number.isInteger(tenure) ||
        tenure < 1 ||
        tenure > 60
      ) {
        setError("Tenure must be between 1 and 60 months.");
        return;
      }

      if (
        !Number.isFinite(processing) ||
        processing < 0 ||
        processing > 100
      ) {
        setError("Enter a valid processing fee percentage.");
        return;
      }

      if (
        !Number.isFinite(documentationFee) ||
        documentationFee < 0 ||
        !Number.isFinite(otherChargesAmount) ||
        otherChargesAmount < 0
      ) {
        setError("Charges must be valid non-negative amounts.");
        return;
      }

      if (
        !invoiceForm.firstDueDate ||
        invoiceForm.firstDueDate < today()
      ) {
        setError("Select a valid first EMI due date.");
        return;
      }

      const interest = calculateInterest(
        principal,
        rate,
        tenure
      );

      invoiceData = {
        paymentType: "EMI",
        downPayment,
        tenureMonths: tenure,
        annualInterestRate: rate,
        processingFeePercentage: processing,
        processingFeeAmount,
        documentationFee,
        otherChargesAmount,
        otherChargesDescription:
          invoiceForm.otherChargesDescription.trim(),
        totalFees,
        financedBalance,
        principal,
        totalInterest: interest,
        monthlyEMI: calculateEMI(
          principal,
          rate,
          tenure
        ),
        emiSchedule: createEMISchedule(
          principal,
          interest,
          tenure,
          invoiceForm.firstDueDate
        ),
        totalPayable: roundMoney(
          downPayment + principal + interest
        ),
        firstDueDate: invoiceForm.firstDueDate,
      };
    } else {
      invoiceData = {
        paymentType: "Full Payment",
        downPayment: 0,
        tenureMonths: 0,
        annualInterestRate: 0,
        processingFeePercentage: 0,
        processingFeeAmount: 0,
        documentationFee: 0,
        otherChargesAmount: 0,
        totalFees: 0,
        financedBalance: 0,
        principal: bikePrice,
        totalInterest: 0,
        monthlyEMI: 0,
        emiSchedule: [],
        totalPayable: bikePrice,
      };
    }
        try {
      setSaving(true);
      setError("");
      setSuccess("");

      const bikeRef = doc(db, "bikes", selectedBike.id);
      const invoiceRef = doc(collection(db, "invoices"));

      // The EMI down payment is considered received now.
      const initialPaid =
        invoiceData.paymentType === "EMI"
          ? roundMoney(invoiceData.downPayment)
          : 0;

      const initialBalance = roundMoney(
        invoiceData.totalPayable - initialPaid
      );

      const paymentRef =
        initialPaid > 0
          ? doc(collection(db, "payments"))
          : null;

      const invoiceNumber =
        `BL-${today().replaceAll("-", "")}-${invoiceRef.id
          .slice(0, 6)
          .toUpperCase()}`;

      await runTransaction(db, async (transaction) => {
        const bikeSnapshot = await transaction.get(bikeRef);

        if (!bikeSnapshot.exists()) {
          throw new Error("Registered bike no longer exists.");
        }

        const currentBike = bikeSnapshot.data();

        if (currentBike.invoiceId) {
          throw new Error(
            "An invoice already exists for this bike."
          );
        }

        const finalInvoice = {
          ...invoiceData,

          invoiceNumber,
          bikeId: selectedBike.id,

          customerId: currentBike.customerId,
          customerName: currentBike.customerName,
          customerPhone: currentBike.customerPhone || "",

          brand: currentBike.brand || "",
          model: currentBike.model || "",
          colour: currentBike.colour || "",
          registrationNumber:
            currentBike.registrationNumber || "",
          chassisNumber: currentBike.chassisNumber || "",
          engineNumber: currentBike.engineNumber || "",
          bikePrice: Number(currentBike.bikePrice),

          invoiceDate: today(),
          notes: invoiceForm.notes.trim(),

          totalPaid: initialPaid,
          downPaymentPaid: initialPaid,
          balanceDue: initialBalance,

          paymentStatus:
            initialBalance <= 0.01
              ? "Paid"
              : initialPaid > 0
                ? "Partial"
                : "Pending",

          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        };

        transaction.set(invoiceRef, finalInvoice);

        // Create a real payment document for the down payment.
        if (paymentRef && initialPaid > 0) {
          transaction.set(paymentRef, {
            invoiceId: invoiceRef.id,
            invoiceNumber,

            customerId: currentBike.customerId,
            customerName: currentBike.customerName,
            customerPhone: currentBike.customerPhone || "",

            bikeId: selectedBike.id,
            brand: currentBike.brand || "",
            model: currentBike.model || "",
            registrationNumber:
              currentBike.registrationNumber || "",

            amount: initialPaid,
            paymentType: "Down Payment",
            paymentMethod: "Cash",
            installmentNumber: null,

            transactionReference: "",
            paymentDate: today(),
            notes:
              "Initial down payment collected during invoice creation.",

            createdBy: auth.currentUser.uid,
            createdAt: serverTimestamp(),
          });
        }

        transaction.update(bikeRef, {
          invoiceId: invoiceRef.id,
          invoiceNumber,
          updatedAt: serverTimestamp(),
        });
      });

      setSuccess(
        initialPaid > 0
          ? `Invoice created. ${money(initialPaid)} down payment recorded successfully.`
          : "Invoice created successfully."
      );

      setShowInvoiceForm(false);
      resetInvoiceForm();

      await fetchBillingData();
    } catch (err) {
      console.error("Invoice creation error:", err);
      setError(err.message || "Unable to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     PAYMENT HELPERS
  ======================================================= */

  const getInvoicePayments = (invoiceId) =>
    payments.filter(
      (payment) => payment.invoiceId === invoiceId
    );

  const getDownPaymentPaid = (invoice) => {
    const recordedPayments = getInvoicePayments(invoice.id)
      .filter(
        (payment) => payment.paymentType === "Down Payment"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    return Number(
      invoice.downPaymentPaid ?? recordedPayments
    );
  };

  const getNextInstallment = (invoice) =>
    (invoice.emiSchedule || []).find(
      (item) =>
        Number(item.installmentAmount) -
          Number(item.paidAmount || 0) >
        0.01
    );

  const openPaymentForm = (invoice, installment = null) => {
    setSelectedInvoice(invoice);
    setError("");
    setSuccess("");

    let paymentType = "Full Payment";
    let amount = Number(invoice.balanceDue || 0);
    let installmentNumber = "";

    if (invoice.paymentType === "EMI") {
      const downPaymentRemaining = Math.max(
        0,
        Number(invoice.downPayment || 0) -
          getDownPaymentPaid(invoice)
      );

      if (downPaymentRemaining > 0.01 && !installment) {
        paymentType = "Down Payment";
        amount = downPaymentRemaining;
      } else if (installment) {
        paymentType = "EMI Installment";
        amount = Math.max(
          0,
          Number(installment.installmentAmount) -
            Number(installment.paidAmount || 0)
        );
        installmentNumber = String(
          installment.installmentNumber
        );
      } else {
        const nextInstallment = getNextInstallment(invoice);

        paymentType = "EMI Installment";
        amount = nextInstallment
          ? Number(nextInstallment.installmentAmount) -
            Number(nextInstallment.paidAmount || 0)
          : 0;

        installmentNumber = String(
          nextInstallment?.installmentNumber || ""
        );
      }
    }

    setPaymentForm({
      paymentType,
      amount:
        amount > 0 ? roundMoney(amount).toFixed(2) : "",
      paymentMethod: "UPI",
      installmentNumber,
      transactionReference: "",
      paymentDate: today(),
      notes: "",
    });

    setShowPaymentForm(true);
  };

  const handlePaymentTypeChange = (value) => {
    if (!selectedInvoice) return;

    let amount = 0;
    let installmentNumber = "";

    if (value === "Full Payment") {
      amount = Number(selectedInvoice.balanceDue || 0);
    } else if (value === "Down Payment") {
      amount = Math.max(
        0,
        Number(selectedInvoice.downPayment || 0) -
          getDownPaymentPaid(selectedInvoice)
      );
    } else if (value === "EMI Installment") {
      const installment = getNextInstallment(selectedInvoice);

      installmentNumber = String(
        installment?.installmentNumber || ""
      );

      amount = installment
        ? Number(installment.installmentAmount) -
          Number(installment.paidAmount || 0)
        : 0;
    }

    setPaymentForm((previous) => ({
      ...previous,
      paymentType: value,
      amount:
        amount > 0 ? roundMoney(amount).toFixed(2) : "",
      installmentNumber,
    }));
  };
    /* =======================================================
     RECORD PAYMENT
  ======================================================= */
  const handleRecordPayment = async (event) => {
    event.preventDefault();
    if (!selectedInvoice || !auth.currentUser) {
      setError("Please sign in and select an invoice.");
      return;
    }
    let amount = roundMoney(Number(paymentForm.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (
      !paymentForm.paymentDate ||
      paymentForm.paymentDate > today()
    ) {
      setError("Enter a valid payment date.");
      return;
    }
    if (!paymentForm.paymentMethod) {
      setError("Select a payment method.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const invoiceRef = doc(
        db,
        "invoices",
        selectedInvoice.id
      );
      const paymentRef = doc(collection(db, "payments"));
      await runTransaction(db, async (transaction) => {
        const invoiceSnapshot = await transaction.get(invoiceRef);
        if (!invoiceSnapshot.exists()) {
          throw new Error("Invoice not found.");
        }
        const invoice = invoiceSnapshot.data();

      const totalPayable = roundMoney(
        Number(invoice.totalPayable || 0)
      );

      const previousPaid = roundMoney(
        Number(invoice.totalPaid || 0)
      );

      const currentBalance = roundMoney(
        Number(
          invoice.balanceDue ?? (totalPayable - previousPaid)
        )
      );

      if (currentBalance <= 0.01) {
        throw new Error("This invoice is already fully paid.");
      }

      if (amount > currentBalance + 0.01) {
        throw new Error(
          "Payment cannot exceed the outstanding balance."
        );
      }

      const isFullPayment =
        paymentForm.paymentType === "Full Payment";

      // FULL PAYMENT MUST CLEAR THE ENTIRE BALANCE.
      if (
        isFullPayment &&
        Math.abs(amount - currentBalance) > 0.01
      ) {
        throw new Error(
          "Full Payment must equal the entire outstanding balance."
        );
      }

      // Keep the settled amount local to this transaction attempt.
      // Firestore may retry the callback when another write happens.
      const recordedAmount = isFullPayment
        ? currentBalance
        : amount;

      let schedule = Array.isArray(invoice.emiSchedule)
        ? invoice.emiSchedule.map((item) => ({ ...item }))
        : [];

      let updatedDownPaymentPaid = Number(
        invoice.downPaymentPaid ??
          getDownPaymentPaid(selectedInvoice)
      );

      // DOWN PAYMENT
      if (paymentForm.paymentType === "Down Payment") {
        const remainingDownPayment = roundMoney(
          Number(invoice.downPayment || 0) -
            updatedDownPaymentPaid
        );

        if (amount > remainingDownPayment + 0.01) {
          throw new Error(
            "Payment exceeds the remaining down payment."
          );
        }

        updatedDownPaymentPaid = roundMoney(
          updatedDownPaymentPaid + amount
        );
      }

      // EMI INSTALLMENT
      else if (
        paymentForm.paymentType === "EMI Installment"
      ) {
        const installmentIndex = schedule.findIndex(
          (item) =>
            Number(item.installmentNumber) ===
            Number(paymentForm.installmentNumber)
        );

        if (installmentIndex === -1) {
          throw new Error("EMI installment not found.");
        }

        const installment = {
          ...schedule[installmentIndex],
        };

        const remaining = roundMoney(
          Number(installment.installmentAmount) -
            Number(installment.paidAmount || 0)
        );

        if (amount > remaining + 0.01) {
          throw new Error(
            "Payment exceeds the remaining installment amount."
          );
        }

        installment.paidAmount = roundMoney(
          Number(installment.paidAmount || 0) + amount
        );

        if (
          installment.paidAmount >=
          Number(installment.installmentAmount) - 0.01
        ) {
          installment.paidAmount = Number(
            installment.installmentAmount
          );
          installment.status = "Paid";
          installment.paidDate = paymentForm.paymentDate;
        } else {
          installment.status = "Partial";
        }

        schedule[installmentIndex] = installment;
      }

      // FULL PAYMENT OF AN EMI INVOICE:
      // Settle down payment and all remaining installments.
      if (
        isFullPayment &&
        invoice.paymentType === "EMI"
      ) {
        updatedDownPaymentPaid = Number(
          invoice.downPayment || 0
        );

        schedule = schedule.map((item) => ({
          ...item,
          paidAmount: Number(item.installmentAmount || 0),
          status: "Paid",
          paidDate: paymentForm.paymentDate,
        }));
      }

      // CALCULATE FINAL PAYMENT TOTALS
      let totalPaid;
      let balanceDue;
      let paymentStatus;

      if (isFullPayment) {
        // Force exact settlement to avoid floating-point
        // rounding problems.
        totalPaid = totalPayable;
        balanceDue = 0;
        paymentStatus = "Paid";
      } else {
        totalPaid = roundMoney(previousPaid + amount);

        balanceDue = Math.max(
          0,
          roundMoney(totalPayable - totalPaid)
        );

        if (balanceDue <= 0.01) {
          totalPaid = totalPayable;
          balanceDue = 0;
          paymentStatus = "Paid";
        } else {
          paymentStatus = getStatus(
            totalPaid,
            totalPayable,
            schedule
          );
        }
      }

      // CREATE PAYMENT RECORD
      transaction.set(paymentRef, {
        invoiceId: selectedInvoice.id,
        invoiceNumber: invoice.invoiceNumber,

        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone || "",

        bikeId: invoice.bikeId,
        brand: invoice.brand || "",
        model: invoice.model || "",
        registrationNumber:
          invoice.registrationNumber || "",

        amount: roundMoney(recordedAmount),
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod,

        installmentNumber:
          paymentForm.paymentType === "EMI Installment"
            ? Number(paymentForm.installmentNumber)
            : null,

        transactionReference:
          paymentForm.transactionReference.trim(),

        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes.trim(),

        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // UPDATE INVOICE AND PAYMENT STATUS ATOMICALLY
      transaction.update(invoiceRef, {
        totalPaid,
        balanceDue,
        paymentStatus,
        downPaymentPaid: updatedDownPaymentPaid,
        emiSchedule: schedule,
        updatedAt: serverTimestamp(),
      });
    });

    setSuccess(
      paymentForm.paymentType === "Full Payment"
        ? "Full payment recorded successfully! Invoice status updated to PAID."
        : "Payment recorded successfully."
    );

    setShowPaymentForm(false);
    setSelectedInvoice(null);

    await fetchBillingData();

  } catch (err) {
    console.error("Payment recording error:", err);

    setError(
      err.message || "Unable to record payment."
    );

  } finally {
    setSaving(false);
  }
};


  /* =======================================================
     PRINT INVOICE
  ======================================================= */

  const printInvoice = (invoice) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=850,height=700"
    );

    if (!printWindow) {
      setError("Please allow pop-ups to print the invoice.");
      return;
    }

    const rows = [
      ["Invoice Number", invoice.invoiceNumber],
      ["Invoice Date", invoice.invoiceDate],
      ["Customer", invoice.customerName],
      ["Phone", invoice.customerPhone || "—"],
      [
        "Bike",
        `${invoice.brand || ""} ${invoice.model || ""}`,
      ],
      [
        "Registration Number",
        invoice.registrationNumber || "—",
      ],
      ["Bike Price", money(invoice.bikePrice)],
      ["Payment Type", invoice.paymentType],
      ["Down Payment", money(invoice.downPayment)],
      ["Total Fees", money(invoice.totalFees)],
      ["Total Interest", money(invoice.totalInterest)],
      ["Total Payable", money(invoice.totalPayable)],
      ["Amount Paid", money(invoice.totalPaid)],
      ["Balance Due", money(invoice.balanceDue)],
      ["Payment Status", invoice.paymentStatus],
    ];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHTML(invoice.invoiceNumber)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #172b45;
            }
            h1 { margin-bottom: 5px; }
            p { color: #64748b; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 25px;
            }
            td {
              padding: 12px;
              border: 1px solid #dbe3ed;
            }
            td:first-child {
              font-weight: bold;
              width: 40%;
              background: #f5f7fb;
            }
            .footer {
              margin-top: 35px;
              text-align: center;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>BikeLedger</h1>
          <p>Two-Wheeler Billing Management System</p>
          <h2>Customer Invoice</h2>
          <table>
            ${rows
              .map(
                ([label, value]) =>
                  `<tr>
                    <td>${escapeHTML(label)}</td>
                    <td>${escapeHTML(value)}</td>
                  </tr>`
              )
              .join("")}
          </table>
          <div class="footer">
            <p>Thank you for your business.</p>
            <button onclick="window.print()">Print Invoice</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="billing-layout">
      <Sidebar />

      <main className="billing-main">
        <div className="billing-header">
          <div>
            <p className="billing-eyebrow">
              FINANCE MANAGEMENT
            </p>
            <h1>Billing & EMI</h1>
            <p className="billing-subtitle">
              Manage invoices, showroom charges, installments
              and overdue payments.
            </p>
          </div>

          <button
            type="button"
            className="billing-primary-btn"
            onClick={() => {
              setError("");
              setSuccess("");
              resetInvoiceForm();
              setShowInvoiceForm(true);
            }}
            disabled={availableBikes.length === 0 || loading}
          >
            + Create Invoice
          </button>
        </div>

        {error && !showInvoiceForm && !showPaymentForm && (
          <div className="billing-alert billing-alert-error">
            {error}
          </div>
        )}

        {success && !showInvoiceForm && !showPaymentForm && (
          <div className="billing-alert billing-alert-success">
            {success}
          </div>
        )}

        {/* STATISTICS */}

        <section className="billing-stats">
          <div className="billing-stat-card">
            <div className="billing-stat-icon invoice-icon">
              ▤
            </div>
            <div>
              <p>Total Invoices</p>
              <h2>{stats.totalInvoices}</h2>
            </div>
          </div>

          <div className="billing-stat-card">
            <div className="billing-stat-icon revenue-icon">
              ₹
            </div>
            <div>
              <p>Amount Collected</p>
              <h2>{money(stats.collected)}</h2>
            </div>
          </div>

          <div className="billing-stat-card">
            <div className="billing-stat-icon due-icon">
              ◷
            </div>
            <div>
              <p>Outstanding Balance</p>
              <h2>{money(stats.outstanding)}</h2>
            </div>
          </div>

          <div className="billing-stat-card">
            <div className="billing-stat-icon overdue-icon">
              !
            </div>
            <div>
              <p>Overdue Installments</p>
              <h2>{overdueInstallments}</h2>
            </div>
          </div>
        </section>
                {/* TABS */}

        <div className="billing-tabs">
          <button
            type="button"
            className={
              activeTab === "invoices" ? "active" : ""
            }
            onClick={() => setActiveTab("invoices")}
          >
            Invoices
          </button>

          <button
            type="button"
            className={
              activeTab === "payments" ? "active" : ""
            }
            onClick={() => setActiveTab("payments")}
          >
            Payment History
          </button>
        </div>

        {/* INVOICE LIST */}

        {activeTab === "invoices" && (
          <section className="billing-content">
            <div className="billing-toolbar">
              <div>
                <h2>Customer Invoices</h2>
                <p>
                  View invoices and expand EMI schedules.
                </p>
              </div>

              <div className="billing-filters">
                <input
                  type="search"
                  placeholder="Search customer, bike or invoice..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="billing-empty">
                Loading billing data...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="billing-empty">
                <div className="billing-empty-icon">▤</div>
                <h3>No invoices found</h3>
                <p>
                  {invoices.length === 0
                    ? "Create an invoice for a registered bike to get started."
                    : "Try another search or status filter."}
                </p>
              </div>
            ) : (
              <div className="billing-table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Bike</th>
                      <th>Type</th>
                      <th>Total Payable</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <React.Fragment key={invoice.id}>
                        <tr>
                          <td>
                            <strong>
                              {invoice.invoiceNumber}
                            </strong>
                            <small>{invoice.invoiceDate}</small>
                          </td>

                          <td>
                            <strong>
                              {invoice.customerName || "—"}
                            </strong>
                            <small>
                              {invoice.customerPhone || ""}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {invoice.brand} {invoice.model}
                            </strong>
                            <small>
                              {invoice.registrationNumber || ""}
                            </small>
                          </td>

                          <td>
                            <span className="billing-type-chip">
                              {invoice.paymentType}
                            </span>
                          </td>

                          <td>
                            {money(invoice.totalPayable)}
                          </td>

                          <td className="billing-paid-amount">
                            {money(invoice.totalPaid)}
                          </td>

                          <td className="billing-due-amount">
                            {money(invoice.balanceDue)}
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                invoice.paymentStatus
                              )}
                            >
                              {invoice.paymentStatus}
                            </span>
                          </td>

                          <td>
                            <div className="billing-row-actions">
                              {invoice.paymentType === "EMI" && (
                                <button
                                  type="button"
                                  className="billing-view-btn"
                                  onClick={() =>
                                    setExpandedInvoiceId(
                                      expandedInvoiceId ===
                                        invoice.id
                                        ? null
                                        : invoice.id
                                    )
                                  }
                                >
                                  {expandedInvoiceId === invoice.id
                                    ? "Hide Schedule"
                                    : "View EMI"}
                                </button>
                              )}

                              <button
                                type="button"
                                className="billing-action-btn"
                                onClick={() =>
                                  openPaymentForm(invoice)
                                }
                                disabled={
                                  Number(invoice.balanceDue) <= 0
                                }
                              >
                                Record Payment
                              </button>

                              <button
                                type="button"
                                className="billing-view-btn"
                                onClick={() =>
                                  printInvoice(invoice)
                                }
                              >
                                Print Invoice
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* EMI SCHEDULE */}

                        {expandedInvoiceId === invoice.id && (
                          <tr>
                            <td colSpan="9">
                              <div className="billing-schedule">
                                <div className="billing-schedule-header">
                                  <div>
                                    <h3>
                                      EMI Installment Schedule
                                    </h3>
                                    <p>
                                      {invoice.tenureMonths} installments
                                      {" · "}
                                      {invoice.annualInterestRate}%
                                      annual interest
                                    </p>
                                  </div>

                                  <strong>
                                    Monthly EMI:{" "}
                                    {money(invoice.monthlyEMI)}
                                  </strong>
                                </div>

                                <div className="billing-fee-summary">
                                  <div>
                                    <span>Down Payment</span>
                                    <strong>
                                      {money(invoice.downPayment)}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>Down Payment Received</span>
                                    <strong>
                                      {money(
                                        invoice.downPaymentPaid ??
                                          getDownPaymentPaid(invoice)
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>Processing Fee</span>
                                    <strong>
                                      {money(
                                        invoice.processingFeeAmount
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>Documentation Fee</span>
                                    <strong>
                                      {money(invoice.documentationFee)}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>Other Charges</span>
                                    <strong>
                                      {money(invoice.otherChargesAmount)}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>Total Fees</span>
                                    <strong>
                                      {money(invoice.totalFees)}
                                    </strong>
                                  </div>
                                </div>

                                {invoice.otherChargesDescription && (
                                  <p className="billing-other-charge-note">
                                    Other charges:{" "}
                                    {invoice.otherChargesDescription}
                                  </p>
                                )}

                                <div className="billing-table-wrapper">
                                  <table className="billing-installment-table">
                                    <thead>
                                      <tr>
                                        <th>Installment</th>
                                        <th>Due Date</th>
                                        <th>Principal</th>
                                        <th>Interest</th>
                                        <th>Amount Due</th>
                                        <th>Paid</th>
                                        <th>Remaining</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {(invoice.emiSchedule || []).map(
                                        (item) => {
                                          const remaining = Math.max(
                                            0,
                                            Number(
                                              item.installmentAmount
                                            ) -
                                              Number(
                                                item.paidAmount || 0
                                              )
                                          );

                                          const displayStatus =
                                            item.status !== "Paid" &&
                                            item.dueDate < today() &&
                                            remaining > 0.01
                                              ? "Overdue"
                                              : item.status;

                                          return (
                                            <tr
                                              key={
                                                item.installmentNumber
                                              }
                                            >
                                              <td>
                                                #
                                                {item.installmentNumber}
                                              </td>

                                              <td>{item.dueDate}</td>

                                              <td>
                                                {money(
                                                  item.principalAmount
                                                )}
                                              </td>

                                              <td>
                                                {money(
                                                  item.interestAmount
                                                )}
                                              </td>

                                              <td>
                                                {money(
                                                  item.installmentAmount
                                                )}
                                              </td>

                                              <td className="billing-paid-amount">
                                                {money(item.paidAmount)}
                                              </td>

                                              <td className="billing-due-amount">
                                                {money(remaining)}
                                              </td>

                                              <td>
                                                <span
                                                  className={statusClass(
                                                    displayStatus
                                                  )}
                                                >
                                                  {displayStatus}
                                                </span>
                                              </td>

                                              <td>
                                                {remaining > 0.01 && (
                                                  <button
                                                    type="button"
                                                    className="billing-action-btn"
                                                    onClick={() =>
                                                      openPaymentForm(
                                                        invoice,
                                                        item
                                                      )
                                                    }
                                                  >
                                                    Pay
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
                {/* PAYMENT HISTORY TAB */}

        {activeTab === "payments" && (
          <section className="billing-content">
            <div className="billing-toolbar">
              <div>
                <h2>Payment History</h2>
                <p>All recorded customer transactions.</p>
              </div>

              <span className="billing-record-count">
                {payments.length} transactions
              </span>
            </div>

            {loading ? (
              <div className="billing-empty">
                Loading payment history...
              </div>
            ) : payments.length === 0 ? (
              <div className="billing-empty">
                <div className="billing-empty-icon">₹</div>
                <h3>No payments recorded</h3>
                <p>
                  Payments will appear here after collection.
                </p>
              </div>
            ) : (
              <div className="billing-table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Invoice</th>
                      <th>Payment Type</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.paymentDate || "—"}</td>

                        <td>
                          <strong>
                            {payment.customerName || "—"}
                          </strong>
                          <small>
                            {payment.customerPhone || ""}
                          </small>
                        </td>

                        <td>
                          {payment.invoiceNumber || "—"}
                        </td>

                        <td>{payment.paymentType || "—"}</td>

                        <td>{payment.paymentMethod || "—"}</td>

                        <td>
                          {payment.transactionReference || "—"}
                        </td>

                        <td className="billing-paid-amount">
                          {money(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* REFRESH */}

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button
            type="button"
            className="billing-view-btn"
            onClick={fetchBillingData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh Data"}
          </button>
        </div>
      </main>

      {/* ===================================================
          CREATE INVOICE MODAL
      =================================================== */}

      {showInvoiceForm && (
        <div
          className="billing-modal-overlay"
          onClick={closeForms}
        >
          <div
            className="billing-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="billing-modal-header">
              <div>
                <p className="billing-eyebrow">
                  NEW TRANSACTION
                </p>
                <h2>Create Invoice</h2>
              </div>

              <button
                className="billing-close-btn"
                type="button"
                onClick={closeForms}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="billing-alert billing-alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateInvoice}>
              <div className="billing-form-group">
                <label>Select Registered Bike *</label>

                <select
                  name="bikeId"
                  value={invoiceForm.bikeId}
                  onChange={handleInvoiceChange}
                  required
                >
                  <option value="">
                    Choose a registered bike
                  </option>

                  {availableBikes.map((bike) => (
                    <option key={bike.id} value={bike.id}>
                      {bike.brand} {bike.model} —{" "}
                      {bike.customerName || "Customer"} —{" "}
                      {bike.registrationNumber ||
                        "No registration"}
                    </option>
                  ))}
                </select>

                {availableBikes.length === 0 && (
                  <small>
                    No uninvoiced registered bikes are available.
                    Register a bike first.
                  </small>
                )}
              </div>

              {selectedBike && (
                <div className="billing-selected-bike">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {selectedBike.customerName || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>
                      {selectedBike.customerPhone || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Registration</span>
                    <strong>
                      {selectedBike.registrationNumber || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Bike Price</span>
                    <strong>{money(bikePrice)}</strong>
                  </div>
                </div>
              )}

              <div className="billing-form-group">
                <label>Payment Type *</label>

                <div className="billing-payment-options">
                  <label
                    className={
                      invoiceForm.paymentType === "Full Payment"
                        ? "selected"
                        : ""
                    }
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="Full Payment"
                      checked={
                        invoiceForm.paymentType === "Full Payment"
                      }
                      onChange={handleInvoiceChange}
                    />
                    <span>
                      <strong>Full Payment</strong>
                      <small>
                        Pay the complete bike price at once.
                      </small>
                    </span>
                  </label>

                  <label
                    className={
                      invoiceForm.paymentType === "EMI"
                        ? "selected"
                        : ""
                    }
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="EMI"
                      checked={invoiceForm.paymentType === "EMI"}
                      onChange={handleInvoiceChange}
                    />
                    <span>
                      <strong>EMI Payment</strong>
                      <small>
                        Configure charges and monthly installments.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              {/* EMI CONFIGURATION */}

              {invoiceForm.paymentType === "EMI" && (
                <>
                  <h3 className="billing-section-heading">
                    EMI Configuration
                  </h3>

                  <div className="billing-form-grid">
                    <div className="billing-form-group">
                      <label>Down Payment (₹) *</label>
                      <input
                        type="number"
                        name="downPayment"
                        min="0"
                        max={Math.max(0, bikePrice - 0.01)}
                        step="0.01"
                        value={invoiceForm.downPayment}
                        onChange={handleInvoiceChange}
                        required
                      />
                      <small>
                        This amount will automatically be recorded
                        as received when the invoice is created.
                      </small>
                    </div>

                    <div className="billing-form-group">
                      <label>Tenure (Months) *</label>
                      <select
                        name="tenureMonths"
                        value={invoiceForm.tenureMonths}
                        onChange={handleInvoiceChange}
                      >
                        {[3, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60].map(
                          (month) => (
                            <option key={month} value={month}>
                              {month} Months
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="billing-form-group">
                      <label>Annual Interest Rate (%) *</label>
                      <input
                        type="number"
                        name="annualInterestRate"
                        min="0"
                        max="100"
                        step="0.01"
                        value={invoiceForm.annualInterestRate}
                        onChange={handleInvoiceChange}
                        required
                      />
                    </div>

                    <div className="billing-form-group">
                      <label>First EMI Due Date *</label>
                      <input
                        type="date"
                        name="firstDueDate"
                        min={today()}
                        value={invoiceForm.firstDueDate}
                        onChange={handleInvoiceChange}
                        required
                      />
                    </div>

                    <div className="billing-form-group">
                      <label>Processing Fee (%) *</label>
                      <input
                        type="number"
                        name="processingFeePercentage"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          invoiceForm.processingFeePercentage
                        }
                        onChange={handleInvoiceChange}
                        required
                      />
                    </div>

                    <div className="billing-form-group">
                      <label>Documentation Fee (₹) *</label>
                      <input
                        type="number"
                        name="documentationFee"
                        min="0"
                        step="0.01"
                        value={invoiceForm.documentationFee}
                        onChange={handleInvoiceChange}
                        required
                      />
                    </div>

                    <div className="billing-form-group">
                      <label>Other Charges (₹)</label>
                      <input
                        type="number"
                        name="otherChargesAmount"
                        min="0"
                        step="0.01"
                        value={invoiceForm.otherChargesAmount}
                        onChange={handleInvoiceChange}
                      />
                    </div>

                    <div className="billing-form-group">
                      <label>Other Charges Description</label>
                      <input
                        type="text"
                        name="otherChargesDescription"
                        maxLength="250"
                        placeholder="e.g. Insurance or additional service"
                        value={
                          invoiceForm.otherChargesDescription
                        }
                        onChange={handleInvoiceChange}
                      />
                    </div>
                  </div>
                                    {/* EMI PREVIEW */}

                  <div className="billing-emi-preview">
                    <div className="billing-preview-heading">
                      <div>
                        <h3>EMI Calculation Preview</h3>
                        <p>
                          Estimated customer payment details
                        </p>
                      </div>

                      <span className="billing-preview-chip">
                        Annual Simple Interest
                      </span>
                    </div>

                    <div className="billing-preview-row">
                      <span>Bike Price</span>
                      <strong>{money(bikePrice)}</strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Down Payment</span>
                      <strong>{money(downPayment)}</strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Financed Balance</span>
                      <strong>{money(financedBalance)}</strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Processing Fee</span>
                      <strong>
                        {money(processingFeeAmount)}
                      </strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Documentation Fee</span>
                      <strong>
                        {money(documentationFee)}
                      </strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Other Charges</span>
                      <strong>
                        {money(otherChargesAmount)}
                      </strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Total Additional Fees</span>
                      <strong>{money(totalFees)}</strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Annual Interest Rate</span>
                      <strong>
                        {invoiceForm.annualInterestRate}%
                      </strong>
                    </div>

                    <div className="billing-preview-row billing-preview-highlight">
                      <span>Monthly Installment</span>
                      <strong>{money(monthlyEMI)}</strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Estimated Total Interest</span>
                      <strong>
                        {money(estimatedInterest)}
                      </strong>
                    </div>

                    <div className="billing-preview-row">
                      <span>Down Payment Received</span>
                      <strong>{money(downPayment)}</strong>
                    </div>

                    <div className="billing-preview-row billing-preview-total">
                      <span>Estimated Total Payable</span>
                      <strong>
                        {money(estimatedTotalPayable)}
                      </strong>
                    </div>

                    <small>
                      The down payment is recorded as collected
                      automatically when you create this invoice.
                      Interest is calculated using annual simple
                      interest.
                    </small>
                  </div>
                </>
              )}

              <div className="billing-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Optional invoice notes..."
                  value={invoiceForm.notes}
                  onChange={handleInvoiceChange}
                />
              </div>

              <div className="billing-modal-actions">
                <button
                  type="button"
                  className="billing-secondary-btn"
                  onClick={closeForms}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="billing-primary-btn"
                  disabled={
                    saving ||
                    !invoiceForm.bikeId ||
                    (invoiceForm.paymentType === "EMI" &&
                      (invoiceForm.downPayment === "" ||
                        downPayment < 0 ||
                        downPayment >= bikePrice ||
                        !invoiceForm.firstDueDate))
                  }
                >
                  {saving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          RECORD PAYMENT MODAL
      =================================================== */}

      {showPaymentForm && selectedInvoice && (
        <div
          className="billing-modal-overlay"
          onClick={closeForms}
        >
          <div
            className="billing-modal billing-payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="billing-modal-header">
              <div>
                <p className="billing-eyebrow">
                  COLLECT PAYMENT
                </p>
                <h2>Record Payment</h2>
              </div>

              <button
                className="billing-close-btn"
                type="button"
                onClick={closeForms}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="billing-alert billing-alert-error">
                {error}
              </div>
            )}

            <div className="billing-payment-summary">
              <div>
                <span>Invoice</span>
                <strong>
                  {selectedInvoice.invoiceNumber}
                </strong>
              </div>

              <div>
                <span>Customer</span>
                <strong>
                  {selectedInvoice.customerName || "—"}
                </strong>
              </div>

              <div>
                <span>Total Payable</span>
                <strong>
                  {money(selectedInvoice.totalPayable)}
                </strong>
              </div>

              <div>
                <span>Balance Due</span>
                <strong className="billing-due-amount">
                  {money(selectedInvoice.balanceDue)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleRecordPayment}>
              {selectedInvoice.paymentType === "EMI" && (
                <div className="billing-form-group">
                  <label>Payment Type *</label>

                  <select
                    value={paymentForm.paymentType}
                    onChange={(event) =>
                      handlePaymentTypeChange(
                        event.target.value
                      )
                    }
                  >
                    <option value="Down Payment">
                      Down Payment
                    </option>
                    <option value="EMI Installment">
                      EMI Installment
                    </option>
                    <option value="Full Payment">
                      Full Payment
                    </option>
                  </select>
                </div>
              )}

              {paymentForm.paymentType ===
                "EMI Installment" && (
                <div className="billing-form-group">
                  <label>Installment Number</label>
                  <input
                    type="number"
                    value={paymentForm.installmentNumber}
                    readOnly
                  />
                </div>
              )}

              <div className="billing-form-grid">
                <div className="billing-form-group">
                  <label>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    max={selectedInvoice.balanceDue}
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>

                <div className="billing-form-group">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="billing-form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    max={today()}
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>

                <div className="billing-form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    name="transactionReference"
                    placeholder="UPI ID / transaction number"
                    value={
                      paymentForm.transactionReference
                    }
                    onChange={handlePaymentChange}
                  />
                </div>
              </div>
                            <div className="billing-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Optional payment notes..."
                  value={paymentForm.notes}
                  onChange={handlePaymentChange}
                />
              </div>

              <div className="billing-modal-actions">
                <button
                  type="button"
                  className="billing-secondary-btn"
                  onClick={closeForms}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="billing-primary-btn"
                  disabled={
                    saving ||
                    !paymentForm.amount ||
                    Number(paymentForm.amount) <= 0
                  }
                >
                  {saving ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
