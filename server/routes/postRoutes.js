import express from 'express';
import { addPost, getFeedPosts, likePost,getComments,addComment,sharePost } from '../controllers/postController.js';
import {upload} from '../configs/multer.js';
import {protect} from '../middlewares/auth.js';

const postRouter = express.Router();

postRouter.post('/add',upload.array('images' ,4) , protect,addPost);
postRouter.get('/feed' , protect , getFeedPosts);
postRouter.post('/like' , protect ,likePost);
postRouter.get('/:postId/comments',protect,getComments);
postRouter.post('/comment',protect,addComment);
postRouter.post('/share',protect,sharePost);


export default postRouter;