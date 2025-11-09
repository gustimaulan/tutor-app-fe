// /Users/gdhia/Desktop/GmdhiaRepos/ss-crud/frontend/functions/api/[[path]].js

export async function onRequest(context) {
  // Ambil URL backend dari environment variable di Cloudflare Pages.
  const backendUrl = context.env.VITE_API_URL;

  // Jika VITE_API_URL tidak diset di production, kembalikan error agar mudah di-debug.
  if (!backendUrl) {
    return new Response('Backend API URL not configured in Cloudflare Pages environment.', { status: 500 });
  }

  // Ambil URL request yang masuk
  const url = new URL(context.request.url);

  // Buat URL baru yang menunjuk ke backend Anda
  // Ini akan mengganti 'https://frontend.com/api/v1/students'
  // menjadi 'https://backend.com/api/v1/students'
  const backendApiUrl = `${backendUrl}${url.pathname}${url.search}`;

  // Buat request baru ke backend dengan mempertahankan metode, headers, dan body
  const newRequest = new Request(backendApiUrl, context.request);

  // Lakukan fetch ke backend dan kembalikan responsnya langsung ke client
  return fetch(newRequest);
}
