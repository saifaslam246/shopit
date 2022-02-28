const express = require("express");
const router = express.Router();
const {
  getsingleproduct,
  getproducts,
  newproduct,
  updateproduct,
  deleteproduct,
  createProductReview,
  getProductReviews,
  deleteProductReview,
  getAdminProducts,
} = require("../controllers/productController");

const { isAuthorizedUser, authorizedRoles } = require("../middleware/auth");
router
  .route("/admin/product/new")
  .post(isAuthorizedUser, authorizedRoles("admin"), newproduct);
router.route("/products").get(getproducts);
router.route("/admin/products").get(getAdminProducts);
router.route("/product/:id").get(getsingleproduct);
router
  .route("/admin/product/:id")
  .put(isAuthorizedUser, authorizedRoles("admin"), updateproduct);
router
  .route("/admin/product/:id")
  .delete(isAuthorizedUser, authorizedRoles("admin"), deleteproduct);

router.route("/review").put(isAuthorizedUser, createProductReview);
router.route("/reviews").get(isAuthorizedUser, getProductReviews);
router.route("/reviews").delete(isAuthorizedUser, deleteProductReview);

module.exports = router;
