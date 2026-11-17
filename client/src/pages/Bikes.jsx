// import { useEffect, useState } from "react";

// import api from "../services/api";
// import Sidebar from "../components/Sidebar";

// import "../styles/Bikes.css";

// const emptyForm = {
//   customer: "",
//   inventoryBike: "",
//   brand: "",
//   model: "",
//   colour: "",
//   registrationNumber: "",
//   chassisNumber: "",
//   engineNumber: "",
//   purchaseDate: "",
//   bikePrice: "",
// };

// const Bikes = () => {
//   const [bikes, setBikes] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [inventory, setInventory] = useState([]);

//   const [search, setSearch] = useState("");
//   const [formData, setFormData] = useState(emptyForm);

//   const [editingId, setEditingId] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // FETCH CUSTOMER BIKE RECORDS
//   const fetchBikes = async (searchValue = "") => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await api.get("/bikes", {
//         params: { search: searchValue },
//       });

//       setBikes(response.data.bikes || []);
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to load bikes");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // FETCH ACTIVE CUSTOMERS
//   const fetchCustomers = async () => {
//     try {
//       const response = await api.get("/customers");
//       setCustomers(response.data.customers || []);
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to load customers");
//     }
//   };

//   // FETCH BIKE INVENTORY
//   const fetchInventory = async () => {
//     try {
//       const response = await api.get("/inventory");

//       const inventoryItems =
//         response.data.inventory ||
//         response.data.bikes ||
//         response.data.items ||
//         [];

//       setInventory(inventoryItems);
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to load bike inventory");
//     }
//   };

//   // INITIAL DATA LOADING
//   useEffect(() => {
//     fetchCustomers();
//     fetchInventory();
//   }, []);

//   // SEARCH
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       fetchBikes(search);
//     }, 350);

//     return () => clearTimeout(timer);
//   }, [search]);

//   // FORM INPUT CHANGES
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   // SELECT / IMPORT BIKE FROM INVENTORY
//   const handleInventoryChange = (e) => {
//     const selectedId = e.target.value;

//     const selectedBike = inventory.find((bike) => bike._id === selectedId);

//     if (!selectedBike) {
//       setFormData((previous) => ({
//         ...previous,
//         inventoryBike: "",
//         brand: "",
//         model: "",
//         colour: "",
//         bikePrice: "",
//       }));

//       return;
//     }

//     setFormData((previous) => ({
//       ...previous,
//       inventoryBike: selectedBike._id,
//       brand: selectedBike.brand,
//       model: selectedBike.model,
//       colour: "",
//       // Automatically populate the showroom price.
//       bikePrice:
//         selectedBike.price !== null && selectedBike.price !== undefined
//           ? String(selectedBike.price)
//           : "",
//     }));
//   };

//   // OPEN ADD FORM
//   const openAddForm = () => {
//     setFormData({
//       ...emptyForm,
//       purchaseDate: new Date().toISOString().split("T")[0],
//     });

//     setEditingId(null);
//     setError("");
//     setSuccess("");
//     setShowForm(true);
//   };

//   // OPEN EDIT FORM
//   const handleEdit = (bike) => {
//     setFormData({
//       customer: bike.customer?._id || "",
//       inventoryBike: bike.inventoryBike?._id || "",
//       brand: bike.brand || "",
//       model: bike.model || "",
//       colour: bike.colour || "",
//       registrationNumber: bike.registrationNumber || "",
//       chassisNumber: bike.chassisNumber || "",
//       engineNumber: bike.engineNumber || "",
//       purchaseDate: bike.purchaseDate
//         ? new Date(bike.purchaseDate).toISOString().split("T")[0]
//         : "",
//       bikePrice: String(bike.bikePrice ?? ""),
//     });

//     setEditingId(bike._id);
//     setError("");
//     setSuccess("");
//     setShowForm(true);
//   };

//   // SAVE OR UPDATE BIKE
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       // Common customer bike details
//       const payload = {
//         customer: formData.customer,
//         colour: formData.colour,
//         registrationNumber: formData.registrationNumber,
//         chassisNumber: formData.chassisNumber,
//         engineNumber: formData.engineNumber,
//         purchaseDate: formData.purchaseDate,
//       };

//       if (editingId) {
//         // UPDATE EXISTING CUSTOMER BIKE
//         // Purchase price and inventory stock remain unchanged.
//         await api.put(`/bikes/${editingId}`, {
//           ...payload,
//           brand: formData.brand,
//           model: formData.model,
//         });

//         setSuccess("Bike details updated successfully.");
//       } else {
//         // NEW BIKE REGISTRATION

//         // Check inventory selection
//         if (!formData.inventoryBike) {
//           setError("Please select a bike from inventory.");
//           return;
//         }

//         // Find selected inventory bike
//         const selectedBike = inventory.find(
//           (bike) => bike._id === formData.inventoryBike,
//         );

//         if (!selectedBike) {
//           setError("Selected inventory bike was not found.");
//           return;
//         }

//         // Get showroom price
//         const showroomPrice = Number(selectedBike.price);

//         // Get actual purchase price
//         const purchasePrice = Number(formData.bikePrice);

//         // Validate showroom price
//         if (
//           selectedBike.price === null ||
//           selectedBike.price === undefined ||
//           !Number.isFinite(showroomPrice) ||
//           showroomPrice <= 0
//         ) {
//           setError(
//             "A valid showroom price is required. Please update the price in Bike Inventory.",
//           );
//           return;
//         }

//         // Validate purchase price
//         if (
//           formData.bikePrice === "" ||
//           !Number.isFinite(purchasePrice) ||
//           purchasePrice <= 0
//         ) {
//           setError("Please enter a valid bike purchase price.");
//           return;
//         }

//         // Purchase price must not exceed showroom price
//         if (purchasePrice > showroomPrice) {
//           setError(
//             `Purchase price cannot exceed the showroom price of ₹${showroomPrice.toLocaleString("en-IN")}.`,
//           );
//           return;
//         }

//         // REGISTER CUSTOMER BIKE
//         await api.post("/bikes", {
//           ...payload,
//           inventoryBike: formData.inventoryBike,
//           bikePrice: purchasePrice,
//         });

//         setSuccess(
//           "Bike registered successfully. Purchase price saved and inventory stock reduced by one.",
//         );
//       }

//       // RESET FORM AFTER SUCCESS
//       setShowForm(false);
//       setFormData(emptyForm);
//       setEditingId(null);

//       // REFRESH BIKE RECORDS AND INVENTORY
//       await Promise.all([fetchBikes(search), fetchInventory()]);
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to save bike details");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // DELETE BIKE RECORD
//   const handleDelete = async (id) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to permanently delete this bike record?",
//     );

//     if (!confirmed) return;

//     try {
//       setError("");
//       setSuccess("");

//       await api.delete(`/bikes/${id}`);

//       setSuccess("Bike record deleted successfully.");

//       await fetchBikes(search);
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to delete bike");
//     }
//   };

//   // AVAILABLE INVENTORY ITEMS
//   const availableInventory = inventory.filter(
//     (bike) => bike.isActive !== false && Number(bike.stock) > 0,
//   );

//   // SELECTED INVENTORY BIKE
//   const selectedInventoryBike = inventory.find(
//     (bike) => bike._id === formData.inventoryBike,
//   );

//   // CURRENT SHOWROOM PRICE
//   const showroomPrice = selectedInventoryBike
//     ? Number(selectedInventoryBike.price)
//     : 0;

//   // CHECK WHETHER SHOWROOM PRICE IS VALID
//   const validShowroomPrice =
//     selectedInventoryBike &&
//     selectedInventoryBike.price !== null &&
//     selectedInventoryBike.price !== undefined &&
//     Number.isFinite(showroomPrice) &&
//     showroomPrice > 0;

//   // CHECK WHETHER PURCHASE PRICE IS VALID
//   const purchasePrice = Number(formData.bikePrice);

//   const validPurchasePrice =
//     formData.bikePrice !== "" &&
//     Number.isFinite(purchasePrice) &&
//     purchasePrice > 0 &&
//     validShowroomPrice &&
//     purchasePrice <= showroomPrice;

//   return (
//     <div className="dashboard-layout">
//       <Sidebar />

//       <main className="bikes-main">
//         <header className="bikes-header">
//           <div>
//             <h1>Bike Management</h1>
//             <p>Manage customer bike and purchase details.</p>
//           </div>

//           <button className="add-bike-button" onClick={openAddForm}>
//             + Add Bike
//           </button>
//         </header>

//         {/* BIKE SUMMARY */}
//         <section className="bike-summary">
//           <div>
//             <span>Total Bike Records</span>
//             <h2>{bikes.length}</h2>
//           </div>

//           <div className="bike-summary-icon">🏍</div>
//         </section>

//         {/* SEARCH */}
//         <div className="bike-toolbar">
//           <input
//             type="search"
//             placeholder="Search by brand, model or registration number..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* ALERTS */}
//         {error && <div className="bike-alert error">{error}</div>}

//         {success && <div className="bike-alert success">{success}</div>}

//         {/* ADD / EDIT FORM */}
//         {showForm && (
//           <section className="bike-form-card">
//             <div className="bike-form-heading">
//               <h2>{editingId ? "Edit Bike Details" : "Register New Bike"}</h2>

//               <button type="button" onClick={() => setShowForm(false)}>
//                 ✕
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="bike-form-grid">
//                 {/* CUSTOMER SELECTION */}
//                 <div className="bike-field full-width">
//                   <label>Select Customer *</label>

//                   <select
//                     name="customer"
//                     value={formData.customer}
//                     onChange={handleChange}
//                     required
//                   >
//                     <option value="">Choose a customer</option>

//                     {customers.map((customer) => (
//                       <option key={customer._id} value={customer._id}>
//                         {customer.name} - {customer.phone}
//                       </option>
//                     ))}
//                   </select>

//                   {customers.length === 0 && (
//                     <small>
//                       No active customers available. Add a customer first.
//                     </small>
//                   )}
//                 </div>

//                 {/* IMPORT / SELECT BIKE FROM INVENTORY */}
//                 {!editingId && (
//                   <div className="bike-field full-width">
//                     <label>Import Bike from Inventory *</label>

//                     <select
//                       name="inventoryBike"
//                       value={formData.inventoryBike}
//                       onChange={handleInventoryChange}
//                       required
//                     >
//                       <option value="">Choose an available bike</option>

//                       {availableInventory.map((bike) => (
//                         <option key={bike._id} value={bike._id}>
//                           {bike.brand} {bike.model} — Stock: {bike.stock}
//                         </option>
//                       ))}
//                     </select>

//                     {availableInventory.length === 0 && (
//                       <small>
//                         No bikes are currently available in inventory. Add stock
//                         from Bike Inventory first.
//                       </small>
//                     )}
//                   </div>
//                 )}

//                 {/* SELECTED BIKE IMAGE AND DETAILS */}
//                 {!editingId && selectedInventoryBike && (
//                   <div className="bike-field full-width">
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "18px",
//                         padding: "14px",
//                         border: "1px solid #e2e8f0",
//                         borderRadius: "10px",
//                         background: "#f8fafc",
//                       }}
//                     >
//                       <img
//                         src={selectedInventoryBike.imageUrl}
//                         alt={`${selectedInventoryBike.brand} ${selectedInventoryBike.model}`}
//                         style={{
//                           width: "130px",
//                           height: "100px",
//                           objectFit: "contain",
//                           borderRadius: "8px",
//                           background: "#fff",
//                         }}
//                       />

//                       <div>
//                         <strong>
//                           {selectedInventoryBike.brand}{" "}
//                           {selectedInventoryBike.model}
//                         </strong>

//                         <p>
//                           Showroom Price:{" "}
//                           {validShowroomPrice
//                             ? `₹${showroomPrice.toLocaleString("en-IN")}`
//                             : "Price not set"}
//                         </p>

//                         <p>Available Stock: {selectedInventoryBike.stock}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* EDIT MODE: EXISTING BIKE DETAILS */}
//                 {editingId && (
//                   <>
//                     <div className="bike-field">
//                       <label>Bike Brand *</label>

//                       <input
//                         name="brand"
//                         value={formData.brand}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>

//                     <div className="bike-field">
//                       <label>Bike Model *</label>

//                       <input
//                         name="model"
//                         value={formData.model}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>
//                   </>
//                 )}

//                 {/* COLOUR */}
//                 <div className="bike-field">
//                   <label>Colour</label>

//                   {!editingId && selectedInventoryBike?.colors?.length > 0 ? (
//                     <select
//                       name="colour"
//                       value={formData.colour}
//                       onChange={handleChange}
//                     >
//                       <option value="">Choose colour</option>

//                       {selectedInventoryBike.colors.map((colour, index) => (
//                         <option key={index} value={colour}>
//                           {colour}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       name="colour"
//                       value={formData.colour}
//                       onChange={handleChange}
//                       placeholder="Enter bike colour"
//                     />
//                   )}
//                 </div>

//                 {/* REGISTRATION NUMBER */}
//                 <div className="bike-field">
//                   <label>Registration Number</label>

//                   <input
//                     name="registrationNumber"
//                     value={formData.registrationNumber}
//                     onChange={handleChange}
//                     placeholder="Example: AP XX AB 1234"
//                   />
//                 </div>

//                 {/* CHASSIS NUMBER */}
//                 <div className="bike-field">
//                   <label>Chassis Number</label>

//                   <input
//                     name="chassisNumber"
//                     value={formData.chassisNumber}
//                     onChange={handleChange}
//                     placeholder="Enter chassis number"
//                   />
//                 </div>

//                 {/* ENGINE NUMBER */}
//                 <div className="bike-field">
//                   <label>Engine Number</label>

//                   <input
//                     name="engineNumber"
//                     value={formData.engineNumber}
//                     onChange={handleChange}
//                     placeholder="Enter engine number"
//                   />
//                 </div>

//                 {/* PURCHASE DATE */}
//                 <div className="bike-field">
//                   <label>Purchase Date *</label>

//                   <input
//                     type="date"
//                     name="purchaseDate"
//                     value={formData.purchaseDate}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 {/* PURCHASE PRICE */}
//                 <div className="bike-field">
//                   <label>Bike Purchase Price (₹) *</label>

//                   <input
//                     type="number"
//                     name="bikePrice"
//                     value={formData.bikePrice}
//                     onChange={handleChange}
//                     placeholder="Enter actual purchase price"
//                     min="1"
//                     max={
//                       !editingId && validShowroomPrice
//                         ? showroomPrice
//                         : undefined
//                     }
//                     step="0.01"
//                     required
//                     readOnly={Boolean(editingId)}
//                   />

//                   {!editingId && selectedInventoryBike && (
//                     <small>
//                       Showroom Price:{" "}
//                       {validShowroomPrice
//                         ? `₹${showroomPrice.toLocaleString("en-IN")}`
//                         : "Price not configured"}
//                       <br />
//                       Default price is the showroom price. Discounts are
//                       allowed, but the purchase price cannot exceed it.
//                     </small>
//                   )}

//                   {editingId && (
//                     <small>
//                       Original purchase price is preserved and cannot be changed
//                       during editing.
//                     </small>
//                   )}
//                 </div>
//               </div>

//               {/* FORM ACTIONS */}
//               <div className="bike-form-actions">
//                 <button
//                   type="button"
//                   className="bike-cancel-button"
//                   onClick={() => setShowForm(false)}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="bike-save-button"
//                   disabled={
//                     saving ||
//                     customers.length === 0 ||
//                     (!editingId &&
//                       (!formData.inventoryBike ||
//                         !selectedInventoryBike ||
//                         !validShowroomPrice ||
//                         !validPurchasePrice))
//                   }
//                 >
//                   {saving
//                     ? "Saving..."
//                     : editingId
//                       ? "Update Bike"
//                       : "Confirm Purchase & Register"}
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}

//         {/* BIKE RECORDS */}
//         <section className="bike-table-card">
//           <div className="bike-table-heading">
//             <h2>Bike Records</h2>
//             <span>{bikes.length} records</span>
//           </div>

//           {loading ? (
//             <p className="bike-empty">Loading bike records...</p>
//           ) : bikes.length === 0 ? (
//             <p className="bike-empty">
//               No bike records found. Add your first bike.
//             </p>
//           ) : (
//             <div className="bike-table-wrapper">
//               <table className="bike-table">
//                 <thead>
//                   <tr>
//                     <th>Customer</th>
//                     <th>Brand / Model</th>
//                     <th>Registration No.</th>
//                     <th>Purchase Date</th>
//                     <th>Bike Price</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {bikes.map((bike) => (
//                     <tr key={bike._id}>
//                       <td>
//                         <strong>{bike.customer?.name || "Unknown"}</strong>

//                         <small>{bike.customer?.phone || ""}</small>
//                       </td>

//                       <td>
//                         {bike.brand} {bike.model}
//                       </td>

//                       <td>{bike.registrationNumber || "Not available"}</td>

//                       <td>
//                         {new Date(bike.purchaseDate).toLocaleDateString(
//                           "en-IN",
//                         )}
//                       </td>

//                       <td>₹{Number(bike.bikePrice).toLocaleString("en-IN")}</td>

//                       <td>
//                         <div className="bike-actions">
//                           <button
//                             className="bike-edit-button"
//                             onClick={() => handleEdit(bike)}
//                           >
//                             Edit
//                           </button>

//                           <button
//                             className="bike-delete-button"
//                             onClick={() => handleDelete(bike._id)}
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// };

// export default Bikes;


// import { useEffect, useMemo, useState } from "react";

// import {
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   runTransaction,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";

// import { db, auth } from "../firebase";
// import Sidebar from "../components/Sidebar";
// import "../styles/Bikes.css";

// const emptyForm = {
//   customer: "",
//   inventoryBike: "",
//   brand: "",
//   model: "",
//   colour: "",
//   registrationNumber: "",
//   chassisNumber: "",
//   engineNumber: "",
//   purchaseDate: "",
//   bikePrice: "",
// };

// // Use browser local date.
// const getLocalDate = () => {
//   const date = new Date();
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const Bikes = () => {
//   const [bikes, setBikes] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [inventory, setInventory] = useState([]);

//   const [search, setSearch] = useState("");
//   const [formData, setFormData] = useState(emptyForm);

//   const [editingId, setEditingId] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState(null);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // ==========================================
//   // FETCH REGISTERED BIKES
//   // ==========================================

//   const fetchBikes = async (searchValue = "") => {
//     try {
//       setLoading(true);

//       const snapshot = await getDocs(collection(db, "bikes"));

//       let records = snapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       records.sort((a, b) => {
//         const dateA = a.createdAt?.toMillis?.() || 0;
//         const dateB = b.createdAt?.toMillis?.() || 0;
//         return dateB - dateA;
//       });

//       const searchText = searchValue.trim().toLowerCase();

//       if (searchText) {
//         records = records.filter((bike) =>
//           (bike.brand || "").toLowerCase().includes(searchText) ||
//           (bike.model || "").toLowerCase().includes(searchText) ||
//           (bike.registrationNumber || "")
//             .toLowerCase()
//             .includes(searchText) ||
//           (bike.customerName || "").toLowerCase().includes(searchText)
//         );
//       }

//       setBikes(records);
//     } catch (err) {
//       console.error("Bike loading error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Permission denied while loading bikes. Check Firestore bikes rules."
//           : err.message || "Unable to load bike records."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==========================================
//   // FETCH CUSTOMERS
//   // ==========================================

//   const fetchCustomers = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "customers"));

//       const records = snapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       const activeCustomers = records.filter(
//         (customer) => customer.active !== false
//       );

//       activeCustomers.sort((a, b) =>
//         (a.name || "").localeCompare(b.name || "")
//       );

//       setCustomers(activeCustomers);
//     } catch (err) {
//       console.error("Customer loading error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Permission denied while reading customers. Check Firestore customer rules."
//           : err.message || "Unable to load customers."
//       );
//     }
//   };

//   // ==========================================
//   // FETCH INVENTORY
//   // ==========================================

//   const fetchInventory = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "inventory"));

//       const records = snapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       }));

//       setInventory(records);
//     } catch (err) {
//       console.error("Inventory loading error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Permission denied while reading inventory. Check Firestore inventory rules."
//           : err.message || "Unable to load inventory."
//       );
//     }
//   };

//   // ==========================================
//   // INITIAL LOADING
//   // ==========================================

//   useEffect(() => {
//     const loadData = async () => {
//       await Promise.all([
//         fetchCustomers(),
//         fetchInventory(),
//       ]);
//     };

//     loadData();
//   }, []);

//   // ==========================================
//   // SEARCH BIKE RECORDS
//   // ==========================================

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       fetchBikes(search);
//     }, 350);

//     return () => clearTimeout(timer);
//   }, [search]);

//   // ==========================================
//   // INPUT HANDLER
//   // ==========================================

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   // ==========================================
//   // SELECT INVENTORY BIKE
//   // ==========================================

//   const handleInventoryChange = (e) => {
//     const selectedId = e.target.value;

//     const selectedBike = inventory.find(
//       (bike) => bike.id === selectedId
//     );

//     if (!selectedBike) {
//       setFormData((previous) => ({
//         ...previous,
//         inventoryBike: "",
//         brand: "",
//         model: "",
//         colour: "",
//         bikePrice: "",
//       }));

//       return;
//     }

//     setFormData((previous) => ({
//       ...previous,
//       inventoryBike: selectedBike.id,
//       brand: selectedBike.brand || "",
//       model: selectedBike.model || "",
//       colour: "",
//       bikePrice:
//         selectedBike.price !== null &&
//         selectedBike.price !== undefined
//           ? String(selectedBike.price)
//           : "",
//     }));
//   };

//   // ==========================================
//   // OPEN ADD FORM
//   // ==========================================

//   const openAddForm = () => {
//     setFormData({
//       ...emptyForm,
//       purchaseDate: getLocalDate(),
//     });

//     setEditingId(null);
//     setError("");
//     setSuccess("");
//     setShowForm(true);
//   };

//   // ==========================================
//   // OPEN EDIT FORM
//   // ==========================================

//   const handleEdit = (bike) => {
//     setFormData({
//       customer: bike.customerId || "",
//       inventoryBike: bike.inventoryBikeId || "",
//       brand: bike.brand || "",
//       model: bike.model || "",
//       colour: bike.colour || "",
//       registrationNumber: bike.registrationNumber || "",
//       chassisNumber: bike.chassisNumber || "",
//       engineNumber: bike.engineNumber || "",
//       purchaseDate: bike.purchaseDate || "",
//       bikePrice: String(bike.bikePrice ?? ""),
//     });

//     setEditingId(bike.id);
//     setError("");
//     setSuccess("");
//     setShowForm(true);

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   // ==========================================
//   // SAVE / UPDATE BIKE
//   // ==========================================

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (saving) return;

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       const currentUser = auth.currentUser;

//       if (!currentUser) {
//         throw new Error("Please sign in again before saving.");
//       }

//       const selectedCustomer = customers.find(
//         (customer) => customer.id === formData.customer
//       );

//       if (!selectedCustomer) {
//         throw new Error("Please select a valid customer.");
//       }

//       if (!formData.purchaseDate) {
//         throw new Error("Please select a purchase date.");
//       }

//       // REQUIRED FIELD VALIDATION
//       // These four fields are mandatory for registration and editing.

//       if (!formData.colour.trim()) {
//         throw new Error("Please enter the bike colour.");
//       }

//       if (!formData.registrationNumber.trim()) {
//         throw new Error("Please enter the registration number.");
//       }

//       if (!formData.chassisNumber.trim()) {
//         throw new Error("Please enter the chassis number.");
//       }

//       if (!formData.engineNumber.trim()) {
//         throw new Error("Please enter the engine number.");
//       }

//       // ======================================
//       // UPDATE EXISTING REGISTERED BIKE
//       // ======================================

//       if (editingId) {
//         const bikeRef = doc(db, "bikes", editingId);

//         await updateDoc(bikeRef, {
//           customerId: selectedCustomer.id,
//           customerName: selectedCustomer.name || "",
//           customerPhone: selectedCustomer.phone || "",

//           brand: formData.brand.trim(),
//           model: formData.model.trim(),
//           colour: formData.colour.trim(),

//           registrationNumber: formData.registrationNumber.trim(),
//           chassisNumber: formData.chassisNumber.trim(),
//           engineNumber: formData.engineNumber.trim(),

//           purchaseDate: formData.purchaseDate,
//           updatedAt: serverTimestamp(),
//         });

//         setSuccess("Bike details updated successfully.");
//       } else {
//         // ====================================
//         // REGISTER NEW BIKE
//         // ====================================

//         if (!formData.inventoryBike) {
//           throw new Error("Please select a bike from inventory.");
//         }

//         const selectedBike = inventory.find(
//           (bike) => bike.id === formData.inventoryBike
//         );

//         if (!selectedBike) {
//           throw new Error("Selected inventory bike was not found.");
//         }

//         const showroomPrice = Number(selectedBike.price);
//         const purchasePrice = Number(formData.bikePrice);

//         if (
//           selectedBike.price === null ||
//           selectedBike.price === undefined ||
//           !Number.isFinite(showroomPrice) ||
//           showroomPrice <= 0
//         ) {
//           throw new Error(
//             "Please configure a valid showroom price in Bike Inventory."
//           );
//         }

//         if (
//           formData.bikePrice === "" ||
//           !Number.isFinite(purchasePrice) ||
//           purchasePrice <= 0
//         ) {
//           throw new Error("Please enter a valid purchase price.");
//         }

//         if (purchasePrice > showroomPrice) {
//           throw new Error(
//             `Purchase price cannot exceed showroom price ₹${showroomPrice.toLocaleString("en-IN")}.`
//           );
//         }

//         const inventoryRef = doc(
//           db,
//           "inventory",
//           selectedBike.id
//         );

//         const newBikeRef = doc(collection(db, "bikes"));

//         // ====================================
//         // ATOMIC FIRESTORE TRANSACTION
//         // ====================================

//         await runTransaction(db, async (transaction) => {
//           const inventorySnapshot = await transaction.get(inventoryRef);

//           if (!inventorySnapshot.exists()) {
//             throw new Error("Inventory bike no longer exists.");
//           }

//           const currentBike = inventorySnapshot.data();
//           const currentStock = Number(currentBike.stock);

//           if (
//             !Number.isInteger(currentStock) ||
//             currentStock <= 0
//           ) {
//             throw new Error(
//               "This bike is out of stock. Please refresh inventory."
//             );
//           }

//           // Reduce inventory stock by one.
//           transaction.update(inventoryRef, {
//             stock: currentStock - 1,
//             updatedAt: serverTimestamp(),
//           });

//           // Create the customer bike record.
//           transaction.set(newBikeRef, {
//             customerId: selectedCustomer.id,
//             customerName: selectedCustomer.name || "",
//             customerPhone: selectedCustomer.phone || "",

//             inventoryBikeId: selectedBike.id,

//             brand: currentBike.brand || "",
//             model: currentBike.model || "",
//             colour: formData.colour.trim(),

//             registrationNumber: formData.registrationNumber.trim(),
//             chassisNumber: formData.chassisNumber.trim(),
//             engineNumber: formData.engineNumber.trim(),

//             purchaseDate: formData.purchaseDate,
//             bikePrice: purchasePrice,

//             createdBy: currentUser.uid,
//             createdAt: serverTimestamp(),
//           });
//         });

//         setSuccess(
//           "Bike registered successfully. Inventory stock reduced by one."
//         );
//       }

//       // ======================================
//       // RESET FORM AND REFRESH DATA
//       // ======================================

//       setShowForm(false);
//       setFormData(emptyForm);
//       setEditingId(null);

//       await Promise.all([
//         fetchBikes(search),
//         fetchInventory(),
//       ]);
//     } catch (err) {
//       console.error("Bike saving error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Firestore permission denied. Check customer, bikes and inventory rules. Also verify the inventory document has its original createdBy field."
//           : err.message || "Unable to save bike details."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ==========================================
//   // DELETE REGISTERED BIKE
//   // ==========================================

//   const handleDelete = async (id) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to permanently delete this bike record?"
//     );

//     if (!confirmed) return;

//     try {
//       setDeletingId(id);
//       setError("");
//       setSuccess("");

//       await deleteDoc(doc(db, "bikes", id));

//       setSuccess("Bike record deleted successfully.");
//       await fetchBikes(search);
//     } catch (err) {
//       console.error("Bike deletion error:", err);

//       setError(
//         err.code === "permission-denied"
//           ? "Permission denied while deleting the bike record."
//           : err.message || "Unable to delete bike record."
//       );
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // ==========================================
//   // AVAILABLE INVENTORY
//   // ==========================================

//   const availableInventory = useMemo(() => {
//     return inventory.filter(
//       (bike) =>
//         bike.isActive !== false &&
//         Number(bike.stock) > 0
//     );
//   }, [inventory]);

//   const selectedInventoryBike = inventory.find(
//     (bike) => bike.id === formData.inventoryBike
//   );

//   const showroomPrice = selectedInventoryBike
//     ? Number(selectedInventoryBike.price)
//     : 0;

//   const validShowroomPrice =
//     selectedInventoryBike &&
//     selectedInventoryBike.price !== null &&
//     selectedInventoryBike.price !== undefined &&
//     Number.isFinite(showroomPrice) &&
//     showroomPrice > 0;

//   const purchasePrice = Number(formData.bikePrice);

//   const validPurchasePrice =
//     formData.bikePrice !== "" &&
//     Number.isFinite(purchasePrice) &&
//     purchasePrice > 0 &&
//     validShowroomPrice &&
//     purchasePrice <= showroomPrice;

//   // ==========================================
//   // RENDER PAGE
//   // ==========================================

//   return (
//     <div className="dashboard-layout">
//       <Sidebar />

//       <main className="bikes-main">
//         {/* PAGE HEADER */}

//         <header className="bikes-header">
//           <div>
//             <h1>Bike Management</h1>
//             <p>Manage customer bike and purchase details.</p>
//           </div>

//           <button
//             type="button"
//             className="add-bike-button"
//             onClick={openAddForm}
//           >
//             + Add Bike
//           </button>
//         </header>

//         {/* SUMMARY */}

//         <section className="bike-summary">
//           <div>
//             <span>Total Bike Records</span>
//             <h2>{loading ? "..." : bikes.length}</h2>
//           </div>

//           <div className="bike-summary-icon">🏍</div>
//         </section>

//         {/* SEARCH */}

//         <div className="bike-toolbar">
//           <input
//             type="search"
//             placeholder="Search by brand, model or registration number..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* ALERTS */}

//         {error && (
//           <div className="bike-alert error" role="alert">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="bike-alert success" role="status">
//             {success}
//           </div>
//         )}

//         {/* ADD / EDIT FORM */}

//         {showForm && (
//           <section className="bike-form-card">
//             <div className="bike-form-heading">
//               <h2>
//                 {editingId ? "Edit Bike Details" : "Register New Bike"}
//               </h2>

//               <button
//                 type="button"
//                 onClick={() => setShowForm(false)}
//                 disabled={saving}
//               >
//                 ✕
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="bike-form-grid">
//                 {/* CUSTOMER SELECTION */}

//                 <div className="bike-field full-width">
//                   <label htmlFor="customer">Select Customer *</label>

//                   <select
//                     id="customer"
//                     name="customer"
//                     value={formData.customer}
//                     onChange={handleChange}
//                     required
//                   >
//                     <option value="">Choose a customer</option>

//                     {customers.map((customer) => (
//                       <option key={customer.id} value={customer.id}>
//                         {customer.name} - {customer.phone}
//                       </option>
//                     ))}
//                   </select>

//                   {customers.length === 0 && (
//                     <small>
//                       No active customers found. Add a customer first.
//                     </small>
//                   )}
//                 </div>

//                 {/* INVENTORY SELECTION */}

//                 {!editingId && (
//                   <div className="bike-field full-width">
//                     <label htmlFor="inventoryBike">
//                       Import Bike from Inventory *
//                     </label>

//                     <select
//                       id="inventoryBike"
//                       name="inventoryBike"
//                       value={formData.inventoryBike}
//                       onChange={handleInventoryChange}
//                       required
//                     >
//                       <option value="">Choose an available bike</option>

//                       {availableInventory.map((bike) => (
//                         <option key={bike.id} value={bike.id}>
//                           {bike.brand} {bike.model} — Stock: {bike.stock}
//                         </option>
//                       ))}
//                     </select>

//                     {availableInventory.length === 0 && (
//                       <small>
//                         No bikes are currently available. Add stock from Bike
//                         Inventory first.
//                       </small>
//                     )}
//                   </div>
//                 )}

//                 {/* SELECTED BIKE DETAILS */}

//                 {!editingId && selectedInventoryBike && (
//                   <div className="bike-field full-width">
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "18px",
//                         padding: "14px",
//                         border: "1px solid #e2e8f0",
//                         borderRadius: "10px",
//                         background: "#f8fafc",
//                       }}
//                     >
//                       <img
//                         src={selectedInventoryBike.imageUrl}
//                         alt={`${selectedInventoryBike.brand} ${selectedInventoryBike.model}`}
//                         style={{
//                           width: "130px",
//                           height: "100px",
//                           objectFit: "contain",
//                           borderRadius: "8px",
//                           background: "#fff",
//                         }}
//                       />

//                       <div>
//                         <strong>
//                           {selectedInventoryBike.brand}{" "}
//                           {selectedInventoryBike.model}
//                         </strong>

//                         <p>
//                           Showroom Price:{" "}
//                           {validShowroomPrice
//                             ? `₹${showroomPrice.toLocaleString("en-IN")}`
//                             : "Price not set"}
//                         </p>

//                         <p>
//                           Available Stock: {selectedInventoryBike.stock}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* EDIT MODE */}

//                 {editingId && (
//                   <>
//                     <div className="bike-field">
//                       <label>Bike Brand *</label>

//                       <input
//                         name="brand"
//                         value={formData.brand}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>

//                     <div className="bike-field">
//                       <label>Bike Model *</label>

//                       <input
//                         name="model"
//                         value={formData.model}
//                         onChange={handleChange}
//                         required
//                       />
//                     </div>
//                   </>
//                 )}

//                 {/* COLOUR - REQUIRED */}

//                 <div className="bike-field">
//                   <label>Colour *</label>

//                   {!editingId &&
//                   Array.isArray(selectedInventoryBike?.colors) &&
//                   selectedInventoryBike.colors.length > 0 ? (
//                     <select
//                       name="colour"
//                       value={formData.colour}
//                       onChange={handleChange}
//                       required
//                     >
//                       <option value="">Choose colour</option>

//                       {selectedInventoryBike.colors.map((colour, index) => (
//                         <option key={index} value={colour}>
//                           {colour}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       name="colour"
//                       value={formData.colour}
//                       onChange={handleChange}
//                       placeholder="Enter bike colour"
//                       required
//                     />
//                   )}
//                 </div>

//                 {/* REGISTRATION NUMBER - REQUIRED */}

//                 <div className="bike-field">
//                   <label>Registration Number *</label>

//                   <input
//                     name="registrationNumber"
//                     value={formData.registrationNumber}
//                     onChange={handleChange}
//                     placeholder="Example: AP XX AB 1234"
//                     required
//                   />
//                 </div>

//                 {/* CHASSIS NUMBER - REQUIRED */}

//                 <div className="bike-field">
//                   <label>Chassis Number *</label>

//                   <input
//                     name="chassisNumber"
//                     value={formData.chassisNumber}
//                     onChange={handleChange}
//                     placeholder="Enter chassis number"
//                     required
//                   />
//                 </div>

//                 {/* ENGINE NUMBER - REQUIRED */}

//                 <div className="bike-field">
//                   <label>Engine Number *</label>

//                   <input
//                     name="engineNumber"
//                     value={formData.engineNumber}
//                     onChange={handleChange}
//                     placeholder="Enter engine number"
//                     required
//                   />
//                 </div>

//                 {/* PURCHASE DATE */}

//                 <div className="bike-field">
//                   <label>Purchase Date *</label>

//                   <input
//                     type="date"
//                     name="purchaseDate"
//                     value={formData.purchaseDate}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 {/* PURCHASE PRICE */}

//                 <div className="bike-field">
//                   <label>Bike Purchase Price (₹) *</label>

//                   <input
//                     type="number"
//                     name="bikePrice"
//                     value={formData.bikePrice}
//                     onChange={handleChange}
//                     placeholder="Enter actual purchase price"
//                     min="1"
//                     max={
//                       !editingId && validShowroomPrice
//                         ? showroomPrice
//                         : undefined
//                     }
//                     step="0.01"
//                     required
//                     readOnly={Boolean(editingId)}
//                   />

//                   {!editingId && selectedInventoryBike && (
//                     <small>
//                       Showroom Price:{" "}
//                       {validShowroomPrice
//                         ? `₹${showroomPrice.toLocaleString("en-IN")}`
//                         : "Price not configured"}
//                       <br />
//                       Discounts are allowed, but the purchase price cannot
//                       exceed showroom price.
//                     </small>
//                   )}

//                   {editingId && (
//                     <small>
//                       Original purchase price is preserved during editing.
//                     </small>
//                   )}
//                 </div>
//               </div>

//               {/* FORM ACTIONS */}

//               <div className="bike-form-actions">
//                 <button
//                   type="button"
//                   className="bike-cancel-button"
//                   onClick={() => setShowForm(false)}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="bike-save-button"
//                   disabled={
//                     saving ||
//                     customers.length === 0 ||
//                     (!editingId &&
//                       (
//                         !formData.inventoryBike ||
//                         !selectedInventoryBike ||
//                         !validShowroomPrice ||
//                         !validPurchasePrice
//                       ))
//                   }
//                 >
//                   {saving
//                     ? "Saving..."
//                     : editingId
//                       ? "Update Bike"
//                       : "Confirm Purchase & Register"}
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}

//         {/* REGISTERED BIKE RECORDS */}

//         <section className="bike-table-card">
//           <div className="bike-table-heading">
//             <h2>Bike Records</h2>
//             <span>{bikes.length} records</span>
//           </div>

//           {loading ? (
//             <p className="bike-empty">Loading bike records...</p>
//           ) : bikes.length === 0 ? (
//             <p className="bike-empty">
//               No bike records found. Add your first bike.
//             </p>
//           ) : (
//             <div className="bike-table-wrapper">
//               <table className="bike-table">
//                 <thead>
//                   <tr>
//                     <th>Customer</th>
//                     <th>Brand / Model</th>
//                     <th>Registration No.</th>
//                     <th>Purchase Date</th>
//                     <th>Bike Price</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {bikes.map((bike) => (
//                     <tr key={bike.id}>
//                       <td>
//                         <strong>{bike.customerName || "Unknown"}</strong>
//                         <small>{bike.customerPhone || ""}</small>
//                       </td>

//                       <td>
//                         {bike.brand} {bike.model}
//                       </td>

//                       <td>
//                         {bike.registrationNumber || "Not available"}
//                       </td>

//                       <td>
//                         {bike.purchaseDate
//                           ? new Date(
//                               `${bike.purchaseDate}T00:00:00`
//                             ).toLocaleDateString("en-IN")
//                           : "Not available"}
//                       </td>

//                       <td>
//                         ₹{Number(bike.bikePrice || 0).toLocaleString("en-IN")}
//                       </td>

//                       <td>
//                         <div className="bike-actions">
//                           <button
//                             type="button"
//                             className="bike-edit-button"
//                             onClick={() => handleEdit(bike)}
//                             disabled={Boolean(deletingId) || saving}
//                           >
//                             Edit
//                           </button>

//                           <button
//                             type="button"
//                             className="bike-delete-button"
//                             onClick={() => handleDelete(bike.id)}
//                             disabled={Boolean(deletingId) || saving}
//                           >
//                             {deletingId === bike.id
//                               ? "Deleting..."
//                               : "Delete"}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// };

// export default Bikes;

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

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

  if (typeof value.toDate === "function") {
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
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // ==========================================
  // FETCH PAYMENTS DIRECTLY FROM FIRESTORE
  // ==========================================

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const paymentsRef = collection(db, "payments");

      let snapshot;

      try {
        snapshot = await getDocs(
          query(paymentsRef, orderBy("paymentDate", "desc")),
        );
      } catch (orderError) {
        // Fallback for older records without a consistent paymentDate field.
        console.warn(
          "Payment date ordering unavailable. Loading without ordering.",
          orderError,
        );

        snapshot = await getDocs(paymentsRef);
      }

      const records = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      records.sort((a, b) => {
        const dateA =
          toDate(a.paymentDate || a.createdAt)?.getTime() || 0;

        const dateB =
          toDate(b.paymentDate || b.createdAt)?.getTime() || 0;

        return dateB - dateA;
      });

      setPayments(records);

      console.log("Firebase payment records loaded:", records);
    } catch (err) {
      console.error("Firebase payment loading error:", err);

      setError(
        err.code === "permission-denied"
          ? "Permission denied. Check the Firestore payments read rules and active staff profile."
          : err.message || "Unable to load payment records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ==========================================
  // FILTER PAYMENT RECORDS
  // ==========================================

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const searchText = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const customerName = getCustomerName(payment).toLowerCase();
      const customerPhone = getCustomerPhone(payment).toLowerCase();
      const invoiceNumber = String(getInvoiceNumber(payment)).toLowerCase();
      const reference = String(
        payment.transactionReference || "",
      ).toLowerCase();

      const matchesSearch =
        customerName.includes(searchText) ||
        customerPhone.includes(searchText) ||
        invoiceNumber.includes(searchText) ||
        reference.includes(searchText);

      const matchesType =
        paymentTypeFilter === "All" ||
        payment.paymentType === paymentTypeFilter;

      const matchesMethod =
        methodFilter === "All" ||
        payment.paymentMethod === methodFilter;

      const paymentDate = toDate(
        payment.paymentDate || payment.createdAt,
      );

      let matchesDate = true;

      if (dateFilter !== "All") {
        if (!paymentDate) {
          matchesDate = false;
        } else if (dateFilter === "Today") {
          matchesDate =
            paymentDate.toDateString() === now.toDateString();
        } else if (dateFilter === "This Month") {
          matchesDate =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "This Year") {
          matchesDate =
            paymentDate.getFullYear() === now.getFullYear();
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

  // ==========================================
  // PAYMENT STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    const totalCollected = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const today = new Date();

    const todayCollected = payments
      .filter((payment) => {
        const date = toDate(payment.paymentDate || payment.createdAt);

        return date && date.toDateString() === today.toDateString();
      })
      .reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );

    const currentMonthCollected = payments
      .filter((payment) => {
        const date = toDate(payment.paymentDate || payment.createdAt);

        return (
          date &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      })
      .reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );

    return {
      totalTransactions: payments.length,
      totalCollected,
      todayCollected,
      currentMonthCollected,
    };
  }, [payments]);

  // ==========================================
  // PRINT PAYMENT RECEIPT
  // ==========================================

  const printReceipt = (payment) => {
    const receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const customer = escapeHTML(getCustomerName(payment));
    const phone = escapeHTML(getCustomerPhone(payment));
    const invoice = escapeHTML(getInvoiceNumber(payment));
    const paymentId = escapeHTML(getPaymentId(payment));
    const paymentDate = escapeHTML(
      formatDate(payment.paymentDate || payment.createdAt),
    );
    const paymentType = escapeHTML(payment.paymentType || "—");
    const paymentMethod = escapeHTML(payment.paymentMethod || "—");
    const reference = escapeHTML(
      payment.transactionReference || "—",
    );
    const notes = escapeHTML(payment.notes || "—");
    const amount = escapeHTML(formatCurrency(payment.amount));

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

          h1 {
            text-align: center;
            margin-bottom: 5px;
          }

          .subtitle {
            text-align: center;
            color: #666;
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
          }

          .amount {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
          }

          .footer {
            text-align: center;
            margin-top: 35px;
            color: #666;
          }

          @media print {
            body {
              padding: 0;
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
          <p class="subtitle">Payment Receipt</p>

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
          </div>

        </div>

        <script>
          window.onload = () => window.print();
        </script>
      </body>
      </html>
    `);

    receiptWindow.document.close();
  };

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="payments-page">

          <div className="payments-header">
            <div>
              <h1>Payments Management</h1>
              <p>
                Track and manage all customer payment transactions.
              </p>
            </div>

            <button
              className="payments-refresh-btn"
              onClick={fetchPayments}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {/* STATISTICS */}

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
                <h2>
                  {formatCurrency(statistics.currentMonthCollected)}
                </h2>
              </div>
            </div>

          </div>

          {/* TRANSACTION HISTORY */}

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

            {/* FILTERS */}

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

            {/* ERROR */}

            {error && (
              <div className="payments-error" role="alert">
                {error}

                <button onClick={fetchPayments}>
                  Retry
                </button>
              </div>
            )}

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
                    ? "Payment records saved in Firebase will appear here."
                    : "Try changing your search or filters."}
                </p>
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
                          #{String(payment.id).slice(-7).toUpperCase()}
                        </td>

                        <td>
                          <strong>{getCustomerName(payment)}</strong>
                          <small>{getCustomerPhone(payment)}</small>
                        </td>

                        <td>{getInvoiceNumber(payment)}</td>

                        <td>
                          <span className="payment-type-badge">
                            {payment.paymentType || "—"}

                            {payment.installmentNumber
                              ? ` #${payment.installmentNumber}`
                              : ""}
                          </span>
                        </td>

                        <td>{payment.paymentMethod || "—"}</td>

                        <td>
                          {formatDate(
                            payment.paymentDate || payment.createdAt,
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
