const bcrypt = require('bcrypt');
const User = require("../models/User");
const auth = require('../auth')
const { errorHandler } = require('../auth')

module.exports.registerUser = (req, res) => {
    if (!req.body.email.includes("@")){
        return res.status(400).send({ message: 'Invalid email format' });
    } else if (req.body.password.length < 8) {
        return res.status(400).send({ message: 'Password must be atleast 8 characters long' });
    } else {
        let newUser = new User({
            profile: req.body.profile,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email : req.body.email,
            isAdmin : req.body.isAdmin,
            password : bcrypt.hashSync(req.body.password, 10)
        });


	    return newUser.save()
        .then((result) => res.status(201).send({
            message: 'Registered successfully',
            user: result
        }))
        .catch(error => errorHandler(error, req, res));
	}
};

module.exports.loginUser = (req, res) => {
    if(req.body.email.includes("@")){
        return User.findOne({ email: req.body.email })
        .then(result => {
            if(result == null) {
                return res.status(404).send({ message: 'No Email Found' }); 
            } else {
                const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
                if (isPasswordCorrect)  {
                    return res.status(200).send({ 
                        message: 'User logged in successfully',
                        access: auth.createAccessToken(result)
                    });
                } else {
                     return res.status(401).send({ message: 'Email and password do not match' });
                }
            }
        })
        .catch(error => errorHandler(error, req, res));
    } else {
        return res.status(400).send({ message: 'Invalid Email' });
    }
}

// Get all users
module.exports.getAllUsers = (req, res) => {
  return User.find()
    .then(users => res.status(200).send(users))
    .catch(error => errorHandler(error, req, res));
};

// Retrieve User Details
module.exports.getUserDetails = (req, res) => {
    const userId = req.params.userId || req.user.id;

    return User.findById(userId)
    .then(user => {
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        } else {
            user.password = "";
            return res.status(200).send({ 
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin
            });
        }  
    })
    .catch(error => errorHandler(error, req, res));
};

// Update profile
module.exports.updateProfile = (req, res) => {
    const userId = req.params.userId || req.user.id;
    const { profile, firstName, lastName, email } = req.body;

    User.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Update the user's profile with new data
            user.profile = profile || user.profile;
            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.email = email || user.email;

            return user.save();
        })
        .then(updatedUser => {
            return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
        })
        .catch(error => {
            console.error(error);
            return res.status(500).json({ message: "An error occurred while updating the profile" });
        });
};

// Update Password
module.exports.updatePassword = (req, res) => {
    const userId = req.params.userId || req.user.id;
    const isAdmin = req.user.isAdmin;
    const isSelfUpdate = !req.params.userId;

    let adminPasswordCheck = Promise.resolve(req.user.password);

    if (!isSelfUpdate && isAdmin) {
        adminPasswordCheck = User.findById(req.user.id).select('password');
    }

    adminPasswordCheck
        .then(adminPassword => {
            if (!isSelfUpdate && isAdmin) {
                const isAdminPasswordCorrect = bcrypt.compareSync(req.body.adminPassword, adminPassword.password);
                if (!isAdminPasswordCorrect) {
                    return res.status(400).send({ message: 'Incorrect admin password' });
                }
            }
            return User.findById(userId);
        })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            if (isSelfUpdate) {
                const isPasswordCorrect = bcrypt.compareSync(req.body.currentPassword, user.password);
                if (!isPasswordCorrect) {
                    return res.status(400).send({ message: 'Incorrect current password' });
                }

                if (req.body.newPassword !== req.body.confirmPassword) {
                    return res.status(400).send({ message: 'New password and confirm password do not match' });
                }
            }

            user.password = bcrypt.hashSync(req.body.newPassword, 10);

            return user.save()
                .then(() => res.status(200).send({ message: 'Password updated successfully' }))
                .catch(error => errorHandler(error, req, res));
        })
        .catch(error => errorHandler(error, req, res));
};
