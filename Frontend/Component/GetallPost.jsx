import React, { useState } from 'react';
import axios from 'axios';
import PostManager from './PostManager';
import { useQuery } from '@tanstack/react-query';

const GetAllPost = () => {
    const [skip, setSkip] = useState(0);
    const limit = 9;

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

    // Fetch posts data with React Query
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['posts', skip, limit],
        queryFn: async () => {
            const response = await apiClient.get(`/users/allPost?skip=${skip}&limit=${limit}`);
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes before data is considered stale
        cacheTime: 30 * 60 * 1000, // Cache data for 30 minutes
        retry: 1,
    });

    // Calculate number of pages
    const pages = data ? Math.ceil(data.totalCount / limit) : 0;

    // Handle page change
    const handlePageChange = (newSkip) => {
        setSkip(newSkip);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Loading posts...</p>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <div className="mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Failed to load posts</h1>
                <p className="text-gray-600 mb-6">{error?.message || "Something went wrong. Please try again later."}</p>
                <button 
                    onClick={() => refetch()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        );
    }

    // No posts found
    if (!data.posts || data.posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <div className="mb-4 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">No posts found</h1>
                <p className="text-gray-600">Check back later for new content.</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {data.posts.map((post, index) => (
                    <PostManager key={post._id || index} posts={post} />
                ))}
            </div>
            
            <div className="flex items-center justify-center py-8">
                <nav aria-label="Pagination" className="flex flex-wrap justify-center">
                    <ul className="inline-flex items-center flex-wrap">
                        {skip > 0 && (
                            <li
                                className="block px-3 py-2 mr-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
                                onClick={() => handlePageChange(skip - limit)}
                            >
                                <span className="sr-only">Previous</span>
                                <svg
                                    aria-hidden="true"
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        clipRule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        fillRule="evenodd"
                                    />
                                </svg>
                            </li>
                        )}

                        {Array.from({ length: pages }, (_, i) => {
                            const pageSkip = i * limit;
                            const isSelected = skip === pageSkip;
                            
                            // Only show 5 page buttons at a time with ellipsis for large page counts
                            const currentPage = Math.floor(skip / limit) + 1;
                            const pageNumber = i + 1;
                            
                            // Always show first, last, and pages around current
                            const showPageButton = 
                                pageNumber === 1 || 
                                pageNumber === pages || 
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                            
                            // Show ellipsis
                            if (!showPageButton) {
                                // Show ellipsis only once between groups
                                if (pageNumber === 2 || pageNumber === pages - 1) {
                                    return (
                                        <li key={i} className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 mx-1">
                                            ...
                                        </li>
                                    );
                                }
                                return null;
                            }
                            
                            return (
                                <li
                                    key={i}
                                    className={`px-3 py-2 mx-1 leading-tight ${
                                        isSelected 
                                          ? 'bg-pink-500 text-white' 
                                          : 'text-gray-500 bg-white hover:bg-gray-100'
                                    } border border-gray-300 rounded-lg cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    onClick={() => handlePageChange(pageSkip)}
                                    role="button"
                                    aria-current={isSelected ? "page" : undefined}
                                >
                                    {pageNumber}
                                </li>
                            );
                        }).filter(Boolean)}

                        {skip < (pages - 1) * limit && (
                            <li
                                className="block px-3 py-2 ml-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
                                onClick={() => handlePageChange(skip + limit)}
                            >
                                <span className="sr-only">Next</span>
                                <svg
                                    aria-hidden="true"
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        clipRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        fillRule="evenodd"
                                    />
                                </svg>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default GetAllPost;
// return (
//   <div className="flex items-center justify-center py-8">
//     <nav aria-label="Pagination">
//       <ul className="inline-flex items-center -space-x-px">
//         <li>
//           <a
//             className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             <span className="sr-only">Previous</span>
//             <svg
//               aria-hidden="true"
//               className="w-5 h-5"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 clipRule="evenodd"
//                 d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
//                 fillRule="evenodd"
//               />
//             </svg>
//           </a>
//         </li>
//         <li>
//           <a
//             className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             1
//           </a>
//         </li>
//         <li>
//           <a
//             className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             2
//           </a>
//         </li>
//         <li>
//           <a
//             className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             3
//           </a>
//         </li>
//         <li>
//           <a
//             className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             ...
//           </a>
//         </li>
//         <li>
//           <a
//             className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             10
//           </a>
//         </li>
//         <li>
//           <a
//             className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//             href="#"
//           >
//             <span className="sr-only">Next</span>
//             <svg
//               aria-hidden="true"
//               className="w-5 h-5"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 clipRule="evenodd"
//                 d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
//                 fillRule="evenodd"
//               />
//             </svg>
//           </a>
//         </li>
//       </ul>
//     </nav>
//   </div>
// )
