const ORIGIN = "https://rubixnet--music-streamer-web-app.modal.run";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "Content-Length,Content-Range,Accept-Ranges,Content-Type",
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const incoming = new URL(request.url);
    const origin = (env && env.ORIGIN) || ORIGIN;
    const target = origin.replace(/\/$/, "") + incoming.pathname + incoming.search;
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("x-forwarded-for");

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      redirect: "follow",
    });

    const out = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders())) {
      out.set(k, v);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: out,
    });
  },
};
