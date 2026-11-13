const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentType: {
      type: String,
      enum: [
        "Full Payment",
        "Down Payment",
        "EMI Installment",
      ],
      required: true,
    },

    installmentNumber: {
      type: Number,
      default: null,
      min: 1,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"],
      required: true,
    },

    transactionReference: {
      type: String,
      trim: true,
      default: "",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ invoice: 1, paymentDate: -1 });
paymentSchema.index({ customer: 1, paymentDate: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
