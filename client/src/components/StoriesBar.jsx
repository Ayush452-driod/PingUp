import React, { useEffect, useState } from 'react'
import { dummyStoriesData } from '../assets/assets';
import { Plus } from 'lucide-react';
import moment from 'moment';
import StoryModel from './StoryModel';
import StoryViewer from './StoryViewer';
import api from '../api/axios.js';
import {useAuth} from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const StoriesBar = () => {
    const {getToken} = useAuth();
    const [stories,setStories] = useState([]);
    const [showModel,setShowModel] = useState(false);
    const [viewStory,setViewStory] = useState(null);

    const fetchStories = async()=>{
      try {
        const token = await getToken();
        const {data} = await api.get('/api/story/get',{
          headers : {Authorization : `Bearer ${token}`}
        })
        if(data.success){
          setStories(data.stories);
        }
        else{
          toast(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
    useEffect(()=>{
      fetchStories();
    },[])

  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4'>
      <div className='flex gap-4 pb-5'>
            {/*Add Story card*/}
            <div onClick={()=>setShowModel(true)} className='rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-3/4 cursor-pointer hover:shadow-lg
            tansition-all duration-200 border-2 border-dashed border-indigo-300 bg-linear-to-b from indigo-50 to-white'>
              <div className='h-full flex flex-col items-center justify-center p-4'>
                <div className='size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3'>
                  <Plus className='w-5 h-5 text-white'/>
                </div>
                <p className='text-sm font-medium text-slate-700 text-center'>Create Story</p>
              </div>
            </div>

            {/*Story Card*/}
         {
           stories.map((story, index) => (
    <div
      onClick={()=>setViewStory(story)}
      key={index}
      className="relative rounded-lg shadow min-w-30 max-w-30 max-h-40 aspect-3/4 cursor-pointer hover:shadow-lg
      transition-all duration-200 bg-linear-to-b from-indigo-500 to-purple-600
      hover:from-indigo-700 hover:to-purple-800 active:scale-95 overflow-hidden"
    >
      {/* Profile Picture */}
      <img
        src={story.user.profile_picture}
        alt="Story User"
        className="absolute top-3 left-3 z-10 size-8 rounded-full ring-2 ring-white shadow"
      />

      {/* Story Content */}
      <p className="absolute bottom-8 left-3 right-3 z-10 text-white text-sm truncate">
        {story.content}
      </p>

      {/* Time */}
      <p className="absolute bottom-2 right-2 z-10 text-xs text-white/80">
        {moment(story.createdAt).fromNow()}
      </p>
      {
        story.media_type !== 'text' && (
          <div className='absolute inset-0 z-1 rounded-lg bg-black overflow-hidden'>
           {
             story.media_type === "image" ?
            <img src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70
             hover:opacity-80'/>
             :
            <video src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70
           hover:opacity-80'/>
          }
          </div>
        )
      }
     
    </div>
  ))
}
      </div>
      {/** Add Story Model*/}
      {showModel && <StoryModel setShowModel={setShowModel} fetchStories={fetchStories}/>}
      {/**View Story Model */}
      {viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory}/>}
    </div>
  )
}

export default StoriesBar
