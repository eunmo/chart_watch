(function() {
  'use strict';

  var express = require('express');
	var formidable = require('formidable');
  var util = require('util');
	var path = require('path');
	var fs = require('fs');
	var exec = require('child_process').exec;

  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index');
  });

	var uploadDir = path.resolve('uploads');
	var perlScript = path.resolve('perl/tag.pl');

	router.get('/upload', function(req, res) {
		var stats = [];
		fs.readdir(uploadDir, function(err, list) {
			console.log(list.length + ' files');
			list.forEach(function(name) {
				var filePath = path.join(uploadDir, name);
				exec('perl ' + perlScript + ' ' + filePath, function (error, stdout, stderr) {
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					stats.push(JSON.parse(stdout));
					if (stats.length == list.length) {
						res.status(200).send(stats);
					}
				});
			});
		});
	});

	router.post('/upload',function(req, res) {
		var form = new formidable.IncomingForm();
		var files = [];
    var fields = [];

    form.uploadDir = uploadDir;

    form
      .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
      })
      .on('file', function(field, file) {
        console.log(field, file);
        files.push([field, file]);
      })
      .on('end', function() {
        console.log('-> upload done');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received fields:\n\n '+util.inspect(fields));
        res.write('\n\n');
        res.end('received files:\n\n '+util.inspect(files));
      });
    form.parse(req);
	});

  module.exports = router;
}());
