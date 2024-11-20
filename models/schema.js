const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ScreenShare')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

module.exports = mongoose.model('User', UserSchema);
