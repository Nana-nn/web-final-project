# 项目结构：

```
├── crawlers   #　爬虫
|  └── chinanews.js  #爬取中国新闻网
|  └── sina.js #爬取新浪新闻
|  └── sport.js #爬取网易体育
|  └── wangyi.js #爬取网易新闻
|  └── mysql.js #连接数据库并执行sql语句
├── node_modules　# npm install的包
|  └── ...　　
├── route    # 路由文件
|  └── index,js #后端路由文件
├── static　#静态文件
|  └── css
|  └── img
|  └── js
|  └── index.html
├── app.js #项目入口
├── package-lock.json
├── package.json
```

# 运行

```shell
node app
```



# 实验任务：

新闻爬虫及爬取结果的查询网站

核心需求：

1、选取3-5个代表性的新闻网站（比如新浪新闻、网易新闻等，或者某个垂直领域权威性的网站比如经济领域的雪球财经、东方财富等，或者体育领域的腾讯体育、虎扑体育等等）建立爬虫，针对不同网站的新闻页面进行分析，爬取出编码、标题、作者、时间、关键词、摘要、内容、来源等结构化信息，存储在数据库中。

2、建立网站提供对爬取内容的分项全文搜索，给出所查关键词的时间热度分析。

技术要求：

1、必须采用Node.JS实现网络爬虫

2、必须采用Node.JS实现查询网站后端，HTML+JS实现前端（尽量不要使用任何前后端框架）



##### 视频请见：[web demo(基于nodejs)_哔哩哔哩_bilibili](https://www.bilibili.com/video/bv1B34y1J7ZY?vd_source=2639eb5da06960a4a76e9d5cdbe690d7)

##### 博客请见：[(94条消息) web编程期末大作业_this is me trying的博客-CSDN博客](https://blog.csdn.net/m0_50394599/article/details/125848054)
