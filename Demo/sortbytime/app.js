var express = require('express');
var jade = require('jade');
var mongo = require('./mongo');
var app = express();

//mongo connect
mongo.connectToDB();

//boot
app.configure(function () {
	app.use(express.static(__dirname));
	app.use(express.bodyParser());
	app.set('views', __dirname + "/views");	
})

//router
app.get('/', function (req, res) {
	res.send("hello world");
});

app.listen(8000);

