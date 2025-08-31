# ** webproxy**

简单的网页、文件下载代理

ps：page未完成

## 使用方法

基本算是通用的

ex：



```
#nodejs安装包
https://nodejs.org/dist/v22.19.0/node-v22.19.0-x64.msi
https:/xxxxxxx.com/https://nodejs.org/dist/v22.19.0/node-v22.19.0-x64.msi
```



## 部署

## docker

```bash

#拉取镜像
docker pull sjhxlll/webproxy:latest

docker run -d --restart always -p 8080:5000 --name webproxy sjhxlll/webproxy:latest
```





编译（使用docker）

1.**准备环境**:

- 安装docker。
- 找一个空文件夹。
- 把linux的三个文件 (`main.go`, `go.mod`, `Dockerfile`) 保存到这个文件夹里。

2.**使用 Docker 编译**: 打开你的终端，进入刚刚创建的文件夹，然后运行下面的命令来构建一个临时的 Docker 镜像：

```bash
docker build -t go-proxy-builder .
```

3.**提取可执行文件**: 现在，使用Docker 命令，把编译好的 `webproxy` 文件从镜像里“抓”出来：

Bash

```
# 创建一个临时容器
docker create --name temp-builder go-proxy-builder

# 从容器里复制文件到当前目录
docker cp temp-builder:/webproxy .

# 删除临时容器，保持整洁
docker rm temp-builder
```

4.**运行和测试**:

- 为了能运行它，先给它加上执行权限：

  Bash

  ```bash
  chmod +x ./webproxy
  
  ./webproxy
  ```