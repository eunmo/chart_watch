(function() {
	'use strict';

	var express = require('express');
	var http = require('http');
	var path = require('path');
	var ejs = require('ejs');

	var routes = require('./routes/index');

	var app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.engine('html', ejs.renderFile);
	app.set('view engine', 'html');

	app.use('/', routes);

	var server = app.listen(3000, function() {
		console.log('Express server listening on port ' + server.address().port);
	});

	module.exports = app;
}());
