import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

import "../styles/BikeInventory.css";

// Create a fresh form object whenever the form is reset
const createInitialForm = () => ({
  brand: "",
  model: "",
  category: "Motorcycle",
  imageUrl: "",
  price: "",
  stock: 3,
  colors: "",
});

const BikeInventory = () => {
  // Inventory data
  const [bikes, setBikes] = useState([]);

  // Loading and request states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [formData, setFormData] = useState(createInitialForm);

  // -----------------------------------------
  // 1. FETCH BIKE INVENTORY
  // -----------------------------------------

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/inventory");

      setBikes(response.data.bikes || []);
    } catch (err) {
      console.error("Inventory loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load bike inventory. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // -----------------------------------------
  // 2. INVENTORY SUMMARY
  // -----------------------------------------

  const totalModels = bikes.length;

  const totalStock = bikes.reduce(
    (total, bike) => total + Number(bike.stock || 0),
    0,
  );

  const availableModels = bikes.filter((bike) => Number(bike.stock) > 0).length;

  // -----------------------------------------
  // 3. SEARCH AND FILTER
  // -----------------------------------------

  const filteredBikes = useMemo(() => {
    return bikes.filter((bike) => {
      const searchText = search.trim().toLowerCase();

      const brand = (bike.brand || "").toLowerCase();
      const model = (bike.model || "").toLowerCase();

      const matchesSearch =
        brand.includes(searchText) || model.includes(searchText);

      const matchesCategory =
        categoryFilter === "All" || bike.category === categoryFilter;

      const matchesBrand = brandFilter === "All" || bike.brand === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [bikes, search, categoryFilter, brandFilter]);

  const brands = useMemo(() => {
    return [...new Set(bikes.map((bike) => bike.brand).filter(Boolean))].sort();
  }, [bikes]);

  // -----------------------------------------
  // 4. OPEN ADD BIKE FORM
  // -----------------------------------------

  const handleAddBike = () => {
    setEditingBike(null);
    setFormData(createInitialForm());

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // -----------------------------------------
  // 5. OPEN EDIT BIKE FORM
  // -----------------------------------------

  const handleEditBike = (bike) => {
    setEditingBike(bike);

    setFormData({
      brand: bike.brand || "",
      model: bike.model || "",
      category: bike.category || "Motorcycle",
      imageUrl: bike.imageUrl || "",
      price: bike.price ?? "",
      stock: bike.stock ?? 0,
      colors: (bike.colors || []).join(", "),
    });

    setError("");
    setSuccess("");

    setShowForm(true);

    // Scroll to the edit form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------------------
  // 6. HANDLE FORM INPUT CHANGES
  // -----------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // 7. ADD OR UPDATE BIKE MODEL
  // -----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        category: formData.category,
        imageUrl: formData.imageUrl.trim(),

        price:
          formData.price === "" || formData.price === null
            ? null
            : Number(formData.price),

        stock: Number(formData.stock),

        colors: formData.colors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean),
      };

      // Required field validation
      if (!payload.brand || !payload.model || !payload.imageUrl) {
        setError("Please complete all required fields.");
        return;
      }

      // Price validation
      if (
        payload.price !== null &&
        (!Number.isFinite(payload.price) || payload.price < 0)
      ) {
        setError("Enter a valid bike price.");
        return;
      }

      // Stock validation
      if (!Number.isInteger(payload.stock) || payload.stock < 0) {
        setError("Stock must be a whole number greater than or equal to zero.");
        return;
      }

      if (editingBike) {
        // UPDATE EXISTING INVENTORY DOCUMENT
        const response = await api.put(
          `/inventory/${editingBike._id}`,
          payload,
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Unable to update bike model.",
          );
        }

        setSuccess("Bike model and stock updated successfully.");
      } else {
        // ADD NEW INVENTORY DOCUMENT
        const response = await api.post("/inventory", payload);

        if (!response.data.success) {
          throw new Error(response.data.message || "Unable to add bike model.");
        }

        setSuccess("Bike model added successfully.");
      }

      // Reset form after successful operation
      setShowForm(false);
      setEditingBike(null);
      setFormData(createInitialForm());

      // Refresh inventory
      await fetchInventory();
    } catch (err) {
      console.error("Saving inventory error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save bike details.",
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // 8. PERMANENTLY DELETE BIKE MODEL
  // -----------------------------------------

  const handleDeleteBike = async (bike) => {
    if (deletingId || saving) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${bike.brand} ${bike.model}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(bike._id);

      setError("");
      setSuccess("");

      // Permanently delete inventory document
      const response = await api.delete(`/inventory/${bike._id}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to delete bike model.",
        );
      }

      setSuccess(
        response.data.message ||
          `${bike.brand} ${bike.model} deleted successfully.`,
      );

      // Close edit form if the deleted bike was being edited
      if (editingBike?._id === bike._id) {
        setShowForm(false);
        setEditingBike(null);
        setFormData(createInitialForm());
      }

      // Refresh inventory from MongoDB
      await fetchInventory();
    } catch (err) {
      console.error("Delete inventory error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete this bike model.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------
  // 9. CLOSE FORM
  // -----------------------------------------

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBike(null);
    setFormData(createInitialForm());

    setError("");
  };

  // -----------------------------------------
  // 10. RENDER PAGE
  // -----------------------------------------

  return (
    <div className="inventory-layout">
      <Sidebar />

      <main className="inventory-main">
        {/* PAGE HEADER */}

        <header className="inventory-header">
          <div>
            <h1>Bike Inventory</h1>

            <p>Manage showroom bike models, prices and available stock.</p>
          </div>

          <button
            type="button"
            className="inventory-add-button"
            onClick={handleAddBike}
          >
            + Add Bike Model
          </button>
        </header>

        {/* INVENTORY SUMMARY */}

        <section className="inventory-summary">
          <div className="inventory-summary-card">
            <span>Total Bike Models</span>
            <h2>{loading ? "..." : totalModels}</h2>
            <p>Registered models</p>
          </div>

          <div className="inventory-summary-card">
            <span>Total Available Stock</span>
            <h2>{loading ? "..." : totalStock}</h2>
            <p>Individual units</p>
          </div>

          <div className="inventory-summary-card">
            <span>Models In Stock</span>
            <h2>{loading ? "..." : availableModels}</h2>
            <p>Models with available units</p>
          </div>
        </section>

        {/* ERROR AND SUCCESS MESSAGES */}

        {error && (
          <div className="inventory-message error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="inventory-message success" role="status">
            {success}
          </div>
        )}

        {/* ADD / EDIT BIKE FORM */}

        {showForm && (
          <section className="inventory-form-card">
            <div className="inventory-form-heading">
              <h2>{editingBike ? "Edit Bike Model" : "Add Bike Model"}</h2>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="inventory-form-grid">
                {/* BRAND */}

                <div className="inventory-field">
                  <label htmlFor="brand">Brand *</label>

                  <input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g. Hero"
                    required
                  />
                </div>

                {/* MODEL */}

                <div className="inventory-field">
                  <label htmlFor="model">Model *</label>

                  <input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. Splendor Plus"
                    required
                  />
                </div>

                {/* CATEGORY */}

                <div className="inventory-field">
                  <label htmlFor="category">Vehicle Category *</label>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                </div>

                {/* PRICE */}

                <div className="inventory-field">
                  <label htmlFor="price">Bike Price (₹)</label>

                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter actual selling price"
                  />
                </div>

                {/* STOCK */}

                <div className="inventory-field">
                  <label htmlFor="stock">Available Stock *</label>

                  <input
                    id="stock"
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                  />
                </div>

                {/* COLOURS */}

                <div className="inventory-field">
                  <label htmlFor="colors">Available Colours</label>

                  <input
                    id="colors"
                    name="colors"
                    value={formData.colors}
                    onChange={handleChange}
                    placeholder="Black, Blue, Red"
                  />
                </div>

                {/* IMAGE URL */}

                <div className="inventory-field full-width">
                  <label htmlFor="imageUrl">Bike Image URL *</label>

                  <input
                    id="imageUrl"
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Paste bike image URL"
                    required
                  />
                </div>
              </div>

              {/* FORM BUTTONS */}

              <div className="inventory-form-actions">
                <button
                  type="button"
                  className="inventory-cancel-button"
                  onClick={handleCloseForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inventory-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBike
                      ? "Update Model"
                      : "Add Model"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SEARCH AND FILTERS */}

        <section className="inventory-toolbar">
          <input
            type="text"
            placeholder="Search by bike brand or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="All">All Brands</option>

            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Motorcycle">Motorcycles</option>
            <option value="Scooter">Scooters</option>
          </select>
        </section>

        {/* BIKE INVENTORY CARDS */}

        <section className="inventory-section">
          <div className="inventory-section-heading">
            <h2>Available Bike Models</h2>

            <span>{filteredBikes.length} models</span>
          </div>

          {loading ? (
            <div className="inventory-empty">Loading bike inventory...</div>
          ) : filteredBikes.length === 0 ? (
            <div className="inventory-empty">No bike models found.</div>
          ) : (
            <div className="inventory-grid">
              {filteredBikes.map((bike) => (
                <article className="inventory-bike-card" key={bike._id}>
                  {/* BIKE IMAGE */}

                  <div className="inventory-image-wrapper">
                    <img
                      src={bike.imageUrl}
                      alt={`${bike.brand} ${bike.model}`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";

                        const fallback = e.currentTarget.nextElementSibling;

                        if (fallback) {
                          fallback.style.display = "flex";
                        }
                      }}
                    />

                    <div
                      className="inventory-image-fallback"
                      style={{ display: "none" }}
                    >
                      Bike image unavailable
                    </div>
                  </div>

                  {/* BIKE DETAILS */}

                  <div className="inventory-bike-details">
                    <span className="inventory-brand">{bike.brand}</span>

                    <h3>{bike.model}</h3>

                    <span className="inventory-category">{bike.category}</span>

                    {/* PRICE */}

                    <div className="inventory-price">
                      {bike.price == null
                        ? "Price not set"
                        : `₹${Number(bike.price).toLocaleString("en-IN")}`}
                    </div>

                    {/* STOCK */}

                    <div className="inventory-stock-row">
                      <span>Available Stock</span>

                      <strong
                        className={
                          Number(bike.stock) > 0
                            ? "stock-available"
                            : "stock-empty"
                        }
                      >
                        {bike.stock} units
                      </strong>
                    </div>

                    {/* COLOURS */}

                    <p className="inventory-colors">
                      Colours:{" "}
                      {(bike.colors || []).join(", ") || "Not specified"}
                    </p>

                    {/* ACTION BUTTONS */}

                    <div className="inventory-card-actions">
                      <button
                        type="button"
                        className="inventory-edit-button"
                        onClick={() => handleEditBike(bike)}
                        disabled={Boolean(deletingId) || saving}
                      >
                        Edit / Update Stock
                      </button>

                      <button
                        type="button"
                        className="inventory-delete-button"
                        onClick={() => handleDeleteBike(bike)}
                        disabled={Boolean(deletingId) || saving}
                      >
                        {deletingId === bike._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BikeInventory;
