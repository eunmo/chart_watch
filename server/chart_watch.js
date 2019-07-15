(function() {
  'use strict';

  var express = require('express');
  var http = require('http');
  var path = require('path');
  var ejs = require('ejs');
  var bodyParser = require('body-parser');

  var routes = require('./routes/index');

  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');

  app.use(bodyParser.json());

  app.use(express.static(path.join(__dirname, '../client')));
  app.use(express.static(path.join(__dirname, '../uploads/img')));
  app.use(express.static(path.join(__dirname, '../uploads')));

  app.use('/', routes);

  // build dir comes after routes to avoid duplication of index.html
  app.use(express.static(path.join(__dirname, '../build')));

  var server = app.listen(3010, function() {
    console.log('Express server listening on port ' + server.address().port);
  });

  module.exports = app;
})();
