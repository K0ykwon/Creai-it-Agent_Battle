'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaComments, FaRobot, FaPlay, FaPause, FaStop, FaArrowLeft, FaTrophy } from 'react-icons/fa';

interface DebateMessage {
  id: string;
  speaker: 'team1' | 'team2' | 'judge';
  content: string;
  timestamp: Date;
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
}

export default function DebatePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [debateData, setDebateData] = useState<DebateData | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(true);
  
  // 토론 설정 상태
  const [selectedTeam1, setSelectedTeam1] = useState('');
  const [selectedTeam2, setSelectedTeam2] = useState('');
  const [topic, setTopic] = useState('');
  const [position1, setPosition1] = useState('');
  const [position2, setPosition2] = useState('');
  const [totalRounds, setTotalRounds] = useState(8); // 기본 8라운드

  useEffect(() => {
    // 항상 설정 모드로 시작하고 팀 목록 불러오기
    setIsSetupMode(true);
    fetchTeams();
  }, [router]);

  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (messages.length > 0) {
      console.log('메시지 업데이트됨:', messages);
      localStorage.setItem('debateMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('팀 목록 조회 오류:', error);
    }
  };

  const setupDebate = () => {
    if (!selectedTeam1 || !selectedTeam2 || !topic || !position1 || !position2) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (selectedTeam1 === selectedTeam2) {
      alert('서로 다른 팀을 선택해주세요.');
      return;
    }

    const team1 = teams.find(t => t.id === selectedTeam1);
    const team2 = teams.find(t => t.id === selectedTeam2);

    if (!team1 || !team2) {
      alert('선택한 팀을 찾을 수 없습니다.');
      return;
    }

    const newDebateData: DebateData = {
      team1,
      team2,
      topic,
      position1,
      position2,
      totalRounds,
      timestamp: new Date().toISOString()
    };

    setDebateData(newDebateData);
    localStorage.setItem('debateData', JSON.stringify(newDebateData));
    setIsSetupMode(false);
  };

  const startDebate = async () => {
    if (!debateData) return;
    
    // 새로운 토론 시작 시 이전 결과 삭제
    localStorage.removeItem('debateResult');
    console.log('새로운 토론 시작, 이전 결과 삭제');
    
    setIsDebating(true);
    setIsLoading(true);
    setMessages([]);
    setCurrentRound(0);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: debateData.topic,
          team1: debateData.team1,
          team2: debateData.team2,
          position1: debateData.position1,
          position2: debateData.position2,
          totalRounds: debateData.totalRounds,
        }),
      });

      if (!response.ok) {
        throw new Error('토론 시작에 실패했습니다.');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'message') {
                setMessages(prev => [...prev, {
                  id: data.id,
                  speaker: data.speaker,
                  content: data.content,
                  timestamp: new Date(data.timestamp)
                }]);
              } else if (data.type === 'round') {
                setCurrentRound(data.round);
                                           } else if (data.type === 'judgment') {
                setMessages(prev => [...prev, {
                  id: 'judgment',
                  speaker: 'judge',
                  content: data.content,
                  timestamp: new Date(data.timestamp)
                }]);
                
                // 판정 결과를 localStorage에 저장
                if (data.result) {
                  localStorage.setItem('debateResult', JSON.stringify(data.result));
                }
              } else if (data.type === 'complete') {
                 setIsDebating(false);
                 setIsLoading(false);
                 
                 // 토론 완료 후 결과 페이지로 이동 (결과는 삭제하지 않음)
                 setTimeout(() => {
                   router.push('/results');
                 }, 3000);
               }
            } catch (e) {
              console.error('JSON 파싱 오류:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('토론 오류:', error);
      setIsDebating(false);
      setIsLoading(false);
    }
  };

  const pauseDebate = () => {
    setIsPaused(!isPaused);
  };

  const stopDebate = () => {
    setIsDebating(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  const goBack = () => {
    router.push('/');
  };

  const viewResults = () => {
    router.push('/results');
  };

  if (isSetupMode) {
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
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <FaArrowLeft className="text-lg" />
                  <span>돌아가기</span>
                </motion.button>
                <div className="h-6 w-px bg-gray-600"></div>
                <h1 className="text-xl font-bold text-white">토론 설정</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">토론 배틀 설정</h2>
            
            <div className="space-y-6">
              {/* 토론 주제 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  토론 주제
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 인공지능이 인간의 일자리를 대체할 것인가?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 라운드 수 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  토론 라운드 수
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="2"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-white font-semibold min-w-[60px] text-center">
                    {totalRounds}라운드
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  각 팀이 {Math.floor(totalRounds / 2)}번씩 발언합니다
                </div>
              </div>

              {/* 팀 선택 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    팀 1 선택
                  </label>
                  <select
                    value={selectedTeam1}
                    onChange={(e) => setSelectedTeam1(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">팀을 선택하세요</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-gray-800">
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    팀 2 선택
                  </label>
                  <select
                    value={selectedTeam2}
                    onChange={(e) => setSelectedTeam2(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">팀을 선택하세요</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-gray-800">
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 입장 설정 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    팀 1 입장
                  </label>
                  <input
                    type="text"
                    value={position1}
                    onChange={(e) => setPosition1(e.target.value)}
                    placeholder="예: 찬성, 반대, 중립 등"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    팀 2 입장
                  </label>
                  <input
                    type="text"
                    value={position2}
                    onChange={(e) => setPosition2(e.target.value)}
                    placeholder="예: 찬성, 반대, 중립 등"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 설정 완료 버튼 */}
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={setupDebate}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
                >
                  <FaPlay className="text-lg" />
                  <span>토론 설정 완료</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-white">AI 토론 배틀</h1>
            </div>
            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-400">
                  라운드 {currentRound}/{debateData?.totalRounds || 8} (각 팀 {Math.floor((debateData?.totalRounds || 8) / 2)}번씩)
                </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={viewResults}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <FaTrophy className="text-sm" />
                <span>결과 보기</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* 토론 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">토론 주제</h2>
            <p className="text-lg text-gray-300">{debateData.topic}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <FaRobot className="text-sm" />
                {debateData.team1.teamName} ({debateData.position1})
              </h3>
              <p className="text-sm text-gray-300 line-clamp-3">{debateData.team1.prompt}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <FaRobot className="text-sm" />
                {debateData.team2.teamName} ({debateData.position2})
              </h3>
              <p className="text-sm text-gray-300 line-clamp-3">{debateData.team2.prompt}</p>
            </div>
          </div>
        </motion.div>

        {/* 컨트롤 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-4 mb-8"
        >
          {!isDebating ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startDebate}
              disabled={isLoading}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white py-3 px-6 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
            >
              <FaPlay className="text-lg" />
              <span>{isLoading ? '토론 준비 중...' : '토론 시작'}</span>
            </motion.button>
          ) : (
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pauseDebate}
                className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-500 text-white py-3 px-6 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
              >
                {isPaused ? <FaPlay className="text-lg" /> : <FaPause className="text-lg" />}
                <span>{isPaused ? '계속하기' : '일시정지'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopDebate}
                className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
              >
                <FaStop className="text-lg" />
                <span>토론 중단</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* 토론 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/8 backdrop-blur-lg rounded-2xl border border-white/10 p-6 min-h-[500px]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaComments className="text-xl text-blue-400" />
              <h3 className="text-xl font-bold text-white">토론 진행 상황</h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsSetupMode(true);
                setDebateData(null);
                localStorage.removeItem('debateData');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <FaArrowLeft className="text-sm" />
              다시 설정하기
            </motion.button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaComments className="text-4xl mx-auto mb-2" />
                  <p>토론이 시작되면 여기에 메시지가 표시됩니다.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.speaker === 'team1' ? -20 : message.speaker === 'team2' ? 20 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${
                    message.speaker === 'team1' ? 'justify-start' : 
                    message.speaker === 'team2' ? 'justify-end' : 
                    'justify-center'
                  }`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.speaker === 'team1' 
                      ? 'bg-blue-500/20 border border-blue-500/30' 
                      : message.speaker === 'team2'
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {message.speaker === 'judge' ? (
                        <FaTrophy className="text-sm text-yellow-400" />
                      ) : (
                        <FaRobot className={`text-sm ${
                          message.speaker === 'team1' ? 'text-blue-400' : 'text-purple-400'
                        }`} />
                      )}
                      <span className={`text-sm font-medium ${
                        message.speaker === 'team1' ? 'text-blue-300' : 
                        message.speaker === 'team2' ? 'text-purple-300' :
                        'text-yellow-300'
                      }`}>
                        {message.speaker === 'judge' ? '심사위원' : 
                         message.speaker === 'team1' ? debateData?.team1.teamName : 
                         debateData?.team2.teamName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span>AI가 토론 중입니다...</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
