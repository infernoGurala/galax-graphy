export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
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
