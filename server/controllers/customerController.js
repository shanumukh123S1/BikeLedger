const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Bike = require("../models/Bike");
// CREATE CUSTOMER
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      alternatePhone,
      address,
      guarantorName,
      guarantorPhone,
      notes,
    } = req.body;

    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number and address are required",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      alternatePhone,
      address,
      guarantorName,
      guarantorPhone,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL ACTIVE CUSTOMERS + SEARCH
const getCustomers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const customers = await Customer.find({
      isActive: true,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
    });
  }
};

// GET CUSTOMER BY ID
const getCustomerById = async (req, res) => {
  try {
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

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid customer ID",
    });
  }
};

// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "alternatePhone",
      "address",
      "guarantorName",
      "guarantorPhone",
      "notes",
    ];
    console.log("CUSTOMER SAVED:");
    console.log(customer);
    console.log("DATABASE:", mongoose.connection.name);

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};




// PERMANENTLY DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }
    const linkedBike = await Bike.exists({
      customer: id,
    });

    if (linkedBike) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this customer because bike records are linked to them. Delete or reassign those records first.",
      });
    }

    // Find and permanently delete customer
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer permanently deleted from database",
    });
  } catch (error) {
    console.error("Customer deletion error:", error.message);

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
