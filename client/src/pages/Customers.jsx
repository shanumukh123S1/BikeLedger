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
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Convert MongoDB date values safely
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN");
  };

  // Fetch customers from the Express API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");
      const customerList = (response.data.customers || []).map((customer) => ({
        ...customer,
        id: customer._id,
      }));

      setCustomers(customerList);
    } catch (err) {
      console.error("Fetch customers error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Unable to load customers. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load customers when page opens
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by name or phone
  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return true;

    return (
      (customer.name || "").toLowerCase().includes(searchValue) ||
      (customer.phone || "").includes(searchValue) ||
      (customer.alternatePhone || "").includes(searchValue)
    );
  });

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open add customer form
  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit customer form
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

    setEditingId(customer.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Validate customer form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return false;
    }

    if (
      formData.alternatePhone.trim() &&
      !/^\d{10}$/.test(formData.alternatePhone.trim())
    ) {
      setError("Enter a valid 10-digit alternate phone number.");
      return false;
    }

    if (
      formData.guarantorPhone.trim() &&
      !/^\d{10}$/.test(formData.guarantorPhone.trim())
    ) {
      setError("Enter a valid 10-digit guarantor phone number.");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Customer address is required.");
      return false;
    }

    return true;
  };

  // Add or update customer through the Express API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        address: formData.address.trim(),
        guarantorName: formData.guarantorName.trim(),
        guarantorPhone: formData.guarantorPhone.trim(),
        notes: formData.notes.trim(),
      };

      if (editingId) {
        await api.put(`/customers/${editingId}`, customerData);
        setSuccess("Customer updated successfully!");
      } else {
        await api.post("/customers", customerData);
        setSuccess("Customer added successfully!");
      }

      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchCustomers();
    } catch (err) {
      console.error("Save customer error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Unable to save customer. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete customer through the Express API
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this customer?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await api.delete(`/customers/${id}`);

      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== id)
      );

      setSuccess("Customer deleted successfully!");
    } catch (err) {
      console.error("Delete customer error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Unable to delete customer. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="customers-main">

        {/* Header */}
        <header className="customers-header">
          <div>
            <h1>Customers</h1>
            <p>Manage your two-wheeler customers.</p>
          </div>

          <button
            className="add-customer-button"
            onClick={openAddForm}
          >
            + Add Customer
          </button>
        </header>

        {/* Customer Summary */}
        <div className="customer-summary">
          <div>
            <span>Total Active Customers</span>
            <h2>{customers.length}</h2>
          </div>

          <div className="customer-summary-icon">
            ♙
          </div>
        </div>

        {/* Search */}
        <div className="customer-toolbar">
          <input
            type="search"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="customer-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="customer-alert success" role="status">
            {success}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <section className="customer-form-card">

            <div className="customer-form-heading">
              <h2>
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
              >
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
                    type="tel"
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
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="Optional phone number"
                    maxLength={10}
                    inputMode="numeric"
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
                    type="tel"
                    value={formData.guarantorPhone}
                    onChange={handleChange}
                    placeholder="Enter guarantor phone"
                    maxLength={10}
                    inputMode="numeric"
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
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >
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

        {/* Customer Records */}
        <section className="customer-table-card">

          <div className="customer-table-heading">
            <h2>Customer Records</h2>
            <span>{filteredCustomers.length} records</span>
          </div>

          {loading ? (
            <p className="customer-empty">
              Loading customers...
            </p>
          ) : filteredCustomers.length === 0 ? (
            <p className="customer-empty">
              {search
                ? "No matching customers found."
                : "No customers found. Add your first customer."}
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
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>

                      <td>{customer.name}</td>

                      <td>{customer.phone}</td>

                      <td>{customer.address}</td>

                      <td>{formatDate(customer.createdAt)}</td>

                      <td>
                        <div className="customer-actions">

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(customer.id)}
                            disabled={deletingId === customer.id}
                          >
                            {deletingId === customer.id
                              ? "Deleting..."
                              : "Delete"}
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
