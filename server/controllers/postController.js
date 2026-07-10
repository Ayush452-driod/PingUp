import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

// add a new post
export const addPost = async(req,res)=>{
  try {
    const {userId} = req.auth();
    const {content , post_type} = req.body;
    const images = req.files

    let image_urls = [];
    if(images.length){
      image_urls = await Promise.all(
        image.map(async(image)=>{
          const fileBuffer = fs.readFileSync(image.path);
           const response = await imagekit.upload({
              file:fileBuffer,
             fileName:image.originalname,
             folder : "posts",
    });
    const url = imagekit.url({
      path:response.filePath,
      transformation:[
        {quality:'auto'},
        {format:'webp'},
        {width:'1280'},
      ]
    })
     return url;
        })
      )
    }

      await Post.create({
        user : userId,
        content,
        image_urls,
        post_type,
      });

      return res.json({success : true , message : 'Post created successfully'});

  } catch (error) {
      console.log(error);
      return res.json({success : false , message : error.message});
  }
}

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