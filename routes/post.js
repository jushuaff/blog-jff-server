//[SECTION] Dependencies and Modules
const express = require("express");
const postController = require("../controllers/post");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

//[SECTION] Routing Component
router.get('/', postController.getAllPosts);
router.post('/create', verify, postController.createPost);
router.get('/getPost/:id', postController.getPostById);
router.patch('/update/:id', verify, postController.editPost);
router.delete('/delete/:postId', verify, postController.deletePost);

// Comments routes
router.post('/addComment/:postId', verify, postController.addComment);
router.patch('/update-comment/:postId/:commentId', verify, postController.updateComment);
router.delete('/delete-comment/:postId/:commentId', verify, postController.deleteComment);
router.get("/getComments/:id", verify, postController.getPostComments);

module.exports = router;