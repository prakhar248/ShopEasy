// ============================================================
// SEED SCRIPT - Generates Users, Sellers, Products & Reviews
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const { faker } = require("@faker-js/faker");

// Load env variables
dotenv.config();

// Models (adjust paths if needed)
const User = require("../models/User");
const Product = require("../models/Product");

// ================= DB CONNECTION =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    process.exit(1);
  }
};

// ================= CREATE SELLERS =================
const createSellers = async (num = 10) => {
  const sellers = [];

  for (let i = 0; i < num; i++) {
    sellers.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "123456", // ⚠️ hash if your model requires
      isSeller: true,
    });
  }

  return await User.insertMany(sellers);
};

// ================= CREATE USERS =================
const createUsers = async (num = 20) => {
  const users = [];

  for (let i = 0; i < num; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "123456",
      isSeller: false,
    });
  }

  return await User.insertMany(users);
};

// ================= CREATE PRODUCTS =================
const createProducts = async (sellers, num = 100) => {
  const products = [];

  for (let i = 0; i < num; i++) {
    const seller = faker.helpers.arrayElement(sellers);

    products.push({
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price({ min: 100, max: 5000 })),
      description: faker.commerce.productDescription(),
      image: faker.image.urlLoremFlickr({ category: "product" }),
      category: faker.helpers.arrayElement(["Electronics", "Clothing", "Books", "Home", "Sports", "Beauty"]),
      brand: faker.company.name(),
      countInStock: faker.number.int({ min: 0, max: 100 }),
      seller: seller._id,
      reviews: [],
      numReviews: 0,
      rating: 0,
    });
  }

  return await Product.insertMany(products);
};

// ================= ADD REVIEWS =================
const addReviews = async (products, users) => {
  for (let product of products) {
    const numReviews = faker.number.int({ min: 1, max: 5 });

    const reviews = [];

    for (let i = 0; i < numReviews; i++) {
      const user = faker.helpers.arrayElement(users);

      reviews.push({
        name: user.name,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentences(2),
        user: user._id,
      });
    }

    product.reviews = reviews;
    product.numReviews = reviews.length;
    product.rating =
      reviews.reduce((acc, item) => acc + item.rating, 0) /
      reviews.length;

    await product.save();
  }
};

// ================= MAIN SEED FUNCTION =================
const seedDB = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing old data...");
    await User.deleteMany();
    await Product.deleteMany();

    console.log("👨‍💼 Creating sellers...");
    const sellers = await createSellers(10);

    console.log("👤 Creating users...");
    const users = await createUsers(20);

    console.log("📦 Creating products...");
    const products = await createProducts(sellers, 100);

    console.log("⭐ Adding reviews...");
    await addReviews(products, users);

    console.log("🎉 Data Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

// ================= RUN SCRIPT =================
seedDB();