const product = require("../model/product");
const dotenv = require("dotenv");
const connectDatabase = require("../config/database");
const products = require("../data/products");
dotenv.config({ path: "backend/config/config.env" });
connectDatabase();
const seedproducts = async () => {
  try {
    await product.deleteMany();
    console.log("products are deleted");
    await product.insertMany(products);
    console.log("products are added");
    process.exit();
  } catch (err) {
    console.log(err.message);
    process.exit();
  }
};
seedproducts();
