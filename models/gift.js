const mongoose = require('mongoose');

// Define the Gift schema
const giftSchema = mongoose.Schema({
    gift_occasion: {
    type: String,
    required: true
  },
  gift_category: {
    type: String,
    required: true
  },
  cost: {
    type: float,
    required: true
  },
  group_age: {
    type: int,
    required: true
  }
});

// Define the Gift model
const Gift_model = mongoose.model('gift', giftSchema);

// Function to initialize the connection and model
function initialize(connectionString) {
  return new Promise((resolve, reject) => {
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

// Function to add a new Gift
function addNewGift(data) {
  const newGift = new Gift_model(data);
  return newGift.save();
}



// Function to get a Gift by ID
function getGiftById(id) {
  return Gift_model.findById(id).lean().exec();
}

// Function to update a Gift by ID
function updateGiftById(data, id) {
  return Gift_model.findByIdAndUpdate(id, data, { new: true }).exec();
}

// Function to delete a Gift by ID
function deleteGiftById(id) {
  return Gift_model.findByIdAndDelete(id).exec();
}

function countGifts() {
    return Gift_model.countDocuments().exec();
}

module.exports = {
  Gift_model,
  initialize,
  addNewGift,
  getAllGifts,
  getGiftById,
  updateGiftById,
  deleteGiftById,
  countGifts
};
