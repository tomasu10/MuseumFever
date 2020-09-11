//Import required packages
const express = require('express');
const router = express.Router({mergeParams: true});
const Museum = require('../models/museum');
const Comment = require('../models/comment');
const middleware = require('../middleware');


// CREATE Comment: Adds new museums to DB
router.post('/',middleware.isLoggedIn,async (req,res)=>{
    //Lookup museum by id
    try{
        const museum = await Museum.findById(req.params.id);
        //Create new comment
        const comment = await Comment.create(req.body.comment);
        //Add Username and id to comment
        comment.author.id = req.user._id;
        comment.author.username = req.user.username;
        comment.save();
        //Connect new comment to museum
        museum.comments.push(comment);
        museum.save();
        //Redirect to show page
        req.flash("success","Comment Successfully Added");
        res.redirect(`/museums/${museum._id}`);
    }
    catch(err){
        req.flash("error","Something went wrong");
        console.log(err);
    }
 
 });

//NEW Comments: Displays form to make new museum
router.get('/new',middleware.isLoggedIn, async (req,res)=>{
    //Find museum by ID
    try{
        const museum = await Museum.findById(req.params.id);
        res.render("comments/new",{museum:museum});
    }
    catch(err){
        console.log(err);
    }
 });

 //EDIT: Display comment edit form
 router.get("/:comment_id/edit",middleware.isLoggedIn,middleware.checkUserComment,async (req,res)=>{
        res.render("comments/edit",{museum_id:req.params.id,comment:req.comment});

 });

 //UPDATE: Change one comment
 router.put('/:comment_id',middleware.checkCommentOwnership,async (req,res)=>{
    try{
        await Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment);
        req.flash("success","Comment Successfully Updated");
        res.redirect(`/museums/${req.params.id}`);
    }
    catch(err){
        res.redirect('back');
    }
 });

 //DESTROY: Remove one comment
 router.delete('/:comment_id',middleware.checkCommentOwnership,async (req,res)=>{
    try{
        //Delete Comment from comments db collection
        await Comment.findByIdAndRemove(req.params.comment_id);
        //Delete comment from museum array
        await Museum.findByIdAndUpdate(req.params.id, {
            $pull: {comments:req.params.comment_id}
        });
        req.flash("success","Comment Successfully Deleted");
        res.redirect(`/museums/${req.params.id}`);
    }
    catch(err){
        res.redirect('back');
    }
 });




 module.exports = router;