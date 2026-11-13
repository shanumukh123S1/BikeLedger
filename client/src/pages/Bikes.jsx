import { useEffect, useState } from "react";

import api from "../services/api";
import Sidebar from "../components/Sidebar";

import "../styles/Bikes.css";

const emptyForm = {
  customer: "",
  inventoryBike: "",
  brand: "",
  model: "",
  colour: "",
  registrationNumber: "",
  chassisNumber: "",
  engineNumber: "",
  purchaseDate: "",
  bikePrice: "",
};

const Bikes = () => {
  const [bikes, setBikes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // FETCH CUSTOMER BIKE RECORDS
  const fetchBikes = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bikes", {
        params: { search: searchValue },
      });

      setBikes(response.data.bikes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load bikes");
    } finally {
      setLoading(false);
    }
  };

  // FETCH ACTIVE CUSTOMERS
  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load customers");
    }
  };

  // FETCH BIKE INVENTORY
  const fetchInventory = async () => {
    try {
      const response = await api.get("/inventory");

      const inventoryItems =
        response.data.inventory ||
        response.data.bikes ||
        response.data.items ||
        [];

      setInventory(inventoryItems);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load bike inventory");
    }
  };

  // INITIAL DATA LOADING
  useEffect(() => {
    fetchCustomers();
    fetchInventory();
  }, []);

  // SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBikes(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // FORM INPUT CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SELECT / IMPORT BIKE FROM INVENTORY
  const handleInventoryChange = (e) => {
    const selectedId = e.target.value;

    const selectedBike = inventory.find((bike) => bike._id === selectedId);

    if (!selectedBike) {
      setFormData((previous) => ({
        ...previous,
        inventoryBike: "",
        brand: "",
        model: "",
        colour: "",
        bikePrice: "",
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      inventoryBike: selectedBike._id,
      brand: selectedBike.brand,
      model: selectedBike.model,
      colour: "",
      // Automatically populate the showroom price.
      bikePrice:
        selectedBike.price !== null && selectedBike.price !== undefined
          ? String(selectedBike.price)
          : "",
    }));
  };

  // OPEN ADD FORM
  const openAddForm = () => {
    setFormData({
      ...emptyForm,
      purchaseDate: new Date().toISOString().split("T")[0],
    });

    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEdit = (bike) => {
    setFormData({
      customer: bike.customer?._id || "",
      inventoryBike: bike.inventoryBike?._id || "",
      brand: bike.brand || "",
      model: bike.model || "",
      colour: bike.colour || "",
      registrationNumber: bike.registrationNumber || "",
      chassisNumber: bike.chassisNumber || "",
      engineNumber: bike.engineNumber || "",
      purchaseDate: bike.purchaseDate
        ? new Date(bike.purchaseDate).toISOString().split("T")[0]
        : "",
      bikePrice: String(bike.bikePrice ?? ""),
    });

    setEditingId(bike._id);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // SAVE OR UPDATE BIKE
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Common customer bike details
      const payload = {
        customer: formData.customer,
        colour: formData.colour,
        registrationNumber: formData.registrationNumber,
        chassisNumber: formData.chassisNumber,
        engineNumber: formData.engineNumber,
        purchaseDate: formData.purchaseDate,
      };

      if (editingId) {
        // UPDATE EXISTING CUSTOMER BIKE
        // Purchase price and inventory stock remain unchanged.
        await api.put(`/bikes/${editingId}`, {
          ...payload,
          brand: formData.brand,
          model: formData.model,
        });

        setSuccess("Bike details updated successfully.");
      } else {
        // NEW BIKE REGISTRATION

        // Check inventory selection
        if (!formData.inventoryBike) {
          setError("Please select a bike from inventory.");
          return;
        }

        // Find selected inventory bike
        const selectedBike = inventory.find(
          (bike) => bike._id === formData.inventoryBike,
        );

        if (!selectedBike) {
          setError("Selected inventory bike was not found.");
          return;
        }

        // Get showroom price
        const showroomPrice = Number(selectedBike.price);

        // Get actual purchase price
        const purchasePrice = Number(formData.bikePrice);

        // Validate showroom price
        if (
          selectedBike.price === null ||
          selectedBike.price === undefined ||
          !Number.isFinite(showroomPrice) ||
          showroomPrice <= 0
        ) {
          setError(
            "A valid showroom price is required. Please update the price in Bike Inventory.",
          );
          return;
        }

        // Validate purchase price
        if (
          formData.bikePrice === "" ||
          !Number.isFinite(purchasePrice) ||
          purchasePrice <= 0
        ) {
          setError("Please enter a valid bike purchase price.");
          return;
        }

        // Purchase price must not exceed showroom price
        if (purchasePrice > showroomPrice) {
          setError(
            `Purchase price cannot exceed the showroom price of ₹${showroomPrice.toLocaleString("en-IN")}.`,
          );
          return;
        }

        // REGISTER CUSTOMER BIKE
        await api.post("/bikes", {
          ...payload,
          inventoryBike: formData.inventoryBike,
          bikePrice: purchasePrice,
        });

        setSuccess(
          "Bike registered successfully. Purchase price saved and inventory stock reduced by one.",
        );
      }

      // RESET FORM AFTER SUCCESS
      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);

      // REFRESH BIKE RECORDS AND INVENTORY
      await Promise.all([fetchBikes(search), fetchInventory()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save bike details");
    } finally {
      setSaving(false);
    }
  };

  // DELETE BIKE RECORD
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this bike record?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/bikes/${id}`);

      setSuccess("Bike record deleted successfully.");

      await fetchBikes(search);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete bike");
    }
  };

  // AVAILABLE INVENTORY ITEMS
  const availableInventory = inventory.filter(
    (bike) => bike.isActive !== false && Number(bike.stock) > 0,
  );

  // SELECTED INVENTORY BIKE
  const selectedInventoryBike = inventory.find(
    (bike) => bike._id === formData.inventoryBike,
  );

  // CURRENT SHOWROOM PRICE
  const showroomPrice = selectedInventoryBike
    ? Number(selectedInventoryBike.price)
    : 0;

  // CHECK WHETHER SHOWROOM PRICE IS VALID
  const validShowroomPrice =
    selectedInventoryBike &&
    selectedInventoryBike.price !== null &&
    selectedInventoryBike.price !== undefined &&
    Number.isFinite(showroomPrice) &&
    showroomPrice > 0;

  // CHECK WHETHER PURCHASE PRICE IS VALID
  const purchasePrice = Number(formData.bikePrice);

  const validPurchasePrice =
    formData.bikePrice !== "" &&
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0 &&
    validShowroomPrice &&
    purchasePrice <= showroomPrice;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="bikes-main">
        <header className="bikes-header">
          <div>
            <h1>Bike Management</h1>
            <p>Manage customer bike and purchase details.</p>
          </div>

          <button className="add-bike-button" onClick={openAddForm}>
            + Add Bike
          </button>
        </header>

        {/* BIKE SUMMARY */}
        <section className="bike-summary">
          <div>
            <span>Total Bike Records</span>
            <h2>{bikes.length}</h2>
          </div>

          <div className="bike-summary-icon">🏍</div>
        </section>

        {/* SEARCH */}
        <div className="bike-toolbar">
          <input
            type="search"
            placeholder="Search by brand, model or registration number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ALERTS */}
        {error && <div className="bike-alert error">{error}</div>}

        {success && <div className="bike-alert success">{success}</div>}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <section className="bike-form-card">
            <div className="bike-form-heading">
              <h2>{editingId ? "Edit Bike Details" : "Register New Bike"}</h2>

              <button type="button" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bike-form-grid">
                {/* CUSTOMER SELECTION */}
                <div className="bike-field full-width">
                  <label>Select Customer *</label>

                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose a customer</option>

                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>

                  {customers.length === 0 && (
                    <small>
                      No active customers available. Add a customer first.
                    </small>
                  )}
                </div>

                {/* IMPORT / SELECT BIKE FROM INVENTORY */}
                {!editingId && (
                  <div className="bike-field full-width">
                    <label>Import Bike from Inventory *</label>

                    <select
                      name="inventoryBike"
                      value={formData.inventoryBike}
                      onChange={handleInventoryChange}
                      required
                    >
                      <option value="">Choose an available bike</option>

                      {availableInventory.map((bike) => (
                        <option key={bike._id} value={bike._id}>
                          {bike.brand} {bike.model} — Stock: {bike.stock}
                        </option>
                      ))}
                    </select>

                    {availableInventory.length === 0 && (
                      <small>
                        No bikes are currently available in inventory. Add stock
                        from Bike Inventory first.
                      </small>
                    )}
                  </div>
                )}

                {/* SELECTED BIKE IMAGE AND DETAILS */}
                {!editingId && selectedInventoryBike && (
                  <div className="bike-field full-width">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        padding: "14px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        background: "#f8fafc",
                      }}
                    >
                      <img
                        src={selectedInventoryBike.imageUrl}
                        alt={`${selectedInventoryBike.brand} ${selectedInventoryBike.model}`}
                        style={{
                          width: "130px",
                          height: "100px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          background: "#fff",
                        }}
                      />

                      <div>
                        <strong>
                          {selectedInventoryBike.brand}{" "}
                          {selectedInventoryBike.model}
                        </strong>

                        <p>
                          Showroom Price:{" "}
                          {validShowroomPrice
                            ? `₹${showroomPrice.toLocaleString("en-IN")}`
                            : "Price not set"}
                        </p>

                        <p>Available Stock: {selectedInventoryBike.stock}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EDIT MODE: EXISTING BIKE DETAILS */}
                {editingId && (
                  <>
                    <div className="bike-field">
                      <label>Bike Brand *</label>

                      <input
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="bike-field">
                      <label>Bike Model *</label>

                      <input
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                )}

                {/* COLOUR */}
                <div className="bike-field">
                  <label>Colour</label>

                  {!editingId && selectedInventoryBike?.colors?.length > 0 ? (
                    <select
                      name="colour"
                      value={formData.colour}
                      onChange={handleChange}
                    >
                      <option value="">Choose colour</option>

                      {selectedInventoryBike.colors.map((colour, index) => (
                        <option key={index} value={colour}>
                          {colour}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="colour"
                      value={formData.colour}
                      onChange={handleChange}
                      placeholder="Enter bike colour"
                    />
                  )}
                </div>

                {/* REGISTRATION NUMBER */}
                <div className="bike-field">
                  <label>Registration Number</label>

                  <input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Example: AP XX AB 1234"
                  />
                </div>

                {/* CHASSIS NUMBER */}
                <div className="bike-field">
                  <label>Chassis Number</label>

                  <input
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    placeholder="Enter chassis number"
                  />
                </div>

                {/* ENGINE NUMBER */}
                <div className="bike-field">
                  <label>Engine Number</label>

                  <input
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    placeholder="Enter engine number"
                  />
                </div>

                {/* PURCHASE DATE */}
                <div className="bike-field">
                  <label>Purchase Date *</label>

                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* PURCHASE PRICE */}
                <div className="bike-field">
                  <label>Bike Purchase Price (₹) *</label>

                  <input
                    type="number"
                    name="bikePrice"
                    value={formData.bikePrice}
                    onChange={handleChange}
                    placeholder="Enter actual purchase price"
                    min="1"
                    max={
                      !editingId && validShowroomPrice
                        ? showroomPrice
                        : undefined
                    }
                    step="0.01"
                    required
                    readOnly={Boolean(editingId)}
                  />

                  {!editingId && selectedInventoryBike && (
                    <small>
                      Showroom Price:{" "}
                      {validShowroomPrice
                        ? `₹${showroomPrice.toLocaleString("en-IN")}`
                        : "Price not configured"}
                      <br />
                      Default price is the showroom price. Discounts are
                      allowed, but the purchase price cannot exceed it.
                    </small>
                  )}

                  {editingId && (
                    <small>
                      Original purchase price is preserved and cannot be changed
                      during editing.
                    </small>
                  )}
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="bike-form-actions">
                <button
                  type="button"
                  className="bike-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bike-save-button"
                  disabled={
                    saving ||
                    customers.length === 0 ||
                    (!editingId &&
                      (!formData.inventoryBike ||
                        !selectedInventoryBike ||
                        !validShowroomPrice ||
                        !validPurchasePrice))
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Bike"
                      : "Confirm Purchase & Register"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* BIKE RECORDS */}
        <section className="bike-table-card">
          <div className="bike-table-heading">
            <h2>Bike Records</h2>
            <span>{bikes.length} records</span>
          </div>

          {loading ? (
            <p className="bike-empty">Loading bike records...</p>
          ) : bikes.length === 0 ? (
            <p className="bike-empty">
              No bike records found. Add your first bike.
            </p>
          ) : (
            <div className="bike-table-wrapper">
              <table className="bike-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Brand / Model</th>
                    <th>Registration No.</th>
                    <th>Purchase Date</th>
                    <th>Bike Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bikes.map((bike) => (
                    <tr key={bike._id}>
                      <td>
                        <strong>{bike.customer?.name || "Unknown"}</strong>

                        <small>{bike.customer?.phone || ""}</small>
                      </td>

                      <td>
                        {bike.brand} {bike.model}
                      </td>

                      <td>{bike.registrationNumber || "Not available"}</td>

                      <td>
                        {new Date(bike.purchaseDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>

                      <td>₹{Number(bike.bikePrice).toLocaleString("en-IN")}</td>

                      <td>
                        <div className="bike-actions">
                          <button
                            className="bike-edit-button"
                            onClick={() => handleEdit(bike)}
                          >
                            Edit
                          </button>

                          <button
                            className="bike-delete-button"
                            onClick={() => handleDelete(bike._id)}
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

export default Bikes;
