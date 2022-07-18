// 引入必须的模块
var myRequest = require('request')
var myCheerio = require('cheerio')
var myIconv = require('iconv-lite')
require('date-utils');

// 连接数据库
var mysql = require("./mysql.js");

// 定义要访问的网站
var source_name = "网易体育";
var myEncoding = "utf-8";
var seedURL = 'https://sports.163.com/allsports/';

// 定义新闻页面里具体的元素的读取方式，定义哪些url可以作为新闻页面
var seedURL_format = "$('a')";
var keywords_format = " $('meta[name=\"keywords\"]').eq(0).attr(\"content\")";
var title_format = "$('title').text()";
var date_format =  "$('#ne_wrap').eq(0).attr(\"data-publishtime\")";
var author_format = "$('.post_author').text()";
var source_format = "$('.post_author').text()";
var desc_format = "$('meta[name=\"description\"]').eq(0).attr(\"content\")";
var content_format = "$('.post_body > p').text()";
var url_reg = /\/sports\/article\/([a-zA-Z0-9]{16}).html/;
// https://www.163.com/sports/article/HCD4B1MB00058782.html
// 构造一个模仿浏览器的request
//防止网站屏蔽我们的爬虫
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}

// 定时执行
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
// rule.hour = [0, 12];
// rule.minute = 5;
rule.second = 0;
schedule.scheduleJob(rule, function() {
    seedget();
});

//request模块异步fetch url
function request(url, callback) {
    var options = {
        url: url,
        encoding: null,
        headers: headers,
        timeout: 10000 //
    }
    myRequest(options, callback)
}

function seedget(){
//读取种子页面
request(seedURL, function(err, res, body) { 
    try {
    //用iconv转换编码
    var html = myIconv.decode(body, myEncoding);
    // console.log(html);
    //准备用cheerio解析html
    var $ = myCheerio.load(html, { decodeEntities: true });
    } catch (e) { console.log('读种子页面并转码出错：' + e) };

    var seedurl_news;

    try {
        seedurl_news = eval(seedURL_format);
        // console.log(seedurl_news);
    } catch (e) { console.log('url列表所处的html块识别出错：' + e) };
  

    seedurl_news.each(function(i, e) { //遍历种子页面里所有的a链接
        var myURL = "";
        try {
            //得到具体新闻url
            var href = "";
            href = $(e).attr("href");
            if (typeof(href) == "undefined") {  return true;
            }
            if (href.toLowerCase().indexOf('http://') >= 0 || href.toLowerCase().indexOf('https://') >= 0) myURL = href; //http://开头的或者https://开头
            else if (href.startsWith('//')) myURL = 'http:' + href; ////开头的
            else myURL = seedURL.substr(0, seedURL.lastIndexOf('/') + 1) + href; //其他

        } catch (e) { console.log('识别种子页面中的新闻链接出错：' + e) }
       // 检验新闻网页url是否符合url命名格式
        if (!url_reg.test(myURL)){return; 
        }
        // 爬取新闻页面
        var news_search_sql = 'select url from fetches where url=?';
        var news_search = [myURL];
        mysql.query(news_search_sql, news_search, function(qerr, vals, fields) {
            if (vals.length > 0) {
                console.log('该新闻页面已被爬取！')
            } else {
                newsGet(myURL); //读取新闻页面
            }
        });
    });
});
}

function newsGet(myURL) { //读取新闻页面
    request(myURL, function(err, res, body) { //读取新闻页面
        try {
            var html_news = myIconv.decode(body, myEncoding); //用iconv转换编码
            //准备用cheerio解析html_news
            var $ = myCheerio.load(html_news, { decodeEntities: true });
        } catch (e) { 
            console.log('页面解析出错：' + e);
            return;
        };
        //动态执行format字符串，构建json对象准备写入文件或数据库
        var fetch = {};
        fetch.crawler_time = (new Date()).toFormat("YYYY-MM-DD HH:MM:SS.SSSS");
        fetch.url = myURL;
        fetch.source_encoding = myEncoding; //编码
        fetch.keywords="";
        fetch.title = "";
        fetch.publish_date = new Date();
        fetch.author = "";
        fetch.source = "";
        fetch.description = "";
        fetch.content = "";
        fetch.source_name = source_name;
        // 读取新闻页面中的元素并保存到fetch对象中
        // 关键字
        if (keywords_format == "") fetch.keywords = source_name; // eval(keywords_format);  //没有关键词就用sourcename
        else fetch.keywords = eval(keywords_format);
        //标题
        if (title_format == "") fetch.title = ""
        else fetch.title = eval(title_format); 
        //刊登日期 
        fetch.publish_date = eval(date_format);   
        // 内容
        fetch.content = eval(content_format);
        if( fetch.content==""){
            return;
        }

        // 获取新闻来源
        fetch.source = eval(source_format).split("：")[1]
        if (fetch.source != null){
            fetch.source = fetch.source.replace(/\s/g, "").replace("作者","").replace("责任编辑","")
        } 
            
         // 作者
         if (author_format == "") fetch.author = source_name; //eval(author_format);  //作者
         else {
            fetch.author = eval(author_format).split("：")[2]
            if (fetch.author != null){
                fetch.author = fetch.author.replace(/\s/g, "").replace("作者","").replace("责任编辑","")
            } 
         }

        // 新闻摘要
        fetch.description =  eval(desc_format);
        if (fetch.description == "") {
            fetch.description = eval("$('meta[property=\"og:description\"]').eq(0).attr(\"content\")").replace(/[\r\n\s]/g, "");
        } 
        if(fetch.description!="" && fetch.keywords!="" && fetch.publish_date!="" && fetch.author!="" && fetch.source!="" && fetch.title!=""&& fetch.content!="" && fetch.publish_date!=""){
        // 写入数据库
        var fetchAddSql = 'INSERT INTO fetches(url,source,source_encoding,source_name,title,' +
            'keywords,author,publish_date,crawler_time,content,description) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
        var fetchAddSql_Params = [fetch.url, fetch.source, fetch.source_encoding, fetch.source_name, 
            fetch.title, fetch.keywords, fetch.author, fetch.publish_date,
            fetch.crawler_time, fetch.content, fetch.description
        ];

        //执行sql
        mysql.query(fetchAddSql, fetchAddSql_Params, function(qerr, vals, fields) {
            if (qerr) {
                console.log("URL duplicate");
            }
            else{
                console.log("写入mysql数据库成功！")
            }
        }); //mysql写入
    }
    });
}