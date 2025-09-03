import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { teamName, prompt, timestamp } = await request.json();

    if (!teamName || !prompt) {
      return NextResponse.json(
        { error: '조 이름과 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 팀 목록에서 같은 이름의 팀이 있는지 확인
    const teamIds = await redis.smembers('teams');
    let existingTeamId = null;
    
    for (const teamId of teamIds) {
      const existingData = await redis.get(`prompt:${teamId}`);
      if (existingData) {
        const parsedData = JSON.parse(existingData);
        if (parsedData.teamName === teamName) {
          existingTeamId = teamId;
          break;
        }
      }
    }

    // 프롬프트 데이터 생성
    const promptData = {
      teamName,
      prompt,
      timestamp: timestamp || new Date().toISOString(),
      id: existingTeamId || `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Redis에 저장 (기존 데이터가 있으면 덮어쓰기)
    await redis.set(`prompt:${promptData.id}`, JSON.stringify(promptData));
    
    // 새로운 팀인 경우에만 teams 세트에 추가
    if (!existingTeamId) {
      await redis.sadd('teams', promptData.id);
    }

    return NextResponse.json({
      success: true,
      message: existingTeamId ? '프롬프트가 성공적으로 업데이트되었습니다.' : '프롬프트가 성공적으로 저장되었습니다.',
      data: promptData
    });

  } catch (error) {
    console.error('프롬프트 저장 오류:', error);
    return NextResponse.json(
      { error: '프롬프트 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 모든 팀 ID 가져오기
    const teamIds = await redis.smembers('teams');
    
    // 각 팀의 프롬프트 데이터 가져오기
    const teams = [];
    for (const teamId of teamIds) {
      const promptData = await redis.get(`prompt:${teamId}`);
      if (promptData) {
        teams.push(JSON.parse(promptData));
      }
    }

    return NextResponse.json({
      success: true,
      teams
    });

  } catch (error) {
    console.error('프롬프트 조회 오류:', error);
    return NextResponse.json(
      { error: '프롬프트 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
