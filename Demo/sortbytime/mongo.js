var mongoose = require('mongoose');

var connectToDB = function () {
	mongoose.connect('mongodb://localhost/test');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function () {
		console.log('mongoDB connected!');
	});	
}

//defind co
var Co = {};
var initSchema = function () {
	var coSchema = mongoose.Schema( {
		content: String,
		dateReal: Date,
		dateFake: String
	})

	Co = mongoose.model('Co', coSchema, 'co');
}

var createData = function () {
	var d = new Date();
	var co = new Co({
		content: "content",
		dateReal: d
	})
}
//init Model
initSchema();

exports.connectToDB = connectToDB;
exports.initSchema = initSchema;