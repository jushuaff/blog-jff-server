const Post = require('../models/Post');
const User = require('../models/User');
const { errorHandler } = require('../auth');
const path = require('path');
const fs = require('fs');

// Create a new Post post
module.exports.createPost = async (req, res) => {
    const { title, content, imageUrl } = req.body;

    if (!content && !imageUrl) {
        return res.status(400).json({ message: 'Either content or image URL is required.' });
    }

    const newPost = new Post({
        userId: req.user.id,
        title,
        content,
        imageUrl: imageUrl || null
    });

    try {
        const result = await newPost.save();
        const populatedPost = await Post.findById(result._id).populate('userId', 'firstName lastName').exec();
        res.status(201).json(populatedPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while creating the post.' });
    }
};

// Get all Post posts (sorted by date in descending order)
module.exports.getAllPosts = (req, res) => {
    Post.find()
        .sort({ dateCreated: -1 })
        .populate('userId', 'firstName lastName') // Populate user's name or other fields if needed
        .then(Posts => res.status(200).json(Posts))
        .catch(err => errorHandler(err, req, res));
};

// Get a Post post by ID
module.exports.getPostById = (req, res) => {
    Post.findById(req.params.id)
        .populate('userId', 'name')
        .populate('comments.userId', 'name')
        .then(Post => {
            if (!Post) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json(Post);
        })
        .catch(err => errorHandler(err, req, res));
};

// Edit a Post post (only the owner can edit)
module.exports.editPost = (req, res) => {
    Post.findById(req.params.id)
        .then(Post => {
            if (!Post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Check if the logged-in user is the owner of the Post post
            if (Post.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only edit your own posts' });
            }

            // Update the Post post fields
            Post.title = req.body.title || Post.title;
            Post.content = req.body.content || Post.content;
            Post.imageUrl = req.body.imageUrl || Post.imageUrl;

            return Post.save()
                .then(updatedPost => {
                    res.status(200).json({
                        message: 'Post updated successfully',
                        post: updatedPost
                    });
                })
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};

// Delete a Post post (admin can delete any post, user can delete their own post)
module.exports.deletePost = (req, res) => {
    const { postId } = req.params;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const isPostOwner = post.userId.toString() === req.user.id;
            const isAdmin = req.user.isAdmin;

            if (!isPostOwner && !isAdmin) {
                return res.status(403).json({ message: 'You do not have permission to delete this post' });
            }

            return Post.findByIdAndDelete(postId)
                .then(() => res.status(200).json({ message: 'Post deleted successfully' }))
                .catch(err => {
                    console.error("Error deleting post:", err); // Log the deletion error
                    errorHandler(err, req, res);
                });
        })
        .catch(err => {
            console.error("Error finding post:", err); // Log the error finding the post
            errorHandler(err, req, res);
        });
};

// Add a comment to a Post
module.exports.addComment = (req, res) => {
    const { comment } = req.body;
    const { postId } = req.params;
    
    Post.findById(postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const newComment = {
                userId: req.user.id,
                comment,
                dateAdded: Date.now()
            };

            post.comments.push(newComment);

            return post.save() 
                .then(updatedPost => res.status(200).json(updatedPost))
                .catch(err => {
                    console.error('Error saving post:', err);
                    res.status(500).json({ error: 'Failed to save post', details: err });
                });
        })
        .catch(err => {
            console.error('Error finding post:', err);
            res.status(500).json({ error: 'Failed to find post', details: err });
        });
};


// Get comments
exports.getPostComments = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('comments.userId', 'name');

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const formattedComments = post.comments.map(comment => ({
            userId: post.userId._id.toString(),
            comment: comment.comment,
            dateAdded: comment.dateAdded
        }));

        res.status(200).json({ comments: formattedComments });
    } catch (err) {
        res.status(500).json({ message: "Error fetching comments", error: err.message });
    }
};

// Update a comment by commentId
module.exports.updateComment = (req, res) => {
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    // Find the Post post containing the comment
    Post.findById(postId)
        .then(Post => {
            if (!Post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            console.log("Post found:", Post.title);
            console.log("Post comments:", Post.comments);

            const foundComment = Post.comments.id(commentId);
            if (!foundComment) {
                console.error("Comment not found with id:", commentId);
                return res.status(404).json({ message: 'Comment not found' });
            }

            if (foundComment.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You do not have permission to update this comment' });
            }

            foundComment.comment = comment;

            return Post.save()
                .then(() => res.status(200).json({ message: 'Comment updated successfully' }))
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};

// Delete a comment (admin can delete any comment, user can delete their own comment)
module.exports.deleteComment = (req, res) => {
    Post.findById(req.params.PostId)
        .then(Post => {
            if (!Post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const comment = Post.comments.id(req.params.commentId);

            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            // Check if the user is the comment owner or an admin
            const isCommentOwner = comment.userId.toString() === req.user.id;
            const isAdmin = req.user.isAdmin;

            if (!isCommentOwner && !isAdmin) {
                return res.status(403).json({ message: 'You do not have permission to delete this comment' });
            }

            // Remove the comment
            comment.remove();

            return Post.save()
                .then(updatedPost => res.status(200).json({ message: 'Comment deleted successfully', updatedPost }))
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};