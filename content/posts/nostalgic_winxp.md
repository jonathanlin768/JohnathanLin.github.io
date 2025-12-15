---
title: "Windows XP虚拟机中文版无需激活下载"
date: 2022-10-02T18:51:17+08:00
draft: false
categories: ["技术文章", "怀旧"]
tags: ["WinXp"]
---
# 虚拟机镜像下载地址
虚拟机镜像下载：

链接：https://pan.baidu.com/s/1yfY0SjDrtOeuTiEWf7YizA?pwd=374l

提取码：374l 

我本地的VirtualBox 版本：6.1
<!--more-->
## 使用步骤
1. 打开安装后的VirtualBox，点击``管理``->``导入虚拟电脑``
![](/images/nostalgic_winxp_vb1.png)
2. 选中下载好的虚拟机镜像，进行导入
![](/images/nostalgic_winxp_import.png)
3. 导入
![](/images/nostalgic_winxp_import2.png)
4. 查看当前虚拟机配置
![](/images/nostalgic_winxp_import3.png)

5. 继续导入
![](/images/nostalgic_winxp_importing.png)
6. 对CPU和内存做一些调整
![](/images/nostalgic_winxp_import_cpu.png)
这里记得要关闭``启用PAE/NX``
![](/images/nostalgic_winxp_import_mem.png)
7. 导入后，需要设置一下共享文件夹，否则会报错
![](/images/nostalgic_winxp_shared_dir.png)
8. 启动
![](/images/nostalgic_winxp_start.png)

> (2025-12-15更新)不知道是否是因为换了AMD CPU，这次导入之后，启动这个虚拟机镜像特别卡。有幸再次见到这个手电筒。![](/images/nostalgic_winxp_2025.png)

# 其他的方式总结
## 其他的方式：安装正版，但正版只有30天试用
1. 安装VirtualBox；
2. 下载镜像：从[MSDN Itellyou](https://msdn.itellyou.cn/)中找到Windows XP的镜像，下载；
3. 在VirtualBox中安装镜像;
4. 启动镜像，安装系统

那么你会发现，安装的Windows XP只有30天试用。在二十一世纪初期，盗版泛滥，微软采取了非常强硬的措施限制盗版。即使你安装时输入了正确的序列号，微软也会要求你使用电话等方式进行激活。

## 其他的方式：下载网上已处理过的镜像
不能再使用这种正版的镜像了，需要使用别人处理好的，不需要激活的镜像。

这里我找到了github上的一位老哥提供的链接[github WinXPImage](https://github.com/lucianoferrari/winxpimage)，但是他的镜像是位于谷歌云盘上的。我把它下载之后放进百度网盘里了：

链接：https://pan.baidu.com/s/1ypKeaZixJXnbqAo4ZT0YLQ?pwd=30dd 
提取码：30dd 

在VirtualBox安装此镜像后，你将获得一个无限期使用的，**英文版**的Windows XP。

但你不一定能启动起来，你需要在导入OVA文件后，在OVA文件的目录下，执行以下命令：
``` cmd
vbox-img geometry --filename Windows_XP_Professional-disk1.vdi --format VDI --cylinders 5874 --heads 255 --sectors 56
```
来自于[github issue](https://github.com/lucianoferrari/winxpimage/issues/1) streeg 老哥给出的解决方案。

# 如何汉化Windows XP？
如果只是用英文版Windows XP，那么就达不到我们“怀旧”的目的了。
Windows XP英文版默认没有中文语言包。
我翻遍互联网，终于在一个[犄角旮旯](https://files.dog/MSDN/Windows%20XP/)里找到了语言包mui_win_xp_pro_n_cd1.iso。

我把它下载之后放进百度网盘里了：

链接：https://pan.baidu.com/s/18mW9OCRejMDoEpUcih-zlA?pwd=peu4 
提取码：peu4 

然后,
1. 设置VirtualBox里Windows XP虚拟机和物理机共享文件夹，[具体方法](https://www.jianshu.com/p/060103d48244)
2. 将mui_win_xp_pro_n_cd1.iso通过共享文件夹从物理机传进虚拟机中
3. 安装，[具体方法](https://www.docin.com/p-2998336055.html)

最后重启虚拟机即可。

上图!
![](/images/nostalgic_xp.png)
