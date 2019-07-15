(function() {
  'use strict';

  var path = require('path');
  var fs = require('fs');
  var Promise = require('bluebird');
  var exec = Promise.promisify(require('child_process').exec);
  var AWS = require('aws-sdk');
  var s3config = require('../../../s3.json');

  var uploadDir = path.join(__dirname, '../../../uploads/temp');

  module.exports = function(router, db) {
    function moveToS3(id, filePath) {
      var fileBuffer = fs.readFileSync(filePath);
      var s3 = new AWS.S3(s3config);
      var param = {
        Bucket: 'eunmo-music',
        Key: id,
        ContentType: 'audio/mpeg',
        Body: fileBuffer
      };
      return new Promise(function(resolve, reject) {
        s3.putObject(param, function(error, response) {
          if (error !== null) {
            console.log('s3 error: ' + error);
            return reject();
          }
          fs.unlinkSync(filePath);
          resolve();
        });
      });
    }

    router.get('/api/migrate', async function(req, res) {
      var from = 27000;
      var to = 32585;
      var query =
        'Select id from Songs where id >= ' + from + ' and id < ' + to;
      var rows = await db.promisifyQuery(query);
      var id, file, url, time;

      for (var i = 0; i < rows.length; i++) {
        id = '' + rows[i].id;
        file = path.join(uploadDir, id);
        url = 'http://1.235.106.140:3000/music/' + id + '.mp3';
        await exec('curl -o ' + file + ' ' + url);
        await moveToS3(id, file);
        if (i % 10 === 0) {
          time = new Date();
          console.log(time.toLocaleTimeString() + ' ' + id);
        }
      }
      console.log('Done');
      res.sendStatus(200);
    });
  };
})();
