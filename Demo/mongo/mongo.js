var mongoose = require('mongoose');


var Co = {};
//defind co
var initSchema = function () {
	var coSchema = mongoose.Schema( {
		age: Number,
		friends: Array,	
		location: String,
		name: String,
		skill: Array
	})

	Co = mongoose.model('Co', coSchema, 'co');
}
//init Model
initSchema();

var mongoTest = function () {
	Co.find({"name": "lee"}, function (err, doc) {
		if (err) {
			console.log('find some one failed: ' + err);
			return;
		}
		console.log('find successed: \n' + doc)
	})	
}

//save one
var save = function (name) {
	var co = new Co({
		'name': name,
		'age': 21,
		'skill': ["english"]
	})
	co.save(function (err) {
		if (err) {azt
			console.log('failed!: ' + err);
			return;
		}
		console.log('save success!');
	})	
}

var show = function () {
	Co.find({}, function (err, doc) {
		if (!err) {
			console.log(doc);
		}
	})
}

var find = function () {
	Co.find({'age': {$gte: 22}}, function (err, doc) {
		if (!err) {
			console.log(doc);
		}
	})
}

var update = function (val) {
	Co.update({'name': 'lee'}, {$set: {'age': val}}, function (err, doc) {
		if (!err) {
			console.log(doc);
		}
	});
}

var deleteDB = function (val) {
	Co.remove({
		'name': val
	}, function (err, doc) {
		if (!err) {
			console.log(doc);
		}
	})
}

var newCollection = function () {
	var singleSchema = mongoose.Schema( {
		key1: String,
		key2: String,
		key3: {
			nest1: Array,
			nest2: Array,
			nest3: String
		}
	})
	var Single = mongoose.model('Single', singleSchema)
	var single = new Single({
		key1: "value1"
	}).save(function (err) {
		console.log(this.arguments);
	})
}

//blog

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

var Blog = {};
var blogSchema = {};
var initBlog = function () {
	blogSchema = mongoose.Schema({
		title_en: String,
		title_cn: String,
		content: String,
		category: String,
		date: Date,
		comments: Array
	})

	Blog = mongoose.model('Blog', blogSchema);	
	console.log("blog db init complete!");
}
var saveBlog = function (obj) {
	var blog = new Blog({
		title_en: obj.title_en,
		title_cn: obj.title_cn,
		content: obj.content,
		category: obj.category,
		date: obj.date,
		comments: []
	}).save(function (err) {
		if (err) {
			console.log(err);
		}
	})
}
var showBlog = function (callback, res) {
	Blog.find({}, function (err, doc) {
		if (!err) {
			callback(res, doc);
		}
	})	
}
//test
exports.connectToDB = connectToDB;
exports.mongoTest = mongoTest;

exports.show = show;
exports.save = save;
exports.find = find;
exports.update = update;
exports.deleteDB = deleteDB;

exports.newCollection = newCollection;	

//blog
exports.saveBlog = saveBlog;
exports.initBlog = initBlog;
exports.showBlog = showBlog;







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