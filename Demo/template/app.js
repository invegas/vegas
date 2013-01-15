var express = require('express');
var jade = require('jade');
var app = express();

app.configure(function () {
	app.use(express.static(__dirname + "/media"));
	// app.use(express.logger());
	app.use(express.bodyParser())

	app.set('views', __dirname + "/views");
	// app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'jade');
})

app.get('/', function (req, res) {
	//res level
	// res.render("blog-ejs.html", {
	// 	'title': 'Template Test',
	// 	'content': 'Hello World'
	// })

	res.render("layout", {
		'title': 'Template Test',
		'hello': 'Hello World'
	})

	// res.send("hello world");
});

app.listen(8000);