import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "../styles/Customers.css";

const emptyForm = {
  name: "",
  phone: "",
  alternatePhone: "",
  address: "",
  guarantorName: "",
  guarantorPhone: "",
  notes: "",
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch customers
  const fetchCustomers = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers", {
        params: { search: searchValue },
      });

      setCustomers(response.data.customers);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load customers");
    } finally {
      setLoading(false);
    }
  };

  

  // Search customers
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Form input handler
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Open new customer form
  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (customer) => {
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      alternatePhone: customer.alternatePhone || "",
      address: customer.address || "",
      guarantorName: customer.guarantorName || "",
      guarantorPhone: customer.guarantorPhone || "",
      notes: customer.notes || "",
    });

    setEditingId(customer._id);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Save customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        setSuccess("Customer updated successfully");
      } else {
        await api.post("/customers", formData);
        setSuccess("Customer added successfully");
      }

      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchCustomers(search);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save customer");
    } finally {
      setSaving(false);
    }
  };

  // Delete customer
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/customers/${id}`);

      setSuccess("Customer deleted successfully");
      await fetchCustomers(search);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete customer");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="customers-main">
        <header className="customers-header">
          <div>
            <h1>Customers</h1>
            <p>Manage your two-wheeler customers.</p>
          </div>

          <button className="add-customer-button" onClick={openAddForm}>
            + Add Customer
          </button>
        </header>

        <div className="customer-summary">
          <div>
            <span>Total Active Customers</span>
            <h2>{customers.length}</h2>
          </div>
          <div className="customer-summary-icon">♙</div>
        </div>

        <div className="customer-toolbar">
          <input
            type="search"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="customer-alert error">{error}</div>}

        {success && <div className="customer-alert success">{success}</div>}

        {showForm && (
          <section className="customer-form-card">
            <div className="customer-form-heading">
              <h2>{editingId ? "Edit Customer" : "Add New Customer"}</h2>

              <button type="button" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <div className="customer-field">
                  <label>Customer Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="customer-field">
                  <label>Phone Number *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="customer-field">
                  <label>Alternate Phone</label>
                  <input
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="Optional phone number"
                  />
                </div>

                <div className="customer-field">
                  <label>Guarantor Name</label>
                  <input
                    name="guarantorName"
                    value={formData.guarantorName}
                    onChange={handleChange}
                    placeholder="Enter guarantor name"
                  />
                </div>

                <div className="customer-field">
                  <label>Guarantor Phone</label>
                  <input
                    name="guarantorPhone"
                    value={formData.guarantorPhone}
                    onChange={handleChange}
                    placeholder="Enter guarantor phone"
                  />
                </div>

                <div className="customer-field full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter customer address"
                    required
                  />
                </div>

                <div className="customer-field full-width">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="customer-form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="save-button" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="customer-table-card">
          <div className="customer-table-heading">
            <h2>Customer Records</h2>
            <span>{customers.length} records</span>
          </div>

          {loading ? (
            <p className="customer-empty">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="customer-empty">
              No customers found. Add your first customer.
            </p>
          ) : (
            <div className="customer-table-wrapper">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.address}</td>
                      <td>
                        {new Date(customer.createdAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td>
                        <div className="customer-actions">
                          <button
                            className="edit-button"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(customer._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Customers;
