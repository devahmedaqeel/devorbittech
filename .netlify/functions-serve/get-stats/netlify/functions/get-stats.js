"use strict";

// netlify/functions/get-stats.js
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204 };
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ count: null })
  };
};
//# sourceMappingURL=get-stats.js.map
