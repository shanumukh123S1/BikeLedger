const express = require("express");
const router = express.Router();

const { loginStaff } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Staff login
router.post("/login", loginStaff);

// Get logged-in staff details
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    staff: req.staff,
  });
});

module.exports = router;
