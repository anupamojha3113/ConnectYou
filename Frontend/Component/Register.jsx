// RegisterPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username || !fullName || !email || !password || !avatar) {
      toast.error('All fields are required!');
      return;
    }

    try {
      setLoading(true);

      

      const get =  await axios.post(`${import.meta.env.VITE_backend_URL}/users/register`, {
        password: password,
        username: username,
        Avatar: avatar,
        FullName: fullName,
        email: email,
      }, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Sccefully Registered");  
      
      
      navigate("/login"); 
      
      // setUsername('');
      // setFullName('');
      // setEmail('');
      // setPassword('');
      // setAvatar(null);
    
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <ToastContainer />
      <div className="w-full max-w-md space-y-8 p-8 bg-yellow-50 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={handleLogin}
            >
              log in to your existing account
            </Link>
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
              Avatar
            </label>
            <input
              type="file"
              id="avatar"
              className="w-full border border-gray-300 rounded-md p-2"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              required
            />
          </div>
          <div>
            <button
              className={`w-full py-2 px-4 rounded-md text-white ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
