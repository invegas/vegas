var express = require('express');
var xml = require('./xml');
var app = express();

//boot
app.configure(function () {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + "/media"));	
})

xml.test();

//router
app.get('/', function (req, res) {
	res.send("hello world");	
});

app.listen(8000);

