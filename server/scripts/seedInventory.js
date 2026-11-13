require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const BikeInventory = require("../models/BikeInventory");

const inventory = [
  {
    brand: "Hero",
    model: "Splendor Plus",
    category: "Motorcycle",
    stock: 4,
    price: null,
    colors: ["Black", "Blue", "Red"],
    imageUrl:
      "https://media.zigcdn.com/media/content/2023/Sep/cover_650bf24aeec35.jpg",
  },
  {
    brand: "Hero",
    model: "HF Deluxe",
    category: "Motorcycle",
    stock: 3,
    price: null,
    colors: ["Blue", "Black", "Red"],
    imageUrl:
      "https://cdni.autocarindia.com/utils/imageresizer.ashx?n=https%3A%2F%2Fcms.haymarketindia.net%2Fmodel%2Fuploads%2Fmodelimages%2FHero-MotoCorp-HF-Deluxe-130120211538.jpg",
  },
  {
    brand: "Honda",
    model: "Shine 125",
    category: "Motorcycle",
    stock: 4,
    price: null,
    colors: ["Blue", "Black", "Red"],
    imageUrl:
      "https://ich.kaizenhonda.com/v1/product/35/icon/Pearl%20Siren%20Blue.png",
  },
  {
    brand: "Honda",
    model: "Activa",
    category: "Scooter",
    stock: 4,
    price: null,
    colors: ["Blue", "Black", "White"],
    imageUrl:
      "https://samrathonda.com/uploads/bikes/1769148446_download%20-%202026-01-23T113618.376.png",
  },
  {
    brand: "TVS",
    model: "Jupiter",
    category: "Scooter",
    stock: 3,
    price: null,
    colors: ["Orange", "White", "Grey"],
    imageUrl:
      "https://www.tvsmotor.com/tvs-jupiter/-/media/TVS-Jupiter-110/Latest-Blogs/Jupiter-Image-4.PNG",
  },
  {
    brand: "TVS",
    model: "Raider 125",
    category: "Motorcycle",
    stock: 3,
    price: null,
    colors: ["Yellow", "Black", "Red"],
    imageUrl:
      "https://www.tvsmotor.com/pe/-/media/Feature/IB/Columbia/compressed-images/virtual-experience/Virtual-Experince/Raider/yellow.png",
  },
  {
    brand: "Bajaj",
    model: "Pulsar N160",
    category: "Motorcycle",
    stock: 3,
    price: null,
    colors: ["Black", "Blue", "Red"],
    imageUrl:
      "https://cdni.autocarindia.com/utils/imageresizer.ashx?n=https%3A%2F%2Fcms.haymarketindia.net%2Fmodel%2Fuploads%2Fmodelimages%2FBajaj-Pulsar-N160-040720221312.png",
  },
  {
    brand: "Suzuki",
    model: "Access 125",
    category: "Scooter",
    stock: 4,
    price: null,
    colors: ["Green", "White", "Black"],
    imageUrl:
      "https://cdn.bikedekho.com/processedimages/suzuki/2025-access-125/source/2025-access-125679781cfcf8aa.jpg",
  },
];

const seedInventory = async () => {
  try {
    await connectDB();

    let added = 0;
    let existing = 0;

    for (const bike of inventory) {
      const result = await BikeInventory.updateOne(
        {
          brand: bike.brand,
          model: bike.model,
        },
        {
          $setOnInsert: bike,
        },
        {
          upsert: true,
        },
      );

      if (result.upsertedCount > 0) {
        added++;
      } else {
        existing++;
      }
    }

    console.log("Bike inventory seeding completed.");
    console.log(`New models added: ${added}`);
    console.log(`Existing models skipped: ${existing}`);
  } catch (error) {
    console.error("Inventory seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedInventory();
