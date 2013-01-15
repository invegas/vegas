var express = require('express');
var jade = require('jade');
var mongo = require('./mongo');
var app = express();

//mongo connect
mongo.connectToDB();

//boot
app.configure(function () {
	app.use(express.static(__dirname + "/media"));
	app.use(express.bodyParser());
})


//router
app.get('/', function (req, res) {
	res.send("hello world");
});


app.listen(8000);

