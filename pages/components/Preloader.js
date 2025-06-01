import React from "react";

const Preloader = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden p-4">
      {/* Header skeleton */}
      <div className="animate-pulse h-12 bg-gray-200 rounded-full w-full mb-6"></div>
      
      {/* Main banner skeleton */}
      <div className="animate-pulse h-40 bg-gray-200 rounded-lg w-full mb-6"></div>
      
      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      
      {/* Second row of cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      
      {/* List items */}
      <div className="space-y-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center animate-pulse">
            <div className="rounded-full bg-gray-200 h-12 w-12 mr-4"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="shimmer-effect"></div>
      </div>
    </div>
  );
};

export default Preloader;
