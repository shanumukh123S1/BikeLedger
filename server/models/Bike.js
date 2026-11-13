const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
  {
    // Link bike to an existing customer
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    // Link to the showroom inventory model.
    // Optional to preserve previously registered bike records.
    inventoryBike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeInventory",
      default: null,
    },

    brand: {
      type: String,
      required: [true, "Bike brand is required"],
      trim: true,
    },

    model: {
      type: String,
      required: [true, "Bike model is required"],
      trim: true,
    },

    colour: {
      type: String,
      trim: true,
      default: "",
    },

    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
    },

    // Actual customer purchase price.
    // It can differ from the inventory showroom price.
    bikePrice: {
      type: Number,
      required: [true, "Bike price is required"],
      min: [1, "Bike price must be greater than zero"],
    },
  },
  {
    timestamps: true,
  },
);

const Bike = mongoose.model("Bike", bikeSchema);

module.exports = Bike;
