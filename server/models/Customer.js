const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Enter a valid 10-digit phone number"],
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      required: [true, "Customer address is required"],
      trim: true,
      maxlength: 500,
    },

    guarantorName: {
      type: String,
      trim: true,
      default: "",
    },

    guarantorPhone: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
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

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
