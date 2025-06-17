import React from 'react';

const PreloaderSociety = () => {
    return (
        <div className="inset-0 flex items-center h-screen justify-center bg-white bg-opacity-75 z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
    );
};

export default PreloaderSociety; 