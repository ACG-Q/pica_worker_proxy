
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api')) {
      return new Response(htmlHelpPage(url), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const path = url.pathname.replace(/^\/api/, '');
    const targetUrl = `https://picaapi.picacomic.com${path}${url.search}`;

    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow'
    });

    const response = await fetch(proxyReq);
    const res = new Response(response.body, response);
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };
}

function htmlHelpPage(url) {
  const base = `${url.origin}/api`;
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>Pica Comic 透明代理</title>
  <style>
    body { font-family: sans-serif; padding: 2em; max-width: 700px; margin: auto; line-height: 1.7; }
    code, input { background: #f4f4f4; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; }
    .box { display: flex; gap: 0.5em; margin-top: 0.5em; }
    button { padding: 6px 12px; cursor: pointer; border: none; border-radius: 6px; background: #007bff; color: white; }
    button:hover { background: #0056b3; }
    h1 { font-size: 1.5em; }
  </style>
</head>
<body>
  <h1>📘 Pica Comic 透明代理服务</h1>
  <p>你已成功部署漫画 API 代理。</p>

  <h2>✅ 使用说明</h2>
  <p>将原始地址：</p>
  <pre><code>https://picaapi.picacomic.com</code></pre>
  <p>替换为你的代理地址：</p>
  <div class="box">
    <input type="text" id="apiUrl" value="${base}" readonly style="flex:1;" />
    <button onclick="copy()">复制</button>
  </div>

  <h2>📦 Venera 插件说明</h2>
  <p>如果你是 <b>Venera</b> 用户，使用 <code>picacg.js</code> 漫画源，只需在设置中填入上方地址即可。</p>

  <script>
    function copy() {
      const input = document.getElementById('apiUrl');
      input.select();
      document.execCommand('copy');
      alert('已复制 API 地址：' + input.value);
    }
  </script>

  <hr />
  <footer style="font-size: 0.9em; color: gray;">
    Powered by Cloudflare Worker · 靓仔定制版 ·
    <a href="https://github.com/ACG-Q/pica_worker_proxy" target="_blank">GitHub 项目地址</a>
  </footer>
</body>
</html>
`;
}