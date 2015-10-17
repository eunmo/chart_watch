musicApp.filter('songDuration', function () {
	return function (secs) {
		secs = Math.floor(secs);
		var hour = Math.floor(secs / 3600);
		var min = Math.floor(secs / 60);
		var sec = secs % 60;
		var str = (hour > 0 ? (hour + ':') : '') +
							((hour > 0 && min < 10) ? '0' : '') + min + ':' +
							(sec >= 10 ? '' : '0') + sec;

		return str;
	};
});

musicApp.filter('normalizeString', function () {
	return function (str) {
		if (str === null || str === undefined || typeof str !== "string")
			return null;
		return str.replace(/`/g, '\'');
	};
});

musicApp.filter('numAlbums', function () {
	return function (num) {
		if (num <= 1)
			return '(' + num + ' album)';
		return '(' + num + ' albums)';
	};
});

musicApp.filter('numSongs', function () {
	return function (num) {
		if (num <= 1)
			return num + ' song';
		return num + ' songs';
	};
});

musicApp.filter('numFeatures', function () {
	return function (num) {
		if (num <= 1)
			return num + ' feature';
		return num + ' features';
	};
});

musicApp.filter('artistType', function () {
	return function (string) {
		if (string === 'Duet')
			return 'Duo';
		return string;
	};
});

musicApp.filter('capitalize', function () {
	return function (string) {
		if (string.length < 3)
			return string.toUpperCase();

		return string.charAt(0).toUpperCase() + string.slice(1);
	};
});
