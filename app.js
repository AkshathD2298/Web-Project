const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const database = require('./config/database');
const bodyParser = require('body-parser');
const restaurantRouter = require('./routes/restaurantsRoute');
const authRouter = require('./routes/authRoute');

const { check, validationResult } = require("express-validator");

const port = process.env.PORT || 3000;
dotenv.config();
mongoose.connect(database.url);
let db = mongoose.connection;

// Check connection
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Check for DB errors
db.on("error", function (err) {
  console.log("DB Error");
});

app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(cors());
var Restaurant = require('./models/restaurant');
const exphbs = require('express-handlebars');
app.use(express.static(path.join(__dirname, 'views')));
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set("view engine", ".hbs");

app.use('/api/restaurants', restaurantRouter);
app.use('/api/auth', authRouter);

app.use('/', (req, res) => {
  const page = parseInt(req.query.page);
  const perPage = parseInt(req.query.perPage);
  const borough = req.query.borough;

//   if (isNaN(page) || isNaN(perPage) || (borough && typeof borough !== 'string')) {
//     return res.status(400).send("Invalid query parameters");
//   }
    console.log("default")
  const filter = borough ? { borough } : {};

  Restaurant.find(filter)
    .skip(page * perPage)
    .limit(perPage)
    .lean()
    .then((restaurants) => {
      //res.render("index", { restaurant: restaurants });
      res.status(200).send(restaurants);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error fetching restaurants");
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});