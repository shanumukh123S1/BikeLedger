// const mongoose = require("mongoose");

// const emiScheduleSchema = new mongoose.Schema(
//   {
//     installmentNumber: {
//       type: Number,
//       required: true,
//     },
//     dueDate: {
//       type: Date,
//       required: true,
//     },
//     openingBalance: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     principalAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     interestAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     installmentAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     paidAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     status: {
//       type: String,
//       enum: ["Pending", "Partial", "Paid", "Overdue"],
//       default: "Pending",
//     },
//     paidDate: {
//       type: Date,
//       default: null,
//     },
//   },
//   { _id: true },
// );

// const invoiceSchema = new mongoose.Schema(
//   {
//     invoiceNumber: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },

//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },

//     bike: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Bike",
//       required: true,
//     },

//     // Original registered bike purchase price snapshot.
//     bikePrice: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     invoiceDate: {
//       type: Date,
//       default: Date.now,
//     },

//     paymentType: {
//       type: String,
//       enum: ["Full Payment", "EMI"],
//       required: true,
//     },

//     // EMI configuration. These values are snapshots for this invoice.
//     downPayment: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     // Internal financed principal; not required in customer-facing preview.
//     loanAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     // Monthly percentage. Example: 2 means 2% per month.
//     monthlyInterestRate: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     tenureMonths: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     monthlyEMI: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     // Staff-configured fees saved for this invoice.
//     processingFeePercentage: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     processingFeeAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     documentationFee: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     otherChargesAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     otherChargesDescription: {
//       type: String,
//       trim: true,
//       default: "",
//       maxlength: 250,
//     },

//     totalFees: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     emiSchedule: {
//       type: [emiScheduleSchema],
//       default: [],
//     },

//     // Includes down payment, financed charges and interest.
//     totalPayable: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     totalPaid: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     balanceDue: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["Pending", "Partial", "Paid", "Overdue"],
//       default: "Pending",
//     },

//     notes: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//   },
//   { timestamps: true },
// );

// invoiceSchema.index({ customer: 1, invoiceDate: -1 });
// invoiceSchema.index({ bike: 1 }, { unique: true });

// const Invoice = mongoose.model("Invoice", invoiceSchema);

// module.exports = Invoice;

const mongoose = require("mongoose");

const emiScheduleSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    installmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Partial", "Paid", "Overdue"],
      default: "Pending",
    },
    paidDate: {
      type: Date,
      default: null,
    },
  },
  { _id: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },

    bikePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    paymentType: {
      type: String,
      enum: ["Full Payment", "EMI"],
      required: true,
    },

    downPayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Internal financed amount, not displayed as a separate customer field.
    loanAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Annual simple interest percentage chosen by staff for this invoice.
    annualInterestRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    tenureMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyEMI: {
      type: Number,
      default: 0,
      min: 0,
    },

    processingFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    processingFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    documentationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherChargesAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherChargesDescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: 250,
    },

    totalFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalInterest: {
      type: Number,
      default: 0,
      min: 0,
    },

    emiSchedule: {
      type: [emiScheduleSchema],
      default: [],
    },

    // Includes down payment, fees and interest.
    totalPayable: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid", "Overdue"],
      default: "Pending",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

invoiceSchema.index({ customer: 1, invoiceDate: -1 });
invoiceSchema.index({ bike: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
