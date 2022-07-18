var express = require('express');
var app = express();//应用对象

var static = express.static('static');
app.use(static);
// 注意是/，意味着根目录下去找
app.use(require('./route'));


var server = app.listen(8080, function() {
    console.log("访问地址为 http://127.0.0.1:8080/index.html")
})