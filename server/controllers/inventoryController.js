const mongoose = require("mongoose");

const BikeInventory = require("../models/BikeInventory");
const Bike = require("../models/Bike");

// Helper: validate and prepare inventory data
const prepareInventoryData = (body) => {
  const { brand, model, category, imageUrl, price, stock, colors } = body;

  const updates = {};

  if (brand !== undefined) {
    if (typeof brand !== "string" || !brand.trim()) {
      throw new Error("Brand is required");
    }
    updates.brand = brand.trim();
  }

  if (model !== undefined) {
    if (typeof model !== "string" || !model.trim()) {
      throw new Error("Model is required");
    }
    updates.model = model.trim();
  }

  if (category !== undefined) {
    if (!["Motorcycle", "Scooter"].includes(category)) {
      throw new Error("Category must be Motorcycle or Scooter");
    }
    updates.category = category;
  }

  if (imageUrl !== undefined) {
    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      throw new Error("A valid bike image URL is required");
    }
    updates.imageUrl = imageUrl.trim();
  }

  if (price !== undefined) {
    if (price === "" || price === null) {
      updates.price = null;
    } else {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new Error("Enter a valid bike price");
      }

      updates.price = parsedPrice;
    }
  }

  if (stock !== undefined) {
    const parsedStock = Number(stock);

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      throw new Error(
        "Stock must be a whole number greater than or equal to zero",
      );
    }

    updates.stock = parsedStock;
  }

  if (colors !== undefined) {
    if (Array.isArray(colors)) {
      updates.colors = colors
        .filter((color) => typeof color === "string")
        .map((color) => color.trim())
        .filter(Boolean);
    } else if (typeof colors === "string") {
      updates.colors = colors
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean);
    } else {
      throw new Error(
        "Colours must be provided as an array or comma-separated text",
      );
    }
  }

  return updates;
};

// GET ALL ACTIVE INVENTORY MODELS
const getInventory = async (req, res) => {
  try {
    const bikes = await BikeInventory.find({
      isActive: true,
    }).sort({ brand: 1, model: 1 });

    return res.status(200).json({
      success: true,
      count: bikes.length,
      bikes,
    });
  } catch (error) {
    console.error("Get Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bike inventory",
    });
  }
};

// GET ONE INVENTORY MODEL
const getInventoryBike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory bike ID",
      });
    }

    const bike = await BikeInventory.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike model not found",
      });
    }

    return res.status(200).json({
      success: true,
      bike,
    });
  } catch (error) {
    console.error("Get Inventory Bike Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bike model",
    });
  }
};

// ADD NEW INVENTORY MODEL
const createInventoryBike = async (req, res) => {
  try {
    const updates = prepareInventoryData(req.body);

    // Validate required fields
    if (
      !updates.brand ||
      !updates.model ||
      !updates.category ||
      !updates.imageUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "Brand, model, category and image are required",
      });
    }

    // Prevent duplicate brand and model
    const existing = await BikeInventory.findOne({
      brand: updates.brand,
      model: updates.model,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This bike model already exists",
      });
    }

    const bike = await BikeInventory.create({
      ...updates,
      price: updates.price === undefined ? null : updates.price,
      stock: updates.stock === undefined ? 0 : updates.stock,
      colors: updates.colors || [],
    });

    return res.status(201).json({
      success: true,
      message: "Bike model added successfully",
      bike,
    });
  } catch (error) {
    console.error("Create Inventory Bike Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This brand and model combination already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to add bike model",
    });
  }
};

// UPDATE EXISTING INVENTORY MODEL AND STOCK
const updateInventoryBike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory bike ID",
      });
    }

    const updates = prepareInventoryData(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Check whether the inventory record exists.
    const existingBike = await BikeInventory.findOne({
      _id: id,
      isActive: true,
    });

    if (!existingBike) {
      return res.status(404).json({
        success: false,
        message: "Bike model not found",
      });
    }

    // Prevent another inventory record from having the same
    // brand and model combination.
    const updatedBrand = updates.brand || existingBike.brand;
    const updatedModel = updates.model || existingBike.model;

    const duplicate = await BikeInventory.findOne({
      _id: { $ne: id },
      brand: updatedBrand,
      model: updatedModel,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another inventory record already has this brand and model",
      });
    }

    // Update the existing document. Do not create a new record.
    Object.assign(existingBike, updates);

    const updatedBike = await existingBike.save();

    return res.status(200).json({
      success: true,
      message: "Bike inventory updated successfully",
      bike: updatedBike,
    });
  } catch (error) {
    console.error("Update Inventory Bike Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This brand and model combination already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update bike inventory",
    });
  }
};

// PERMANENTLY DELETE INVENTORY MODEL
const deleteInventoryBike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory bike ID",
      });
    }

    const bike = await BikeInventory.findById(id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: "Bike inventory model not found",
      });
    }

    // Prevent deletion if this inventory model is referenced
    // by an already registered customer bike.
    const registeredBike = await Bike.findOne({
      inventoryBike: id,
    }).select("_id");

    if (registeredBike) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this model because it is linked to registered customer bikes. Keep the inventory record to preserve existing records.",
      });
    }

    // Permanently delete the MongoDB document.
    await BikeInventory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `${bike.brand} ${bike.model} deleted permanently`,
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete Inventory Bike Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to delete bike model",
    });
  }
};

module.exports = {
  getInventory,
  getInventoryBike,
  createInventoryBike,
  updateInventoryBike,
  deleteInventoryBike,
};
