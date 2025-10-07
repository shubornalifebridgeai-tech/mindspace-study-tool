
import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div 
            className="w-5 h-5 border-4 border-white border-t-transparent border-solid rounded-full animate-spin"
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;
