import React, { useState } from 'react';
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Send
} from 'lucide-react';

import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';

import api from '../api/axios.js';
import toast from 'react-hot-toast';


const PostCard = ({ post }) => {

  const postWithHashtags = post.content
    ? post.content.replace(
        /(#\w+)/g,
        '<span class="text-indigo-600">$1</span>'
      )
    : '';


  // -----------------------------
  // States
  // -----------------------------

  const [likes, setLikes] = useState(
    post.likes_count || []
  );

  const [shares, setShares] = useState(
    post.shares_count || []
  );

  const [comments, setComments] = useState([]);

  const [commentCount, setCommentCount] = useState(
    post.comments_count || 0
  );

  const [showComments, setShowComments] =
    useState(false);

  const [commentText, setCommentText] =
    useState('');

  const [loadingComments, setLoadingComments] =
    useState(false);


  // -----------------------------
  // Redux / Auth
  // -----------------------------

  const currentUser = useSelector(
    (state) => state.user.value
  );

  const navigate = useNavigate();

  const { getToken } = useAuth();


  // -----------------------------
  // Authentication Headers
  // -----------------------------

  const authHeaders = async () => ({
    headers: {
      Authorization: `Bearer ${await getToken()}`
    }
  });


  // -----------------------------
  // LIKE POST
  // -----------------------------

  const handleLike = async () => {

    try {

      const { data } = await api.post(
        '/api/post/like',
        {
          postId: post._id
        },
        await authHeaders()
      );


      if (data.success) {

        toast.success(data.message);

        setLikes((prev) => {

          if (prev.includes(currentUser._id)) {

            return prev.filter(
              (id) => id !== currentUser._id
            );

          } else {

            return [
              ...prev,
              currentUser._id
            ];

          }

        });

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(error.message);

    }

  };


  // -----------------------------
  // LOAD COMMENTS
  // -----------------------------

  const loadComments = async () => {

    try {

      setLoadingComments(true);

      const { data } = await api.get(
        `/api/post/${post._id}/comments`,
        await authHeaders()
      );


      if (data.success) {

        setComments(data.comments);

        setCommentCount(
          data.comments.length
        );

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(error.message);

    } finally {

      setLoadingComments(false);

    }

  };


  // -----------------------------
  // SHOW / HIDE COMMENTS
  // -----------------------------

  const toggleComments = async () => {

    const next = !showComments;

    setShowComments(next);

    if (next) {

      await loadComments();

    }

  };


  // -----------------------------
  // ADD COMMENT
  // -----------------------------

  const handleComment = async (e) => {

    e.preventDefault();


    if (!commentText.trim()) {

      return;

    }


    try {

      const { data } = await api.post(
        '/api/post/comment',
        {
          postId: post._id,
          content: commentText.trim()
        },
        await authHeaders()
      );


      if (data.success) {

        // Add new comment to beginning
        setComments((prev) => [
          data.comment,
          ...prev
        ]);


        // Increase comment count
        setCommentCount(
          (prev) => prev + 1
        );


        // Clear input
        setCommentText('');


        toast.success('Comment added');

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(error.message);

    }

  };


  // -----------------------------
  // SHARE POST
  // -----------------------------

  const handleShare = async () => {

    try {

      const { data } = await api.post(
        '/api/post/share',
        {
          postId: post._id
        },
        await authHeaders()
      );


      if (!data.success) {

        return toast.error(
          data.message
        );

      }


      // Update share count
      setShares((prev) => {

        if (
          prev.includes(currentUser._id)
        ) {

          return prev;

        }

        return [
          ...prev,
          currentUser._id
        ];

      });


      // Create share URL
      const shareUrl =
        `${window.location.origin}/post/${post._id}`;


      // Mobile / supported browsers
      if (navigator.share) {

        await navigator.share({

          title:
            `${post.user.fullname || post.user.full_name}'s post on PingUp`,

          text:
            post.content ||
            'Check out this post on PingUp',

          url: shareUrl

        });

      }

      // Desktop fallback
      else {

        await navigator.clipboard.writeText(
          shareUrl
        );

        toast.success(
          'Post link copied'
        );

      }

    } catch (error) {

      // Ignore user cancelling share
      if (error.name !== 'AbortError') {

        toast.error(error.message);

      }

    }

  };


  // -----------------------------
  // RETURN
  // -----------------------------

  return (

    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>

      {/* =========================
          USER INFO
      ========================== */}

      <div
        onClick={() =>
          navigate(
            '/profile/' + post.user._id
          )
        }
        className='inline-flex items-center gap-3 cursor-pointer'
      >

        <img
          src={post.user.profile_picture}
          alt=''
          className='w-10 h-10 rounded-full shadow'
        />


        <div>

          <div className='flex items-center space-x-1'>

            <span>
              {post.user.fullname ||
                post.user.full_name}
            </span>

            <BadgeCheck className='w-4 h-4 text-blue-500' />

          </div>


          <div className='text-gray-500 text-sm'>

            @{post.user.username}

            {' . '}

            {moment(
              post.createdAt
            ).fromNow()}

          </div>

        </div>

      </div>


      {/* =========================
          POST CONTENT
      ========================== */}

      {post.content && (

        <div
          className='text-gray-800 text-sm whitespace-pre-line'
          dangerouslySetInnerHTML={{
            __html: postWithHashtags
          }}
        />

      )}


      {/* =========================
          POST IMAGES
      ========================== */}

      {post.image_urls &&
        post.image_urls.length > 0 && (

          <div className='grid grid-cols-2 gap-2'>

            {post.image_urls.map(
              (img, index) => (

                <img
                  src={img}
                  key={index}
                  className={`
                    w-full
                    h-48
                    object-cover
                    rounded-lg
                    ${
                      post.image_urls.length === 1
                        ? 'col-span-2 h-auto'
                        : ''
                    }
                  `}
                  alt=''
                />

              )
            )}

          </div>

        )}


      {/* =========================
          ACTIONS
      ========================== */}

      <div className='flex items-center gap-6 text-gray-500 text-sm border-t border-gray-200 pt-3'>


        {/* LIKE */}

        <button
          className='flex items-center gap-1 hover:text-red-500 transition'
          onClick={handleLike}
        >

          <Heart
            className={`
              w-5 h-5
              ${
                currentUser &&
                likes.includes(
                  currentUser._id
                )
                  ? 'text-red-500 fill-red-500'
                  : ''
              }
            `}
          />

          <span>
            {likes.length}
          </span>

        </button>


        {/* COMMENT */}

        <button
          className='flex items-center gap-1 hover:text-indigo-600 transition'
          onClick={toggleComments}
        >

          <MessageCircle className='w-5 h-5' />

          <span>
            {commentCount}
          </span>

        </button>


        {/* SHARE */}

        <button
          className='flex items-center gap-1 hover:text-indigo-600 transition'
          onClick={handleShare}
        >

          <Share2
            className={`
              w-5 h-5
              ${
                currentUser &&
                shares.includes(
                  currentUser._id
                )
                  ? 'text-indigo-600'
                  : ''
              }
            `}
          />

          <span>
            {shares.length}
          </span>

        </button>

      </div>


      {/* =========================
          COMMENTS SECTION
      ========================== */}

      {showComments && (

        <div className='border-t border-gray-200 pt-3 space-y-3'>


          {/* COMMENT INPUT */}

          <form
            onSubmit={handleComment}
            className='flex items-center gap-2'
          >

            <input
              type='text'
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              placeholder='Write a comment...'
              maxLength={500}
              className='flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400'
            />


            <button
              type='submit'
              disabled={!commentText.trim()}
              className='p-2 rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            >

              <Send className='w-4 h-4' />

            </button>

          </form>


          {/* COMMENT LIST */}

          {loadingComments ? (

            <p className='text-sm text-gray-400'>
              Loading comments...
            </p>

          ) : (

            <div className='space-y-3 max-h-64 overflow-y-auto'>


              {comments.length === 0 ? (

                <p className='text-sm text-gray-400'>
                  No comments yet. Be the first!
                </p>

              ) : (

                comments.map(
                  (comment) => (

                    <div
                      key={comment._id}
                      className='flex gap-2'
                    >

                      {/* USER IMAGE */}

                      <img
                        src={
                          comment.user?.profile_picture
                        }
                        alt=''
                        className='w-8 h-8 rounded-full object-cover'
                      />


                      {/* COMMENT */}

                      <div className='bg-gray-100 rounded-xl px-3 py-2'>

                        <p className='text-xs font-semibold'>

                          {comment.user?.fullname ||
                            comment.user?.full_name ||
                            comment.user?.username}

                        </p>


                        <p className='text-sm text-gray-700 wrap-break-word'>

                          {comment.content}

                        </p>


                        <p className='text-[10px] text-gray-400 mt-1'>

                          {moment(
                            comment.createdAt
                          ).fromNow()}

                        </p>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          )}

        </div>

      )}

    </div>

  );

};


export default PostCard;