// const mongoose = require("mongoose");
// const crypto = require("crypto");

// const Invoice = require("../models/Invoice");
// const Bike = require("../models/Bike");
// const Customer = require("../models/Customer");

// const roundMoney = (value) =>
//   Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// const addMonths = (date, months) => {
//   const result = new Date(date);
//   const originalDay = result.getDate();

//   result.setDate(1);
//   result.setMonth(result.getMonth() + months);

//   const lastDay = new Date(
//     result.getFullYear(),
//     result.getMonth() + 1,
//     0,
//   ).getDate();

//   result.setDate(Math.min(originalDay, lastDay));
//   return result;
// };

// const generateInvoiceNumber = () => {
//   const now = new Date();

//   const datePart = [
//     now.getFullYear(),
//     String(now.getMonth() + 1).padStart(2, "0"),
//     String(now.getDate()).padStart(2, "0"),
//   ].join("");

//   return `INV-${datePart}-${crypto
//     .randomBytes(4)
//     .toString("hex")
//     .toUpperCase()}`;
// };

// // Reducing-balance EMI calculation.
// const calculateEMISchedule = ({
//   principal,
//   monthlyInterestRate,
//   tenureMonths,
//   firstDueDate,
// }) => {
//   const monthlyRate = monthlyInterestRate / 100;

//   const factor = Math.pow(1 + monthlyRate, tenureMonths);

//   const monthlyEMI = roundMoney(
//     (principal * monthlyRate * factor) / (factor - 1),
//   );

//   let openingBalance = principal;
//   const schedule = [];

//   for (let month = 1; month <= tenureMonths; month += 1) {
//     const interestAmount = roundMoney(openingBalance * monthlyRate);

//     let principalAmount = roundMoney(monthlyEMI - interestAmount);

//     if (month === tenureMonths || principalAmount > openingBalance) {
//       principalAmount = roundMoney(openingBalance);
//     }

//     const installmentAmount = roundMoney(principalAmount + interestAmount);

//     schedule.push({
//       installmentNumber: month,
//       dueDate: addMonths(firstDueDate, month - 1),
//       openingBalance: roundMoney(openingBalance),
//       principalAmount,
//       interestAmount,
//       installmentAmount,
//       paidAmount: 0,
//       status: "Pending",
//       paidDate: null,
//     });

//     openingBalance = roundMoney(openingBalance - principalAmount);
//   }

//   return {
//     monthlyEMI,
//     schedule,
//     totalInstallments: roundMoney(
//       schedule.reduce(
//         (total, installment) => total + installment.installmentAmount,
//         0,
//       ),
//     ),
//   };
// };

// // Update overdue statuses whenever invoice information is requested.
// const refreshOverdueStatus = async (invoice) => {
//   if (invoice.paymentType !== "EMI") return invoice;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   let changed = false;

//   for (const installment of invoice.emiSchedule) {
//     if (installment.status === "Paid") continue;

//     const dueDate = new Date(installment.dueDate);
//     dueDate.setHours(0, 0, 0, 0);

//     if (dueDate < today) {
//       if (installment.status !== "Overdue") {
//         installment.status = "Overdue";
//         changed = true;
//       }
//     } else if (
//       installment.status === "Overdue" ||
//       installment.status === "Pending"
//     ) {
//       const newStatus = installment.paidAmount > 0 ? "Partial" : "Pending";

//       if (installment.status !== newStatus) {
//         installment.status = newStatus;
//         changed = true;
//       }
//     }
//   }

//   if (changed) {
//     const hasOverdue = invoice.emiSchedule.some(
//       (item) => item.status === "Overdue",
//     );

//     invoice.paymentStatus = hasOverdue
//       ? "Overdue"
//       : invoice.totalPaid > 0
//         ? "Partial"
//         : "Pending";

//     if (invoice.balanceDue <= 0) {
//       invoice.paymentStatus = "Paid";
//     }

//     await invoice.save();
//   }

//   return invoice;
// };

// // GET /api/billing/available-bikes
// const getAvailableBikes = async (req, res) => {
//   try {
//     const invoicedBikeIds = await Invoice.distinct("bike");

//     const bikes = await Bike.find({
//       _id: { $nin: invoicedBikeIds },
//     })
//       .populate("customer", "name phone address")
//       .populate("inventoryBike", "brand model category imageUrl price")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: bikes.length,
//       bikes,
//     });
//   } catch (error) {
//     console.error("Get available bikes error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch available bikes",
//     });
//   }
// };

// // POST /api/billing
// const createInvoice = async (req, res) => {
//   try {
//     const {
//       bikeId,
//       paymentType,
//       downPayment = 0,
//       tenureMonths,
//       monthlyInterestRate = 2,
//       processingFeePercentage = 0,
//       documentationFee = 0,
//       otherChargesAmount = 0,
//       otherChargesDescription = "",
//       firstDueDate,
//       notes = "",
//     } = req.body;

//     if (!bikeId || !mongoose.Types.ObjectId.isValid(bikeId)) {
//       return res.status(400).json({
//         success: false,
//         message: "A valid registered bike is required",
//       });
//     }

//     if (!["Full Payment", "EMI"].includes(paymentType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment type must be Full Payment or EMI",
//       });
//     }

//     const bike = await Bike.findById(bikeId).populate("customer");

//     if (!bike || !bike.customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Registered bike or its customer was not found",
//       });
//     }

//     const customer = await Customer.findById(bike.customer._id);

//     if (!customer || !customer.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: "The bike's customer is inactive or unavailable",
//       });
//     }

//     const bikePrice = roundMoney(Number(bike.bikePrice));

//     if (!Number.isFinite(bikePrice) || bikePrice <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid registered bike purchase price",
//       });
//     }

//     const existingInvoice = await Invoice.findOne({ bike: bike._id });

//     if (existingInvoice) {
//       return res.status(409).json({
//         success: false,
//         message: "An invoice already exists for this registered bike",
//         invoiceNumber: existingInvoice.invoiceNumber,
//       });
//     }

//     const invoiceData = {
//       invoiceNumber: generateInvoiceNumber(),
//       customer: customer._id,
//       bike: bike._id,
//       bikePrice,
//       invoiceDate: new Date(),
//       paymentType,
//       downPayment: 0,
//       loanAmount: 0,
//       monthlyInterestRate: 0,
//       tenureMonths: 0,
//       monthlyEMI: 0,
//       processingFeePercentage: 0,
//       processingFeeAmount: 0,
//       documentationFee: 0,
//       otherChargesAmount: 0,
//       otherChargesDescription: "",
//       totalFees: 0,
//       emiSchedule: [],
//       totalPayable: bikePrice,
//       totalPaid: 0,
//       balanceDue: bikePrice,
//       paymentStatus: "Pending",
//       notes: String(notes).trim(),
//     };

//     if (paymentType === "EMI") {
//       const down = Number(downPayment);
//       const rate = Number(monthlyInterestRate);
//       const tenure = Number(tenureMonths);
//       const processingRate = Number(processingFeePercentage);
//       const documentFee = Number(documentationFee);
//       const otherFee = Number(otherChargesAmount);

//       if (!Number.isFinite(down) || down < 0 || down >= bikePrice) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Down payment must be at least 0 and less than the bike price",
//         });
//       }

//       if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Monthly interest rate must be greater than 0 and at most 100%",
//         });
//       }

//       if (!Number.isInteger(tenure) || tenure < 1 || tenure > 60) {
//         return res.status(400).json({
//           success: false,
//           message: "Tenure must be between 1 and 60 months",
//         });
//       }

//       if (
//         !Number.isFinite(processingRate) ||
//         processingRate < 0 ||
//         processingRate > 100
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Processing fee percentage must be between 0 and 100",
//         });
//       }

//       if (
//         !Number.isFinite(documentFee) ||
//         documentFee < 0 ||
//         !Number.isFinite(otherFee) ||
//         otherFee < 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Documentation and other charges cannot be negative",
//         });
//       }

//       const financedBalance = roundMoney(bikePrice - down);

//       const processingAmount = roundMoney(
//         financedBalance * (processingRate / 100),
//       );

//       const totalFees = roundMoney(processingAmount + documentFee + otherFee);

//       // Fees are financed along with the remaining bike balance.
//       const financedPrincipal = roundMoney(financedBalance + totalFees);

//       const dueDate = firstDueDate
//         ? new Date(firstDueDate)
//         : addMonths(new Date(), 1);

//       if (Number.isNaN(dueDate.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid first EMI due date",
//         });
//       }

//       dueDate.setHours(0, 0, 0, 0);

//       const emiResult = calculateEMISchedule({
//         principal: financedPrincipal,
//         monthlyInterestRate: rate,
//         tenureMonths: tenure,
//         firstDueDate: dueDate,
//       });

//       const totalPayable = roundMoney(down + emiResult.totalInstallments);

//       Object.assign(invoiceData, {
//         downPayment: roundMoney(down),
//         loanAmount: financedPrincipal,
//         monthlyInterestRate: rate,
//         tenureMonths: tenure,
//         monthlyEMI: emiResult.monthlyEMI,
//         processingFeePercentage: processingRate,
//         processingFeeAmount: processingAmount,
//         documentationFee: roundMoney(documentFee),
//         otherChargesAmount: roundMoney(otherFee),
//         otherChargesDescription: String(otherChargesDescription).trim(),
//         totalFees,
//         emiSchedule: emiResult.schedule,
//         totalPayable,
//         balanceDue: totalPayable,
//       });
//     }

//     const invoice = await Invoice.create(invoiceData);

//     const populatedInvoice = await Invoice.findById(invoice._id)
//       .populate("customer", "name phone address")
//       .populate({
//         path: "bike",
//         populate: {
//           path: "inventoryBike",
//           select: "brand model category imageUrl",
//         },
//       });

//     return res.status(201).json({
//       success: true,
//       message: "Invoice created successfully",
//       invoice: populatedInvoice,
//     });
//   } catch (error) {
//     console.error("Create invoice error:", error);

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "An invoice already exists for this bike or invoice number",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create invoice",
//       error: error.message,
//     });
//   }
// };

// // GET /api/billing
// const getInvoices = async (req, res) => {
//   try {
//     const invoices = await Invoice.find().sort({ createdAt: -1 });

//     for (const invoice of invoices) {
//       await refreshOverdueStatus(invoice);
//     }

//     await Invoice.populate(invoices, [
//       { path: "customer", select: "name phone address" },
//       {
//         path: "bike",
//         populate: {
//           path: "inventoryBike",
//           select: "brand model category imageUrl",
//         },
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       count: invoices.length,
//       invoices,
//     });
//   } catch (error) {
//     console.error("Get invoices error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch invoices",
//     });
//   }
// };

// // GET /api/billing/:id
// const getInvoiceById = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid invoice ID",
//       });
//     }

//     const invoice = await Invoice.findById(req.params.id)
//       .populate("customer", "name phone address")
//       .populate({
//         path: "bike",
//         populate: {
//           path: "inventoryBike",
//           select: "brand model category imageUrl",
//         },
//       });

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found",
//       });
//     }

//     await refreshOverdueStatus(invoice);

//     return res.status(200).json({
//       success: true,
//       invoice,
//     });
//   } catch (error) {
//     console.error("Get invoice details error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch invoice details",
//     });
//   }
// };

// module.exports = {
//   getAvailableBikes,
//   createInvoice,
//   getInvoices,
//   getInvoiceById,
// };

const mongoose = require("mongoose");
const crypto = require("crypto");

const Invoice = require("../models/Invoice");
const Bike = require("../models/Bike");
const Customer = require("../models/Customer");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const addMonths = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));
  return result;
};

const generateInvoiceNumber = () => {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  return `INV-${datePart}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Showroom method: annual simple interest, not monthly reducing balance.
const calculateShowroomEMI = ({
  financedAmount,
  annualInterestRate,
  tenureMonths,
  firstDueDate,
}) => {
  const years = tenureMonths / 12;

  const totalInterest = roundMoney(
    financedAmount * (annualInterestRate / 100) * years,
  );

  const totalInstallmentAmount = roundMoney(financedAmount + totalInterest);

  const regularInstallment = roundMoney(totalInstallmentAmount / tenureMonths);

  const regularPrincipal = roundMoney(financedAmount / tenureMonths);

  const regularInterest = roundMoney(totalInterest / tenureMonths);

  let principalAllocated = 0;
  let interestAllocated = 0;
  let installmentAllocated = 0;

  const schedule = [];

  for (let month = 1; month <= tenureMonths; month += 1) {
    const isLast = month === tenureMonths;

    const principalAmount = isLast
      ? roundMoney(financedAmount - principalAllocated)
      : regularPrincipal;

    const interestAmount = isLast
      ? roundMoney(totalInterest - interestAllocated)
      : regularInterest;

    const installmentAmount = isLast
      ? roundMoney(totalInstallmentAmount - installmentAllocated)
      : regularInstallment;

    schedule.push({
      installmentNumber: month,
      dueDate: addMonths(firstDueDate, month - 1),
      principalAmount,
      interestAmount,
      installmentAmount,
      paidAmount: 0,
      status: "Pending",
      paidDate: null,
    });

    principalAllocated = roundMoney(principalAllocated + principalAmount);

    interestAllocated = roundMoney(interestAllocated + interestAmount);

    installmentAllocated = roundMoney(installmentAllocated + installmentAmount);
  }

  return {
    totalInterest,
    totalInstallmentAmount,
    monthlyEMI: regularInstallment,
    schedule,
  };
};

const refreshOverdueStatus = async (invoice) => {
  if (invoice.paymentType !== "EMI") return invoice;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let changed = false;

  for (const installment of invoice.emiSchedule) {
    if (installment.status === "Paid") continue;

    const remaining = roundMoney(
      installment.installmentAmount - installment.paidAmount,
    );

    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let newStatus;

    if (remaining <= 0) {
      newStatus = "Paid";
    } else if (dueDate < today) {
      newStatus = "Overdue";
    } else if (installment.paidAmount > 0) {
      newStatus = "Partial";
    } else {
      newStatus = "Pending";
    }

    if (installment.status !== newStatus) {
      installment.status = newStatus;
      changed = true;
    }
  }

  const hasOverdue = invoice.emiSchedule.some(
    (item) => item.status === "Overdue",
  );

  const hasPartial = invoice.emiSchedule.some(
    (item) => item.status === "Partial",
  );

  const newInvoiceStatus =
    invoice.balanceDue <= 0
      ? "Paid"
      : hasOverdue
        ? "Overdue"
        : invoice.totalPaid > 0 || hasPartial
          ? "Partial"
          : "Pending";

  if (invoice.paymentStatus !== newInvoiceStatus) {
    invoice.paymentStatus = newInvoiceStatus;
    changed = true;
  }

  if (changed) await invoice.save();

  return invoice;
};

// GET /api/billing/available-bikes
const getAvailableBikes = async (req, res) => {
  try {
    const invoicedBikeIds = await Invoice.distinct("bike");

    const bikes = await Bike.find({
      _id: { $nin: invoicedBikeIds },
    })
      .populate("customer", "name phone address")
      .populate("inventoryBike", "brand model category imageUrl price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bikes.length,
      bikes,
    });
  } catch (error) {
    console.error("Get available bikes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available bikes",
    });
  }
};

// POST /api/billing
const createInvoice = async (req, res) => {
  try {
    const {
      bikeId,
      paymentType,
      downPayment = 0,
      tenureMonths,
      annualInterestRate,
      processingFeePercentage = 0,
      documentationFee = 0,
      otherChargesAmount = 0,
      otherChargesDescription = "",
      firstDueDate,
      notes = "",
    } = req.body;

    if (!bikeId || !mongoose.Types.ObjectId.isValid(bikeId)) {
      return res.status(400).json({
        success: false,
        message: "A valid registered bike is required",
      });
    }

    if (!["Full Payment", "EMI"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Payment type must be Full Payment or EMI",
      });
    }

    const bike = await Bike.findById(bikeId).populate("customer");

    if (!bike || !bike.customer) {
      return res.status(404).json({
        success: false,
        message: "Registered bike or customer was not found",
      });
    }

    const customer = await Customer.findById(bike.customer._id);

    if (!customer || !customer.isActive) {
      return res.status(400).json({
        success: false,
        message: "The bike's customer is inactive or unavailable",
      });
    }

    const bikePrice = roundMoney(Number(bike.bikePrice));

    if (!Number.isFinite(bikePrice) || bikePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid registered bike purchase price",
      });
    }

    const existingInvoice = await Invoice.findOne({ bike: bike._id });

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: "An invoice already exists for this registered bike",
        invoiceNumber: existingInvoice.invoiceNumber,
      });
    }

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      customer: customer._id,
      bike: bike._id,
      bikePrice,
      invoiceDate: new Date(),
      paymentType,
      downPayment: 0,
      loanAmount: 0,
      annualInterestRate: 0,
      tenureMonths: 0,
      monthlyEMI: 0,
      processingFeePercentage: 0,
      processingFeeAmount: 0,
      documentationFee: 0,
      otherChargesAmount: 0,
      otherChargesDescription: "",
      totalFees: 0,
      totalInterest: 0,
      emiSchedule: [],
      totalPayable: bikePrice,
      totalPaid: 0,
      balanceDue: bikePrice,
      paymentStatus: "Pending",
      notes: String(notes).trim(),
    };

    if (paymentType === "EMI") {
      const down = Number(downPayment);
      const rate = Number(annualInterestRate);
      const tenure = Number(tenureMonths);
      const processingRate = Number(processingFeePercentage);
      const documentFee = Number(documentationFee);
      const otherFee = Number(otherChargesAmount);

      if (!Number.isFinite(down) || down < 0 || down >= bikePrice) {
        return res.status(400).json({
          success: false,
          message: "Down payment must be at least 0 and less than bike price",
        });
      }

      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({
          success: false,
          message: "Annual interest rate must be between 0 and 100%",
        });
      }

      if (!Number.isInteger(tenure) || tenure < 1 || tenure > 60) {
        return res.status(400).json({
          success: false,
          message: "Tenure must be between 1 and 60 months",
        });
      }

      if (
        !Number.isFinite(processingRate) ||
        processingRate < 0 ||
        processingRate > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Processing fee percentage must be between 0 and 100",
        });
      }

      if (
        !Number.isFinite(documentFee) ||
        documentFee < 0 ||
        !Number.isFinite(otherFee) ||
        otherFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Documentation and other charges cannot be negative",
        });
      }

      const financedBalance = roundMoney(bikePrice - down);

      // Processing fee is a percentage of the financed balance.
      const processingAmount = roundMoney(
        financedBalance * (processingRate / 100),
      );

      const totalFees = roundMoney(processingAmount + documentFee + otherFee);

      // Fees are added before calculating simple interest.
      const financedAmount = roundMoney(financedBalance + totalFees);

      const dueDate = firstDueDate
        ? new Date(`${firstDueDate}T00:00:00`)
        : addMonths(new Date(), 1);

      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid first EMI due date",
        });
      }

      const emiResult = calculateShowroomEMI({
        financedAmount,
        annualInterestRate: rate,
        tenureMonths: tenure,
        firstDueDate: dueDate,
      });

      const totalPayable = roundMoney(down + emiResult.totalInstallmentAmount);

      Object.assign(invoiceData, {
        downPayment: roundMoney(down),
        loanAmount: financedAmount,
        annualInterestRate: rate,
        tenureMonths: tenure,
        monthlyEMI: emiResult.monthlyEMI,
        processingFeePercentage: processingRate,
        processingFeeAmount: processingAmount,
        documentationFee: roundMoney(documentFee),
        otherChargesAmount: roundMoney(otherFee),
        otherChargesDescription: String(otherChargesDescription).trim(),
        totalFees,
        totalInterest: emiResult.totalInterest,
        emiSchedule: emiResult.schedule,
        totalPayable,
        balanceDue: totalPayable,
      });
    }

    const invoice = await Invoice.create(invoiceData);

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customer", "name phone address")
      .populate({
        path: "bike",
        populate: {
          path: "inventoryBike",
          select: "brand model category imageUrl",
        },
      });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: populatedInvoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An invoice already exists for this bike or invoice number",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// GET /api/billing
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    for (const invoice of invoices) {
      await refreshOverdueStatus(invoice);
    }

    await Invoice.populate(invoices, [
      { path: "customer", select: "name phone address" },
      {
        path: "bike",
        populate: {
          path: "inventoryBike",
          select: "brand model category imageUrl",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
};

// GET /api/billing/:id
const getInvoiceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate("customer", "name phone address")
      .populate({
        path: "bike",
        populate: {
          path: "inventoryBike",
          select: "brand model category imageUrl",
        },
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await refreshOverdueStatus(invoice);

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice details",
    });
  }
};

module.exports = {
  getAvailableBikes,
  createInvoice,
  getInvoices,
  getInvoiceById,
};
