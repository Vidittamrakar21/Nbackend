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
app.use(express.static('build'));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://vidit:eV1g5UrTK8jupTQL@cluster0.bhggfzx.mongodb.net/blognest?retryWrites=true&w=majority');
  console.log("Database Connected");
}

const auth = (req,res,next) => {
  try {
   const {token} = req.cookies;
   if(token){
    const user = jwt.verify(token,process.env.SECKEY);
    req.userID = user.id;
    req.mail = user.email;
    req.name = user.name;
    res.json(user);
   next();
   }
 
   else{
     res.status(201).json({message: "declined"});
     console.log("Kindly login first, to continue!")
   }
 
   
  } catch (error) {
   console.log(error);
   res.send(error);
  }
   
 }

 app.get('/check', auth)

app.get('/api/blogs', async (req,res) =>{
  try {
    let limit = parseInt(req.query.limit);
    let page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const alldata = await Blog.find().skip(skip).limit(limit).sort({'date': -1}).exec();
    res.json(alldata);
    

  } catch (error) {
    res.json(error);
  }
  
})

app.get('/api/all', async (req,res) =>{
  try {
   

    const alldata = await Blog.find()
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

app.get('/api/blogs/tech',async (req,res) => {
  try {
    const alldata = await Blog.find({btype: "tech"}).sort({'date': -1});
    res.json(alldata);
  } catch (error) {
    res.json(error);
  }
})

app.get('/api/blogs/food' , async (req,res) => {
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

app.post('/api/search', async(req,res)=>{
  try {
    const {searchval} = req.body;
    if(!searchval){
      res.status(200).json({message: "Search by any topic name in the bar, to find blogs related to that !"});
    }

    else{

      const searchTerm = searchval;
      const regex = new RegExp(searchTerm, 'i');
      const data = await Blog.find({title: regex})
      if(data.length === 0){
        res.status(200).json({message: "empty"});
      }
      else{

        res.status(200).json(data);
      }
    }
  } catch (error) {
    res.status(500).json(error);
    console.log(error)
  }
})

app.post('/api/post', async (req,res) =>{
  try {
    const blogdata = req.body;
    const {title, image, btype , content , createdby , userid} = blogdata;
    if(!(title && image && btype && content && createdby && userid)){
      res.status(201).json({message: "Input fields can't be empty !"});
    }

    else{
      const newblog =  await Blog.create(blogdata);
      if(newblog){
        const data = await User.updateOne({_id: userid}, {$push: {blogposted: newblog._id }});
        res.status(201).json({message: "Blog posted successfully !", blog: newblog});
      }
      else{
        res.status(201).json({message: "unable to post, try again later."});
      }
      
    }
   
    
  } catch (error) {
    res.status(500).json({message: "An error occured while creating a post, Kindly try again."})
  }
})

app.post('/api/postcomment',async (req,res)=>{
  try {

    const {id , com, by} = req.body;

    const comment = await Blog.updateOne({_id: id}, {$push: {comments: {by: by, mes: com}}});
    res.status(201).json({info: comment, message: "comment posted successfully!"});
    
  } catch (error) {
    res.status(200).json({message: "Can't able to post the comment ! Try again later"});
  }
})

app.post('/api/postlike', async (req, res)=>{
    try {
      const {uid ,bid } = req.body;

      const user = await User.findById(uid);
      const blog = await Blog.findById(bid);
      const alllikes = blog.likes;

      if(user){
        const like = user.postliked;
        const data = like.find((element)=> element === bid);
        if(data){
          res.status(200).json({message: "Already liked this blog !"})
        }
        else{
          const dolike = await User.updateOne({_id: uid}, {$push: {postliked: bid}});
          const increment = await Blog.updateOne({_id: bid}, {likes: alllikes + 1 })
          res.status(201).json({message: "you liked a blog !"})

        } 

      }

      
    } catch (error) {
      res.status(200).json({message: "Can't able to like the blog ! Try again later"});
      console.log(error)
    }
})

app.post('/api/save', async (req, res)=>{
    try {
      const {uid ,bid } = req.body;

      const user = await User.findById(uid);

      if(user){
        const sb = user.saved;
        const data = sb.find((element)=> element === bid);
        if(data){
          res.status(200).json({message: "Already saved !"})
        }
        else{
          const dosave = await User.updateOne({_id: uid}, {$push: {saved: bid}});
         
          res.status(201).json({message: "Blog Saved !"})

        } 

      }

      
    } catch (error) {
      res.status(200).json({message: "Can't able to save the blog ! Try again later"});
      console.log(error)
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


app.post('/api/getuser', async (req  , res)=>{
  try {
    const {id} = req.body;
    const data = await User.findById(id);
    res.status(200).json(data);
  } catch (error) {
    res.status(200).json({message: "Error uccured while finding user"})
  }
})

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

app.patch('/api/updatename', async (req,res)=>{
  try {

    const {name, uid} = req.body;
    if(!(name && uid)){
      res.status(201).json({message:"Input field can't be empty"})
    }
   else{
    const data = await User.findByIdAndUpdate(uid, {name: name});
    res.status(201).json({message:"name updated successfully!", bdata:data})
   }
    
  } catch (error) {
    res.status(200).json({messager: "Error occured while updating"})
  }
})

app.patch('/api/updatemail', async (req,res)=>{
  try {

    const {mail, uid} = req.body;
    if(!(mail && uid)){
      res.status(201).json({message:"Input field can't be empty"})
    }
   else{
    const data = await User.findByIdAndUpdate(uid, {email: mail});
    res.status(201).json({message:"email updated successfully!", bdata:data})
   }
    
  } catch (error) {
    res.status(200).json({messager: "Error occured while updating"})
  }
})

app.patch('/api/updateabout', async (req,res)=>{
  try {

    const {bio, uid} = req.body;
    if(!(bio && uid)){
      res.status(201).json({message:"Input field can't be empty"})
    }
   else{
    const data = await User.findByIdAndUpdate(uid, {about: bio});
    res.status(201).json({message:"bio updated successfully!", bdata:data})
   }
    
  } catch (error) {
    res.status(200).json({messager: "Error occured while updating"})
  }
})

// app.patch('/api/update', async (req,res)=>{
//   try {
//     const {data} = req.body;
//   const doupdate = await Blog.updateMany({createdby: data});
//   res.status(200).json(doupdate);
//   } catch (error) {
//     res.json(error);
//   }
// })



app.listen(8080, ()=> {
  console.log("server started");
})