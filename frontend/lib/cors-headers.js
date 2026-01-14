// CORS headers helper for API routes
export function getCorsHeaders(methods = 'GET, POST, PUT, DELETE, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

