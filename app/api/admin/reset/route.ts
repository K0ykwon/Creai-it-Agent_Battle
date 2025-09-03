import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // 비밀번호 확인
    if (password !== 'admin') {
      return NextResponse.json(
        { error: '잘못된 비밀번호입니다.' },
        { status: 401 }
      );
    }

    // Redis에서 모든 팀 데이터 삭제
    const teamIds = await redis.smembers('teams');
    
    // 각 팀의 프롬프트 데이터 삭제
    for (const teamId of teamIds) {
      await redis.del(`prompt:${teamId}`);
    }
    
    // teams 세트 삭제
    await redis.del('teams');

    return NextResponse.json({
      success: true,
      message: '데이터베이스가 성공적으로 초기화되었습니다.',
      deletedTeams: teamIds.length
    });

  } catch (error) {
    console.error('DB 초기화 오류:', error);
    return NextResponse.json(
      { error: 'DB 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
