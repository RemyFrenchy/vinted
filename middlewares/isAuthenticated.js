const User = require("../models/User"); // ES5
// import User from "./" // ES6

const isAuthenticated = async (req, res, next) => {
  try {
    // Récupérer le Bearer token
    const userToken = req.headers.authorization.replace("Bearer ", "");
    // Chercher le user qui possède ce token
    const user = await User.findOne({ token: userToken }).select("_id account");
    if (user) {
      // Si ok ===> next()
      req.user = user;
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
    // Sinon ===> unauthorized
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
