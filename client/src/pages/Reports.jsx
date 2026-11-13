import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/Reports.css";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN");
};

const getDateRange = (filter) => {
  const now = new Date();
  const start = new Date(now);

  if (filter === "Today") {
    start.setHours(0, 0, 0, 0);
  } else if (filter === "This Month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (filter === "This Year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    return null;
  }

  return { start, end: now };
};

const Reports = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError("");

      const [invoiceResponse, paymentResponse] = await Promise.all([
        api.get("/billing"),
        api.get("/payments"),
      ]);

      setInvoices(invoiceResponse.data?.invoices || []);
      setPayments(paymentResponse.data?.payments || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const reportData = useMemo(() => {
    const range = getDateRange(dateFilter);

    const isInRange = (date) => {
      if (!range) return true;
      const value = new Date(date);
      return (
        !Number.isNaN(value.getTime()) &&
        value >= range.start &&
        value <= range.end
      );
    };

    const filteredInvoices = invoices.filter((invoice) =>
      isInRange(invoice.invoiceDate),
    );

    const filteredPayments = payments.filter((payment) =>
      isInRange(payment.paymentDate),
    );

    const totalSales = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.bikePrice || 0),
      0,
    );

    const totalInvoiced = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalPayable || 0),
      0,
    );

    const totalCollected = filteredPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // Outstanding is the current balance on invoices created in this period.
    const outstanding = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.balanceDue || 0),
      0,
    );

    const overdueInvoices = filteredInvoices.filter(
      (invoice) =>
        invoice.paymentStatus === "Overdue" ||
        invoice.emiSchedule?.some(
          (installment) => installment.status === "Overdue",
        ),
    );

    const paymentMethods = [
      "Cash",
      "UPI",
      "Card",
      "Bank Transfer",
      "Cheque",
    ].map((method) => {
      const methodPayments = filteredPayments.filter(
        (payment) => payment.paymentMethod === method,
      );

      return {
        method,
        count: methodPayments.length,
        amount: methodPayments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0,
        ),
      };
    });

    const paymentTypes = [
      "Full Payment",
      "Down Payment",
      "EMI Installment",
    ].map((type) => {
      const typePayments = filteredPayments.filter(
        (payment) => payment.paymentType === type,
      );

      return {
        type,
        count: typePayments.length,
        amount: typePayments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0,
        ),
      };
    });

    return {
      filteredInvoices,
      filteredPayments,
      totalSales,
      totalInvoiced,
      totalCollected,
      outstanding,
      overdueInvoices,
      paymentMethods,
      paymentTypes,
    };
  }, [invoices, payments, dateFilter]);

  const exportCSV = () => {
    const headers = [
      "Invoice Number",
      "Customer",
      "Bike Price",
      "Total Payable",
      "Total Paid",
      "Balance Due",
      "Payment Type",
      "Payment Status",
      "Invoice Date",
    ];

    const rows = reportData.filteredInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.customer?.name || "",
      invoice.bikePrice,
      invoice.totalPayable,
      invoice.totalPaid,
      invoice.balanceDue,
      invoice.paymentType,
      invoice.paymentStatus,
      formatDate(invoice.invoiceDate),
    ]);

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `BikeLedger_Report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const maximumMethodAmount = Math.max(
    ...reportData.paymentMethods.map((item) => item.amount),
    1,
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="reports-page">
          <header className="reports-header">
            <div>
              <h1>Reports & Analytics</h1>
              <p>
                Monitor showroom sales, collections and outstanding payments.
              </p>
            </div>

            <div className="reports-actions">
              <button
                className="reports-secondary-btn"
                onClick={printReport}
                disabled={loading}
              >
                Print Report
              </button>

              <button
                className="reports-primary-btn"
                onClick={exportCSV}
                disabled={loading}
              >
                Export CSV
              </button>
            </div>
          </header>

          <section className="reports-toolbar">
            <div>
              <label htmlFor="report-period">Report Period</label>
              <select
                id="report-period"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            <button
              className="reports-refresh-btn"
              onClick={fetchReportData}
              disabled={loading}
            >
              ↻ Refresh Data
            </button>
          </section>

          {error && (
            <div className="reports-error">
              {error}
              <button onClick={fetchReportData}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="reports-loading">Loading showroom reports...</div>
          ) : (
            <>
              <section className="reports-summary-grid">
                <article className="report-card">
                  <span className="report-card-icon">🏍</span>
                  <p>Bike Sales Value</p>
                  <h2>{currency(reportData.totalSales)}</h2>
                  <small>{reportData.filteredInvoices.length} invoices</small>
                </article>

                <article className="report-card">
                  <span className="report-card-icon">₹</span>
                  <p>Total Invoiced</p>
                  <h2>{currency(reportData.totalInvoiced)}</h2>
                  <small>Including fees and interest</small>
                </article>

                <article className="report-card">
                  <span className="report-card-icon">↗</span>
                  <p>Payments Collected</p>
                  <h2>{currency(reportData.totalCollected)}</h2>
                  <small>
                    {reportData.filteredPayments.length} transactions
                  </small>
                </article>

                <article className="report-card">
                  <span className="report-card-icon">◷</span>
                  <p>Outstanding Balance</p>
                  <h2>{currency(reportData.outstanding)}</h2>
                  <small>Current balance of filtered invoices</small>
                </article>
              </section>

              <section className="reports-secondary-grid">
                <article className="reports-panel">
                  <div className="reports-panel-heading">
                    <div>
                      <h2>Payment Method Analysis</h2>
                      <p>Collections grouped by payment method</p>
                    </div>
                  </div>

                  <div className="method-list">
                    {reportData.paymentMethods.map((item) => (
                      <div className="method-item" key={item.method}>
                        <div className="method-info">
                          <strong>{item.method}</strong>
                          <span>
                            {item.count} transactions · {currency(item.amount)}
                          </span>
                        </div>

                        <div className="method-bar-track">
                          <div
                            className="method-bar"
                            style={{
                              width: `${
                                (item.amount / maximumMethodAmount) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="reports-panel">
                  <div className="reports-panel-heading">
                    <div>
                      <h2>Payment Type Analysis</h2>
                      <p>Collections grouped by transaction type</p>
                    </div>
                  </div>

                  <div className="payment-type-list">
                    {reportData.paymentTypes.map((item) => (
                      <div className="payment-type-row" key={item.type}>
                        <div>
                          <strong>{item.type}</strong>
                          <span>{item.count} transactions</span>
                        </div>
                        <strong>{currency(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="reports-panel overdue-panel">
                <div className="reports-panel-heading">
                  <div>
                    <h2>Overdue Accounts</h2>
                    <p>Invoices with overdue EMI installments</p>
                  </div>

                  <span className="overdue-count">
                    {reportData.overdueInvoices.length} Overdue
                  </span>
                </div>

                {reportData.overdueInvoices.length === 0 ? (
                  <div className="reports-empty">
                    No overdue accounts found for this period.
                  </div>
                ) : (
                  <div className="reports-table-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Customer</th>
                          <th>Invoice Date</th>
                          <th>Outstanding</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reportData.overdueInvoices.map((invoice) => (
                          <tr key={invoice._id}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{invoice.customer?.name || "—"}</td>
                            <td>{formatDate(invoice.invoiceDate)}</td>
                            <td>{currency(invoice.balanceDue)}</td>
                            <td>
                              <span className="overdue-badge">
                                {invoice.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="reports-panel invoice-panel">
                <div className="reports-panel-heading">
                  <div>
                    <h2>Sales & Invoice Report</h2>
                    <p>Invoice details for the selected period</p>
                  </div>

                  <span className="report-record-count">
                    {reportData.filteredInvoices.length} Records
                  </span>
                </div>

                {reportData.filteredInvoices.length === 0 ? (
                  <div className="reports-empty">
                    No invoices found for this period.
                  </div>
                ) : (
                  <div className="reports-table-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Invoice Number</th>
                          <th>Customer</th>
                          <th>Bike Price</th>
                          <th>Total Payable</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Payment Type</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reportData.filteredInvoices.map((invoice) => (
                          <tr key={invoice._id}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{invoice.customer?.name || "—"}</td>
                            <td>{currency(invoice.bikePrice)}</td>
                            <td>{currency(invoice.totalPayable)}</td>
                            <td className="report-paid">
                              {currency(invoice.totalPaid)}
                            </td>
                            <td>{currency(invoice.balanceDue)}</td>
                            <td>{invoice.paymentType}</td>
                            <td>
                              <span
                                className={`report-status ${String(
                                  invoice.paymentStatus || "Pending",
                                )
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {invoice.paymentStatus || "Pending"}
                              </span>
                            </td>
                            <td>{formatDate(invoice.invoiceDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="reports-footer">
                Generated from BikeLedger records ·{" "}
                {new Date().toLocaleString("en-IN")}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
