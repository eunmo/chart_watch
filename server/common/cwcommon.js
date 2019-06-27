(function() {
  'use strict';

  module.exports = {
    artistCmpOrder: function(a, b) {
      return a.order - b.order;
    },
    getPrimaryGroup: function(artist) {
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
    getSongArtists: function(song) {
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
    newSong: function(songRow) {
      var song = {
        id: songRow.id,
        title: songRow.title,
        plays: songRow.plays,
        artists: [],
        features: []
      };
      return song;
    },
    newAlbum: function(albumRow) {
      var i;
      var artistRow;
      var artist, primaryGroup;
      var album = {
        id: albumRow.id,
        title: albumRow.title,
        format: albumRow.format,
        release: albumRow.release,
        albumArtists: []
      };

      for (i in albumRow.Artists) {
        artistRow = albumRow.Artists[i];
        artist = {
          id: artistRow.id,
          name: artistRow.name,
          order: artistRow.AlbumArtist.order
        };
        primaryGroup = this.getPrimaryGroup(artistRow);
        if (primaryGroup !== null) artist.primaryGroup = primaryGroup;
        album.albumArtists.push(artist);
      }

      album.albumArtists.sort(this.artistCmpOrder);

      return album;
    },
    weekToNum: function(week) {
      return (
        week.getFullYear() * 10000 + week.getMonth() * 100 + week.getDate()
      );
    },
    getSeasonalWeeks: function(date) {
      var dates = '';
      var mm = date.getMonth();
      var dd = date.getDate();
      var append = false;

      for (var yy = date.getFullYear() - 1; yy >= 2000; yy--) {
        date = new Date(Date.UTC(yy, mm, dd));
        date.setDate(date.getDate() + (6 - date.getDay()));

        if (append) {
          dates += ',';
        }

        dates +=
          "'" +
          date.getFullYear() +
          '-' +
          (date.getMonth() + 1) +
          '-' +
          date.getDate() +
          "'";
        append = true;
      }

      return dates;
    }
  };
})();
