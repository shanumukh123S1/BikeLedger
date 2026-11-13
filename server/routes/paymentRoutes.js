// const express = require("express");
// const router = express.Router();

// const {
//   createPayment,
//   getPayments,
//   getPaymentById,
// } = require("../controllers/paymentController");

// const { protect } = require("../middleware/authMiddleware");

// // All payment routes require staff authentication.
// router.use(protect);

// router.post("/", createPayment);
// router.get("/", getPayments);
// router.get("/:id", getPaymentById);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPayments,
  getPaymentById,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);

module.exports = router;
