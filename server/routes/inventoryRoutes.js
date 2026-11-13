const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getInventory,
  getInventoryBike,
  createInventoryBike,
  updateInventoryBike,
  deleteInventoryBike,
} = require("../controllers/inventoryController");

router.use(protect);

router.get("/", getInventory);
router.get("/:id", getInventoryBike);
router.post("/", createInventoryBike);
router.put("/:id", updateInventoryBike);
router.delete("/:id", deleteInventoryBike);

module.exports = router;
