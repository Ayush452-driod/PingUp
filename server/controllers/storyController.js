import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Story from '../models/Story.js';
import User from '../models/User.js';
import { inngest } from '../inngest/index.js';

//add user story
export const addUserStory  =  async(req,res)=>{
  try {
    const {userId} = req.auth();
    const {content , media_type , background_color} = req.body;
    const media = req.file;
    let media_url = '';

    //upload image or video to imagekit
    if(media_type === 'image' || media_type === 'video'){
        const fileBuffer = fs.readFileSync(media.path);
        const respone = await imagekit.upload({
          file : fileBuffer,
          fileName : media.originalname,
        })
        media_url = respone.url;
    }
    //create story
    const story = await Story.create({
      user : userId,
      content,
      media_url,
      media_type,
      background_color,
    })
      //schedule story deletion after 24 hours
      await inngest.send({
        name : 'app/story.delete',
        data : {storyId : story._id},
      })

    return res.json({success : true , message : 'Story Created'});

  } catch (error) {
    console.log(error);
    return res.json({success:false , message:error.message});
  }
}

//get user stories

export const getStories = async(req,res)=>{
  try {
    const {userId} = req.auth();
    const user = await User.findById(userId);

    //user connections and followings
    const userIds = [userId,...user.connections,...user.following];

    const stories = await Story.find({
      user:{$in : userIds}
    }).populate('user').sort({createdAt : -1});

    return res.json({success : true , stories , message : 'getting Stories'});

  } catch (error) {
    console.log(error);
    return res.json({success:false , message:error.message});
  }
}

