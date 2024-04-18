const express = require("express");
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const router = express.Router();
const { check,query, validationResult } = require("express-validator");
const urlencodedParser = express.urlencoded({extended: false})

// Import Restaurant and User Mongoose schemas
const Restaurant_Model = require("../models/restaurant");
const { addNewRestaurant } = require('../models/restaurant');

let User_Model = require('../models/user');


// Verify JWT Token
function matchToken(req,res,next){
  if(req.cookies.jwt != null){
      const bearer = req.cookies.jwt.split(' ')
      const loginCredential = bearer[1]
      req.token = loginCredential
      next()
  }else{
    res.redirect('/');
  }
}

router.route("/").get(cookieParser(), matchToken,(req,res)=>{
  jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
    if (err){
        res.render('error',{errorCode: 401, errorMessage: "Not Authorised"});
    } else {
              const page = req.query.page;
              const perPage = req.query.perPage;
              const borough = req.query.borough;
              console.log(borough + "________borough");
              Restaurant_Model.countRestaurants().then((count) => {
                      console.log(count);
                      numberOfPages = Math.ceil(count / perPage);
                      if (page <= numberOfPages && perPage < count && page >= 1 && perPage > 1) {
                          console.log(`page: ${page}`);

                          Restaurant_Model.getAllRestaurants(page, perPage, borough).then((restaurants) => {
                                  // console.log("Restaurants");
                                  // console.log(restaurants);
                                  // Render index.hbs for pagination
                                  res.render('index', {
                                      data: restaurants,
                                      count: count,
                                      page: page,
                                      perPage: perPage,
                                      start: (((page - 1) * perPage) + 1),
                                      end: ((page - 1) * perPage) + perPage,
                                      showPrevious: true,
                                      showNext: true,
                                  });
                                  //res.status(200).render("index", {
                                  //   restaurants: restaurants,layout: false 
                                  // });
                                  //  res.status(200).send(restaurants);
                              })
                              .catch((err) => {
                                  res.status(500).json({
                                      message: err.message
                                  });
                              });
                      } else {
                          console.log("false");
                          res.render('error', {errorCode:404, errorMessage:"Not found"});
                      }
                  })
                  .catch((err) => {
                      res.status(500).json({
                          message: err.message
                      });
                  });
    }
  });
})
.post(matchToken, 
  check("name", "Name is Mandatory").notEmpty(),
  check("cuisine", "cuisine is Mandatory").notEmpty(),
  check("borough", "Borough is Mandatory").notEmpty(),
  check("building", "Building is Mandatory").notEmpty(),
  check("street", "Street_address is Mandatory").notEmpty(),
  check("zipcode", "Postal Code is Mandatory").notEmpty(),
   (req, res) => {
          jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error');
            } else {
              console.log("Adding a restaurant")
          try{
          
          const errors = validationResult(req);
          
          if (errors.isEmpty()) {
            
  
            console.log('no error');
            const restaurant ={
            
            name : req.body.name,
            cuisine : req.body.cuisine,
            restaurant_id: req.body.restaurantId,
            borough : req.body.borough,
  
            address:{
              building:req.body.building,
              street:req.body.street,
              zipcode:req.body.zipcode
            }
            
            };
  
    
            Restaurant_Model.addNewRestaurant(restaurant).then(()=>{
              
              console.log('Added');
              res.redirect("/")
              
            })
            .catch((err) => {
              
              console.log(err.message+"error while adding a restaurant");
              const alert = err.array()
              res.render('addForm');
                
            }); 
            
          }
          else
          {

              const alert = errors.array()
              res.render('addForm',{
                errs: alert
                
            });
          
          } 
        }
        catch(err)
        {
          console.log(err.message+"error while adding");
          res.render('error');
          
        }
       
        
        }
        
      })
  });
// .push()

router.route("/search").get(matchToken,(req,res)=>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
        if (err){
          res.render('error', {errorCode:401, errorMessage: "Not Authorised"});
        } else {
      res.render("search")
        }
      })
})
router.route("/addRestaurant")
  .get(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error');
      } else {
        res.render('addForm');
        
      }
    })
  })
router.route("/login").post(async (req,res)=>{
    // Validate user input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    User_Model.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        bcrypt.compare(password, user.password)
          .then((result) => {
            console.log(result);
            if (result === true) {
              const accessToken = jwt.sign({email:email, password:user.password}, process.env.SECRETKEY);
              res.cookie('jwt',`bearer ${accessToken}`);
              console.log("Hello");
              res.redirect("/api/restaurant/");
            } else {
              res.status(401).json({ message: "Invalid email or password" });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: "Internal server error" });
          });
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal server error" });
      });
})
router.route("/register").post(async (req,res)=>{
    try {
        // Validate user input
        const {email, password } = req.body;
        console.log(req.body);
        // Check if the user already exists
        const existingUser = await User_Model.findOne({ email });
        if (existingUser) {
            console.log();
          return res.status(400).json({ message: 'User already exists' });
        }
        // hash password
        bcrypt.hash(password, 10).then(
              async hash=>{ 
                // Create a new user
                let user = User_Model();
                user.email = email
                user.password = hash
                user.isAdmin = false
                try {
                  const result = await user.save();
                  res.redirect("/");  // this will be the new created ObjectId
              } catch(error){
                console.log(error);
              }
            }).catch(err=>{console.log(err); 
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
}).get((req,res)=>{
    res.render("register", {layout: 'auth'})
})

router.route("/:id").get(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error', {errorCode:401, errorMessage:"Not Authorized"});
      } else {
        console.log('restaurant by id'+req.params.id);

        Restaurant_Model.getRestaurantById(req.params.id).then((restaurant)=>{
            console.log(restaurant);
          res.render("editForm", {data:restaurant,res_Id:req.params.id});
        })
        .catch((err) => {
          res.status(500).json({ message: err.message });
        }); 
      }
    })
  })
  .post(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
          if (err){
            res.render('error401');
          } else {
            // TODO: Update Restaurant data 


           if(req.body.mType =='delete')
           {
            console.log('deleting'+req.body.res_Id);  
            Restaurant_Model.deleteRestaurantById(req.body.res_Id).then(()=>{
                console.log('Deleted');
                res.redirect("/")
                
              })
              .catch((err) => {
                
                console.log(err.message+"error while updating a restaurant");
                  res.render('error');
                  
              });
           } 
           else
           {
            
            console.log("updating");
            const restaurant ={
             
             name : req.body.name,
             cuisine : req.body.cuisine,
             
             
 
             address:{
               building:req.body.building,
               street:req.body.street,
               zipcode:req.body.zipcode
             }
             
             };
 
             
 
           
 
             Restaurant_Model.updateRestaurantById(restaurant,req.body.res_Id).then(()=>{
               console.log("updated")
               res.redirect("/")
             })
             .catch((err) => {
               
               console.log(err.message+"error while updating a restaurant");
                 res.render('error');
                 
             });
           }
           
          }
    })
})
  .delete(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
          if (err){
            res.render('error401');
          } else {
          Restaurant_Model.deleteOne({_id:req.params.id})
          .then(()=>{
            res.status(200).send("Deleted Successfully");
          })
          .catch((err) => {
            res.status(500).json({ message: err.message });
          });
        }
      })  
    })
    .put(matchToken,(req,res) =>{
      jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error401');
            } else {
              // TODO: Update Restaurant data 
              const restaurant = {};
              restaurant.cuisine = req.body.cuisine;
              restaurant.borough = req.body.borough;
              console.log("cuisine"+req.body.cuisine);
              console.log("borough"+req.body.borough);
              Restaurant_Model.updateOne({_id:req.params.id},{$set:restaurant})
              .then(()=>{
                
                console.log('Updated Successfully');
                res.status(200).send("Updated Successfully");
                //res.redirect("api/restaurant/"+req.params.id);
              })
              .catch((err) => {
                res.status(500).json({ message: err.message });
              });
            }
      })
  })
// .put().delete()


.post(matchToken, 
  check("gift_occasion", "gift_occasion is Mandatory").notEmpty(),
  check("gift_category", "gift_category is Mandatory").notEmpty(),
  check("cost", "cost is Mandatory").notEmpty(),
  check("group_age", "Building is Mandatory").notEmpty(),
 
   (req, res) => {
          jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error');
            } else {
              console.log("Adding a Gift")
          try{
          
          const errors = validationResult(req);
          
          if (errors.isEmpty()) {
            
  
            console.log('no error');
            const gift ={
            
              gift_occasion : req.body.gift_occasion,
            gift_category : req.body.gift_category,
            cost: req.body.cost,
            group_age : req.body.group_age
  
            
            
            };
  
    
            Gift_Model.addNewGift(gift).then(()=>{
              
              console.log('Added');
              res.redirect("/")
              
            })
            .catch((err) => {
              
              console.log(err.message+"error while adding a Gift");
              const alert = err.array()
              res.render('addForm');
                
            }); 
            
          }
          else
          {

              const alert = errors.array()
              res.render('addForm',{
                errs: alert
                
            });
          
          } 
        }
        catch(err)
        {
          console.log(err.message+"error while adding");
          res.render('error');
          
        }
       
        
        }
        
      })
  });




module.exports = router;
