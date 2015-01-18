musicApp.factory('addSongService', function ($rootScope) {
	return {
		songs: [],
		addSongs: function (songs) {
			this.songs = songs;
			this.broadcastSongs();
		},
		broadcastSongs: function () {
			$rootScope.$broadcast('handleAddSong');
		}
	};
});
