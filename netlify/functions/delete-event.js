// netlify/functions/delete-event.js
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_bg3036951506vY9q5GUDfSAsfUA4Ivh8ZeAZvvfKKKse6U'
});

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };
  }

  try {
    // 환경변수 확인
    const token = process.env.NOTION_TOKEN;
    
    if (!token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: '환경변수가 설정되지 않았습니다'
        })
      };
    }

    // 요청 데이터 파싱
    const { eventId } = JSON.parse(event.body);

    console.log('일정 삭제 요청:', { eventId });

    // 필수 데이터 검증
    if (!eventId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '이벤트 ID는 필수 항목입니다'
        })
      };
    }

    // 노션에서 페이지 삭제 (아카이브)
    // 노션 API는 실제 삭제가 아닌 아카이브 처리
    const response = await notion.pages.update({
      page_id: eventId,
      archived: true
    });

    console.log('노션 페이지 삭제(아카이브) 성공:', response.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '일정이 성공적으로 삭제되었습니다',
        pageId: response.id
      })
    };

  } catch (error) {
    console.error('노션 API 오류:', error);
    
    // 상세한 오류 정보 반환
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.code === 'object_not_found') {
      errorMessage = '해당 일정을 찾을 수 없습니다.';
      statusCode = 404;
    } else if (error.code === 'unauthorized') {
      errorMessage = '노션 API 권한이 없습니다.';
      statusCode = 401;
    } else if (error.code === 'validation_error') {
      errorMessage = '요청 데이터가 올바르지 않습니다.';
      statusCode = 400;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
