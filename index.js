const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
const {Schema} = mongoose;
let uri = process.env.MONGO_URI
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//exercise Schema
let exerciseSchema = new mongoose.Schema({
    user_id: {
      type: String,
      required: true,
      unique: false
    },
    description: String,
    duration: Number,
    date: String
});

//Username Schema
let userSchema = new mongoose.Schema({
  username: String,
  Log: [],
});

let User = mongoose.model('User', userSchema);
let users = [] ;

let Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async (req, res) => {

  const {username} = req.body;
  if (!username) { 
    res.send("username required")
    return
  }
  else {
    try {
      let user = new User({username: username});
        await user.save();
        res.status(200).json({
          username: username,
          "_id": user.id,
        });
    } catch (error) {
      console.log(error)
      res.send('Server error..');
    }
  }
}) ; 

app.get('/api/users', async (req, res) => {    
  try {
    data = await User.find({});          
    if (!data) {
      res.send("no data found")
      return
    } 
    users = res.json(data) ;
  } catch (error) {
    console.log(error);
    res.send("Server error")
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
   
  const {description,duration,date } = req.body; 
  const id = req.params._id; 
  const activity = {
    description: description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString().substring(0,16): new Date(Date.now()).toDateString().substring(0,16)           
  }
    
  if (!id || !description || !duration) {
    res.send("Missing field")
    return
  } 

  try {      
    let user = await User.findById(id);
    if (!user) {
      res.send("user id does not exist")
    }else{
      let newExercise = new Exercise({
        user_id: user.id,
        description: description,
        duration: parseInt(duration),
        date: date ? new Date(date).toDateString().substring(0,16): new Date(Date.now()).toDateString().substring(0,16)
      })
      let exerciseObj = await newExercise.save();
    
      const activityPost = {
        $push: { Log: activity },        
      }
      let updatedUser = await User.findByIdAndUpdate(id, activityPost, {new: true});
        
      res.json({
        username: user.username,
        description: exerciseObj.description,
        duration: exerciseObj.duration,
        date: new Date(exerciseObj.date).toDateString().substring(0,16),
        _id: user._id 
      })
    }    
  } catch (error) {
    console.log(error)
    res.send("There was an error saving exercise")
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {

  let id = req.params; 
  
  //request for the user exercises that have been logged
  try {
    let user = await User.findById(id);

    //handle the error of id
    if(!user) {
      console.log("User not found")
      return res.send(`user ${id} was not found`)
    }
    let resObj = {
      id: user.id,
      username: user.username,
      count: user.Log.length,
      log: user.Log
    }/*
    for (let i=0; i<=user.log.length; i++) {
      resObj.Log.push({
        description: user.log[i][description],
        duration: user.log[i][duration],
        date: new Date(user.log[i][date]).toDateString().substring(0,16)
      })
    }*/
    res.json(resObj)

  } catch (error) {
    console.log(error)
    res.send("Could not get exercise logs")
  }
  
});

app.get('/api/users/:_id/logs?from&to&limit', async (req, res) => {
  const {from, to, limit}  = req.query; 
  const id = req.params._id;  
  let dateObj = {}
    
  if (from){
    dateObj["$gte"] = new Date(from).toDateString();
  }
  if (to) {
    dateObj["$lte"] = new Date(to).toDateString();
  }
  let filter ={user_id: id};
  if(from && to){
    filter.date = dateObj 
  }
  let user = await User.find(filter, null, {limit : 500});
  if (!user) {
    res.send("User has no exercises in the given")
    return
  }
  res.json({ 
    username: user.username,
    _id: user._id,            
    log: user.log  
  });
})
 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
