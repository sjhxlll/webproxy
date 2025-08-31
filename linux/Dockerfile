# ---- Stage 1: The Builder ----
# 使用官方的 Go 语言镜像作为编译环境
FROM golang:1.22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 go.mod 文件并下载依赖
# 这样可以利用 Docker 的层缓存机制，只有在依赖变化时才重新下载
COPY go.mod ./
RUN go mod tidy

# 复制所有源代码
COPY . .

# 编译 Go 应用
# CGO_ENABLED=0: 禁用 CGO，以便生成静态链接的可执行文件
# GOOS=linux: 指定目标操作系统为 Linux
# -a: 强制重新构建
# -o /webproxy: 指定输出文件名为 /webproxy
RUN CGO_ENABLED=0 GOOS=linux go build -a -o /webproxy .

# ---- Stage 2: The Final Image ----
# 使用一个极简的基础镜像 scratch，它几乎是空的
FROM scratch

# 从 builder 阶段复制编译好的可执行文件
COPY --from=builder /webproxy /webproxy

# 暴露程序监听的端口
EXPOSE 8080

# 设置容器启动时要执行的命令
ENTRYPOINT ["/webproxy"]
