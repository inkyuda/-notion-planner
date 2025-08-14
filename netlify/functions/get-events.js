// netlify/functions/get-events.js
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

  // GET 요청만 허용
  if (event.httpMethod !== 'GET') {
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
    console.log('노션 데이터베이스 조회 시작...');
    console.log('Database ID:', DATABASE_ID);

    // 노션 데이터베이스 쿼리
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
      sorts: [
        {
          property: '날짜',
          direction: 'ascending'
        }
      ]
    });

    console.log('노션 응답 받음:', response.results.length, '개 항목');

    // 데이터 변환
    const events = response.results.map(page => {
      const properties = page.properties;
      
      // 디버깅을 위한 속성 키 출력
      console.log('페이지 속성 키들:', Object.keys(properties));
      
      const event = {
        id: page.id,
        title: '',
        date: '',
        location: ''
      };

      // 제목 추출 (여러 가능한 속성명 시도)
      if (properties['제목']?.title?.[0]?.text?.content) {
        event.title = properties['제목'].title[0].text.content;
      } else if (properties.title?.title?.[0]?.text?.content) {
        event.title = properties.title.title[0].text.content;
      } else if (properties.Name?.title?.[0]?.text?.content) {
        event.title = properties.Name.title[0].text.content;
      } else {
        event.title = '제목 없음';
      }

      // 날짜 추출
      if (properties['날짜']?.date?.start) {
        event.date = properties['날짜'].date.start;
      } else if (properties.Date?.date?.start) {
        event.date = properties.Date.date.start;
      }

      // 장소 추출
      if (properties['장소']?.rich_text?.[0]?.text?.content) {
        event.location = properties['장소'].rich_text[0].text.content;
      } else if (properties.Location?.rich_text?.[0]?.text?.content) {
        event.location = properties.Location.rich_text[0].text.content;
      }

      console.log('변환된 이벤트:', event);
      return event;
    });

    console.log('총 변환된 이벤트 수:', events.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        events: events,
        count: events.length
      })
    };

  } catch (error) {
    console.error('노션 API 오류:', error);
    
    // 상세한 오류 정보 반환
    let errorMessage = error.message;
    if (error.code === 'object_not_found') {
      errorMessage = '노션 데이터베이스를 찾을 수 없습니다. Integration이 연결되어 있는지 확인하세요.';
    } else if (error.code === 'unauthorized') {
      errorMessage = '노션 API 토큰이 유효하지 않거나 권한이 없습니다.';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
