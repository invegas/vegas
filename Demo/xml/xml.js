var fs = require('fs');
var libxmljs = require("libxmljs");
var parser = require('xml2json');

var writeToFile = function (name, data) {
	var filePath = 'media/' + name + '.xml';
	fs.writeFile(filePath, data, function (err) {
		if (err) {
			return console.log(err);
		}
	})
}

var readFile = function (name) {
	var filePath = 'media/' + name + '.xml';
	fs.exists(filePath, function (exists) {
		if (exists) {
			fs.readFile(filePath, 'utf8', function (err, data) {
				var json = JSON.parse(parser.toJson(data));
				json.root.child.grandchild = "This is a test";

				var xm = parser.toXml(json);
				writeToFile('xml', xm);
				// console.log(xm);
			})
		}
	})
}

var test = function () {
	readFile("xml");
}

exports.test = test;