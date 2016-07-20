musicApp.factory('songService', function ($rootScope) {
	return {
		next: [],
		songs: [],
		random: [],
		addNext: function (songs) {
			this.next = songs;
			this.broadcast('handleAddNext');
		},
		addSongs: function (songs) {
			this.songs = songs;
			this.broadcast('handleAddSong');
		},
		addRandom: function (random) {
			this.random = random;
			this.broadcast('handleRandom');
		},
		songEnded: function (song) {
			this.broadcast('handleSongEnded');
		},
		broadcast: function (name) {
			$rootScope.audios[0].init();
			$rootScope.audios[1].init();
			$rootScope.$broadcast(name);
		},
	};
});
