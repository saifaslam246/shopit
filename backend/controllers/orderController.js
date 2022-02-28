const Order = require("../model/order");
const Product = require("../model/product");

// create our new order => api/v1/order/new
exports.newOrder = async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  const order = await Order.create({
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
  });
  res.status(200).json({
    success: true,
    order,
  });
};

// get  single order => api/v1/order/:id
exports.getSingleOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    res.status(404).json({
      success: false,
      messgae: "no order found with this id",
    });
  }
  res.status(200).json({
    success: true,
    order,
  });
};

// get logged in user orders => api/v1/orders/me
exports.myOrders = async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    orders,
  });
};

// get all order by admin => api/v1/admin/orders
exports.allOrders = async (req, res, next) => {
  const orders = await Order.find();
  totalAmount = 0;
  orders.forEach((order) => {
    totalAmount = totalAmount + order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
};

// update /process order by admin => api/v1/admin/order/:id
exports.updateOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (order.orderStatus === "Delivered") {
    res.status(400).json({
      success: false,
      message: " your order already deliverd",
    });
  }
  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  order.orderStatus = req.body.status;
  order.deliveredAt = Date.now();
  await order.save();
  res.status(200).json({
    success: true,
  });
};
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });
}

// delete order by admin => api/v1/admin/order/:id
exports.deleteOrder = async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    res.status(404).json({
      success: false,
      messgae: "no order found with this id",
    });
  }
  res.status(200).json({
    success: true,
    message: "you have deleted this order",
    order,
  });
};
