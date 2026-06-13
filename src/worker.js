export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve dynamic environment variables
    if (url.pathname === '/env.js') {
      const config = `window.__ENV__ = {
  VITE_APP_PASSWORD: ${JSON.stringify(env.VITE_APP_PASSWORD || '')},
  VITE_SUPABASE_URL: ${JSON.stringify(env.VITE_SUPABASE_URL || '')},
  VITE_SUPABASE_ANON_KEY: ${JSON.stringify(env.VITE_SUPABASE_ANON_KEY || '')}
};`;
      return new Response(config, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store'
        }
      });
    }
    
    // Attempt to serve requests from the static assets
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
    } catch (e) {
      // Ignore errors and fall back to index.html
    }
    
    // SPA fallback: serve index.html for client-side routing
    const indexRequest = new Request(`${url.origin}/index.html`, request);
    return env.ASSETS.fetch(indexRequest);
  }
};
