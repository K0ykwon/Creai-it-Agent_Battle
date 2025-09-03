import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, team1, team2, position1, position2 } = await request.json();

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

당신의 역할과 전략: ${team1.prompt}

토론 규칙:
1. 논리적이고 설득력 있는 주장을 펼치세요
2. 구체적인 사례와 데이터를 활용하세요
3. 상대방의 주장에 대해 반박하세요
4. 각 발언은 2-3문장으로 간결하게 하세요
5. 공격적이지 않고 전문적인 톤을 유지하세요`;

          const team2SystemPrompt = `당신은 토론에서 ${position2} 입장을 담당하는 AI입니다. 주어진 프롬프트에 따라 토론을 진행하세요.

토론 주제: ${topic}
당신의 입장: ${position2}
팀명: ${team2.teamName}

당신의 역할과 전략: ${team2.prompt}

토론 규칙:
1. 논리적이고 설득력 있는 주장을 펼치세요
2. 구체적인 사례와 데이터를 활용하세요
3. 상대방의 주장에 대해 반박하세요
4. 각 발언은 2-3문장으로 간결하게 하세요
5. 공격적이지 않고 전문적인 톤을 유지하세요`;

          // 토론 진행 (8-10라운드)
          const team1Messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system', content: team1SystemPrompt }];
          const team2Messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{ role: 'system', content: team2SystemPrompt }];
          let currentSpeaker = 'team1';
          let debateHistory = '';
          const totalRounds = Math.floor(Math.random() * 3) + 8; // 8-10라운드

          for (let round = 1; round <= totalRounds; round++) {
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
                max_tokens: 200,
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

팀 1: ${team1.teamName} (${position1} 입장)
팀 2: ${team2.teamName} (${position2} 입장)

토론 내용:
${debateHistory}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "winner": "team1" | "team2" | "tie",
  "team1Score": 0-100,
  "team2Score": 0-100,
  "reasoning": "승패 결정 이유 (2-3문장)"
}

평가 기준:
1. 논리적 일관성 (30%)
2. 근거의 설득력 (25%)
3. 반박의 효과성 (20%)
4. 창의성과 독창성 (15%)
5. 전달력과 명확성 (10%)`;

          try {
            const judgeCompletion = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: '당신은 토론 심사위원입니다. 객관적이고 공정한 판단을 내려주세요.'
                },
                {
                  role: 'user',
                  content: judgePrompt
                }
              ],
              max_tokens: 500,
              temperature: 0.3,
            });

            const judgeResponse = judgeCompletion.choices[0]?.message?.content || '';
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'judgment',
              content: judgeResponse,
              timestamp: new Date().toISOString()
            })}\n\n`));

          } catch (error) {
            console.error('승패 결정 오류:', error);
          }

          // 토론 완료
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: '토론이 완료되었습니다.'
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
