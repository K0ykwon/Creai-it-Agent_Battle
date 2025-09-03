'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaComments, FaTrophy, FaPlay, FaBars, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/30 border-b border-gray-800/50 shadow-lg">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/logo.png"
              alt="CREAI+IT Logo"
              width={40}
              height={15}
              className="object-contain"
            />
            <div className="hidden md:flex items-center space-x-2">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                CREAI+IT
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <FaPlay className="text-blue-400 mr-1" />
              <span>토론 시작</span>
            </Link>
            <Link href="/debate" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <FaComments className="text-purple-400 mr-1" />
              <span>토론 진행</span>
            </Link>
            <Link href="/results" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <FaTrophy className="text-yellow-400 mr-1" />
              <span>토론 결과</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-800/50"
          >
            <div className="py-4 space-y-3">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaPlay className="text-blue-400" />
                <span>토론 시작</span>
              </Link>
              <Link 
                href="/debate" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaComments className="text-purple-400" />
                <span>토론 진행</span>
              </Link>
              <Link 
                href="/results" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 px-4 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaTrophy className="text-yellow-400" />
                <span>토론 결과</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
