// src/pages/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 text-red-800">
      <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
      <p className="mb-6 text-lg">You do not have permission to access this page.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default Unauthorized;
