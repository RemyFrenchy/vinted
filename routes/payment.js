const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");

const morgan = require("morgan");
const formidable = require("express-formidable");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51KUwQFIwoULn9HYXtMo72FqQOuKJMU9fbt6IyV2FSjXjbnW0gxDmVCCFUYpTgLhr99Otk9jb1ux4CczksBWxyBUx00d2QHfTLC"
);
const app = express();
app.use(formidable());
app.use(cors());
app.use(mogan("dev"));

app.post("/payment", isAuthenticated, async (req, res) => {
  const stripeToken = req.fields.stripeToken;
  res.json("TEST");

  const response = await stripe.charges.create({
    amount: 5000,
    currency: "eur",
    description: "test a remplacer par la description de l'objet ",
    source: stripeToken,
  });
  console.log(response.status);
});
module.exports = router;
