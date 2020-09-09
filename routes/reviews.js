const express = require("express");
const router = express.Router({mergeParams: true});
const Museum = require("../models/museum");
const Review = require("../models/review");
const middleware = require("../middleware");



// Reviews Index
router.get("/", (req, res)=> {
    Museum.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, museum) {
        if (err || !museum) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {museum: museum});
    });
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, (req, res) => {
    // middleware.checkReviewExistence checks if a user already reviewed the museum, only one review per user is allowed
    Museum.findById(req.params.id, function (err, museum) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {museum: museum});

    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, async (req, res) => {
    try{
        //lookup museum using ID
        const museum = await Museum.findById(req.params.id).populate("reviews");
        const review = await Review.create(req.body.review);
        //add author username/id and associated museum to the review
        review.author.id = req.user._id;
        review.author.username = req.user.username;
        review.museum = museum;
        //save review
        review.save();
        museum.reviews.push(review);
        // calculate the new average review for the museum
        museum.rating = calculateAverage(museum.reviews);
        //save museum
        museum.save();
        req.flash("success", "Your review has been successfully added.");
        res.redirect('/museums/' + museum._id); 
    }
    catch(err){
        req.flash("error", err.message);
        return res.redirect("back");
    }
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, async (req, res) => {
    try{
        const foundReview = await  Review.findById(req.params.review_id);
        res.render("reviews/edit", {museum_id: req.params.id, review: foundReview});
    }
    catch(err){
        req.flash("error", err.message);
        return res.redirect("back");  
    }
});


// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, async (req, res) => {
    try{
        const updatedReview = await Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true});
        const museum = await Museum.findById(req.params.id).populate("reviews");
        // recalculate museum average
        museum.rating = calculateAverage(museum.reviews);
        //save changes
        museum.save();
        req.flash("success", "Your review was successfully edited.");
        res.redirect('/museums/' + museum._id);
    }
    catch(err){
        req.flash("error", err.message);
        return res.redirect("back");
    }
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, async(req, res) =>{
    try{
        await Review.findByIdAndRemove(req.params.review_id);
        //Delete review from museum using $pull
        const museum = await Museum.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews");
        // recalculate museum average
        museum.rating = calculateAverage(museum.reviews);
        //save changes
        museum.save();
        req.flash("success", "Your review was deleted successfully.");
        res.redirect("/museums/" + req.params.id);
    }
    catch{
        req.flash("error", err.message);
        return res.redirect("back"); 
    }
});



function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    let sum = 0;
    reviews.forEach(element => {
        sum += element.rating;
    });
    return sum / reviews.length;
}


module.exports = router;