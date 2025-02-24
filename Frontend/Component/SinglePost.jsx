import axios from 'axios';
import React, { useState } from 'react';
import { debounce } from 'lodash';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SinglePost = () => {
  const navigate = useNavigate();
  const { postid } = useParams();
  const queryClient = useQueryClient();
  const [comm, setComm] = useState({
    Comment: "",
    post_id: postid,
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.Token;
  };

  // API client with auth headers
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_backend_URL,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  });

  // Fetch post data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postid],
    queryFn: async () => {
      const response = await apiClient.get(`/users/Post/detail`, {
        params: { post_id: postid }
      });
      return response.data.data;
    },
    retry: 1,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const response = await apiClient.post('/users/Post/addcomment', commentData);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['post', postid], (oldData) => ({
        ...oldData,
        AllComment: data.comments || [],
        Postinfo: {
          ...oldData.Postinfo,
          NoofComment: data.Nocomm
        }
      }));
      setComm({ ...comm, Comment: '' });
      toast.success("Comment added successfully");
    },
    onError: () => {
      toast.error("Error adding comment");
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commId) => {
      const response = await apiClient.post('/users/Post/delcomment', {
        comm_id: commId,
        postid: postid
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['post', postid], (oldData) => ({
        ...oldData,
        AllComment: data.comments || [],
        Postinfo: {
          ...oldData.Postinfo,
          NoofComment: data.Nocomm
        }
      }));
      toast.success("Comment deleted successfully");
    },
    onError: () => {
      toast.error("Error deleting comment or you don't have permission");
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/users/Post/hitlike', {
        post_id: postid
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['post', postid], (oldData) => ({
        ...oldData,
        isilike: data.isilike,
        Postinfo: {
          ...oldData.Postinfo,
          Nooflike: data.nooflike
        }
      }));
      toast.success("Like updated");
    },
    onError: () => {
      toast.error("Error updating like");
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (username) => {
      await apiClient.post('/users/Post/delete', {
        postid: postid,
        username: username
      });
    },
    onSuccess: () => {
      navigate("/Allpost");
      toast.success("Post deleted successfully");
    },
    onError: () => {
      toast.error("This post doesn't belong to you");
    }
  });

  // Handle comment input
  const handleInput = (event) => {
    setComm({ ...comm, [event.target.name]: event.target.value });
  };

  // Handle comment submission
  const addComment = (e) => {
    e.preventDefault();
    if (!comm.Comment.trim()) return;
    addCommentMutation.mutate(comm);
  };

  // Handle comment deletion
  const deleteComment = (commId) => {
    deleteCommentMutation.mutate(commId);
  };

  // Handle post like with debouncing
  const hitLikeButton = debounce(() => {
    likePostMutation.mutate();
  }, 300);

  // Handle post deletion
  const handleDelete = () => {
    if (data?.Postinfo?.Username) {
      deletePostMutation.mutate(data.Postinfo.Username);
    }
  };

  // Determine media type (image or video)
  const getMediaType = () => {
    if (!data?.Postinfo?.Postimg) return null;
    return data.Postinfo.Postimg.toLowerCase().endsWith('.mp4') ? 'video' : 'image';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg font-medium">Loading post...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center px-4">
        <div className="mb-4 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Failed to load post</h1>
        <p className="text-gray-600 mb-6">{error?.message || "Something went wrong. Please try again later."}</p>
        <button 
          onClick={() => navigate("/Allpost")} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go back to all posts
        </button>
      </div>
    );
  }

  const mediaType = getMediaType();
  const postInfo = data.Postinfo;
  const comments = data.AllComment || [];
  const isLiked = data.isilike;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-blue-100">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl">
          {postInfo.title}
        </h1>

        <div className="relative h-screen flex items-center justify-center">
          {mediaType === 'image' ? (
            <img
              alt="Blog post cover image"
              className="max-w-full max-h-full object-cover"
              src={postInfo.Postimg}
              style={{ minWidth: "128px" }}
            />
          ) : (
            <video width="840" height="360" controls>
              <source src={postInfo.Postimg} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          <div className="absolute top-4 right-4">
            <button 
              className="rounded-full p-2 bg-gray-700 hover:bg-gray-800 text-white"
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
            >
              <TrashIcon className="h-5 w-5" />
              <span className="sr-only">Delete</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
            {postInfo.Username ? postInfo.Username.charAt(0).toUpperCase() : 'J'}
          </div>
          <div className="text-lg">{postInfo.Username || "John"}</div>
        </div>
        <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
          <p>{postInfo.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={hitLikeButton}
              disabled={likePostMutation.isPending}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400"
            >
              <HeartIcon isLiked={isLiked} className="w-5 h-5 fill-current" />
              <span>{postInfo.Nooflike}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <MessageCircleIcon className="w-5 h-5 fill-current" />
              <span>{postInfo.NoofComment}</span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Comments</h2>
          {comments.length === 0 ? (
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((com) => (
              <div className="space-y-6" key={com._id}>
                <div className="flex flex-row items-start space-x-4">
                  <div className="flex flex-row space-x-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{com.Username}</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{com.Content}</p>
                    <button
                      onClick={() => deleteComment(com._id)}
                      disabled={deleteCommentMutation.isPending}
                      aria-label="Delete comment"
                      className="h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <XIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Post a Comment</h2>
          <form className="grid gap-4" onSubmit={addComment}>
            <div className="grid gap-2">
              <label htmlFor="Comment">Comment</label>
              <textarea 
                id="Comment"
                name="Comment" 
                value={comm.Comment}
                placeholder="Write your comment" 
                onChange={handleInput}
                disabled={addCommentMutation.isPending}
                className="p-2 border rounded-md"
              />
            </div>
            <button 
              className={`bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 transition-colors ${
                addCommentMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              type="submit"
              disabled={addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

function HeartIcon({ isLiked, ...props }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isLiked ? "red" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MessageCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export default SinglePost;