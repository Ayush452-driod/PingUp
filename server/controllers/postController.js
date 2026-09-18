import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';

// add a new post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files || [];

    let image_urls = [];

    if (images.length > 0) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          // Delete local file after upload
          fs.unlinkSync(image.path);

          return imagekit.url({
            path: response.filePath,
            transformation: [
              {
                quality: "auto",
                format: "webp",
                width: "1280",
              },
            ],
          });
        })
      );
    }

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    return res.json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Add Post Error:", error);

    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// get post
export const getFeedPosts = async(req,res)=>{
  try {
    const {userId} = req.auth();
    const user = await User.findById(userId);

    // finding User connections and followers
    const userIds = [userId , ...user.connections,...user.following];
    const posts = await Post.find({user:{$in:userIds}}).populate('user').sort({createdAt :-1});

    return res.json({success : true , posts , message :'getting post'});

  } catch (error) {
      console.log(error);
      return res.json({success : false , message : error.message});
  }
}

//like & unliked post 
export const likePost = async(req,res)=>{
  try {
    const {userId} = req.auth();
    const {postId} = req.body;

    const post = await Post.findById(postId);

    if(post.likes_count.includes(userId)){
      post.likes_count = post.likes_count.filter(user=>user!==userId);
      await post.save();
      return res.json({success : true , message : 'Post unliked'});
    }else{
      post.likes_count.push(userId);
      await post.save();
      return res.json({success : true , message : 'Post liked'});
    }
  } catch (error) {
    console.log(error);
    return res.json({success : false , message : error.message});
  }
}

// Get comments for a post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({
      post: postId
    })
      .populate(
        'user',
        'fullname username profile_picture'
      )
      .sort({
        createdAt: -1
      });

    return res.json({
      success: true,
      comments
    });

  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: error.message
    });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { postId, content } = req.body;

    // Check empty comment
    if (!content || !content.trim()) {
      return res.json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }

    // Find post
    const post = await Post.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      post: postId,
      user: userId,
      content: content.trim()
    });

    // Increase comment count
    post.comments_count =
      (post.comments_count || 0) + 1;

    await post.save();

    // Get user information
    await comment.populate(
      'user',
      'fullname username profile_picture'
    );

    return res.json({
      success: true,
      comment,
      message: 'Comment added'
    });

  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: error.message
    });
  }
};

// Share a post
export const sharePost = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: 'Post not found'
      });
    }

    // Make sure the same user is not counted twice
    if (!post.shares_count.includes(userId)) {
      post.shares_count.push(userId);

      await post.save();
    }

    return res.json({
      success: true,
      sharesCount: post.shares_count.length,
      message: 'Post shared successfully'
    });

  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: error.message
    });
  }
};