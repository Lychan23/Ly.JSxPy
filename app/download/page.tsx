"use client";
import React from 'react';

const DownloadPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Download Page</h1>
      <p className="text-lg mb-4">Click the buttons below to download the files you need.</p>
      <div className="flex space-x-4">
        <a
          href="/downloads/lyjs-installer.exe"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download Installer for Windows
        </a>
        <a
          href="/downloads/installer_0.1.0_arm64.deb"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download ARM64 Debian Package
        </a>
        <a
          href="/downloads/lyjs-installer_0.1.0_amd64.deb"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download AMD64 Debian Package
        </a>
        <a
          href="/downloads/lyjs-installer.msi"
          download
          className="py-2 px-4 rounded text-white font-bold animate-neon"
          style={{
            background: 'linear-gradient(270deg, #ff8a00, #e52e71, #9b4bff)',
            backgroundSize: '400% 400%',
          }}
        >
          Download MSI Windows Package
        </a>
      </div>
    </div>
  );
};

export default DownloadPage;
