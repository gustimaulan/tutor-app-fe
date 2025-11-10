/**
 * Cloudflare Pages Function proxy for forwarding frontend /api/* requests
 * to the backend origin. This keeps the browser on the same origin while
 * the edge function performs the cross-origin fetch.
 *
 * Configure the backend origin via Pages environment variable:
 * - BACKEND_URL: e.g. https://tutor-app-api.sigmath.net
 *
 * Local development defaults to http://localhost:8787
 * so axios baseURL '/api/v1' -> http://localhost:8787/api/v1
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight quickly if ever triggered
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const incomingUrl = new URL(request.url);

  // Choose upstream origin: prefer env, fallback to local
  const upstreamOrigin =
    env.BACKEND_URL ||
    env.API_BASE_URL ||
    'http://localhost:8787';

  // Build target URL by preserving the entire path and query
  // Example:
  //   incoming: https://pages.site/api/v1/auth/login?x=1
  //   upstreamOrigin: https://tutor-app-api.sigmath.net
  //   target:  https://tutor-app-api.sigmath.net/api/v1/auth/login?x=1
  const targetUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    upstreamOrigin
  );

  // Prepare request init: forward method, headers, and body
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('x-forwarded-proto');
  headers.delete('x-forwarded-host');

  // Only pass body for methods that can have one
  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const init = {
    method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
  };

  const upstreamResponse = await fetch(targetUrl, init);

  // Copy response headers and adjust where appropriate
  const respHeaders = new Headers(upstreamResponse.headers);
  // Let Cloudflare handle compression
  respHeaders.delete('content-encoding');
  respHeaders.delete('transfer-encoding');

  // Same-origin to the browser, but keep permissive CORS in case
  // assets or iframes hit this route in different contexts.
  const cors = corsHeaders(request);
  respHeaders.set('Access-Control-Allow-Origin', cors.get('Access-Control-Allow-Origin'));
  respHeaders.set('Access-Control-Allow-Credentials', cors.get('Access-Control-Allow-Credentials'));
  respHeaders.set('Access-Control-Expose-Headers', cors.get('Access-Control-Expose-Headers'));

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: respHeaders,
  });
}

/**
 * Minimal CORS headers helper.
 * Although browser calls hit the same origin (/api/*),
 * adding these headers avoids surprises for non-browser clients.
 */
function corsHeaders(request) {
  const origin = new URL(request.url).origin;
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', origin);
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  h.set('Access-Control-Expose-Headers', '*');
  return h;
}
