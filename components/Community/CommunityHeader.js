import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

export default function CommunityHeader({ router }) {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back</span>
        </button>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Community</h1>
      </div>
    </div>
  );
} 