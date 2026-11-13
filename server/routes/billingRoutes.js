// const express = require("express");
// const router = express.Router();

// const {
//   getAvailableBikes,
//   createInvoice,
//   getInvoices,
//   getInvoiceById,
// } = require("../controllers/billingController");

// const { protect } = require("../middleware/authMiddleware");

// // All billing routes require staff authentication.
// router.use(protect);

// router.get("/available-bikes", getAvailableBikes);
// router.post("/", createInvoice);
// router.get("/", getInvoices);
// router.get("/:id", getInvoiceById);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getAvailableBikes,
  createInvoice,
  getInvoices,
  getInvoiceById,
} = require("../controllers/billingController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/available-bikes", getAvailableBikes);
router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);

module.exports = router;