'use strict';

var request = require('request');

module.exports = function (router, models, db) {

	router.get('/api/download/:_id', async (req, res) => {
		var id = req.params._id;

		const songs = await db.song.getDetails([id]);

		if (songs.length === 0) {
			res.sendStatus(200);
			return;
		}

		const filename = encodeURI(songs[0].title) + '.mp3';
		const contentDisposition = 'attachment; filename="' + filename + '"';

		const url = 'https://s3-ap-northeast-1.amazonaws.com/eunmo-music/' + id;
		request(url)
			.on("response", remoteRes => {
 	  	 	// You can add/remove/modify headers here
  	  	remoteRes.headers["content-type"] = "application/octet-stream";
    		remoteRes.headers["content-disposition"] = contentDisposition;
			}).pipe(res);
	});
};
