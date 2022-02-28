const User = require("../model/user");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const { findById } = require("../model/user");

//register a user /api/v1/register
exports.registerUser = async (req, res, next) => {
  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });
  sendToken(user, 200, res);
};

//login a user /api/v1/login
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  // check whearher email and password is entered or not
  if (!email || !password) {
    return res.status(201).json({
      message: "please enter email and password",
    });
  }
  // find user in database
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(201).json({
      message: "invalid email or password",
    });
  }
  //check if psasword is correct or
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return res.status(201).json({
      message: "invalis email or password",
    });
  }
  sendToken(user, 200, res);
};
// forget passsword => api/v1/password/forget
exports.forgetPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(201).json({
      message: "user not found with this email",
    });
  }
  // get resttoken
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // create reset password URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;
  const message = `your reset password token as follow: /n/n ${resetUrl}  if you have not requested this email kindly ignore it`;
  try {
    await sendEmail({
      email: user.email,
      subject: " ShopIt password recovery ",
      message,
    });

    res.status(200).json({
      success: true,
      message: `email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      res.status(500).json({
        message: error.message,
      })
    );
  }
};
// forget passsword => api/v1/password/reset/:token
exports.resetPassword = async (req, res, next) => {
  // hash url token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({
      message: "password reset token has been invalid or has been expires",
    });
  }
  if (req.body.password !== req.body.confermpassword) {
    return res.status(400).json({
      message: "password does not match",
    });
  }
  // setup new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
};

/// get currently loged in user api/v1/me

exports.getProfileUser = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
};

// update / change password api/vi/password/
exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  //check pervious password
  const isMatched = await user.comparePassword(req.body.oldPassword);
  if (!isMatched) {
    return res.status(400).json({
      success: false,
      message: "old password does not match",
    });
  }
  user.password = req.body.password;
  await user.save();
  sendToken(user, 200, res);
};
// update user profile api/v1/me/update
exports.updateProfile = async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  // Update avatar
  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const image_id = user.avatar.public_id;
    const res = await cloudinary.v2.uploader.destroy(image_id);

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
};

//logout user = api/v1/logout

exports.logout = async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    messgae: "logout successfully",
  });
};

///admin Routes

// get All the user => api/v1/admin/users
exports.allUsers = async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
};
// get user datails api/v1/admin/user/:id
exports.singleUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(400).json({
      success: false,
      message: "this user is not exit",
    });
  } else {
    res.status(200).json({
      success: true,
      user,
    });
  }
};

// update user profile api/v1/admin/user/:id
exports.updateUser = async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
  });
};

// delete user datails api/v1/admin/user/:id
exports.deleteUser = async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(400).json({
      success: false,
      message: "this user is not exit",
    });
  }
  // delete the avator
  const image_id = user.avatar.public_id;
  await cloudinary.v2.uploader.destroy(image_id);
  res.status(200).json({
    success: true,
    user,
  });
};
