const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { json } = require('stream/consumers');
const mongoose = require('mongoose');
const Blog = require('./model/blog');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
require('dotenv').config();


const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieparser());
app.use(morgan("tiny"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://vidit:eV1g5UrTK8jupTQL@cluster0.bhggfzx.mongodb.net/blognest?retryWrites=true&w=majority');
  console.log("Database Connected");
}


app.get('/api/blogs', async (req,res) =>{
  try {
    const alldata = await Blog.find().sort({'date': -1});
    res.json(alldata);

  } catch (error) {
    res.json(error);
  }
  
})

app.get('/api/blogs/life', async (req,res) => {
  try {
    const alldata = await Blog.find({btype: "lifestyle"}).sort({'date': -1});
    res.json(alldata);
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/blogs/tech', async (req,res) => {
  try {
    const alldata = await Blog.find({btype: "tech"}).sort({'date': -1});
    res.json(alldata);
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/blogs/food', async (req,res) => {
  try {
    const alldata = await Blog.find({btype: "food"}).sort({'date': -1});
    res.json(alldata);
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/blogs/entre', async (req,res) => {
  try {
    const alldata = await Blog.find({btype: "entrepreneurship"}).sort({'date': -1});
    res.json(alldata);
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/oneb/:id', async (req,res)=>{
  try {
    const id = req.params.id;
    const data = await Blog.findById(id);
    if(data){
      res.status(200).json(data);
    }
    
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/trend', async (req,res)=>{
  try {
   
    const data = await Blog.find(Blog.where('likes').gte(6).sort({ 'likes': -1 }).limit(4));
    if(data){
      res.status(200).json(data);
    }
    
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/search', async(req,res)=>{
  try {
    const {item } = req.body;
    const searchTerm = item;
    const regex = new RegExp(searchTerm, 'i');
  const data = await Blog.find({title: regex})
  res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
    console.log(error)
  }
})

app.post('/api/post', async (req,res) =>{
  try {
    const blogdata = req.body;
    const {title, image, btype , content , createdby } = blogdata;
    if(!(title && image && btype && content && createdby)){
      res.status(201).json({message: "Input fields can't be empty !"});
    }

    else{
      const newblog =  await Blog.create(blogdata);
      res.status(201).json({message: "Blog posted successfully !", blog: newblog});
    }
   
    
  } catch (error) {
    res.status(500).json({message: "An error occured while creating a post, Kindly try again."})
  }
})

app.post('/api/postcomment', async (req,res)=>{
  try {

    const {id , com, by} = req.body;

    const comment = await Blog.updateOne({_id: id}, {$push: {comments: {by: by, mes: com}}});
    res.status(201).json({info: comment, message: "comment posted successfully!"});
    
  } catch (error) {
    res.status(200).json({message: "Can't able to post the comment ! Try again later"});
  }
})

app.patch('/', (req,res) =>{
    const {name} = req.body;
   

    res.json({name:name ,message: "This is a patch test request"});
})

app.delete('/', (req,res) =>{
    const {name} = req.body;

    res.json({name:`hii ${name}`,message: "This is a delete test request"});
})




// user api's/////

app.post('/api/register', async (req,res) =>{
    try {

      const {name ,email ,password} = req.body;
      const existuser = await User.findOne({email});

      if(!(name && email && password)){
        res.status(200).json({message: "All the fields are required !"});
      }

      else if(existuser){
        res.status(200).json({message: "User already exists !"});
      }

      else{

        const hashpass = await bcrypt.hash(password , 10);

        const token = jwt.sign(
          {id: User._id, email ,name},
          process.env.SECKEY,
         {
           expiresIn: "3h"
         }
        )
        
        const newuser = await User.create({
          name,
          email,
          password:hashpass
        })

        newuser.token = token;
        newuser.password = undefined;

        res.status(200).send({info: newuser, message: "Account created successfuly!, Login to continue."})

      }

      
      
    } catch (error) {
      res.status(200).json({message:"Error occured while creating an acount ! Try again later."})
    }
})


app.post('/api/login', async (req,res)=>{
  try {

    const {  email , password} = req.body;
    const existuser = await User.findOne({email});

    if(!( email && password)){
      res.status(200).json({message: "All the fields are required !"})
    }

    else if(!existuser){
      res.status(200).json({message: "You don't have an account yet ! ,Kindly SignUp to continue."})
    }

    else{
      if(existuser && (await bcrypt.compare(password, existuser.password))){

        const token = jwt.sign(
          {id: existuser._id, email, name: existuser.name},
          process.env.SECKEY,
          {
            expiresIn: "3h"
          }
          )

          existuser.token = token;
          existuser.password = undefined;

          const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly: true
          }

          res.status(200).cookie("token" , token, options).json({
            success: true,
            token,
            existuser,
            message: "Logged In Successfully !"
          })
      }

      else{
        res.json({message: "Invalid email or password !"});
      }
    }
    
  } catch (error) {
    res.status(200).json({message: "Error occured while logging ! Try again later."})
  }
})




app.listen(8080, ()=> {
  console.log("server started");
})