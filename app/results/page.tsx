'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaRobot, FaChartBar, FaArrowLeft, FaPlay, FaComments, FaStar, FaThumbsUp, FaThumbsDown, FaRedo } from 'react-icons/fa';

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
  totalRounds: number;
  timestamp: string;
  debateHistory?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [debateData, setDebateData] = useState<DebateData | null>(null);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replayMessages, setReplayMessages] = useState<{id: string, speaker: 'team1' | 'team2' | 'judge', content: string, timestamp: string}[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);

  const setDefaultResult = useCallback(() => {
    return {
      winner: 'tie' as 'ai1' | 'ai2' | 'tie',
      ai1Score: 75,
      ai2Score: 75,
      ai1Strengths: ['논리적 접근', '구체적 근거'],
      ai2Strengths: ['창의적 관점', '감정적 어필'],
      ai1Weaknesses: ['감정적 공감 부족'],
      ai2Weaknesses: ['논리적 근거 부족'],
      summary: '양 팀 모두 좋은 토론을 펼쳤습니다.',
      detailedAnalysis: '토론 분석 중 오류가 발생했습니다.'
    };
  }, []);

  const analyzeDebate = useCallback(async (data: DebateData) => {
    try {
      // localStorage에서 토론 메시지 가져오기
      const savedMessages = localStorage.getItem('debateMessages');
      let debateHistory = '토론 내용이 없습니다.';
      
      if (savedMessages) {
        try {
          const messages = JSON.parse(savedMessages);
          // 토론 메시지를 문자열로 변환
          debateHistory = messages
            .filter((msg: any) => msg.speaker !== 'system') // 시스템 메시지 제외
            .map((msg: any) => `${msg.speaker === 'team1' ? data.team1.teamName : msg.speaker === 'team2' ? data.team2.teamName : '심사위원'}: ${msg.content}`)
            .join('\n\n');
        } catch (error) {
          console.error('토론 메시지 파싱 오류:', error);
        }
      }
      
      console.log('분석에 사용할 토론 내용:', debateHistory);
      
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
          debateHistory: debateHistory
        }),
      });

      if (response.ok) {
        const analysisResult = await response.json();
        console.log('분석 API 결과:', analysisResult.result);
        const convertedResult = convertDebateResult(analysisResult.result);
        console.log('분석 결과 변환됨:', convertedResult);
        
        // 변환된 결과가 올바른지 확인
        if (convertedResult && Array.isArray(convertedResult.ai1Strengths)) {
          setResult(convertedResult);
          // 결과를 localStorage에 저장
          localStorage.setItem('debateResult', JSON.stringify(analysisResult.result));
        } else {
          console.error('분석 결과 변환 실패:', convertedResult);
          setResult(setDefaultResult());
        }
      } else {
        // API 실패 시 기본 결과 설정
        setResult(setDefaultResult());
      }
    } catch (error) {
      console.error('토론 분석 오류:', error);
      setResult(setDefaultResult());
    } finally {
      setIsLoading(false);
    }
  }, [setDefaultResult]);

  const convertDebateResult = useCallback((debateResult: {winner?: string, team1Score?: number, team2Score?: number, team1Strengths?: string | string[], team2Strengths?: string | string[], team1Weaknesses?: string | string[], team2Weaknesses?: string | string[], summary?: string, detailedAnalysis?: string, reasoning?: string}) => {
    // 토론 API 결과를 결과 페이지 형식으로 변환
    if (!debateResult) {
      return setDefaultResult();
    }

    console.log('변환 전 debateResult:', debateResult);
    console.log('team1Strengths 타입:', typeof debateResult.team1Strengths, debateResult.team1Strengths);

    const convertedResult = {
      winner: (debateResult.winner === 'team1' ? 'ai1' : debateResult.winner === 'team2' ? 'ai2' : 'tie') as 'ai1' | 'ai2' | 'tie',
      ai1Score: debateResult.team1Score || 75,
      ai2Score: debateResult.team2Score || 75,
      ai1Strengths: (() => {
        const strengths = debateResult.team1Strengths;
        return Array.isArray(strengths) ? strengths : (strengths ? [strengths] : ['논리적 접근', '구체적 근거']);
      })(),
      ai2Strengths: (() => {
        const strengths = debateResult.team2Strengths;
        return Array.isArray(strengths) ? strengths : (strengths ? [strengths] : ['창의적 관점', '감정적 어필']);
      })(),
      ai1Weaknesses: (() => {
        const weaknesses = debateResult.team1Weaknesses;
        return Array.isArray(weaknesses) ? weaknesses : (weaknesses ? [weaknesses] : ['감정적 공감 부족']);
      })(),
      ai2Weaknesses: (() => {
        const weaknesses = debateResult.team2Weaknesses;
        return Array.isArray(weaknesses) ? weaknesses : (weaknesses ? [weaknesses] : ['논리적 근거 부족']);
      })(),
      summary: debateResult.summary || debateResult.reasoning || '양 팀 모두 좋은 토론을 펼쳤습니다.',
      detailedAnalysis: debateResult.detailedAnalysis || debateResult.reasoning || '토론이 성공적으로 완료되었습니다.'
    };
    
    console.log('변환된 결과:', convertedResult);
    return convertedResult;
  }, [setDefaultResult]);

  const goBack = () => {
    router.push('/');
  };

  const startNewDebate = () => {
    router.push('/');
  };

  const viewDebate = () => {
    const savedMessages = localStorage.getItem('debateMessages');
    console.log('저장된 메시지:', savedMessages);
    console.log('localStorage 전체 내용:', localStorage);
    
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        console.log('파싱된 메시지:', messages);
        console.log('메시지 개수:', messages.length);
        
        if (messages.length > 0) {
          setReplayMessages(messages);
          setCurrentReplayIndex(0);
          setShowReplayModal(true);
        } else {
          alert('토론 메시지가 비어있습니다.');
        }
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        alert('토론 메시지 데이터를 파싱할 수 없습니다.');
      }
    } else {
      alert('토론 메시지 데이터가 없습니다. localStorage를 확인해주세요.');
    }
  };


  const resetReplay = () => {
    setCurrentReplayIndex(0);
  };

  const showAllMessages = () => {
    setCurrentReplayIndex(replayMessages.length - 1);
  };

  useEffect(() => {
    const savedData = localStorage.getItem('debateData');
    const savedResult = localStorage.getItem('debateResult');
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setDebateData(parsedData);
      
      // 결과가 있으면 무조건 덮어쓰기 (새로운 토론 결과)
      if (savedResult) {
        const parsedResult = JSON.parse(savedResult);
        console.log('새로운 토론 결과 로드:', parsedResult);
        const convertedResult = convertDebateResult(parsedResult);
        console.log('변환된 결과:', convertedResult);
        
        // 변환된 결과가 올바른지 확인
        if (convertedResult && Array.isArray(convertedResult.ai1Strengths)) {
          setResult(convertedResult);
          setIsLoading(false);
        } else {
          console.error('변환된 결과가 올바르지 않음:', convertedResult);
          setResult(setDefaultResult());
          setIsLoading(false);
        }
      } else {
        // 결과가 없으면 분석 API 호출
        console.log('결과 없음, 분석 API 호출');
        analyzeDebate(parsedData);
      }
    } else {
      router.push('/');
    }
  }, [router, analyzeDebate, convertDebateResult]);

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
                      {(Array.isArray(result.ai1Strengths) ? result.ai1Strengths : []).map((strength, index) => (
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
                      {(Array.isArray(result.ai1Weaknesses) ? result.ai1Weaknesses : []).map((weakness, index) => (
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
                      {(Array.isArray(result.ai2Strengths) ? result.ai2Strengths : []).map((strength, index) => (
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
                      {(Array.isArray(result.ai2Weaknesses) ? result.ai2Weaknesses : []).map((weakness, index) => (
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

      {/* 토론 재생 모달 */}
      {showReplayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] shadow-2xl flex flex-col"
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaComments className="text-2xl text-blue-400" />
                <h3 className="text-2xl font-bold text-white">토론 다시 보기</h3>
              </div>
              <button
                onClick={() => setShowReplayModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
            </div>

            {/* 재생 컨트롤 */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={showAllMessages}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FaComments className="text-sm" />
                전체 보기
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetReplay}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FaRedo className="text-sm" />
                처음부터
              </motion.button>
            </div>

            {/* 메시지 정보 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>토론 메시지</span>
                <span>{currentReplayIndex + 1} / {replayMessages.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentReplayIndex + 1) / replayMessages.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 토론 메시지 */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
              {replayMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FaComments className="text-4xl mx-auto mb-4" />
                  <p>토론 메시지가 없습니다.</p>
                </div>
              ) : (
                replayMessages.slice(0, currentReplayIndex + 1).map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${
                    message.speaker === 'judge' 
                      ? 'bg-yellow-500/20 border border-yellow-500/30' 
                      : message.speaker === 'team1'
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-purple-500/20 border border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {message.speaker === 'judge' ? (
                      <FaTrophy className="text-yellow-400" />
                    ) : message.speaker === 'team1' ? (
                      <FaRobot className="text-blue-400" />
                    ) : (
                      <FaRobot className="text-purple-400" />
                    )}
                    <span className="font-semibold text-white">
                      {message.speaker === 'judge' 
                        ? '심사위원' 
                        : message.speaker === 'team1' 
                        ? debateData?.team1.teamName 
                        : debateData?.team2.teamName
                      }
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
                </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
