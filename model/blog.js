const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogschema = new Schema ({
    title: {type: String, default: ""},
    image: {type: String, default: ""},
    btype: {type: String, default: ""},
    content: {type: String, default: ""},
    likes: {type: Number, default: 0},
    comments: {type: Array, default: []},
    createdby: {type: String, default: ""},
    userid: {type: String, default: ""},
    date: {type: Date, default: Date.now}
    
});


module.exports = mongoose.model('blogs',blogschema);