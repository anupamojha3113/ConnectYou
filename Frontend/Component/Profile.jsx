import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostManager from './PostManager';
import { useNavigate } from 'react-router-dom';
const ProfilePage = () => {
  const [data, setData] = useState(null);
  
 const navigate = useNavigate()
  useEffect(() => {
    const fetchData = async () => {
     
      try {
        const getLocalStorageItem = JSON.parse(localStorage.getItem("user"));
        if(!getLocalStorageItem){
             navigate('/login')
        }
        const response = await axios.get(`${import.meta.env.VITE_backend_URL}/users/Profile`, {
          headers: {
            Authorization: `Bearer ${getLocalStorageItem?.Token}`,
          }
        });
        setData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
  };

    fetchData();
  }, []); // Empty dependency array ensures useEffect runs only once after the initial render
  if (!data) {
    return <div>Loading...</div>; // Add a loading indicator while fetching data
  }

  
  //   console.log(data);
  // countFollower
  // countFollowing
  // isfollowing
  // isyouraccount

  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
            <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 mr-4">
                <img
                  alt="Profile Photo"
                  className="rounded-full"
                  height={64}
                  src={data.Profiledata.Avatar}
                  style={{
                    aspectRatio: "64/64",
                    objectFit: "cover",
                  }}
                  width={64}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data.Profiledata.username}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">{data.countFollower}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserPlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">{data.countFollowing}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              {
                data.Posts.map((post, index) => {
                  return (<PostManager key={index} posts={post} />)
                })
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;

function UserPlusIcon(props) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  )
}


function UsersIcon(props) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}