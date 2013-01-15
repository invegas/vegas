var express = require('express');
var jade = require('jade');
var mongo = require('./mongo');
var app = express();

//mongo connect
mongo.connectToDB(mongo.initBlog);
// mongo.mongoTest();

//boot
app.configure(function () {
	app.use(express.static(__dirname + "/media"));
	app.use(express.bodyParser());
	app.set('views', __dirname + "/views");
	app.set('view engine', 'jade');	
})


//router
app.get('/', function (req, res) {
	res.send("hello world");
});

var showParam = function (req, res) {
    if (req.body) {
    	console.log("body is " + req.body);
    	console.log(req.body.age);
		for (var key in req.body) {
			console.log(key + ": " + req.body[key]);
		}    	
		res.send({status:'ok',message:'data received'});
    } else {
    	console.log("nothing received");
        res.send({status:'nok',message:'no Tweet received'});
    }	
}

app.post('/find', function (req, res) {
	mongo.find();
	res.send({'status': 'ok'});
})

app.get('/show', function (req, res) {
	mongo.show();
	res.send({'status': 'ok'});
})

app.post('/update', function(req, res){
	if (req.body) {
		mongo.update(req.body.age);
		res.send({'status': 'ok'});
	}
})

app.post('/save', function (req, res) {
	if (req.body) {
		var name = req.body.name;
		mongo.save(name);
		res.send({'status': 'ok'});
	}
})

app.post('/delete', function (req, res) {
	if (req.body) {
		var name = req.body.name;
		mongo.deleteDB(name);
		res.send({'status': 'ok'});
	}
})

app.get('/newCollection', function (req, res) {
	mongo.newCollection();
	res.send('success!');
})

//blog
var getDate = function () {
	var d = new Date();
	var year = d.getFullYear(),
	month = d.getMonth() + 1,
	day = d.getDate(),
	hour = d.getHours() + 1,
	minutes = d.getMinutes() + 1;

	console.log(year + "/" + month + "/" + day + "/" + hour + "/" + minutes);
}
app.post('/blogadd', function (req, res) {
	if (req.body) {
		req.body.date = "";
		mongo.saveBlog(req.body);
		res.send({"status": "ok"});
	}
})

var renderShowBlog = function (res, blogs) {
	res.render("show", {
		'title': "Show blogs",
		'blogs': blogs
	})
}

app.get('/blogshow', function (req, res) {
 	mongo.showBlog(renderShowBlog, res);
})


app.listen(8000);

