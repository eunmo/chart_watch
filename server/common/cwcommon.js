(function () {
	'use strict';

	module.exports = {
		artistCmpOrder: function (a, b) {
			return a.order - b.order;
		},
		getPrimaryGroup: function (artist) {
			var primaryGroup = null;
			for (var i in artist.Group) {
				var group = artist.Group[i];
				if (group.ArtistGroup.primary) {
					primaryGroup = {
						name: group.name,
						id: group.id
					};
					break;
				}
			}
			return primaryGroup;
		},
		getSongArtists: function (song) {
			var songArtists = [];
			var j;
			var artistRow, songArtist;

			for (j in song.Artists) {
				artistRow = song.Artists[j];
				if (!artistRow.SongArtist.feat) {
					songArtist = {
						id: artistRow.id,
						name: artistRow.name,
						order: artistRow.SongArtist.order,
						primaryGroup: this.getPrimaryGroup(artistRow)
					};
					songArtists.push(songArtist);
				}
			}

			songArtists.sort(this.artistCmpOrder);

			return songArtists;
		},
		newSong: function (songRow) {
			var song = {
				id: songRow.id,
				title: songRow.title,
				plays: songRow.plays,
				artists: [],
				features: []
			};
			return song;
		}
	};
}());
