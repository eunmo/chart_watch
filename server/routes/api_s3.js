(function () {
	'use strict';
	
	var AWS = require('aws-sdk');
	
	var mp3Bucket = 'mp3-tokyo';
	
	module.exports = function (router, models) {

		router.get('/api/s3/:_id', function (req, res) {
			var id = req.params._id;
			var s3 = new AWS.S3();
			var expireTime = 1800; // 30 minutes
			var params = { Bucket: mp3Bucket, Key: id, Expires: expireTime };
			var url = s3.getSignedUrl('getObject', params);
			res.json({ url: url });
		});
	};
}());