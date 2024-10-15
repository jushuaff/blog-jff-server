//[SECTION] Dependencies and Modules
const express = require("express");
const userController = require("../controllers/user");

//Import the auth module and deconstruct it to get our verify method.
const { verify, verifyAdmin, isLoggedIn } = require("../auth");

//[SECTION] Routing Component
const router = express.Router();

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error while destroying session:', err);
        } else {
            req.logout(() => {
                console.log('You are logged out');
                res.redirect('/');
            });
        }
    });
});

//[SECTION] Route for user registration
router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);
router.get("/users-list", verify, verifyAdmin, userController.getAllUsers);

// [GET] Retrieve User Details
router.get('/details', verify, userController.getUserDetails);
router.get('/details/:userId', verify, verifyAdmin, userController.getUserDetails);

// Update User Information
router.patch('/update-profile', verify, userController.updateProfile); 
router.patch('/update-profile/:userId', verify, verifyAdmin, userController.updateProfile);

// [PATCH] Update Password
router.patch('/update-password', verify, userController.updatePassword);
router.patch('/update-password/:userId', verify, verifyAdmin, userController.updatePassword);

//create another route for reset password
///THIS IS FOR LATERZZZZZ

module.exports = router;