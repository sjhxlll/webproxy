/**
 * 欢迎来到全能代理 Worker！【修正版】
 * 解决了平台路由对URL中冒号不兼容的问题。
 * by Gemini with love~
 */

// ------------------- HTML 网页界面部分 (也已更新) -------------------
const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>小宝贝的通用下载代理</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');
        body { font-family: 'Noto Sans SC', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); color: #333; }
        .container { text-align: center; background: rgba(255, 255, 255, 0.9); padding: 40px; border-radius: 20px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.18); width: 90%; max-width: 600px; }
        h1 { color: #5c67f2; margin-bottom: 25px; }
        p { color: #666; margin-bottom: 30px; }
        .input-group { display: flex; gap: 10px; }
        input[type="text"] { flex-grow: 1; padding: 15px; border-radius: 10px; border: 1px solid #ddd; font-size: 16px; outline: none; transition: all 0.3s ease; }
        input[type="text"]:focus { border-color: #5c67f2; box-shadow: 0 0 8px rgba(92, 103, 242, 0.2); }
        button { padding: 15px 25px; border: none; background-color: #5c67f2; color: white; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease; }
        button:hover { background-color: #4a54e1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>通用网络代理 ✨</h1>
        <p>在这里粘贴你想要访问或下载的完整URL，然后点击“冲鸭！”</p>
        <div class="input-group">
            <input type="text" id="urlInput" placeholder="例如: https://img.xxmoe.com/images/2025/08/16/-.jpg">
            <button onclick="proxyUrl()">冲鸭！</button>
        </div>
    </div>

    <script>
        function proxyUrl() {
            const input = document.getElementById('urlInput');
            let targetUrl = input.value.trim();

            if (!targetUrl) {
                alert('小可爱，你还没输入网址呢！');
                return;
            }
            
            // **【关键修改】** 去掉用户输入内容可能包含的 "http://" 或 "https://"
            targetUrl = targetUrl.replace(/^https?:\\/\\//, '');

            // **【关键修改】** 构建新的、平台兼容的代理URL
            const proxyRequestUrl = window.location.origin + '/proxy/' + targetUrl;
            
            window.open(proxyRequestUrl, '_blank');
        }
        
        document.getElementById('urlInput').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                proxyUrl();
            }
        });
    </script>
</body>
</html>
`;

// ------------------- Worker 核心逻辑部分 (也已更新) -------------------
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // **【核心修改】** 判断是访问主页还是代理请求
        if (url.pathname === '/') {
            // 访问根目录，显示我们的网页
            return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
        } else if (url.pathname.startsWith('/proxy/')) {
            // 识别到 /proxy/ 暗号，执行代理逻辑
            const targetPath = url.pathname.substring('/proxy/'.length);
            const targetUrl = 'https://' + targetPath + url.search; // 默认使用 https 协议

            // 验证拼接后的 URL 是否有效
            if (!isValidHttpUrl(targetUrl)) {
                return new Response('无效的目标URL哦，请检查链接是否正确。', { status: 400 });
            }

            // --- 后续的 fetch 逻辑和之前一样 ---
            const newHeaders = new Headers(request.headers);
            const targetOrigin = new URL(targetUrl).origin;
            newHeaders.set('Origin', targetOrigin);
            newHeaders.set('Referer', targetOrigin);
            newHeaders.delete('x-forwarded-proto');
            newHeaders.delete('cf-ipcountry');
            newHeaders.delete('cf-ray');
            newHeaders.delete('cf-visitor');
            newHeaders.delete('cf-connecting-ip');
            newHeaders.delete('cdn-loop');

            try {
                const response = await fetch(targetUrl, {
                    method: request.method,
                    headers: newHeaders,
                    body: request.body,
                    redirect: 'follow',
                });
                const responseHeaders = new Headers(response.headers);
                responseHeaders.set('Access-Control-Allow-Origin', '*');
                responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                });
            } catch (error) {
                return new Response('哎呀，代理请求失败了：' + error.message, { status: 500 });
            }
        }

        // 如果是其他乱七八糟的路径，也返回 404
        return new Response('页面不存在哦 (404 Not Found)', { status: 404 });
    },
};

/**
 * 验证字符串是否为有效的 http 或 https URL
 * @param {string} string
 * @returns {boolean}
 */
function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}