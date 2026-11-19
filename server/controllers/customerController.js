const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Bike = require("../models/Bike");

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value));

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// CREATE CUSTOMER
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      alternatePhone = "",
      address,
      guarantorName = "",
      guarantorPhone = "",
      notes = "",
    } = req.body;

    const normalizedPhone = normalizePhone(phone);

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and address are required",
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Reject an existing mobile number before writing to MongoDB.
    const duplicate = await Customer.findOne({ phone: normalizedPhone }).select("_id name");

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered to another customer.",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: normalizedPhone,
      alternatePhone: normalizePhone(alternatePhone),
      address: address.trim(),
      guarantorName: String(guarantorName).trim(),
      guarantorPhone: normalizePhone(guarantorPhone),
      notes: String(notes).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered to another customer.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create customer",
    });
  }
};

// GET ALL ACTIVE CUSTOMERS + SEARCH
const getCustomers = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = { isActive: true };

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
    });
  }
};

// GET CUSTOMER BY ID
const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer",
    });
  }
};

// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "alternatePhone",
      "address",
      "guarantorName",
      "guarantorPhone",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.address !== undefined) updates.address = String(updates.address).trim();
    if (updates.phone !== undefined) {
      updates.phone = normalizePhone(updates.phone);

      if (!isValidPhone(updates.phone)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10-digit mobile number",
        });
      }

      const duplicate = await Customer.findOne({
        phone: updates.phone,
        _id: { $ne: id },
      }).select("_id name");

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This mobile number is already registered to another customer.",
        });
      }
    }

    if (updates.alternatePhone !== undefined) {
      updates.alternatePhone = normalizePhone(updates.alternatePhone);
    }
    if (updates.guarantorPhone !== undefined) {
      updates.guarantorPhone = normalizePhone(updates.guarantorPhone);
    }
    if (updates.guarantorName !== undefined) {
      updates.guarantorName = String(updates.guarantorName).trim();
    }
    if (updates.notes !== undefined) updates.notes = String(updates.notes).trim();

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isActive: true },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered to another customer.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update customer",
    });
  }
};

// PERMANENTLY DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const linkedBike = await Bike.exists({ customer: id });

    if (linkedBike) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this customer because bike records are linked to them. Delete or reassign those records first.",
      });
    }

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer permanently deleted from MongoDB",
    });
  } catch (error) {
    console.error("Customer deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
