//Set up express
const express = require('express');
const router = express.Router();
//Set up Models
const Museum = require('../models/museum');
const Comment = require('../models/comment');
const Review = require("../models/review");
const middleware = require('../middleware');
//Node-Geocoder
const NodeGeocoder = require('node-geocoder');
//Multer for images
const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        req.fileValidationError = "Only image (jpg,jpeg,png,gif) files are allowed!";
        return cb(null,false,req.fileValidationError);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');
const { nextTick } = require('async');
cloudinary.config({ 
  cloud_name: 'codingexercises', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
const geocoder = NodeGeocoder(options);

//INDEX: Displays all museums
router.get('/',async (req,res)=>{
    //Pagination Variables
    const perPage = 8;
    const pageQuery = parseInt(req.query.page);
    const pageNumber = pageQuery ? pageQuery : 1;
    //Get all museums from DB
    const searchTerm = {};
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search),'gi');
        searchTerm.name = regex
    }
    try{
        //ID all museums in DB
        const allMuseumsInDB = await Museum.find({});
        //Filter museums by searchTerm and limit museums shown on the page
        const searchedMuseums = await Museum.find(searchTerm).skip((perPage * pageNumber) - perPage).limit(perPage);
        //Count number of museums DB
        const count = await Museum.countDocuments(searchTerm);
        //Create Render parameters
        const museumViewParams = {museums:searchedMuseums,current:pageNumber, pages:Math.ceil(count/perPage),page:'museums'};
        //If search did not find museums and DB has at least one museum in it
        if(searchedMuseums.length === 0 && allMuseumsInDB.length >0){
            museumViewParams["error"] = `No museums match query: ${req.query.search.toUpperCase()} . Try again.`
        }
        res.render("museums/index",museumViewParams);
    }
    catch(err){
        console.log(err);
    }
    
    
    
});

// CREATE Museum: Adds new museums to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), (req,res)=>{
   //Get data from form and add to museums array
    //Create a new museum and save to db
        if(req.fileValidationError){
            req.flash("error",req.fileValidationError);
            return res.redirect('back');
        }
        cloudinary.v2.uploader.upload(req.file.path, async (err,result)=> {
            if(err){
                req.flash("error",err.message);
                return res.redirect('back');
            }
             //Add cloudinary url for the image to the museum object under image property
            req.body.museum.image = result.secure_url;
            //add image public_id to museum object
            req.body.museum.imageId = result.public_id;
            //add author info to museum
            req.body.museum.author = {
                id: req.user._id,
                username: req.user.username
            };
            //Adjust price if museum is free
            if(req.body.museum.price === '0'){
                req.body.museum.price = "Free";
            }
            //Add location info to museum
            try{
                const data = await geocoder.geocode(req.body.museum.location);
                if(!data.length){
                    req.flash('error', 'Invalid address');
                    return res.redirect('back');
                }
                req.body.museum.lat = data[0].latitude;
                req.body.museum.lng = data[0].longitude;
                req.body.museum.location = data[0].formattedAddress;
            }
            catch(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
            try{
                const createdMuseum = await Museum.create(req.body.museum);
                req.flash("success",`Museum: ${req.body.museum.name} Successfully Added`);
                res.redirect("/museums"); 
            }
            catch(err){
                req.flash('error', 'Museum could not be created');
                return res.redirect('back');
            }
        }); 
});

//NEW Museums: Displays form to make new museum
router.get('/new', middleware.isLoggedIn,(req,res)=>{
    res.render("museums/new");
 });

 //SHOW: Displays info about one museum
 router.get('/:id', async (req,res)=>{
     //Find museum with provided id
    try{
        const foundMuseum = await Museum.findById(req.params.id).populate("comments likes").populate("comments").populate({
            path: "reviews",
            options: {sort: {createdAt: -1}}
        });
        if(!foundMuseum){
            req.flash('error', 'Sorry, that museum does not exist!');
            return res.redirect('/museums'); 
        }
        res.render("museums/show",{museum:foundMuseum,key:process.env.MUSEUMFEVER_API_KEY});
    }
    catch(err){
        req.flash('error', 'Sorry, that museum does not exist!');
        res.redirect('/museums');
    }
 });

 //EDIT: Render Museum Edit Form
router.get('/:id/edit',middleware.isLoggedIn,middleware.checkUserMuseum,async (req,res)=>{
        res.render('museums/edit',{museum:req.museum});
});

 //UPDATE: Change one museum
router.put('/:id',middleware.checkMuseumOwnership,upload.single('image'),(req,res)=>{
    //Find and update correct museum
    Museum.findById(req.params.id,async (err,museum)=>{
        //Check if image if of correct file type
        if(req.fileValidationError){
            req.flash("error",req.fileValidationError);
            return res.redirect('back');
        }
        //Check is image was submitted by user
        if(req.file){
            try{
                //Remove current image from cloudinary
                await cloudinary.v2.uploader.destroy(museum.imageId);
                //Update with new image
                const result = await cloudinary.v2.uploader.upload(req.file.path);
                museum.imageId = result.public_id;
                museum.image = result.secure_url;
            }
            catch(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
        try{
            //Update location data
            const data = await geocoder.geocode(req.body.museum.location);
            if(!data.length){
                req.flash('error', 'Invalid Location address');
                return res.redirect('back');
            }
            museum.lat = data[0].latitude;
            museum.lng = data[0].longitude;
            museum.location = data[0].formattedAddress;
        }
        catch (err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        //Update Museum name, price, and description
        museum.name = req.body.museum.name;
         //Adjust price if museum is free
        req.body.museum.price === "0" ? museum.price = "Free":museum.price = req.body.museum.price;
        museum.description = req.body.museum.description;
        museum.save();
        req.flash("success","Museum Successfully Updated");
        res.redirect(`/museums/${req.params.id}`);
    });
            
});

//DESTROY: Delete one museum then redirect
router.delete('/:id',middleware.checkMuseumOwnership ,(req,res)=>{
    Museum.findById(req.params.id,async(err,museum)=>{
        if(err){
            req.flash("error", err.message);
            return res.redirect('back');
        }
        //Delete image from cloudinary
        try{
            await cloudinary.v2.uploader.destroy(museum.imageId);
        }
        catch(err){
            req.flash("error", err.message);
            return res.redirect('back');
        }
        //Delete all museum comments
        try{
            await Comment.deleteMany({_id: { $in: museum.comments }});
            await Review.deleteMany({_id: { $in: museum.reviews }});
        }
        catch(err){
            req.flash("error", err.message);
            return res.redirect('back');
        }
        //Delete museum from DB
        museum.deleteOne();
        req.flash("success","Museum Successfully Deleted");
        res.redirect('/museums');
    });   
});

// Museum Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Museum.findById(req.params.id, function (err, foundMuseum) {
        if (err) {
            console.log(err);
            return res.redirect("/museums");
        }

        // check if req.user._id exists in foundMuseum.likes
        const foundUserLike = foundMuseum.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundMuseum.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundMuseum.likes.push(req.user);
        }

        foundMuseum.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/museums");
            }
            return res.redirect("/museums/" + foundMuseum._id);
        });
    });
});



//Use for fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};






 module.exports = router;