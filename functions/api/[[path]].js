// /Users/gdhia/Desktop/GmdhiaRepos/ss-crud/frontend/functions/api/[[path]].js

export async function onRequest(context) {
  // Alamat backend production Anda
  // Sebaiknya gunakan Environment Variable di Cloudflare Pages
  const backendUrl = context.env.VITE_API_URL;

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
