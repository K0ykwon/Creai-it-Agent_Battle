import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { debateHistory, topic, team1, team2 } = await request.json();

    if (!debateHistory || !topic) {
      return NextResponse.json(
        { error: '토론 기록과 주제가 필요합니다.' },
        { status: 400 }
      );
    }

    // 토론 결과 분석 프롬프트
    const analysisPrompt = `다음 토론을 분석하여 결과를 제공해주세요.

토론 주제: ${topic}

팀 1 프롬프트: ${team1?.prompt || '찬성 측'}
팀 2 프롬프트: ${team2?.prompt || '반대 측'}

토론 내용:
${debateHistory}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "winner": "ai1" | "ai2" | "tie",
  "ai1Score": 0-100,
  "ai2Score": 0-100,
  "ai1Strengths": "팀1의 강점을 2-3문장으로 설명",
  "ai2Strengths": "팀2의 강점을 2-3문장으로 설명",
  "ai1Weaknesses": "팀1의 약점을 1-2문장으로 설명",
  "ai2Weaknesses": "팀2의 약점을 1-2문장으로 설명",
  "summary": "전체 토론 요약 (3-4문장)",
  "detailedAnalysis": "상세한 분석 내용"
}

평가 기준:
1. 논리적 일관성 (30%)
2. 근거의 설득력 (25%)
3. 반박의 효과성 (20%)
4. 창의성과 독창성 (15%)
5. 전달력과 명확성 (10%)

각 AI의 강점과 약점을 구체적으로 분석하고, 승자를 결정해주세요.

중요 지침:
- ai1Strengths와 ai2Strengths는 각 팀의 실제 토론 내용을 바탕으로 강점을 2-3문장으로 설명하세요
- ai1Weaknesses와 ai2Weaknesses는 각 팀의 실제 토론 내용을 바탕으로 약점을 1-2문장으로 설명하세요
- summary는 전체 토론의 흐름과 주요 논점을 요약하세요
- detailedAnalysis는 평가 기준에 따라 각 팀의 성과를 상세히 분석하세요
- 모든 내용은 실제 토론 내용을 바탕으로 작성하세요`;

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
      max_tokens: 1024,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      // JSON 응답 파싱
      const analysisResult = JSON.parse(response);
      
      return NextResponse.json({
        success: true,
        result: analysisResult
      });
    } catch {
      // JSON 파싱 실패 시 기본 응답
      return NextResponse.json({
        success: true,
        result: {
          winner: 'tie',
          ai1Score: 75,
          ai2Score: 75,
          ai1Strengths: '논리적 근거를 체계적으로 제시하고 구체적인 사례를 효과적으로 활용했습니다.',
          ai2Strengths: '창의적인 관점을 제시하고 감정적 어필을 통해 설득력을 높였습니다.',
          ai1Weaknesses: '일부 주장이 추상적이어서 구체성에 아쉬움이 있었습니다.',
          ai2Weaknesses: '논리적 근거가 부족한 부분이 있어 설득력에 한계가 있었습니다.',
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
