// ChatImage.js

import React from 'react';

const ChatImage = ({ imageUrl, caption }) => {
  return (
    <div className="mx-auto mb-2">
      <div className="relative">
        <div className="w-64 h-64 bg-gray-200 border rounded-lg overflow-hidden">
          <img src={imageUrl} alt="Image" className="object-cover w-full h-full" />
        </div>
        {caption && (
          <div className="w-64 bg-gray-800 text-white text-sm p-2 opacity-75 absolute bottom-0 left-0">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatImage;
