var express = require("express")

var router = express.Router();

// 连接数据库
var my_sql = require("../crawlers/mysql.js");

router.get('/index.html', function (req, res) {
    res.sendFile(__dirname + "/static/" + "index.html");
})

var n_list = [];
var c_list = [];
var news_per_page = 10;//设定每一页的页数为10
var page_num = 10;//即只展示前100条记录

// 返回搜索的新闻，传入4个参数，返回data，数组列表
router.get('/search', function (req, res) {
    var n_list = [];
    // 查询数据库
    var type = req.query.type;
    var info1 = req.query.info1;
    var info = req.query.info;
    var symbol = req.query.symbol;
    var s_sql = "";
    var c_sql = "";
    // 单个的查询：查询标题、内容、作者、发表日期
    if (type == 'title') {
        s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and  title like '%" + info + "%'";
        // 最近7天
        c_sql = "select count(*) as cnt, publish_date from fetches where title like'%" + info + "%' group by publish_date order by publish_date desc limit 7";
    } else if (type == 'content') {
        s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and  content like '%" + info + "%'";
        c_sql = "select count(*) as cnt, publish_date from fetches where content like'%" + info + "%' group by publish_date order by publish_date desc limit 7";
    } else if (type == 'author') {
        s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and  author like '%" + info + "%'";
        c_sql = "select count(*) as cnt, publish_date from fetches where author like'%" + info + "%' group by publish_date order by publish_date desc limit 7";
    } else if (type == 'publish_date') {

        s_sql = "select distinct id_fetches, url,keywords, source, title, author, publish_date from fetches where  keywords!='' and  publish_date ='"+info+"' ";
        //   如果是时间，那么展现在这一天发表的不同来源的新闻个数，分别用柱状体和折线图表现
        c_sql = "select count(*) as cnt, source_name from fetches where publish_date like '%" + info + "%' group by source_name order by cnt desc;";
    } else if (type == 'title,content') {
        if (symbol == "and") {
            s_sql = "select distinct id_fetches, url, keywords, source, title, author, publish_date from fetches where  keywords!='' and  title like '%" + info + "%' and " + "content like '%" + info1 + "%'";
            c_sql = "select count(*) as cnt, publish_date from fetches where title like '%" + info + "%' and " + "content like '%" + info1 + "%' group by publish_date order by publish_date desc limit 7";
        } else {
            s_sql = "select distinct id_fetches, url, keywords, source, title, author, publish_date from fetches where keywords!='' and  title like '%" + info + "%' or " + "content like '%" + info1 + "%'";
            c_sql = "select count(*) as cnt, publish_date from fetches where title like '%" + info + "%' or " + "content like '%" + info1 + "%' group by publish_date order by publish_date desc limit 7";
        }
    }else if(type=='title,source_name'){
        if (symbol == "and") {
            s_sql = "select distinct id_fetches, url, keywords, source, title, author, publish_date from fetches where  keywords!='' and  title like '%" + info + "%' and " + "source_name like '%" + info1 + "%'";
            c_sql = "select count(*) as cnt, publish_date from fetches where title like '%" + info + "%' and " + "source_name like '%" + info1 + "%' group by publish_date order by publish_date desc limit 7";
        } else {
            s_sql = "select distinct id_fetches, url, keywords, source, title, author, publish_date from fetches where keywords!='' and  title like '%" + info + "%' or " + "source_name like '%" + info1 + "%'";
            c_sql = "select count(*) as cnt, publish_date from fetches where title like '%" + info + "%' or " + "source_name like '%" + info1 + "%' group by publish_date order by publish_date desc limit 7";
        }
    }
    my_sql.query(c_sql, function (err, result1, fields) {
        c_list = result1;
        my_sql.query(s_sql, function (err, result2, fields) {
            if (err) {
                console.log(err);
            } else {
                // 只把前news_per_page * page_num条新闻传过去
                n_list = result2;
                if (n_list.length <= news_per_page * page_num) {
                    var page = Math.ceil(n_list.length / news_per_page);
                    // 不足news_per_page * page_num条的新闻，直接传
                    res.json({
                        info: info, type: type,
                        n_list: n_list, page_num: page, news_per_page: news_per_page, charts: c_list
                    });
                } else {
                    // 超过news_per_page * page_num条的新闻，传前面的news_per_page * page_num条
                    res.json({
                        info: info, type: type,
                        n_list: n_list.slice(0, news_per_page * page_num),
                        page_num: page_num, news_per_page: news_per_page, charts: c_list
                    });
                }
            }

        });
    });
})

// all_news展示数据库中所有的新闻
router.get('/all_news', function (req, res) {
    var s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and title!='' and author!='' and source!=''";
    my_sql.query(s_sql, function (err, result, fields) {
        if (err) {
            console.log(err);
        } else {
            // 只把前news_per_page *page_num条新闻传过去
            n_list = result;
            if (n_list.length <= news_per_page * page_num) {
                var page = Math.ceil(n_list.length / news_per_page);
                // 不足news_per_page *page_num条的新闻，直接传
                res.json({n_list: n_list, page_num: page, news_per_page: news_per_page });
            } else {
                // 超过news_per_page *page_num条的新闻，传前面的50条
                res.json({n_list: n_list.slice(0, news_per_page * page_num), page_num: page_num, news_per_page: news_per_page });
            }
        }
    });

})

// all_news展示数据库中所有的新闻,按照降序排列
router.get('/all_news_desc', function (req, res) {
    var s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and title!='' and author!='' and source!='' order by publish_date desc ";
    my_sql.query(s_sql, function (err, result, fields) {
        if (err) {
            console.log(err);
        } else {
            // 只把前news_per_page *page_num条新闻传过去
            n_list = result;
            if (n_list.length <= news_per_page * page_num) {
                var page = Math.ceil(n_list.length / news_per_page);
                // 不足news_per_page *page_num条的新闻，直接传
                res.json({n_list: n_list, page_num: page, news_per_page: news_per_page });
            } else {
                // 超过news_per_page *page_num条的新闻，传前面的50条
                res.json({n_list: n_list.slice(0, news_per_page * page_num), page_num: page_num, news_per_page: news_per_page });
            }
        }
    });

})

// all_news展示数据库中所有的新闻,按照升序排列
router.get('/all_news_order', function (req, res) {
    var s_sql = "select distinct id_fetches, url, keywords,source, title, author, publish_date from fetches where keywords!='' and title!='' and author!='' and source!='' order by publish_date asc";
    my_sql.query(s_sql, function (err, result, fields) {
        if (err) {
            console.log(err);
        } else {
            // 只把前news_per_page *page_num条新闻传过去
            n_list = result;
            if (n_list.length <= news_per_page * page_num) {
                var page = Math.ceil(n_list.length / news_per_page);
                // 不足news_per_page *page_num条的新闻，直接传
                res.json({n_list: n_list, page_num: page, news_per_page: news_per_page });
            } else {
                // 超过news_per_page *page_num条的新闻，传前面的50条
                res.json({n_list: n_list.slice(0, news_per_page * page_num), page_num: page_num, news_per_page: news_per_page });
            }
        }
    });

})
// 查看新闻的详细信息，包含所有的和搜索的
router.get('/news_information', function (req, res) {
    var id_fetches = req.query.id_fetches;
    var s_sql = "select distinct url, source, title, keywords, author, publish_date, crawler_time, description, content from fetches where id_fetches=?";
    my_sql.query(s_sql, id_fetches, function (err, result, fields) {
        res.json({ new_info: result[0] });
    });
})


// 模块导出
module.exports = router;