'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaRobot, FaChartBar, FaArrowLeft, FaPlay, FaComments, FaStar, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

interface DebateResult {
  winner: 'ai1' | 'ai2' | 'tie';
  ai1Score: number;
  ai2Score: number;
  ai1Strengths: string[];
  ai2Strengths: string[];
  ai1Weaknesses: string[];
  ai2Weaknesses: string[];
  summary: string;
  detailedAnalysis: string;
}

interface Team {
  id: string;
  teamName: string;
  prompt: string;
  timestamp: string;
}

interface DebateData {
  team1: Team;
  team2: Team;
  topic: string;
  position1: string;
  position2: string;
  timestamp: string;
  debateHistory?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [debateData, setDebateData] = useState<DebateData | null>(null);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem('debateData');
    const savedResult = localStorage.getItem('debateResult');
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setDebateData(parsedData);
      
      if (savedResult) {
        // 실제 토론 결과가 있으면 사용
        const parsedResult = JSON.parse(savedResult);
        setResult(parsedResult);
        setIsLoading(false);
      } else {
        // 결과가 없으면 분석 API 호출
        analyzeDebate(parsedData);
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const analyzeDebate = async (data: DebateData) => {
    try {
      const response = await fetch('/api/debate/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: data.topic,
          team1: data.team1,
          team2: data.team2,
          position1: data.position1,
          position2: data.position2,
          debateHistory: data.debateHistory || '토론 내용이 없습니다.'
        }),
      });

      if (response.ok) {
        const analysisResult = await response.json();
        setResult(analysisResult.result);
        // 결과를 localStorage에 저장
        localStorage.setItem('debateResult', JSON.stringify(analysisResult.result));
      } else {
        // API 실패 시 기본 결과 설정
        setDefaultResult();
      }
    } catch (error) {
      console.error('토론 분석 오류:', error);
      setDefaultResult();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultResult = () => {
    setResult({
      winner: 'tie',
      ai1Score: 75,
      ai2Score: 75,
      ai1Strengths: ['논리적 접근', '구체적 근거'],
      ai2Strengths: ['창의적 관점', '감정적 어필'],
      ai1Weaknesses: ['감정적 공감 부족'],
      ai2Weaknesses: ['논리적 근거 부족'],
      summary: '양 팀 모두 좋은 토론을 펼쳤습니다.',
      detailedAnalysis: '토론 분석 중 오류가 발생했습니다.'
    });
  };

  const goBack = () => {
    router.push('/');
  };

  const startNewDebate = () => {
    router.push('/');
  };

  const viewDebate = () => {
    router.push('/debate');
  };

  if (!debateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">토론 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-black/40 border-b border-gray-800/50 py-4">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goBack}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <FaArrowLeft className="text-lg" />
                <span>돌아가기</span>
              </motion.button>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-bold text-white">토론 결과</h1>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={viewDebate}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FaComments className="text-sm" />
                <span>토론 보기</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">토론 결과 분석 중...</h2>
            <p className="text-gray-400">AI가 토론 내용을 분석하고 있습니다.</p>
          </div>
        ) : result ? (
          <>
            {/* 승자 발표 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
                <div className="flex justify-center mb-6">
                  <FaTrophy className={`text-6xl ${
                    result.winner === 'ai1' ? 'text-yellow-400' : 
                    result.winner === 'ai2' ? 'text-purple-400' : 'text-gray-400'
                  }`} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {result.winner === 'tie' ? '무승부!' : 
                   result.winner === 'ai1' ? `${debateData?.team1.teamName} 승리!` : `${debateData?.team2.teamName} 승리!`}
                </h2>
                <p className="text-lg text-gray-300 mb-6">{result.summary}</p>
                
                {/* 점수 표시 */}
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      result.winner === 'ai1' ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {result.ai1Score}
                    </div>
                    <div className="text-sm text-gray-400">{debateData?.team1.teamName} 점수</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      result.winner === 'ai2' ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      {result.ai2Score}
                    </div>
                    <div className="text-sm text-gray-400">{debateData?.team2.teamName} 점수</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 상세 분석 */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* 팀 1 분석 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaRobot className="text-2xl text-blue-400" />
                  <h3 className="text-xl font-bold text-white">{debateData?.team1.teamName} 분석</h3>
                  <div className="ml-auto text-2xl font-bold text-blue-400">{result.ai1Score}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <FaThumbsUp className="text-sm" />
                      강점
                    </h4>
                    <ul className="space-y-2">
                      {(result.ai1Strengths || []).map((strength, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <FaStar className="text-yellow-400 text-xs mt-1 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <FaThumbsDown className="text-sm" />
                      개선점
                    </h4>
                    <ul className="space-y-2">
                      {(result.ai1Weaknesses || []).map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* 팀 2 분석 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaRobot className="text-2xl text-purple-400" />
                  <h3 className="text-xl font-bold text-white">{debateData?.team2.teamName} 분석</h3>
                  <div className="ml-auto text-2xl font-bold text-purple-400">{result.ai2Score}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <FaThumbsUp className="text-sm" />
                      강점
                    </h4>
                    <ul className="space-y-2">
                      {(result.ai2Strengths || []).map((strength, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <FaStar className="text-yellow-400 text-xs mt-1 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <FaThumbsDown className="text-sm" />
                      개선점
                    </h4>
                    <ul className="space-y-2">
                      {(result.ai2Weaknesses || []).map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 상세 분석 텍스트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaChartBar className="text-2xl text-blue-400" />
                <h3 className="text-xl font-bold text-white">상세 분석</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{result.detailedAnalysis}</p>
            </motion.div>

            {/* 액션 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNewDebate}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
              >
                <FaPlay className="text-lg" />
                <span>새로운 토론 시작</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={viewDebate}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
              >
                <FaComments className="text-lg" />
                <span>토론 다시 보기</span>
              </motion.button>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
}
