const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Restaurant = require("../models/restaurant");

const cuisines = [
  "American", "Italian", "Chinese", "Mexican", "Indian", "Japanese",
];

router
  .route("/add")
  .get((req, res) => {
    res.render("add_rest", { cuisines: cuisines });
  })
  .post((req, res) => {
    Promise.all([
      check("name", "Name is required").notEmpty().run(req),
      check("cuisine", "Cuisine is required").notEmpty().run(req),
      //check("address", "Address is required").notEmpty().run(req),
      //check("rating", "Rating is required").notEmpty().run(req)
    ])
    .then(() => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        const restaurant = new Restaurant();
        restaurant.name = req.body.name;
        restaurant.cuisine = req.body.cuisine;
        //restaurant.address = req.body.address;
        //restaurant.rating = req.body.rating;

        return restaurant.save();
      } else {
        res.render("add_rest", { errors: errors.array(), cuisines: cuisines });
      }
    })
    .then((result) => {
      if (!result) {
        res.send("Could not save restaurant");
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error saving restaurant");
    });
  });

router
  .route("/:id")
  .get((req, res) => {


    Restaurant.findById(req.params.id)
      .then((restaurant) => {
       // if (!restaurant) {
         // res.send("Could not find restaurant");
        //} else {
          res.send(restaurant);
        
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error fetching restaurant");
      });
  })
  .delete((req, res) => {
    const query = { _id: req.params.id };
    Restaurant.deleteOne(query)
      .then((result) => {
        if (!result) {
          res.status(500).send();
        } else {
          res.send("Successfully Deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error deleting restaurant");
      });
  })
  .put((req, res) => {
    console.log("Im here");
    const restaurant = {
      name: req.body.name,
      cuisine: req.body.cuisine,
      //address: req.body.address,
      //rating: req.body.rating,
    };
    console.log("Reahed here")
    console.log("Reahed here"+req.params.id)
    console.log("Reahed here"+req.body.name)
    console.log("Reahed here"+req.body.cuisine)
    const query = { _id: req.params.id };
    console.log("got the id")
    Restaurant.updateOne(query, {$set:restaurant})
      .then((result) => {
        console.log(result)
        if (!result) {
          res.send("Could not update restaurant");
        } else {
            res.send("updated");
          //res.redirect("/");
        }
      })
      .catch((err) => {
        console.error(err.message);
        
        res.status(500).send("Error updating restaurant");
      });
  });



module.exports = router;