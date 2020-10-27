//Import Required Packages
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Museum = require('../models/museum');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const middleware = require('../middleware');
//Multer allows image file type filter
const multer = require('multer');
//Storage Variable for multer
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
//ImageFilter for multer
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        req.fileValidationError = "Only image (jpg,jpeg,png,gif) files are allowed!";
        return cb(null,false,req.fileValidationError);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})
//Configure Cloudinary
const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'codingexercises', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Landing Page
router.get('/',(req,res)=>{
    res.render("landing");
});

//=============
//AUTH ROUTES
//=============
//Register Routes

//Display register form
router.get('/register',(req,res)=>{
    res.render("register", {page: 'register'});
});
//Handle Sign Up Logic
router.post('/register',async (req,res)=>{
    try{
        const username = new User({username:req.body.username,firstName:req.body.firstName,lastName: req.body.lastName,email:req.body.email});
        if(req.body.adminCode === process.env.ADMIN_CODE){
            username.isAdmin =  true;
        }
        const newUser = await User.register(username,req.body.password);
        await passport.authenticate("local")(req,res,()=>{
            req.flash("success",`Welcome to Museum Fever ${newUser.username}`);
            res.redirect("/museums");
        });
    }
    catch(err){
        req.flash("error",err.message);
        res.redirect("/register");
    }
});
//Login Routes
//Render login form
router.get('/login',(req,res)=>{
    res.render("login", {page: 'login'});
});

//Handle Login Logic
//Structure: router.post('/login',middleware,callback)
router.post('/login',passport.authenticate('local',{
    successRedirect: "/museums",
    failureRedirect: "/login"
}),(req,res)=>{

});


//Logout route
router.get('/logout',(req,res)=>{
    req.logout();
    req.flash("success","Logged you out!")
    res.redirect('/museums');
});




//USER PROFILE ROUTES
router.get("/users/:id",async (req,res)=>{
    try{
        //Find User Id for desired user
        const foundUser = await User.findById(req.params.id);
        //Check to see if user is not found (i.e. no longer in db)
        if(!foundUser){
            req.flash("error","User Not Found");
            return res.redirect('/museums');
        }
        //Find all user created museums
        const userCreatedMuseums = await Museum.find().where('author.id').equals(foundUser._id);
        //Render User Profile
        res.render("users/show",{user:foundUser,museums:userCreatedMuseums});
    }
    catch(err){
        req.flash("error","Something went wrong");
        res.redirect('/museums');
    }
});

//EDIT: Render User Edit Form
router.get('/users/:id/edit',middleware.isLoggedIn,middleware.checkUser,(req,res)=>{
    res.render('users/edit',{user:req.user});
});

//UPDATE: Change one museum
router.put('/users/:id',middleware.checkOwnership,upload.single('image'),(req,res)=>{
//Find and update correct museum
User.findById(req.params.id,async (err,user)=>{
     //Check if image if of correct file type
     if(req.fileValidationError){
        req.flash("error",req.fileValidationError);
        return res.redirect('back');
    }
    //Check is image was submitted by user
    if(req.file){
        try{
            //Remove current image from cloudinary
            if(user.avatarId !== 'default-user-avatar_hu81z4.png'){
                await cloudinary.v2.uploader.destroy(user.avatarId);
            }
            //Update with new image
            const result = await cloudinary.v2.uploader.upload(req.file.path);
            user.avatarId = result.public_id;
            user.avatar = result.secure_url;
        }
        catch(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
    }
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.bio = req.body.bio;
    user.save();
    req.flash("success","User Successfully Updated");
    res.redirect(`/users/${req.params.id}`);
});
        
});




module.exports = router;
