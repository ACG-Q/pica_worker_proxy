
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/p=')) {
      return await handleFileServerProxy(request, url);
    }
    if (!url.pathname.startsWith('/api')) {
      return handleHelpPage(url);
    }
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    return await handleApiProxy(request, url);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };
}

function handleHelpPage(url) {
  return new Response(htmlHelpPage(url), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function handleOptions() {
  return new Response(null, { headers: corsHeaders() });
}

async function handleFileServerProxy(request, url) {
  const realUrl = decodeURIComponent(url.pathname.slice(3)) + url.search;
  const proxyReq = new Request(realUrl, {
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

async function handleApiProxy(request, url) {
  const path = url.pathname.replace(/^\/api/, '');
  const targetUrl = `https://picaapi.picacomic.com${path}${url.search}`;
  const proxyReq = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow'
  });
  const response = await fetch(proxyReq);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    let data = await response.text();
    try {
      let json = JSON.parse(data);
      patchFileServer(json, url.origin);
      data = JSON.stringify(json);
    } catch (e) {
      // 非法 JSON，原样返回
    }
    const res = new Response(data, response);
    res.headers.set('content-type', 'application/json; charset=utf-8');
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } else {
    const res = new Response(response.body, response);
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

function patchFileServer(obj, origin) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      patchFileServer(obj[i], origin);
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key === 'fileServer' && typeof obj[key] === 'string') {
        obj[key] = `${origin}/p=${encodeURIComponent(obj[key])}`;
      } else {
        patchFileServer(obj[key], origin);
      }
    }
  }
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