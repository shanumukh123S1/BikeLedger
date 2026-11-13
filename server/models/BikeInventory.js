const mongoose = require("mongoose");

const bikeInventorySchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Motorcycle", "Scooter"],
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Showroom selling price
    price: {
      type: Number,
      default: null,
      min: 0,
    },

    // Available inventory units
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    // Available bike colours
    colors: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate brand and model combinations.
bikeInventorySchema.index({ brand: 1, model: 1 }, { unique: true });

const BikeInventory = mongoose.model("BikeInventory", bikeInventorySchema);

module.exports = BikeInventory;
