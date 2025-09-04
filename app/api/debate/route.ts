import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, team1, team2, position1, position2, totalRounds } = await request.json();

    if (!topic || !team1 || !team2 || !position1 || !position2) {
      return NextResponse.json(
        { error: '토론 주제, 팀 정보, 입장이 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // 스트리밍 응답 설정
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 토론 시작 메시지
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'message',
            id: 'start',
            speaker: 'system',
            content: `토론 주제: ${topic}`,
            timestamp: new Date().toISOString()
          })}\n\n`));

          // 팀 1과 팀 2의 초기 프롬프트 설정
          const team1SystemPrompt = `당신은 토론에서 ${position1} 입장을 담당하는 AI입니다. 주어진 프롬프트에 따라 토론을 진행하세요.

토론 주제: ${topic}
당신의 입장: ${position1}
팀명: ${team1.teamName}

- 당신의 역할과 전략을 명심하고 반드시 이에 따라 토론을 진행해주세요.
**중요 ** 당신의 역할과 전략: ${team1.prompt}

2-3문장으로 발언해주세요`;

          const team2SystemPrompt = `당신은 토론에서 ${position2} 입장을 담당하는 AI입니다. 주어진 프롬프트에 따라 토론을 진행하세요.

토론 주제: ${topic}
당신의 입장: ${position2}
팀명: ${team2.teamName}

- 당신의 역할과 전략을 명심하고 반드시 이에 따라 토론을 진행해주세요.
**중요 ** 당신의 역할과 전략: ${team2.prompt}
2-3문장으로 발언해주세요`;

          // 토론 진행 (각 팀 4번씩 발언)
          const team1Messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system', content: team1SystemPrompt }];
          const team2Messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system', content: team2SystemPrompt }];
          let currentSpeaker = 'team1'; // 첫 번째 팀부터 시작
          let debateHistory = '';
          const rounds = totalRounds || 8; // 설정된 라운드 수 또는 기본 8라운드

          // 심사위원이 주제 발제
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'message',
            id: 'judge-intro',
            speaker: 'judge',
            content: `안녕하세요. 오늘의 토론 주제는 "${topic}"입니다. ${team1.teamName}은 ${position1} 입장을, ${team2.teamName}은 ${position2} 입장을 대변합니다. 총 ${rounds}라운드로 진행되며, 각 팀은 ${Math.floor(rounds / 2)}번씩 발언할 기회가 있습니다. 토론을 시작하겠습니다.`,
            timestamp: new Date().toISOString()
          })}\n\n`));

          for (let round = 1; round <= rounds; round++) {
            // 라운드 시작 알림
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'round',
              round: round
            })}\n\n`));

            const currentMessages = currentSpeaker === 'team1' ? team1Messages : team2Messages;

            // 현재 발언자에게 토론 상황 전달
            const contextPrompt = `현재 ${round}라운드입니다. 지금까지의 토론 내용:

${debateHistory}

이제 당신의 차례입니다. 상대방의 주장에 반박하거나 새로운 논점을 제시하세요.`;

            currentMessages.push({ role: 'user', content: contextPrompt });

            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: currentMessages,
                max_tokens: 512,
                temperature: 0.8,
              });

              const response = completion.choices[0]?.message?.content || '';
              
              // 발언을 토론 기록에 추가
              const teamName = currentSpeaker === 'team1' ? team1.teamName : team2.teamName;
              debateHistory += `${teamName}: ${response}\n\n`;

              // 스트리밍으로 메시지 전송
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'message',
                id: `round-${round}-${currentSpeaker}`,
                speaker: currentSpeaker,
                content: response,
                timestamp: new Date().toISOString()
              })}\n\n`));

              // 상대방 메시지에도 추가
              if (currentSpeaker === 'team1') {
                team2Messages.push({ role: 'assistant', content: response });
                team1Messages.push({ role: 'assistant', content: response });
              } else {
                team1Messages.push({ role: 'assistant', content: response });
                team2Messages.push({ role: 'assistant', content: response });
              }

              // 발언자 교체
              currentSpeaker = currentSpeaker === 'team1' ? 'team2' : 'team1';

              // 각 라운드 사이에 잠시 대기
              await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
              console.error('OpenAI API 오류:', error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                message: '토론 중 오류가 발생했습니다.'
              })}\n\n`));
              break;
            }
          }

          // 토론 완료 후 승패 결정
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'message',
            id: 'judge-start',
            speaker: 'judge',
            content: '토론이 완료되었습니다. 이제 승패를 결정하겠습니다...',
            timestamp: new Date().toISOString()
          })}\n\n`));

          // 승패 결정 에이전트
          const judgePrompt = `당신은 토론 심사위원입니다. 다음 토론을 분석하여 승패를 결정해주세요.

토론 주제: ${topic}

${team1.teamName}: ${position1} 입장
${team2.teamName}: ${position2} 입장

토론 내용:
${debateHistory}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "winner": "team1" | "team2" | "tie",
  "team1Score": 0-100,
  "team2Score": 0-100,
  "reasoning": "승패 결정 이유 (2-3문장)",
  "team1Strengths": "팀1의 강점을 2-3문장으로 설명",
  "team2Strengths": "팀2의 강점을 2-3문장으로 설명",
  "team1Weaknesses": "팀1의 약점을 1-2문장으로 설명",
  "team2Weaknesses": "팀2의 약점을 1-2문장으로 설명",
  "summary": "전체 토론 요약 (3-4문장)",
  "detailedAnalysis": "상세 분석"
}

평가 기준 (가중치를 다양하게 적용):
1. 논리적 일관성과 추론력
2. 근거의 설득력과 구체성  
3. 반박의 효과성과 대응력
4. 창의성과 독창적 관점
5. 전달력과 명확성
6. 감정적 공감과 설득력
7. 실용성과 현실적 해결책

점수는 60-95 범위에서 다양하게 부여하고, 완전히 똑같은 결과는 피해주세요.

중요 지침:
- team1Strengths와 team2Strengths는 각 팀의 실제 토론 내용을 바탕으로 강점을 2-3문장으로 설명하세요
- team1Weaknesses와 team2Weaknesses는 각 팀의 실제 토론 내용을 바탕으로 약점을 1-2문장으로 설명하세요
- summary는 전체 토론의 흐름과 주요 논점을 요약하세요
- detailedAnalysis는 평가 기준에 따라 각 팀의 성과를 상세히 분석하세요
- 모든 내용은 실제 토론 내용을 바탕으로 작성하세요`;

          try {
            const judgeCompletion = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: `당신은 토론 심사위원입니다. 매번 다른 관점에서 객관적이고 공정한 판단을 내려주세요. 
                  같은 토론이라도 다른 심사위원이 보면 다른 결과가 나올 수 있다는 점을 고려하여, 
                  다양한 평가 기준을 적용하고 점수도 다양하게 부여해주세요.`
                },
                {
                  role: 'user',
                  content: judgePrompt
                }
              ],
              max_tokens: 1024,
              temperature: 0.8,
            });

            const judgeResponse = judgeCompletion.choices[0]?.message?.content || '';
            
            // JSON 파싱 시도
            let parsedResult = null;
            try {
              const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0]);
              }
            } catch (parseError) {
              console.error('판정 결과 파싱 오류:', parseError);
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'judgment',
              content: judgeResponse,
              result: parsedResult,
              timestamp: new Date().toISOString()
            })}\n\n`));

          } catch (error) {
            console.error('승패 결정 오류:', error);
          }

          // 토론 완료
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: '토론이 완료되었습니다.',
            clearPreviousResult: true
          })}\n\n`));

          controller.close();

        } catch (error) {
          console.error('토론 스트림 오류:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: '토론 중 오류가 발생했습니다.'
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('토론 API 오류:', error);
    return NextResponse.json(
      { error: '토론을 시작할 수 없습니다.' },
      { status: 500 }
    );
  }
}
