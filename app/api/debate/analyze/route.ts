import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { debateHistory, topic, prompt1, prompt2 } = await request.json();

    if (!debateHistory || !topic) {
      return NextResponse.json(
        { error: '토론 기록과 주제가 필요합니다.' },
        { status: 400 }
      );
    }

    // 토론 결과 분석 프롬프트
    const analysisPrompt = `다음 토론을 분석하여 결과를 제공해주세요.

토론 주제: ${topic}

팀 1 프롬프트: ${prompt1 || '찬성 측'}
팀 2 프롬프트: ${prompt2 || '반대 측'}

토론 내용:
${debateHistory}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "winner": "ai1" | "ai2" | "tie",
  "ai1Score": 0-100,
  "ai2Score": 0-100,
  "ai1Strengths": ["강점1", "강점2", "강점3"],
  "ai2Strengths": ["강점1", "강점2", "강점3"],
  "ai1Weaknesses": ["약점1", "약점2"],
  "ai2Weaknesses": ["약점1", "약점2"],
  "summary": "전체 토론 요약 (2-3문장)",
  "detailedAnalysis": "상세한 분석 내용 (3-4문장)"
}

평가 기준:
1. 논리적 일관성 (30%)
2. 근거의 설득력 (25%)
3. 반박의 효과성 (20%)
4. 창의성과 독창성 (15%)
5. 전달력과 명확성 (10%)

각 AI의 강점과 약점을 구체적으로 분석하고, 승자를 결정해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 토론 분석 전문가입니다. 객관적이고 공정한 분석을 제공해주세요.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      // JSON 응답 파싱
      const analysisResult = JSON.parse(response);
      
      return NextResponse.json({
        success: true,
        result: analysisResult
      });
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 응답
      return NextResponse.json({
        success: true,
        result: {
          winner: 'tie',
          ai1Score: 75,
          ai2Score: 75,
          ai1Strengths: ['논리적 근거 제시', '구체적 사례 활용'],
          ai2Strengths: ['창의적 관점', '감정적 어필'],
          ai1Weaknesses: ['일부 주장의 추상성'],
          ai2Weaknesses: ['논리적 근거 부족'],
          summary: '양쪽 모두 강점을 보인 균형잡힌 토론이었습니다.',
          detailedAnalysis: response
        }
      });
    }

  } catch (error) {
    console.error('토론 분석 오류:', error);
    return NextResponse.json(
      { error: '토론 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}
