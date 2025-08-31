/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // 从路径中提取目标 URL，例如 /https://example.com/file.jpg -> https://example.com/file.jpg
    const targetUrl = url.pathname.substring(1) + url.search;

    // 验证是否是一个有效的 URL
    if (!isValidHttpUrl(targetUrl)) {
      return new Response('Invalid URL provided. Please provide a full URL like /https://example.com/image.jpg', { status: 400 });
    }

    // 创建一个新的请求头，可以把原始请求的一些头信息复制过去
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Origin', new URL(targetUrl).origin);
    newHeaders.set('Referer', new URL(targetUrl).origin);
    
    // 向目标 URL 发起请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow',
    });

    // 返回从目标服务器获取的响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}