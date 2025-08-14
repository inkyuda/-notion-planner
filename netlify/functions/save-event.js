// netlify/functions/save-event.js
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_bg3036951506vY9q5GUDfSAsfUA4Ivh8ZeAZvvfKKKse6U'
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '24f0121a052e8020b4b3c4cda13a503d';

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
    // 요청 데이터 파싱
    const { title, date, location } = JSON.parse(event.body);

    console.log('일정 저장 요청:', { title, date, location });

    // 필수 데이터 검증
    if (!title || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '제목과 날짜는 필수 항목입니다'
        })
      };
    }

    // 노션에 새 페이지 생성
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID
      },
      properties: {
        '제목': {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        },
        '날짜': {
          date: {
            start: date
          }
        },
        '장소': {
          rich_text: [
            {
              text: {
                content: location || ''
              }
            }
          ]
        }
      }
    });

    console.log('노션 페이지 생성 성공:', response.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '일정이 성공적으로 저장되었습니다',
        pageId: response.id
      })
    };

  } catch (error) {
    console.error('노션 API 오류:', error);
    
    // 상세한 오류 정보 반환
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.code === 'object_not_found') {
      errorMessage = '노션 데이터베이스를 찾을 수 없습니다. Integration이 연결되어 있는지 확인하세요.';
      statusCode = 404;
    } else if (error.code === 'unauthorized') {
      errorMessage = '노션 API 토큰이 유효하지 않거나 권한이 없습니다.';
      statusCode = 401;
    } else if (error.code === 'validation_error') {
      errorMessage = '데이터베이스 속성이 올바르지 않습니다. 컬럼명을 확인하세요.';
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
