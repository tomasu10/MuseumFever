const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    // Avatar is image of user, User is assigned a default image when created. 
    avatar: {
        type: String,
        default: 'https://res.cloudinary.com/codingexercises/image/upload/v1599233150/default-user-avatar_hu81z4.png'
    },
    //User is assigned default image id.
    avatarId: {
        type: String,
        default: 'default-user-avatar_hu81z4.png'
    },
    firstName: String,
    lastName: String,
    email: String,
    bio: {
        type: String,
        default: 'Bio'
    },
    isAdmin: {
        type:Boolean,
        default: false
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);