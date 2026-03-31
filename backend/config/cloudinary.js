// ============================================================
//  config/cloudinary.js  —  Cloudinary + Multer setup
//  Used in productRoutes to handle image file uploads
// ============================================================

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tell Multer to store uploaded files directly in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "mern-ecommerce/products", // Cloudinary folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // Auto-resize
  },
});

// The `upload` middleware can be used in any route
const upload = multer({ storage });

module.exports = { cloudinary, upload };
