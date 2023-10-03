const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { json } = require('stream/consumers');
const mongoose = require('mongoose');
const Blog = require('./model/blog');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://vidit:eV1g5UrTK8jupTQL@cluster0.bhggfzx.mongodb.net/blognest?retryWrites=true&w=majority');
  console.log("Database Connected");
}


app.get('/api/blogs', async (req,res) =>{
  try {
    const alldata = await Blog.find();
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

app.patch('/', (req,res) =>{
    const {name} = req.body;
   

    res.json({name:name ,message: "This is a patch test request"});
})

app.delete('/', (req,res) =>{
    const {name} = req.body;

    res.json({name:`hii ${name}`,message: "This is a delete test request"});
})

app.listen(8080, ()=> {
    console.log("server started");
})