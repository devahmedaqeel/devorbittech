'use strict';

const chatbotHandler = require('../../api/chatbot');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  let statusCode = 200;
  const headers = { ...CORS };
  let responseBody = '';

  let parsedBody = {};
  if (event.body) {
    try {
      parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }
  }

  const eventHeaders = event.headers || {};
  const clientIp = eventHeaders['client-ip'] || eventHeaders['x-forwarded-for'] || '127.0.0.1';

  const req = {
    method: event.httpMethod,
    headers: eventHeaders,
    body: parsedBody,
    socket: { remoteAddress: clientIp }
  };

  const res = {
    setHeader: (name, val) => { headers[name] = val; return res; },
    status: (code) => { statusCode = code; return res; },
    json: (data) => {
      headers['Content-Type'] = 'application/json';
      responseBody = JSON.stringify(data);
      return res;
    },
    end: (str) => {
      if (str) responseBody = str;
      return res;
    }
  };

  try {
    await chatbotHandler(req, res);
    return {
      statusCode,
      headers,
      body: responseBody
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
