// netlify/functions/delete-event.js
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_bg3036951506vY9q5GUDfSAsfUA4Ivh8ZeAZvvfKKKse6U'
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { eventId } = JSON.parse(event.body);

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

    const response = await notion.pages.update({
      page_id: eventId,
      archived: true
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '일정이 성공적으로 삭제되었습니다'
      })
    };

  } catch (error) {
    console.error('삭제 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || '삭제 중 오류가 발생했습니다'
      })
    };
  }
};
