const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");
const User = require("../models/User");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.fields);
    // console.log(req.files.picture.path);

    // Destructuring
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;

    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
    });

    // Upload de l'image
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: `/vinted/offers/${newOffer.product_name} ${newOffer._id} `,
    });

    newOffer.product_image = result;

    await newOffer.save();

    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//*************************************************************

//Créer une route pour permettre aux créateurs des annonces de pouvoir les modifier (méthode HTTP put)

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  const offerToModify = await Offer.findById(req.params.id);
  try {
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }

    const details = offerToModify.product_details;
    for (i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (req.fields.brand) {
          details[i].MARQUE = req.fields.brand;
        }
      }
      if (details[i].TAILLE) {
        if (req.fields.size) {
          details[i].TAILLE = req.fields.size;
        }
      }
      if (details[i].ÉTAT) {
        if (req.fields.condition) {
          details[i].ÉTAT = req.fields.condition;
        }
      }
      if (details[i].COULEUR) {
        if (req.fields.color) {
          details[i].COULEUR = req.fields.color;
        }
      }
      if (details[i].EMPLACEMENT) {
        if (req.fields.location) {
          details[i].EMPLACEMENT = req.fields.location;
        }
      }
    }

    // Notifie Mongoose que l'on a modifié le tableau product_details
    offerToModify.markModified("product_details");

    if (req.files.picture) {
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        public_id: `api/vinted/offers/${offerToModify._id}/preview`,
      });
      offerToModify.product_image = result;
    }

    await offerToModify.save();

    res.status(200).json("Offer modified succesfully !");
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

//************************************************************* modif test
//Créer une route pour permettre aux créateurs des annonces de supprimer (méthode HTTP delete).

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params.id);
    //Je supprime ce qui il y a dans le dossier
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted/offers/${req.params.id}`
    );
    //Une fois le dossier vide, je peux le supprimer !
    await cloudinary.api.delete_folder(`api/vinted/offers/${req.params.id}`);

    offerToDelete = await Offer.findById(req.params.id);

    await offerToDelete.delete();

    res
      .status(200)
      .json({ message: "L'annonce a été definitivement supprimée" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

//***********************************************************************

router.get("/offers", async (req, res) => {
  try {
    // const offers = await Offer.find({
    //   product_name: new RegExp(req.query.search, "i"),
    // }).select("product_price product_name");

    // $gte greater than or equal >=
    // $lte <=
    // $gt >
    // $lt <
    // const offers = await Offer.find({
    //   product_price: { $gte: 100, $lte: 300 },
    // }).select("product_price product_name");

    // 1 ou -1
    // "asc" ou "desc"
    // const offers = await Offer.find()
    //   .sort({ product_price: "desc" })
    //   .select("product_price product_name");

    // Pagination
    // skip() et limit()
    // skip et limit reçoivent systématique un nombre
    // console.log(req.query.skip);
    // console.log(typeof req.query.skip);
    // const offers = await Offer.find()
    //   .skip(4)
    //   .limit(2)
    //   .select("product_price product_name");

    // const count = await Offer.countDocuments({ product_name: "Robe" });
    // console.log(count);

    // Cette route peut recevoir différentes query
    // title

    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }

    let sort = {};
    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }

    let limit = Number(req.query.limit);
    if (!limit) {
      limit = 10;
    }

    let page;
    if (!req.query.page || Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    let skip = (page - 1) * limit;
    console.log(skip);

    const offers = await Offer.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "owner",
        select: "account",
      });

    const count = await Offer.countDocuments(filters);
    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
