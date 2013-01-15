var mongoose = require('mongoose');

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
var connectToDB = function () {
	mongoose.connect('mongodb://localhost/test');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		console.log('mongoDB connected!');
	});	
}

//test
exports.connectToDB = connectToDB;
exports.newCollection = newCollection;	