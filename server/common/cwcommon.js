(function () {
	'use strict';

	module.exports = {
		artistCmpOrder: function (a, b) {
			return a.order - b.order;
		},
		sortWeeks: function (weeks) {
			var results = [];

			var weekCmp = function (a, b) {
				return b.week - a.week;
			};

			weeks.sort(weekCmp);

			for (var i in weeks) {
				results.push(weeks[i]);
			}

			return results;
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
		},
		newAlbum: function (albumRow) {
			var i;
			var artistRow;
			var artist, primaryGroup;
			var album = { 
				id: albumRow.id,
				title: albumRow.title,
				type: albumRow.type,
				release: albumRow.release,
				albumArtists: [],
			};

			for (i in albumRow.Artists) {
				artistRow = albumRow.Artists[i];
				artist = {
					id: artistRow.id,
					name: artistRow.name,
					order: artistRow.AlbumArtist.order,
				};
				primaryGroup = this.getPrimaryGroup(artistRow);
				if (primaryGroup !== null)
					artist.primaryGroup = primaryGroup;
				album.albumArtists.push(artist);
			}

			album.albumArtists.sort(this.artistCmpOrder);

			return album;
		},
		weekToNum: function (week) {
			return week.getFullYear() * 10000 + week.getMonth() * 100 + week.getDate();
		}
	};
}());
