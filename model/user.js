const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userschema = new Schema({

    name: String,
    email: String,
    password: String,
    followers: {type: Number, default:0},
    postliked: {type: Array, default:[]},
    blogposted: {type: Array, default:[]},
    saved: {type: Array, default:[]},
    about: {type: String, default:""},
    token: String,
    date: {type: Date, default: Date.now},
    image: String


})

module.exports = mongoose.model('users',userschema);