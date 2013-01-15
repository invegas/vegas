var mongoose = require('mongoose');

//connect to mongo
var connectToDB = function (callback) {
	mongoose.connect('mongodb://localhost/test');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		console.log('mongoDB connected!');
		callback();
	});	
}

//blog
var Blog = {};
var blogSchema = {};

//user
var User = {};
var userSchema = {};

var initUser = function () {
	userSchema = mongoose.Schema({
		name: String,
		pw: String
	})

	User = mongoose.model('User', userSchema);
	console.log('user db init complete!');
	User.find({}, function (err, doc) {
		if (doc.length == 0) {
			console.log("no user yet");
		}
	})	
}
var register = function (name, pw, res) {
	User.find({}, function (err, doc) {
		if (doc.length != 0) {
			console.log("admin have already exist");
			res.redirect('/');
			return false;
		} else {
			var user = new User({
				name: name,
				pw: pw
			}).save(function (err) {
				console.log("new user insert!");
				res.redirect('/login');
			})
		}
	})	
}
// var login = function (name, pw, res) {
// 	var success = function (res) {
// 		res.redirect('/admin');
// 	}
// 	var failed = function (res) {
// 		res.redirect('/login');
// 		console.log("dont't have this user!");
// 	}

// 	User.findOne({'name': name}, function (err, doc) {
// 		if (!doc || doc.pw != pw) {
// 			failed(res);
// 		} else if (doc.pw == pw) {
// 			success(res);
// 		}
// 	})
// }

var login = function (name, pw, fn) {
	User.findOne({'name': name}, function (err, doc) {
		if (!doc || doc.pw != pw) {
			fn(null, null);
		} else if (doc.pw == pw) {
			fn(null, doc.name);
		}
	})
}

var userExist = function (name, fn) {
	User.findOne({'name': name}, function (err, doc) {
		if (!doc) {
			fn(null, null);
		} else if (doc) {
			fn(null, doc.name);
		}
	})
}
var initBlog = function () {	
	blogSchema = mongoose.Schema({
		title: String,
		content: String,
		category: String,
		date: Date,
		comments: Array
	})

	Blog = mongoose.model('Blog', blogSchema);	
	console.log("blog db init complete!");
	initUser();
}

var showBlogList = function (res, callback) {
	Blog.find({}, function (err, doc) {
		if (!err) {
			callback(res, doc);
		}
	})	
}
var showBlogListByCate = function (req, res, callback) {
	var key = req.params.key;
	Blog.find({"category": key}, function (err, doc) {
		if (!err) {
			callback(res, doc);
		}
	})	
}

var saveBlog = function (res, data, callback) {
	var blog = new Blog({
		title: data.title,
		content: data.content,
		category: data.category,
		date: data.date,
		comments: []
	}).save(function (err) {
		if (err) {
			console.log(err);
			res.send("something is wrong");
		}
		callback(res);

	})
}

var delBlogById = function (id, res, callback) {
	Blog.remove({
		'_id': id
	}, function (err, doc) {
		if (err) {
			res.send("delete failed!");
			return false;
		}
		callback();
	})
}

var findBlog = function (title, res, callback) {
	Blog.findOne({
		'title': title
	}, function (err, one) {
		Blog.find({}, function (err, all) {
			if (!err) {
				var obj = {
					one: one,
					all: all
				}
				callback(res, obj);
			}
		})			
	})
}

var updateBlogById = function (req, res, callback) {
	Blog.update({
		'_id': req.body.id
	}, { $set : { 
			title: req.body.title,
			content: req.body.content,
			category: req.body.category
		}
	}, function (err, doc) {
		if (!err) {
			callback(res);
		}
	})
}

//blog
exports.connectToDB = connectToDB;
exports.initBlog = initBlog;
exports.showBlogList = showBlogList;
exports.showBlogListByCate = showBlogListByCate;

exports.saveBlog = saveBlog;
exports.delBlogById = delBlogById;
exports.findBlog = findBlog;
exports.updateBlogById = updateBlogById;

exports.login = login;
exports.register = register;
exports.userExist = userExist;








//define schema
// var testSchema = mongoose.Schema({
// 	name: String
// });
// var Test = mongoose.model('Test', testSchema);
// var test = new Test({
// 	'name': 'lee'
// })



// //find something in Test
// function findSomeoneInTest (name, callback) {
// 	Test.find({"name": name}, function (err, doc) {
// 		if (err) {
// 			callback('find some one failed: ' + err);
// 			return;
// 		}
// 		callback('find successed: ' + doc);
// 	})
// }

//save
// test.save(function (err) {
// 	if (err) {6
// 		console.log('failed!: ' + err);
// 		return;
// 	}
// 	console.log('save success!');
// })

//Schema method
// testSchema.methods.speak = function () {
// 	var name = this.name;
// 	console.log("I am " + name);
// }