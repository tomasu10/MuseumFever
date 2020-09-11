//Import require packages
const Museum = require("../models/museum"),
Comment   = require("../models/comment"),
User  = require("../models/user"),
Review = require("../models/review");

//Create middleware object
const middlewareObj = {};

//Check if user is logged in
middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in to do that");
    res.redirect("/login");
}


middlewareObj.checkMuseumOwnership = async function(req,res,next){
    //Check if user is logged in
    if(req.isAuthenticated()){
        
        try{
            const foundMuseum = await Museum.findById(req.params.id);
            //Check if user owns the museum- Does logged in userid match foundMuseum userid
            if(foundMuseum.author.id.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                //If user does not match user restrict action
                req.flash("error","You don't have permission to do that");
                res.redirect('back');
            }
        }
        catch(err){
            req.flash("error","Museum not found");
            res.redirect('back');
        }    
    }
    else{
        req.flash('error',"You needed to be logged in to do that")
        res.redirect('back');
    }
};

middlewareObj.checkOwnership = async function(req,res,next){
    //Check if user is logged in
    if(req.isAuthenticated()){
        
        try{
            const foundUser = await User.findById(req.params.id);
            //Check if user owns the museum- Does logged in userid match foundMuseum userid
            if(foundUser._id.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                req.flash("error","You don't have permission to do that");
                res.redirect('back');
            }
        }
        catch(err){
            req.flash("error","Museum not found");
            res.redirect('back');
        }    
    }
    else{
        req.flash('error',"You needed to be logged in to do that")
        res.redirect('back');
    }
};


middlewareObj.checkCommentOwnership = async function(req,res,next){
    //Check if user is logged in
    if(req.isAuthenticated()){
        try{
            const foundComment = await Comment.findById(req.params.comment_id);
            //Check if user owns the comment- Does logged in userid match foundMuseum userid
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                req.flash("error","You don't have permission to do that");
                res.redirect('back');
            }
        }
        catch(err){
            req.flash("error","Comment not found");
            res.redirect('back');
        }    
    }
    else{
        req.flash("error","You need to be logged in to do that");
        res.redirect('back');
    }
};



middlewareObj.checkUserMuseum = async function(req,res,next){
    try{
        const foundMuseum = await Museum.findById(req.params.id);
        if(!foundMuseum){
            req.flash('error', 'Sorry, that museum does not exist!');
            res.redirect('/museums');
        }
        else if(foundMuseum.author.id.equals(req.user._id) || req.user.isAdmin){
            req.museum = foundMuseum;
            next();
        }
        else{
            req.flash('error', 'You don\'t have permission to do that!');
            res.redirect('/museums/' + req.params.id);
        }
    }
    catch(err){
        req.flash('error', 'Sorry, that museum does not exist!');
        res.redirect('/museums');
    }
};

middlewareObj.checkUser = async function(req,res,next){
    try{
        const foundUser = await User.findById(req.params.id);
        if(!foundUser){
            req.flash('error', 'Sorry, that user does not exist!');
            res.redirect('/museums');
        }
        else if(foundUser._id.equals(req.user._id) || req.user.isAdmin){
            //If user and owner are the same assign foundUser within req
            req.user = foundUser;
            next();
        }
        else{
            //Restrict action if users do not match
            req.flash('error', 'You don\'t have permission to do that!');
            res.redirect('/users/' + req.params.id);
        }
    }
    catch(err){
        req.flash('error', 'Sorry, that user does not exist!');
        res.redirect('/museums');
    }
};

middlewareObj.checkUserComment = async function(req,res,next){
    try{
        //Find desired comment
        const foundComment = await Comment.findById(req.params.comment_id);
        if(!foundComment){
            //If no comment found restrict action 
            req.flash('error', 'Sorry, that comment does not exist!');
            res.redirect('/museums');
        }
        else if(foundComment.author.id.equals(req.user._id) || req.user._id){
            //If user is owner of comment assign foundComment within req
            req.comment = foundComment;
            next();
        }
        else{
            req.flash('error', 'You don\'t have permission to do that!');
            res.redirect('/museums/' + req.params.id);
        }
    }
    catch(err){
        req.flash('error', 'Sorry, that comment does not exist!');
        res.redirect('/museums');
    }
};


middlewareObj.checkReviewOwnership = async function(req,res,next){
    //Check if user is logged in
    if(req.isAuthenticated()){
        try{
            const foundReview = await Review.findById(req.params.review_id);
            //Check if user owns the review- Does logged in userid match foundMuseum userid
            if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                req.flash("error","You don't have permission to do that");
                res.redirect('back');
            }
        }
        catch(err){
            req.flash("error","Comment not found");
            res.redirect('back');
        }    
    }
    else{
        req.flash("error","You need to be logged in to do that");
        res.redirect('back');
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Museum.findById(req.params.id).populate("reviews").exec(function (err, foundMuseum) {
            if (err || !foundMuseum) {
                req.flash("error", "Museum not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundMuseum.reviews
                const foundUserReview = foundMuseum.reviews.some(review => {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "Only one review permitted per User.");
                    return res.redirect("/museums/" + foundMuseum._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};




module.exports = middlewareObj;