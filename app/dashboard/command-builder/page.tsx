"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function CommandBuilderUnavailable() {
  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
      >
        <div className="flex justify-center mb-6">
          <Lock 
            className="text-blue-500" 
            size={72} 
            strokeWidth={1.5}
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Feature Unavailable
        </h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We apologize, but the Command Builder is currently not accessible. 
          Please check back later or contact support for more information.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-blue-700 text-sm">
            ✨ We're working on bringing this feature back soon!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}