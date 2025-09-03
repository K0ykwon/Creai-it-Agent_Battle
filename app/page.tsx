// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLightbulb, FaComments, FaPlay, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSavePrompt = async () => {
    if (!teamName.trim() || !prompt.trim()) {
      alert('조 이름과 프롬프트를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: teamName.trim(),
          prompt: prompt.trim(),
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('프롬프트가 성공적으로 저장되었습니다!');
        setTeamName('');
        setPrompt('');
      } else {
        alert('프롬프트 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프롬프트 저장 오류:', error);
      alert('프롬프트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleStartDebate = () => {
    router.push('/debate');
  };

  const handleResetDB = async () => {
    if (!resetPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: resetPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setShowResetModal(false);
        setResetPassword('');
      } else {
        alert(result.error || 'DB 초기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('DB 초기화 오류:', error);
      alert('DB 초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        {/* Enhanced background with more sophisticated particle system */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-blue-500/30 rounded-full blur-3xl -top-[25vw] -left-[25vw] animate-pulse-slow"></div>
          <div className="absolute w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-purple-500/30 rounded-full blur-3xl -bottom-[25vw] -right-[25vw] animate-pulse-slow-delayed"></div>
        </div>

        <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Logo */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 1,
              type: "spring",
              stiffness: 100 
            }}
            className="mx-auto w-full max-w-[100px] sm:max-w-[120px] lg:max-w-[140px] mb-8 lg:mb-12 group"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={360}
              height={120}
              className="w-full h-auto object-contain drop-shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(96,165,250,0.5)]"
              priority
            />
          </motion.div>

          {/* Hero section */}
          <motion.div
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="text-center mb-12 lg:mb-16 relative z-10"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <FaComments className="text-5xl lg:text-7xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                <div className="absolute inset-0 rounded-full bg-blue-400/20 scale-150 blur-xl animate-pulse-slow"></div>
              </div>
            </div>
            
            <h1 className="relative text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 drop-shadow-lg">
                AI 토론 배틀
              </span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl lg:text-3xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-10"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 px-1 relative">
                Powered by CREAI+IT
              </span>
              <br className="hidden lg:block" />
              <span className="opacity-90 leading-relaxed">
                조별로 프롬프트를 등록하고, <br className="hidden sm:block" />
                <span className="relative inline-block">
                  다른 조와 토론 배틀을 벌여보세요.
                </span>
              </span>
            </motion.p>
          </motion.div>

          {/* Prompt input container */}
          <motion.div 
            className="w-full max-w-5xl mx-auto relative z-10"
            id="prompt-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="backdrop-blur-lg bg-white/8 rounded-2xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium ml-2">토론 배틀 설정</div>
                </div>
              </div>
              
              {/* Main content */}
              <div className="p-6 lg:p-8 space-y-6">
                {/* 조 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    조 이름
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="예: 1조, 창의조, 혁신팀 등"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 프롬프트 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    토론 프롬프트
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="AI의 성격, 토론 전략, 입장 등을 설명하는 프롬프트를 입력하세요..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Action buttons */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 max-w-3xl mx-auto mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 w-full sm:w-auto min-w-[240px] relative overflow-hidden"
              onClick={handleSavePrompt}
            >
              <FaLightbulb className="text-xl group-hover:rotate-12 transition-transform" />
              <span>프롬프트 저장</span>
              <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </motion.button>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 w-full sm:w-auto min-w-[240px] relative overflow-hidden"
                onClick={handleStartDebate}
              >
                <FaPlay className="text-xl group-hover:rotate-12 transition-transform relative z-10" />
                <span className="relative z-10">토론 시작하기</span>
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-500 text-white py-4 px-6 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 w-full sm:w-auto relative overflow-hidden"
                onClick={() => setShowResetModal(true)}
              >
                <FaTrash className="text-lg group-hover:rotate-12 transition-transform relative z-10" />
                <span className="relative z-10">DB 초기화</span>
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </motion.button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 text-center text-gray-500 text-sm"
          >
            <p>© 2025 CREAI+IT. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* DB 초기화 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-2xl text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">DB 초기화</h3>
              <p className="text-gray-400">
                모든 팀 데이터가 삭제됩니다.<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  관리자 비밀번호
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleResetDB()}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isResetting}
                >
                  취소
                </button>
                <button
                  onClick={handleResetDB}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? '초기화 중...' : '초기화'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
