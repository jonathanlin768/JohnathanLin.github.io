---
title: "Linux家用服务器维护指南"
date: 2025-12-06T22:40:14+08:00
draft: false
categories: ["技术文章","DIY折腾"]
---

> 2025年，对绝大部分普通人来说，真的没必要折腾家用服务器。除了安装好的那一刻感到的快乐之外，剩下的就只有吃灰和浪费电而已。
> 但是这却是一次难得的和Linux亲密接触的机会。如果你感兴趣，那么玩玩也不错。

# 标题中“家用服务器”指的是什么
本文中探讨的家用服务器，指的是购买的小型主机设备（Intel NUC系列等），自己安装操作系统进行使用的服务器。不包括群晖等成品NAS设备。

用户购买小型服务器，在上面安装Linux系统，然后自己安装各类服务，自己管理端口，内存，磁盘，自己进行运维。

一般人的家用服务器无非用来做两件事：
- 照片存储
- 下载4K超高清无删减电影

程序员可能会多做几件事：
- 部署自己的git私有仓库
- 定时任务执行自定义脚本
- 在线电子书（有些技术类电子书真的只有影印版pdf，临时想看还要下载，很麻烦）

极客玩家可能会多做几件事：
- 部署游戏服务器私服（幻兽帕鲁等）

养宠物的朋友可能会多做几件事：
- 将家用摄像头的录像上传到自己的服务器永久保存

# 以下是各种建议
## 建议一：一定要用Docker进行部署
既然选择了自己维护，那么你大概率下载到的都是开源的软件。而这些软件的开发人员的想法是不一样的。

有的程序员喜欢通过全局变量的方式控制软件，有的程序员只建议用特定的方式启动软件等等。

而且安装的方式也不一定是规范的。比如有的软件允许你用root安装，在没有经验的时候你可能会这么做，而有的软件在文档里强烈建议你为它的软件建立一个用户组和用户。你可能这个软件跟着文档安装在了/usr/local里，但是下一个软件可能放在/home/用户 下。而这会让未来的你一头雾水，毕竟这台服务器一般不会连上去使用。

而docker提供了一种更优雅的方案，每个软件都运行在自己的容器中，容器里有自己独立的变量和目录。然后你可以在docker-compose.yml中指定容器内端口对应的服务器端口，容器内目录对应的服务器目录等。另外，如果你运行的软件都需要用数据库，那么你可以用容器安装一个数据库，比如MySQL8，然后定义一个数据库的容器network。其他软件的容器可以访问这个network。

比如，我的gitea的docker-compose.yml内容如下：
```
services:
  gitea:
    image: docker.gitea.com/gitea:1.24.0
    container_name: gitea
    restart: always
    ports:
      - "13300:3000"
      - "13022:22"
    volumes:
      - /data/gitea/data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro

    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=mysql
      - GITEA__database__HOST=mysql8
      - GITEA__database__PASSWD=gitea123
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea

    networks:
      - mysql8_database_network

networks:
  mysql8_database_network:
    external: true
```
而我的MySQL8容器的docker-compose.yml内容如下：
```
services:
  mysql8:
    image: mysql:8.0
    container_name: mysql8
    environment:
      MYSQL_ROOT_PASSWORD: 123456 # 替换为您的root密码
    ports:
      - "53306:3306" # 将宿主机的3306端口映射到容器的3306端口
    volumes:
      - /data/mysql8/data:/var/lib/mysql # 这是关键：手动设置数据卷存储位置
    command: --lower_case_table_names=1 --default-authentication-plugin=mysql_native_password # 添加此行
    restart: always # 容器退出时总是重启
    networks:
      - database_network

networks:
  database_network:
    driver: bridge
```
此时，gitea是可以访问得到MySQL8容器中的MySQL软件的。

另外，容器可以定义开机自动启动，异常关闭重启等一些行为。

如果不想要了，可以直接执行rm命令删除容器，然后根据docker-compose.yml文件中设置的目录，对服务器的目录进行删除，这样就删除得非常干净。

相比起systemctl直接嵌入系统，出现一些莫名的异常情况，并且日志也不一定能很清晰地打印出来排查来看，Docker容器能够很清晰地一眼看到你在本服使用的软件。

只用一个非root用户，然后在~下，按软件分别存放docker-compose.yml
我目前是在~下，创建了一个docker-compose的目录，然后里面放置各种以软件名为目录名的目录，每个目录只有一个文件：docker-compose.yml。

这样一来，我想启动某个软件，只需要进入对应的软件目录，执行docker compose up -d 即可启动

## 建议二：人为定义好软件服务id，端口号区间等一些自己的服务器规则
我给自己的服务器中的各种软件都人为定义了服务id，从11开始。然后对于他们的端口，则以 服务id + 端口号后三位，组合成一个新的端口号，比如1panel默认的端口是8080，而且其服务id是11，则组合起来，开头是11，末尾取8080的末尾三位080，即可组合成端口号11080。

## 建议三：记录好你的操作日志
好记性不如烂笔头。

家用服务器一般不会经常登录。当我们配置完想要用的功能之后，一般是不会经常通过ssh登录上去看服务器状态。直到某个服务不太正常的时候，我们才会排查具体的问题。

时间久了，我们会遗忘到底这台服务器之前是如何配置的。诚然有了Docker，你可以通过翻阅docker-compose.yml去查看每个容器中的软件配置，但我更建议你将每一次对服务区的操作，都记录在自己的笔记中。

格式如下:
```
## 日期 时间
- 执行了A操作
- 执行了B操作
....
```

例如：
```
## 0615 14:00
- 配置了2T固态，挂在到 /data 下
- 所有安装行为 都使用 lin 用户
- 安装了docker和docker compose 
- 把用户lin加入 docker 用户组，例如 sudo usermod -aG docker lin
- 给NUC固定ip 10.0.0.193 （在openwrt 网络 DHCP/DNS 静态地址分配 添加 填写后 保存 然后下面还有一个保存并应用）
```

就像那些发布后的软件更新log记录一样，我非常建议你将每一次对家用服务器的操作进行简单的记录。这会在未来排查问题时，让你回忆起来时的路。

附:我的操作记录在文章末尾（部分数据已脱敏）

## 建议四：不要穿透到外网，真的没必要
当你部署好了所有软件，拥有了想要的功能，你很快就会在某一天，不在家的时候，突然想看一下家里的猫咪之前的视频；在别人家想装个杯，让别人看你自己配置的4K高清电影；或者是突然想改一下家里自己私有git上的项目代码；在外头想看一下家里的calibre-web上的某一本书的内容。

我必须要明确告知的是，这些都是伪需求。因为他们并不是刚需，并且有很多成熟的方案可以解决。

- 一般TP-Link的摄像头都默认会保存最近一小段时间的视频回看。你一般不会看超过3天前的摄像头录像。而且你回家就能看到了
- 看电影这个事，真要看的朋友会打开电影天堂，富哥会开会员，真没必要通过穿透看你卡得半死的4K电影
- 如果你真的想改代码，那更好的方案是上传github private，这个服务目前早已免费。如果你的项目是git lfs存储，那你拉代码都要拉半天，不如回家操作
- 至于看书，如果是影印版pdf，你可以在百度网盘里备上一份副本。如果是equb，你可以直接传到微信读书去。

而如果真的要穿透到外网，你还需要购买一台海外云服务器，配置frp。但是如果你的服务需要https（比如gitea这样的，它强烈要求你用https），即使你有域名，你也还是要折腾一遍Let's encrypt的签名证书。即使你外网能用https访问，内网也还是需要再手动上传一遍签名证书，不然你内网访问还要绕一圈云服务器。（悲

综上，家用服务器就让它安静的躺在家里运行就行了。在外面就好好享受外面的户外活动，开心去玩。
## 建议五：不管怎么折腾，不要影响你老婆看爱奇艺
这条建议不只是家用服务器相关。程序员总有一些特殊的需要，这里不展开讲。关于那些特殊的网络配置，有时是很不稳定的。为了家庭和睦，我希望你有应急预案，让家里网络断了的时候，能有方案让你老婆继续看爱奇艺。目前的光猫上有默认的wifi，我建议你长期将其开启，这样当家人说网络不好的时候，你可以让他们先用光猫自带的wifi先过渡一下。

这里需要提到的是，我不建议给路由器刷openwrt。openwrt上如果运行过多的服务，也会加速路由器的老化。当我在家用服务器上开qbittorrent下载和上传电影后，路由器越来越卡，经常出现莫名其妙的断网。当然这也与路由器用了三年有关系。

最稳妥的方式还是买一台性能更强的r4s作为主路由，安装openwrt，利用其强大的cpu进行一些特殊的服务，然后路由器就认真做路由器。

## 建议六：享受你的周末，不要为了部署而部署
如果你是自己买服务器，自己装Linux系统，自己在上面安装软件的玩家，你一定不要忘记，你的周末，应该是周末。

你大概率不是公司里的运维，你可能是一个开发人员，懂一些Linux命令，会看日志，会启动Docker，会希望拥有自己私有的服务器。

但是运维是一件很苦杯的事情，你的服务器性能也不一定能满足得了你的真实需求。又或者你的服务器性能过剩而让你感到浪费。这都是非常可能的。

在做好了前五条建议的内容之后，我相信你也会有自己喜欢的家用服务器，你会提前一周找好美国好莱坞大片的种子，一周后在家里的电视里观看，还能看国内删减的内容；你会偶尔去剪出猫咪打量摄像头的可爱视频然后发到抖音；你会在服务器上翻看以前的老照片，本地存储会给你一种安全感。

但是，请你享受你的周末，没有这台服务器，你的生活还会继续。去散步，去打球，去看电影，去陪伴那些爱你的人。他们并不希望你周末对着黑框框挠头，像上班一样。

# 附：我的操作记录

# NUC环境更新计划
为了让NUC能重新启用，并且服务于我的个人生活，我希望能榨干NUC的性能，并且将所有私人服务都有序部署到上面去。因此决定重新整理NUC的配置、用途、和扩展性。

本文将对NUC的用途进行分析，根据用途来选择操作系统及安装的底层软件，并提供有限的扩展性和优雅的管理方式。


# NUC配置信息
CPU：i5-1240p
内存：16G
硬盘：512G + 2T

# NUC需求
- NextCloud 开源私有云存储和协作平台
- Gitea 代码仓库
- Calibre-Web 电子书
- jellyfin + qbittorrent 4k电影

# 底层框架
- 操作系统：Ubuntu Server 24.04
- 数据库：四家数据库我都要，MySQL8.0，PostgreSql 17.4（前期docker其他功能先用mysql，postgresql后续装），Redis 8.0，ELK套装（查日志，前期可不部署）
- 管理面板：1panel
- frp内网穿透
- kvm和Windows虚拟机（后续开Steam游戏使用，前期可不部署）

# Docker配置
需要先定义一个Docker里的外部网络，把几个数据库都包进去。然后那些框架也要读取这个网络。

需要记录每个服务的端口，数据库类型，数据库名称。

# Ubuntu用户账号和密码
- root 123456
- lin 123456

# 端口号管理
上层应用（前两位为服务id，后面为自己需要的端口，比如80,443）
|服务id|服务名|端口号|外网地址|数据挂载目录|数据库信息|其他信息|
|:-----|:----|:----|:---|:----------|:----|:---|
|11|1panel|11080|1panel.windypath.com|1panel默认|http://10.0.0.193:11080/1a4e4fa3db 面板用户:  60173cd028  面板密码:  123456 |
|12|nextcloud|12080|nextcloud.windypath.com|/data/nextcloud/html/|MySQL8,账号nextcloud,密码:123456,数据库nextcloud|管理员账号:admin,密码:123456|
|13|gitea|13300,13022|gitea.windypath.com|/data/gitea/data|MySQL8,账号gitea,密码:gitea123,数据库gitea|管理员账号 JonathanLin,密码:123456|
|14|frpc|7000,7400|无|默认（frpc 1panel内安装）|默认|管理员账号 admin,密码:123456,token:A_123456|
|15|calibre|15083|calibre.windypath.com|/data/calibre-web/|无（他自己带SQLite）|账号:admin, 密码:123456|
|16|qbittorrent|16080,16681|无|/data/qbittorrent/appdata,/data/qbittorrent/downloads|无|账号:admin, 密码:123456|
|17|jellyfin|17096,17920,17359,17900|无|/data/jellyfin/library,TV目录:/data/qbittorrent/downloads/tvseries,电影目录:/data/qbittorrent/downloads/movie，字体目录:/data/jellyfin/fonts|无（他自己自带）|账号:admin,密码:123456|

# 底层服务 （端口号以5开头，后四位为服务自己本身的端口号）
|服务名|端口号|数据挂载目录|其他信息|
|:-----|:----|:----|:---|
|Mysql8|53306|/data/mysql8/data|docker配置网络database_network|

# 云服务器服务
雨云，公网ip 123.456.789.000
|服务id|服务名|端口号|外网地址|数据挂载目录|数据库信息|其他信息|
|:-----|:----|:----|:---|:----------|:----|:---|
||frps|监听客户端连接:7000,仪表盘:7500,接收公网http/https:80,443|123.456.789.000:7500|||账号:admin,密码:123456,token:A_123456|

# 更新日志
## 0615 12:00 
- 安装Ubuntu Server 24.04.2

## 0615 14:00
- 配置了2T固态，挂在到 /data 下
- 所有安装行为 都使用 lin 用户
- 安装了docker和docker compose 
- 把用户lin加入 docker 用户组，例如 sudo usermod -aG docker lin
- 给NUC固定ip 10.0.0.193 （在openwrt 网络 DHCP/DNS 静态地址分配 添加 填写后 保存 然后下面还有一个保存并应用）

## 0615 14:10
用lin账号
- 安装了git
- 在目录下创建 ~/docker-compose目录 用来管理所有的docker-compose.yml
- 用官方脚本安装了1panel

## 0615 17:42
- 装mysql
- 装nextcloud前，在mysql中创建了一个nextcloud的库，和账号密码，执行以下命令：

```
//在创建完数据库后，执行
CREATE USER 'nextcloud'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'%';
FLUSH PRIVILEGES;
```

## 0615 21:38
- 安装docker compose然后让云服务器能正常通过1panel网站功能响应。
- 用1panel的证书设置自动申请https证书。
- 在云服务器上手动用docker安装了frps和1panel
```
云服务器创建frps容器命令
docker run --restart=always --network host -d -v /root/frps/frps.toml:/etc/frp/frps.toml --name frps snowdreamtech/frps
```
```
云服务器1panel信息
设置1Panel安装目录 (默认为/opt): 
[1Panel Log]: 您选择的安装路径是 /opt 
设置1Panel端口 (默认是 15446): 
[1Panel Log]: 您设置的端口是:  15446 
[1Panel Log]: 正在打开防火墙端口 15446 
Rules updated
Rules updated (v6)
Firewall not enabled (skipping reload)
设置1Panel安全入口 (默认是 25525dc70a): 
[1Panel Log]: 您设置的面板安全入口是 25525dc70a 
设置1Panel面板用户 (默认是 05d6fd27db): 
[1Panel Log]: 您设置的面板用户是 05d6fd27db 
[1Panel Log]: 设置1Panel面板密码，设置后按回车键继续 (默认是 2e0a296582):  
```
本地frpc配置：
```
serverAddr = "123.456.789.000"
serverPort = 7000

auth.method = "token"
auth.token = "A_123456"

webServer.addr = "0.0.0.0"
webServer.port = 7400
webServer.user = "admin"
webServer.password = "123456"
webServer.pprofEnable = false

# tls
#transport.tls.certFile = "/etc/frp/ssl/client.crt"
#transport.tls.keyFile = "/etc/frp/ssl/client.key"
#transport.tls.trustedCaFile = "/etc/frp/ssl/ca.crt"

[[proxies]]
name = "1panel"
type = "http"
localIP = "127.0.0.1"
localPort = 11080
subdomain = "1panel"
customDomains = ["1panel.windypath.com"]


[[proxies]]
name = "nextcloud"
type = "http"
localIP = "127.0.0.1"
localPort = 12080
subdomain = "nextcloud"
customDomains = ["nextcloud.windypath.com"]


[[proxies]]
name = "gitea"
type = "http"
localIP = "127.0.0.1"
localPort = 13300
subdomain = "gitea"
customDomains = ["gitea.windypath.com"]

```
- nextcloud设置自己的https域名
- gitea设置自己的https域名
- 本地openclash 设置hosts 家里就不要走外网了 （更新方式：openwrt openclash 覆写设置 DNS设置 Hosts勾起来 然后写）
- 然后把云服务器上的证书下载下来，到本地的1panel里的证书功能里导入，然后本地再配一遍反向代理。我真的佛了
- 但是最后nextcloud登录的时候会有一个报错 是因为config/config.php 里没加 "overwriteprotocol": "https",
```
Refused to send form data to 'https://nextcloud.windypath.com/login' because it violates the following Content Security Policy directive: "form-action 'self' http://10.0.0.193:12080". 
```

- TODO ssh只允许内网机器往上登录，ssh指定秘钥等；端口防火墙看要不要设置一下。

## 0617 21:02
在nuc上成功安装calibre-web 的docker，但是他竟然需要一个metadata.db，需要从windows装一个calibre，然后把这个文件拷过去。

## 0617 23:00
本地安装calibre，然后把metadata.db用winscp上传到服务器后，发现权限还是不够，执行以下命令（类似）更新权限：

```
chown -R 1000:1000 /path/to/your/docker/books
chmod -R 755 /path/to/your/docker/books
```

然后在界面上就能正常读取/books目录，加载书库了。

然后去个人设置里修改语言，然后去设置里再改，支持网页上传书籍。

现在已经可以上传书籍了，我已经把藏书全部上传。

## 0617 23:38
外网1panel修改证书的域名，把calibre.windypath.com添加到那一行里面

cloudflare 解析 calibre.windypath.com 指向云服务器

本地frpc配置代理，指向calibre
```
[[proxies]]
name = "calibre"
type = "http"
localIP = "127.0.0.1"
localPort = 15083
subdomain = "calibre"
customDomains = ["calibre.windypath.com"]
```

然后在外网1panel里更新证书，重新再次申请。

下载外网1panel里的证书到本地

到本地1panel填入证书内容

然后本地1panel还要设置一下网站，反向代理到127.0.0.1:15083

至此 calibre导入及外网访问，完成！！

## 0619 0:16
装qbittorrent

安装顺利完成，但是打开是 unauthorized。 解决办法是宿主机端口要与内网机端口映射保持一致。具体原因考虑到CSRF和映射问题，内外端口必须与WEBUI_PORT一致。（来源：https://zhuanlan.zhihu.com/p/683305383）

## 0619 22:16
装jellyfin，希望能把jellyfin的媒体库 目录 指向 qbittorrent的下载目录

在/data/qbittorrent/downloads目录下创建了两个目录:tvseries和movies

```
services:
  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
    volumes:
      - /data/jellyfin/library:/config
      - /data/qbittorrent/downloads/tvseries:/data/tvshows
      - /data/qbittorrent/downloads/movies:/data/movies
    ports:
      - 17096:8096
      - 17920:8920 #optional
      - 17359:7359/udp #optional
      - 17900:1900/udp #optional
    restart: unless-stopped
```

安装完毕 能够读取到qbittorrent下载的电影。但是字幕需要处理

测试下来字幕还是自己找吧，字幕下载网站：https://assrt.net/

种子资源汇总：https://blog.csdn.net/wangxy_job/article/details/141610804

种子资源网 海盗湾 https://thepiratebay.org/description.php?id=30340380

现在字幕文件都是下载后，winscp到影片同级目录下，改得和影片文件名相同，加上.chn.xxx

## 0620 20:29
qbittorrent设置了替代速度，就是周末12:00~24:00不要下载。其余时间全速下载。

然后qbittorrent下面有个开关 可以切换下载速度限制。

## 0621 23:30
在内网1panel 计划任务 脚本库 增加了三个脚本，分别是查看当前下载任务，查看当前减速开关，修改当前减速开关状态。

## 0623 21:00
给qbittorrent增加了tracker https://trackerslist.com/#/zh
也不知道有没有变快

## 0624 20:58
准备给jellyfin装中文字体，我选了思源黑体。加了一个字体目录到docker里，然后删除容器重新装。
- /data/jellyfin/fonts:/usr/share/fonts/truetype/dejavu

docker-compose.yml修改后，只需要：

修改 docker-compose.yml 文件并保存。
在 docker-compose.yml 文件所在的目录下运行 docker compose up -d。

## 0726 21:57
将Unity项目上传到gitea失败了，原因是有大文件
> TODO：后续需要在gitea和本地都配置git lfs，支持大文件的git仓库。
这次先存到百度网盘了。
