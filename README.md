# MuseumFever
### Created by: Tomas Uribe Tobon

## Description

This project follows a CRUD structure which allows a user to create, read, update, and delete museums, comments, and reviews.

MuseumFever is a user friendly, responsive web application that allows users to browse and contribute to a large collection of museums around the world. Users can create their own profile which gives them the ability to create, update, and delete museum entries. The created museums are viewable on the home page, where all other users can access them. Once signed up, the user can leave comments, likes, and reviews under any museums, which enhances the overall user experience and enables users to interact with one another. Ultimately, MuseumFever is an easily accessible web application that allows users to identify potential museums they would like to visit. The interface makes it easy for a user to find a museum in their area or around the world. An avid museum-goer no longer has to spend multiple hours searching for museum information, such as price, location, and ratings. MuseumFever removes all the effort and allows museum enthusiasts to quickly browse and choose their next museum destination.

## Notable Features

**Data Storage/Persistence**:  MongoDB is used to store all museums, comments, likes, users, and reviews. Each collection in the database has an independent model which separately creates the appropriate Schema through Mongoose. Specific collections are referenced in the models of other collections. For example, the users collection is referenced in the museums collection in order to identify which user created the given museum. NOTE: Mongoose was used to interface NodeJS with MongoDB.

**Authentication**: Passport is used to provide user authentication to the application. Through passport, the user's credentials are kept secure within the database. Using passport, the application validates the user's credentials. The user cannot add any entries to the site unless they are authenticated through passport by either registering for an account or signing in with valid credentials.

**Location Services**: The Google Maps API is used to display a map containing the location of each museum within the application. This allows the user to see where the museum is located using the Google Maps UI. This feature also allows the user to access the address of the museum.

**Image Upload**: Cloudinary allows users to upload images from their local device. Cloudinary provides a way to store these local images on a cloud-service so they can be accessed permanently (unless deleted by user) on the application. Multer (node.js middleware) is also used in conjunction with cloudinary to ensure that only image files are input by the user (i.e. jpg|jpeg|png|gif).

**User Profiles**: In order to enhance the user's experience, user profiles are available to all users once they create a museum. These profiles house all user specific information such as full name, email, username, and created museums. 

## Deployment 
MuseumFever has been deployed on heroku and can be seen in the link below:

[MUSEUMFEVER](https://museumfever.herokuapp.com/)

