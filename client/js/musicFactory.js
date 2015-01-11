musicApp.factory('musicFactory', function($http) {
	var urlBase = '/api/music';
	var _musicService = {};

	_musicService.getMusic = function() {
		return $http.get(urlBase);
	};

	return _musicService;
});
