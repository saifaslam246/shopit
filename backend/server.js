const app = require("./app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDatabase = require("../backend/config/database");
// settting up config file

if (process.env.NODE_ENV !== "PRODUCTION")
  require("dotenv").dotenv.config({ path: "backend/config/config.env" });
// dotenv.config({ path: "backend/config/config.env" });
// connection to databse
connectDatabase();
// SET CLOUDINARY CONFIGRATION

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
app.listen(process.env.PORT, () => {
  console.log(
    `server start at port number ${process.env.PORT} ${process.env.NODE_ENV}`
  );
});
