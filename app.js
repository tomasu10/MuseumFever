//Env file 
require('dotenv').config();
//Import all packages and exports
const express = require("express"),
mongoose = require('mongoose'),
flash = require('connect-flash'),
passport = require('passport'),
LocalStrategy = require('passport-local'),
methodOverride = require('method-override'),
Museum = require("./models/museum"),
Comment   = require("./models/comment"),
User = require('./models/user'),
bodyParser = require("body-parser"),
seedDB = require("./seeds");

//ROUTES
const commentRoutes = require('./routes/comments'),
reviewRoutes     = require("./routes/reviews"),
museumRoutes = require('./routes/museums'),
indexRoutes = require('./routes/index');



//Connect to MongoDB
//Local Use
// mongoose.connect('mongodb://localhost:27017/museumfever_v1', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false
// })
// .then(() => console.log('Connected to DB!'))
// .catch(error => console.log(error.message));
//Production
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/museumfever_v1", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));
//Creates entries for DB
// seedDB();

const app = express()
//Enable parsing of req.body
app.use(bodyParser.urlencoded({extended:true}));
//Used to not have to include .ejs in page renders
app.set("view engine","ejs");
//Allow access to public directory
app.use(express.static(__dirname + "/public"));
//Enable Put/delete commands in forms
app.use(methodOverride("_method"));
//Enable flash messages
app.use(flash());
//Enable Moment package
app.locals.moment = require('moment');

//======================
//PASSPORT CONFIGURATION
//======================
app.use(require("express-session")({
    secret: "I am learning to become a software engineer",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
//Responsible for encoding (serialize) and decoding (deserialize) session
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Current user middleware- Allow current user and error messages to be accessible from all views
app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Use web pages routes
app.use('/museums/:id/comments',commentRoutes);
app.use("/museums/:id/reviews", reviewRoutes);
app.use('/museums',museumRoutes);
app.use(indexRoutes);






//Start Server
const port = process.env.PORT || 3000;
app.listen(port,process.env.IP, function () {
  console.log("Server Has Started!");
});