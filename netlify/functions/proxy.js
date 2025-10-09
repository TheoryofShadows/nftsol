// Netlify Function to proxy API requests to your backend
// This allows you to keep your backend separate while serving the frontend from Netlify

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'https://your-backend-domain.com';
    const apiPath = event.path.replace('/api/', '');
    const targetUrl = `${backendUrl}/api/${apiPath}`;

    // Prepare request options
    const requestOptions = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NFTSol-Netlify-Proxy',
      },
    };

    // Add body for POST/PUT requests
    if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
      requestOptions.body = event.body;
    }

    // Add query parameters
    if (event.queryStringParameters) {
      const queryString = new URLSearchParams(event.queryStringParameters).toString();
      if (queryString) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl += `${separator}${queryString}`;
      }
    }

    // Make request to backend
    const response = await fetch(targetUrl, requestOptions);
    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
