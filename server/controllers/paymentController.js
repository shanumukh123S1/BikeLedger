// const mongoose = require("mongoose");

// const Invoice = require("../models/Invoice");
// const Payment = require("../models/Payment");

// const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// // POST /api/payments
// const createPayment = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     const {
//       invoiceId,
//       amount,
//       paymentType,
//       paymentMethod,
//       installmentNumber,
//       transactionReference = "",
//       paymentDate,
//       notes = "",
//     } = req.body;

//     if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
//       return res.status(400).json({
//         success: false,
//         message: "A valid invoice ID is required",
//       });
//     }

//     const paymentAmount = Number(amount);

//     if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment amount must be greater than zero",
//       });
//     }

//     const allowedMethods = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

//     if (!allowedMethods.includes(paymentMethod)) {
//       return res.status(400).json({
//         success: false,
//         message: "Select a valid payment method",
//       });
//     }

//     const allowedPaymentTypes = [
//       "Full Payment",
//       "Down Payment",
//       "EMI Installment",
//     ];

//     if (!allowedPaymentTypes.includes(paymentType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Select a valid payment type",
//       });
//     }

//     const paidOn = paymentDate ? new Date(paymentDate) : new Date();

//     if (Number.isNaN(paidOn.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment date",
//       });
//     }

//     let createdPayment;

//     await session.withTransaction(async () => {
//       const invoice = await Invoice.findById(invoiceId).session(session);

//       if (!invoice) {
//         const error = new Error("Invoice not found");
//         error.statusCode = 404;
//         throw error;
//       }

//       if (invoice.paymentStatus === "Paid" || invoice.balanceDue <= 0) {
//         const error = new Error("This invoice is already fully paid");
//         error.statusCode = 400;
//         throw error;
//       }

//       if (paymentAmount > invoice.balanceDue + 0.01) {
//         const error = new Error("Payment cannot exceed the invoice balance");
//         error.statusCode = 400;
//         throw error;
//       }

//       if (invoice.paymentType === "Full Payment") {
//         if (paymentType !== "Full Payment") {
//           const error = new Error(
//             "This invoice requires a Full Payment transaction",
//           );
//           error.statusCode = 400;
//           throw error;
//         }

//         if (Math.abs(paymentAmount - invoice.balanceDue) > 0.01) {
//           const error = new Error(
//             "Full Payment must settle the entire remaining invoice balance",
//           );
//           error.statusCode = 400;
//           throw error;
//         }
//       } else {
//         if (paymentType === "Full Payment") {
//           const error = new Error(
//             "Use Down Payment or EMI Installment for an EMI invoice",
//           );
//           error.statusCode = 400;
//           throw error;
//         }

//         if (paymentType === "Down Payment") {
//           const previousDownPayments = await Payment.aggregate([
//             {
//               $match: {
//                 invoice: invoice._id,
//                 paymentType: "Down Payment",
//               },
//             },
//             {
//               $group: {
//                 _id: null,
//                 total: { $sum: "$amount" },
//               },
//             },
//           ]).session(session);

//           const alreadyPaid = previousDownPayments[0]?.total || 0;
//           const downPaymentRemaining = roundMoney(
//             invoice.downPayment - alreadyPaid,
//           );

//           if (downPaymentRemaining <= 0.01) {
//             const error = new Error(
//               "The required down payment is already paid",
//             );
//             error.statusCode = 400;
//             throw error;
//           }

//           if (paymentAmount > downPaymentRemaining + 0.01) {
//             const error = new Error(
//               "Payment exceeds the remaining down payment",
//             );
//             error.statusCode = 400;
//             throw error;
//           }
//         }

//         if (paymentType === "EMI Installment") {
//           const number = Number(installmentNumber);

//           if (
//             !Number.isInteger(number) ||
//             number < 1 ||
//             number > invoice.emiSchedule.length
//           ) {
//             const error = new Error("Invalid EMI installment number");
//             error.statusCode = 400;
//             throw error;
//           }

//           const installment = invoice.emiSchedule.find(
//             (item) => item.installmentNumber === number,
//           );

//           if (!installment) {
//             const error = new Error("EMI installment not found");
//             error.statusCode = 404;
//             throw error;
//           }

//           const previousInstallments = invoice.emiSchedule.filter(
//             (item) => item.installmentNumber < number,
//           );

//           const earlierUnpaid = previousInstallments.some(
//             (item) => item.status !== "Paid",
//           );

//           if (earlierUnpaid) {
//             const error = new Error(
//               "Please clear earlier EMI installments first",
//             );
//             error.statusCode = 400;
//             throw error;
//           }

//           const installmentRemaining = roundMoney(
//             installment.installmentAmount - installment.paidAmount,
//           );

//           if (installmentRemaining <= 0.01) {
//             const error = new Error("This EMI installment is already paid");
//             error.statusCode = 400;
//             throw error;
//           }

//           if (paymentAmount > installmentRemaining + 0.01) {
//             const error = new Error(
//               "Payment exceeds the remaining amount of this installment",
//             );
//             error.statusCode = 400;
//             throw error;
//           }

//           installment.paidAmount = roundMoney(
//             installment.paidAmount + paymentAmount,
//           );

//           if (installment.paidAmount >= installment.installmentAmount - 0.01) {
//             installment.paidAmount = installment.installmentAmount;
//             installment.status = "Paid";
//             installment.paidDate = paidOn;
//           } else {
//             installment.status = "Partial";
//           }
//         }
//       }

//       const paymentData = {
//         invoice: invoice._id,
//         customer: invoice.customer,
//         amount: roundMoney(paymentAmount),
//         paymentType,
//         installmentNumber:
//           paymentType === "EMI Installment" ? Number(installmentNumber) : null,
//         paymentMethod,
//         transactionReference: String(transactionReference).trim(),
//         paymentDate: paidOn,
//         notes: String(notes).trim(),
//       };

//       const paymentDocuments = await Payment.create([paymentData], { session });

//       createdPayment = paymentDocuments[0];

//       invoice.totalPaid = roundMoney(invoice.totalPaid + paymentAmount);
//       invoice.balanceDue = roundMoney(invoice.totalPayable - invoice.totalPaid);

//       if (invoice.balanceDue <= 0.01) {
//         invoice.balanceDue = 0;
//         invoice.totalPaid = invoice.totalPayable;
//         invoice.paymentStatus = "Paid";
//       } else if (invoice.totalPaid > 0) {
//         invoice.paymentStatus = "Partial";
//       } else {
//         invoice.paymentStatus = "Pending";
//       }

//       await invoice.save({ session });
//     });

//     const populatedPayment = await Payment.findById(createdPayment._id)
//       .populate("customer", "name phone")
//       .populate("invoice", "invoiceNumber totalPayable totalPaid balanceDue");

//     return res.status(201).json({
//       success: true,
//       message: "Payment recorded successfully",
//       payment: populatedPayment,
//     });
//   } catch (error) {
//     console.error("Create payment error:", error);

//     return res.status(error.statusCode || 500).json({
//       success: false,
//       message: error.message || "Failed to record payment",
//     });
//   } finally {
//     await session.endSession();
//   }
// };

// // GET /api/payments
// const getPayments = async (req, res) => {
//   try {
//     const { invoiceId, customerId } = req.query;
//     const filter = {};

//     if (invoiceId) {
//       if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid invoice ID",
//         });
//       }

//       filter.invoice = invoiceId;
//     }

//     if (customerId) {
//       if (!mongoose.Types.ObjectId.isValid(customerId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid customer ID",
//         });
//       }

//       filter.customer = customerId;
//     }

//     const payments = await Payment.find(filter)
//       .populate("customer", "name phone")
//       .populate("invoice", "invoiceNumber paymentType")
//       .sort({ paymentDate: -1 });

//     return res.status(200).json({
//       success: true,
//       count: payments.length,
//       payments,
//     });
//   } catch (error) {
//     console.error("Get payments error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payments",
//     });
//   }
// };

// // GET /api/payments/:id
// const getPaymentById = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment ID",
//       });
//     }

//     const payment = await Payment.findById(req.params.id)
//       .populate("customer", "name phone address")
//       .populate(
//         "invoice",
//         "invoiceNumber paymentType totalPayable totalPaid balanceDue",
//       );

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       payment,
//     });
//   } catch (error) {
//     console.error("Get payment details error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payment details",
//     });
//   }
// };

// module.exports = {
//   createPayment,
//   getPayments,
//   getPaymentById,
// };

const mongoose = require("mongoose");

const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// Check whether an EMI installment is overdue
const isInstallmentOverdue = (installment) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(installment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const remaining = roundMoney(
    installment.installmentAmount - installment.paidAmount,
  );

  return dueDate < today && remaining > 0.01;
};

// Update invoice payment status
const updateInvoicePaymentStatus = (invoice) => {
  if (invoice.balanceDue <= 0.01) {
    invoice.balanceDue = 0;
    invoice.totalPaid = invoice.totalPayable;
    invoice.paymentStatus = "Paid";
    return;
  }

  const hasOverdueInstallment = invoice.emiSchedule?.some(
    (installment) =>
      installment.status !== "Paid" && isInstallmentOverdue(installment),
  );

  if (hasOverdueInstallment) {
    invoice.paymentStatus = "Overdue";
  } else if (invoice.totalPaid > 0) {
    invoice.paymentStatus = "Partial";
  } else {
    invoice.paymentStatus = "Pending";
  }
};

// POST /api/payments
const createPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      invoiceId,
      amount,
      paymentType,
      paymentMethod,
      installmentNumber,
      transactionReference = "",
      paymentDate,
      notes = "",
    } = req.body;

    // Validate invoice ID
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "A valid invoice ID is required",
      });
    }

    // Validate amount
    const rawAmount = Number(amount);

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
    }

    const paymentAmount = roundMoney(rawAmount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be at least ₹0.01",
      });
    }

    // Validate payment method
    const allowedMethods = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment method",
      });
    }

    // Validate payment type
    const allowedPaymentTypes = [
      "Full Payment",
      "Down Payment",
      "EMI Installment",
    ];

    if (!allowedPaymentTypes.includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment type",
      });
    }

    // Validate payment date
    const paidOn = paymentDate ? new Date(paymentDate) : new Date();

    if (Number.isNaN(paidOn.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment date",
      });
    }

    if (paidOn > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Payment date cannot be in the future",
      });
    }

    let createdPayment;

    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session);

      if (!invoice) {
        const error = new Error("Invoice not found");
        error.statusCode = 404;
        throw error;
      }

      if (invoice.paymentStatus === "Paid" || invoice.balanceDue <= 0.01) {
        const error = new Error("This invoice is already fully paid");
        error.statusCode = 400;
        throw error;
      }

      if (paymentAmount > invoice.balanceDue + 0.01) {
        const error = new Error("Payment cannot exceed the invoice balance");
        error.statusCode = 400;
        throw error;
      }

      // FULL PAYMENT INVOICE
      if (invoice.paymentType === "Full Payment") {
        if (paymentType !== "Full Payment") {
          const error = new Error(
            "This invoice requires a Full Payment transaction",
          );
          error.statusCode = 400;
          throw error;
        }

        if (Math.abs(paymentAmount - invoice.balanceDue) > 0.01) {
          const error = new Error(
            "Full Payment must settle the entire remaining invoice balance",
          );
          error.statusCode = 400;
          throw error;
        }
      } else {
        // EMI INVOICE
        if (paymentType === "Full Payment") {
          const error = new Error(
            "Use Down Payment or EMI Installment for an EMI invoice",
          );
          error.statusCode = 400;
          throw error;
        }

        // DOWN PAYMENT
        if (paymentType === "Down Payment") {
          const previousDownPayments = await Payment.aggregate([
            {
              $match: {
                invoice: invoice._id,
                paymentType: "Down Payment",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ]).session(session);

          const alreadyPaid = previousDownPayments[0]?.total || 0;

          const downPaymentRemaining = roundMoney(
            invoice.downPayment - alreadyPaid,
          );

          if (downPaymentRemaining <= 0.01) {
            const error = new Error(
              "The required down payment is already paid",
            );
            error.statusCode = 400;
            throw error;
          }

          if (paymentAmount > downPaymentRemaining + 0.01) {
            const error = new Error(
              "Payment exceeds the remaining down payment",
            );
            error.statusCode = 400;
            throw error;
          }
        }

        // EMI INSTALLMENT
        if (paymentType === "EMI Installment") {
          // Ensure the complete down payment is paid first
          const previousDownPayments = await Payment.aggregate([
            {
              $match: {
                invoice: invoice._id,
                paymentType: "Down Payment",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ]).session(session);

          const downPaymentPaid = previousDownPayments[0]?.total || 0;

          if (downPaymentPaid < invoice.downPayment - 0.01) {
            const error = new Error(
              "Please complete the down payment before paying EMIs",
            );
            error.statusCode = 400;
            throw error;
          }

          const number = Number(installmentNumber);

          if (
            !Number.isInteger(number) ||
            number < 1 ||
            number > invoice.emiSchedule.length
          ) {
            const error = new Error("Invalid EMI installment number");
            error.statusCode = 400;
            throw error;
          }

          const installment = invoice.emiSchedule.find(
            (item) => item.installmentNumber === number,
          );

          if (!installment) {
            const error = new Error("EMI installment not found");
            error.statusCode = 404;
            throw error;
          }

          // Earlier installments must be paid first
          const previousInstallments = invoice.emiSchedule.filter(
            (item) => item.installmentNumber < number,
          );

          const earlierUnpaid = previousInstallments.some(
            (item) => item.status !== "Paid",
          );

          if (earlierUnpaid) {
            const error = new Error(
              "Please clear earlier EMI installments first",
            );
            error.statusCode = 400;
            throw error;
          }

          const installmentRemaining = roundMoney(
            installment.installmentAmount - installment.paidAmount,
          );

          if (installmentRemaining <= 0.01) {
            const error = new Error("This EMI installment is already paid");
            error.statusCode = 400;
            throw error;
          }

          if (paymentAmount > installmentRemaining + 0.01) {
            const error = new Error(
              "Payment exceeds the remaining amount of this installment",
            );
            error.statusCode = 400;
            throw error;
          }

          // Update installment payment
          installment.paidAmount = roundMoney(
            installment.paidAmount + paymentAmount,
          );

          if (installment.paidAmount >= installment.installmentAmount - 0.01) {
            installment.paidAmount = installment.installmentAmount;

            installment.status = "Paid";
            installment.paidDate = paidOn;
          } else if (isInstallmentOverdue(installment)) {
            installment.status = "Overdue";
          } else {
            installment.status = "Partial";
          }
        }
      }

      // Create payment record
      const paymentData = {
        invoice: invoice._id,
        customer: invoice.customer,
        amount: roundMoney(paymentAmount),
        paymentType,
        installmentNumber:
          paymentType === "EMI Installment" ? Number(installmentNumber) : null,
        paymentMethod,
        transactionReference: String(transactionReference).trim(),
        paymentDate: paidOn,
        notes: String(notes).trim(),
      };

      const paymentDocuments = await Payment.create([paymentData], { session });

      createdPayment = paymentDocuments[0];

      // Update invoice totals
      invoice.totalPaid = roundMoney(invoice.totalPaid + paymentAmount);

      invoice.balanceDue = roundMoney(invoice.totalPayable - invoice.totalPaid);

      updateInvoicePaymentStatus(invoice);

      await invoice.save({ session });
    });

    // Return populated payment details
    const populatedPayment = await Payment.findById(createdPayment._id)
      .populate("customer", "name phone")
      .populate(
        "invoice",
        "invoiceNumber totalPayable totalPaid balanceDue paymentStatus",
      );

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment: populatedPayment,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  } finally {
    await session.endSession();
  }
};

// GET /api/payments
const getPayments = async (req, res) => {
  try {
    const { invoiceId, customerId } = req.query;

    const filter = {};

    if (invoiceId) {
      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID",
        });
      }

      filter.invoice = invoiceId;
    }

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      filter.customer = customerId;
    }

    const payments = await Payment.find(filter)
      .populate("customer", "name phone")
      .populate("invoice", "invoiceNumber paymentType")
      .sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};

// GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("customer", "name phone address")
      .populate(
        "invoice",
        "invoiceNumber paymentType totalPayable totalPaid balanceDue",
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
};
