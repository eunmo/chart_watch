musicApp.factory('songService', function ($rootScope) {
	return {
		songs: [],
		random: [],
		addSongs: function (songs) {
			this.songs = songs;
			this.broadcast('handleAddSong');
		},
		addRandom: function (random) {
			this.random = random;
			this.broadcast('handleRandom');
		},
		broadcast: function (name) {
			$rootScope.$broadcast(name);
		}
	};
});
