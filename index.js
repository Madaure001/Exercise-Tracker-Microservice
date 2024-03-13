const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
let uri = process.env.MONGO_URI
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//exercise Schema
let exerciseSchema = new mongoose.Schema({
  
 description: {
    type: String,
    required: true
  },
    duration: {
    type: Number,
    required: true
  }
});

//Username Schema
let userSchema = new mongoose.Schema({
  username: {
    type: String,    
    required: true,
    unique: true,
    minlength: 6
  },
  log: [exerciseSchema]
  
});
let User = mongoose.model('User', userSchema); 
let Exercise = mongoose.model('Exercise', exerciseSchema)

  



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
