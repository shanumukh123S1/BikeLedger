const mongoose = require("mongoose");

const Bike = require("../models/Bike");
const Customer = require("../models/Customer");
const BikeInventory = require("../models/BikeInventory");

// Helper: normalize identification numbers
const normalizeNumber = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

// CREATE BIKE AND REDUCE INVENTORY STOCK
const createBike = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    const {
      customer,
      inventoryBike,
      colour,
      registrationNumber,
      chassisNumber,
      engineNumber,
      purchaseDate,
      bikePrice,
    } = req.body;

    // Validate required fields
    if (
      !customer ||
      !inventoryBike ||
      !purchaseDate ||
      bikePrice === undefined ||
      bikePrice === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a customer, inventory bike, purchase date and price",
      });
    }

    // Validate MongoDB IDs
    if (
      !mongoose.Types.ObjectId.isValid(customer) ||
      !mongoose.Types.ObjectId.isValid(inventoryBike)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer or inventory bike ID",
      });
    }

    // Validate purchase price and date
    const price = Number(bikePrice);
    const date = new Date(purchaseDate);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid bike price greater than zero",
      });
    }

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid purchase date",
      });
    }

    // Validate active customer
    const existingCustomer = await Customer.findOne({
      _id: customer,
      isActive: true,
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Active customer not found",
      });
    }

    // Normalize identification numbers
    const normalizedChassis = normalizeNumber(chassisNumber);
    const normalizedEngine = normalizeNumber(engineNumber);

    // Check duplicate chassis number
    if (normalizedChassis) {
      const duplicateChassis = await Bike.findOne({
        chassisNumber: normalizedChassis,
      });

      if (duplicateChassis) {
        return res.status(409).json({
          success: false,
          message: "This chassis number is already registered",
        });
      }
    }

    // Check duplicate engine number
    if (normalizedEngine) {
      const duplicateEngine = await Bike.findOne({
        engineNumber: normalizedEngine,
      });

      if (duplicateEngine) {
        return res.status(409).json({
          success: false,
          message: "This engine number is already registered",
        });
      }
    }

    let createdBikeId;

    // STOCK REDUCTION + BIKE REGISTRATION TRANSACTION
    await session.withTransaction(async () => {
      // Atomically reduce stock only if the inventory item
      // is active and at least one unit is available.
      const inventoryItem = await BikeInventory.findOneAndUpdate(
        {
          _id: inventoryBike,
          isActive: true,
          stock: { $gt: 0 },
        },
        {
          $inc: { stock: -1 },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      if (!inventoryItem) {
        const error = new Error(
          "This bike is unavailable or currently out of stock",
        );
        error.statusCode = 409;
        throw error;
      }

      // Read showroom price directly from the database.
      // Never trust a showroom price sent by the frontend.
      const showroomPrice = Number(inventoryItem.price);

      if (
        inventoryItem.price === null ||
        inventoryItem.price === undefined ||
        !Number.isFinite(showroomPrice) ||
        showroomPrice <= 0
      ) {
        const error = new Error(
          "A valid showroom price is not configured for this bike. Please update it in Bike Inventory.",
        );
        error.statusCode = 400;
        throw error;
      }

      // Purchase price cannot exceed showroom price.
      if (price > showroomPrice) {
        const error = new Error(
          `Purchase price cannot exceed the showroom price of ₹${showroomPrice.toLocaleString(
            "en-IN",
          )}`,
        );
        error.statusCode = 400;
        throw error;
      }

      // Create customer bike record.
      const newBike = await Bike.create(
        [
          {
            customer,
            inventoryBike: inventoryItem._id,
            brand: inventoryItem.brand,
            model: inventoryItem.model,
            colour: colour || "",
            registrationNumber: registrationNumber || "",
            chassisNumber: normalizedChassis,
            engineNumber: normalizedEngine,
            purchaseDate: date,
            bikePrice: price,
          },
        ],
        { session },
      );

      createdBikeId = newBike[0]._id;
    });

    // Fetch registered bike with populated references.
    const populatedBike = await Bike.findById(createdBikeId)
      .populate("customer", "name phone")
      .populate("inventoryBike", "brand model imageUrl price");

    return res.status(201).json({
      success: true,
      message: "Bike registered successfully and inventory stock updated",
      bike: populatedBike,
    });
  } catch (error) {
    console.error("Create Bike Error:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Unable to register bike",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// GET ALL BIKES + SEARCH
const getBikes = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const bikes = await Bike.find({
      $or: [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        {
          registrationNumber: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .populate("customer", "name phone")
      .populate("inventoryBike", "brand model imageUrl price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bikes.length,
      bikes,
    });
  } catch (error) {
    console.error("Get Bikes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bike records",
    });
  }
};

// GET BIKE BY ID
const getBikeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bike ID",
      });
    }

    const bike = await Bike.findById(req.params.id)
      .populate("customer", "name phone")
      .populate("inventoryBike", "brand model imageUrl price");

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    return res.status(200).json({
      success: true,
      bike,
    });
  } catch (error) {
    console.error("Get Bike By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bike",
    });
  }
};

// UPDATE BIKE
// Editing a registered bike does not change its original
// purchase price or inventory stock.
const updateBike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bike ID",
      });
    }

    // Original purchase price is intentionally excluded.
    const allowedFields = [
      "customer",
      "brand",
      "model",
      "colour",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "purchaseDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate customer if changed.
    if (updates.customer !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(updates.customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const customer = await Customer.findOne({
        _id: updates.customer,
        isActive: true,
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Active customer not found",
        });
      }
    }

    // Validate purchase date.
    if (updates.purchaseDate !== undefined) {
      const date = new Date(updates.purchaseDate);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid purchase date",
        });
      }

      updates.purchaseDate = date;
    }

    // Normalize chassis number and check duplicates.
    if (updates.chassisNumber !== undefined) {
      updates.chassisNumber = normalizeNumber(updates.chassisNumber);

      if (updates.chassisNumber) {
        const duplicateChassis = await Bike.findOne({
          chassisNumber: updates.chassisNumber,
          _id: { $ne: id },
        });

        if (duplicateChassis) {
          return res.status(409).json({
            success: false,
            message: "This chassis number is already registered",
          });
        }
      }
    }

    // Normalize engine number and check duplicates.
    if (updates.engineNumber !== undefined) {
      updates.engineNumber = normalizeNumber(updates.engineNumber);

      if (updates.engineNumber) {
        const duplicateEngine = await Bike.findOne({
          engineNumber: updates.engineNumber,
          _id: { $ne: id },
        });

        if (duplicateEngine) {
          return res.status(409).json({
            success: false,
            message: "This engine number is already registered",
          });
        }
      }
    }

    const bike = await Bike.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("customer", "name phone")
      .populate("inventoryBike", "brand model imageUrl price");

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bike updated successfully",
      bike,
    });
  } catch (error) {
    console.error("Update Bike Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update bike",
    });
  }
};

// PERMANENTLY DELETE CUSTOMER BIKE RECORD
// Deleting a customer bike record does not automatically
// increase inventory stock.
const deleteBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bike ID",
      });
    }

    const bike = await Bike.findByIdAndDelete(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bike record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Bike Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete bike",
    });
  }
};

module.exports = {
  createBike,
  getBikes,
  getBikeById,
  updateBike,
  deleteBike,
};
