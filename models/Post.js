const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: [true, 'User ID is Required']
    },
    // One must be mandatory, If no defintion is made; imageUrl must be present
    // defition and imageUrl cannot be null
    title: {
        type: String,
        required: [true, 'Title is Required']
    },
    content: {
        type: String,
        // User can choose to upload only a photo
        default: null
    },
    imageUrl: {
        type: String,
        // User can choose to only post a note
        default: null
    },
    comments: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: [true, 'User ID is required']
            },
            comment: {
                type: String,
                required: [true, 'Comment is required']
            },
            dateAdded: {
                type: Date,
                default: Date.now
            }
        }
    ],
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);