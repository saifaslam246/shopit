const product = require("../model/product");
// const errorhandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");

// /creat a new product api/v1/product/new
exports.newproduct = async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  let imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }
  req.body.images = imagesLinks;
  req.body.user = req.user.id;
  const newproduct = await product.create(req.body);
  res.status(201).json({
    success: true,
    newproduct,
  });
};

// /get all the product api/v1/products

exports.getproducts = async (req, res, next) => {
  const resperpage = 8;
  const productCount = await product.countDocuments();
  const apifeature = new APIFeatures(product.find(), req.query)
    .search()
    .filter()
    .pagination(resperpage);

  const allproducts = await apifeature.query;
  let filteredProductsCount = allproducts.length;
  res.status(200).json({
    success: true,
    productCount,
    resperpage,
    filteredProductsCount,
    allproducts,
  });
};

// /get all the product (admin) api/v1/admin/products
exports.getAdminProducts = async (req, res, next) => {
  const products = await product.find();

  res.status(200).json({
    success: true,
    products,
  });
};

// get a single product by id api/v1/product/:id
exports.getsingleproduct = async (req, res, next) => {
  const singleproduct = await product.findById(req.params.id);
  if (!singleproduct) {
    res.status(404).json({
      success: false,
      message: "this product does not exit",
    });
  }
  res.status(200).json({
    success: true,
    singleproduct,
  });
};

// update a product by id api/v1/product/:id

exports.updateproduct = async (req, res, next) => {
  let updateproduct = await product.findById(req.params.id);

  if (!updateproduct) {
    return res.status(404).json({
      success: false,
      message: "this product does not exit",
    });
  }
  updateproduct = await product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    updateproduct,
  });
};

// delete a product by id api/v1/product/:id
exports.deleteproduct = async (req, res, next) => {
  const deleteproduct = await product.findByIdAndDelete(req.params.id);
  if (!deleteproduct) {
    return res.status(404).json({
      success: false,
      message: "this product does not exit",
    });
  }
  res.status(200).json({
    success: true,
    message: "product are deleted",
  });
};

/// create a new review => ap1/v1/review
exports.createProductReview = async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const reviewproduct = await product.findById(productId);
  const isreviewed = reviewproduct.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (isreviewed) {
    reviewproduct.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    reviewproduct.reviews.push(review);
    reviewproduct.numOfReviews = reviewproduct.reviews.length;
  }
  reviewproduct.ratings =
    reviewproduct.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviewproduct.reviews.length;
  await reviewproduct.save();
  res.status(200).json({
    success: true,
  });
};

// get all the reviews => api/v1/reviews
exports.getProductReviews = async (req, res, next) => {
  const getproductreview = await product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: getproductreview.reviews,
  });
};

// delete a review => api/v1/review/delete/:id
exports.deleteProductReview = async (req, res, next) => {
  const getproduct = await product.findById(req.query.productId);
  const reviews = getproduct.reviews.filter(
    (review) => review._id.toString() != req.query.id.toString()
  );
  const numofReviews = reviews.length;
  const ratings =
    getproduct.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviews.length;
  await product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numofReviews,
    },
    {
      new: true,
      runValidators: false,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    message: "your product review is deleted",
  });
};
