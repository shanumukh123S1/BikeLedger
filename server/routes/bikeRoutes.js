const express = require("express");
const router = express.Router();

const {
  createBike,
  getBikes,
  getBikeById,
  updateBike,
  deleteBike,
} = require("../controllers/bikeController");

const { protect } = require("../middleware/authMiddleware");

// All bike routes require staff authentication
router.use(protect);

router.post("/", createBike);

router.get("/", getBikes);

router.get("/:id", getBikeById);

router.put("/:id", updateBike);

router.delete("/:id", deleteBike);

module.exports = router;
