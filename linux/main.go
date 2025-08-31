package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

// handleProxyRequest 是处理所有传入请求的核心函数
func handleProxyRequest(w http.ResponseWriter, r *http.Request) {
	// 从请求路径中提取目标 URL
	// 例如: /https://example.com/some/path -> https://example.com/some/path
	targetURLString := strings.TrimPrefix(r.URL.Path, "/")
	if r.URL.RawQuery != "" {
		targetURLString += "?" + r.URL.RawQuery
	}

	// 修复由于浏览器路径规范化（例如 https:// -> https:/）而丢失的斜杠
	// 这是解决 "http: no Host in request URL" 错误的关键
	if strings.HasPrefix(targetURLString, "http:/") && !strings.HasPrefix(targetURLString, "http://") {
		targetURLString = "http://" + strings.TrimPrefix(targetURLString, "http:/")
	} else if strings.HasPrefix(targetURLString, "https:/") && !strings.HasPrefix(targetURLString, "https://") {
		targetURLString = "https://" + strings.TrimPrefix(targetURLString, "https:/")
	}

	// 验证 URL 是否有效
	targetURL, err := url.Parse(targetURLString)
	if err != nil || (targetURL.Scheme != "http" && targetURL.Scheme != "https") {
		log.Printf("Invalid URL received: %s", targetURLString)
		http.Error(w, "无效的URL。请提供一个完整的URL，例如 /https://example.com/image.jpg", http.StatusBadRequest)
		return
	}

	log.Printf("Proxying request to: %s", targetURL.String())

	// 创建一个新的请求，指向目标 URL
	proxyReq, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
	if err != nil {
		log.Printf("Error creating proxy request: %v", err)
		http.Error(w, "创建代理请求失败", http.StatusInternalServerError)
		return
	}

	// 复制原始请求的头信息到新请求中
	proxyReq.Header = r.Header.Clone()

	// 特别设置 Host, Origin 和 Referer 头，模拟浏览器行为
	proxyReq.Host = targetURL.Host
	proxyReq.Header.Set("Origin", targetURL.Scheme+"://"+targetURL.Host)
	proxyReq.Header.Set("Referer", targetURL.Scheme+"://"+targetURL.Host)

	// 发起代理请求
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		log.Printf("Error sending proxy request: %v", err)
		http.Error(w, "代理请求失败", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 复制目标服务器响应的头信息到我们自己的响应中
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// 写入响应状态码
	w.WriteHeader(resp.StatusCode)

	// 将目标服务器的响应体直接流式传输给客户端
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("Error copying response body: %v", err)
	}
}

func main() {
	// 监听 8080 端口
	port := "8080"
	log.Printf("Web proxy is starting on port %s...", port)
	http.HandleFunc("/", handleProxyRequest)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}

