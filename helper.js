var moment = require('moment');

//format date
var outputDate = function (date) {
	moment.lang('zh-cn');
	return moment(date).format('LL');
}

var sliceContent = function (data) {
	var start = data.search('<p>'),
	end = data.search('</p>');

	return data.slice(start + 3, end);
}

var activeNav = function (data) {
	var primary, category;
	if (data.indexOf('about') > -1) primary = "about"
	else if (data.indexOf('project') > -1) primary = "project"
	else if (data.indexOf('blog') > -1) primary = "blog"

	if (data.indexOf('nodejs') > -1) category = "node"
	else if (data.indexOf('front') > -1) category = "front"
	else if (data.indexOf('other') > -1) category = "other"
	else category = "blog"

	var obj = {
		primary: primary,
		category: category
	}

	return obj;
}

exports.outputDate = outputDate;
exports.sliceContent = sliceContent;
exports.activeNav = activeNav;

