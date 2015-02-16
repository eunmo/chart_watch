(function () {
	'use strict';

	var Promise = require('bluebird');

	module.exports = function (router, models) {
		
		function addArtistGroup(artistId, groupName, primary) {
			return models.Artist.findOrCreate({
				where: { name: groupName },
				defaults: { nameNorm: groupName }
			})
			.spread(function (artist, created) {
				return models.ArtistGroup.findOne({
					where: { GroupId: { ne: artist.id },
									 MemberId: artistId, primary: true }
				})
				.then(function (artistGroup) {
					return models.ArtistGroup.findOrCreate({
						where: { MemberId: artistId, GroupId: artist.id },
						defaults: { primary: artistGroup === null && primary }
					});
				});
			});
		}
		
		function addArtistMember(artistId, memberName, primary) {
			return models.Artist.findOrCreate({
				where: { name: memberName },
				defaults: { nameNorm: memberName }
			})
			.spread(function (artist, created) {
				return models.ArtistGroup.findOne({
					where: { GroupId: { ne: artistId },
									 MemberId: artist.id, primary: true }
				})
				.then(function (artistGroup) {
					return models.ArtistGroup.findOrCreate({
						where: { GroupId: artistId, MemberId: artist.id },
						defaults: { primary: artistGroup === null && primary }
					});
				});
			});
		}

		function deleteArtistGroup(groupId, memberId) {
			return models.ArtistGroup.destroy({
				where: { GroupId: groupId, MemberId: memberId }
			});
		}

		function updateArtistGroup(groupId, memberId, primary) {
			return models.ArtistGroup.findOne({
				where: { GroupId: { ne: groupId }, MemberId: memberId, primary: true }
			})
			.then(function (artistGroup) {
				if (artistGroup !== null && primary)
					return;

				return models.ArtistGroup.update({
					primary: primary
				},
				{ where: { GroupId: groupId, MemberId: memberId }
				});
			});
		}

		router.put('/api/edit/artist', function (req, res) {
			var input = req.body;
			var id = input.id;
			var promises = [];
			var i;
			
			for (i in input.editGroups) {
				var editGroup = input.editGroups[i];
				if (editGroup.created) {
					if (editGroup.name !== null) {
						promises.push(addArtistGroup(id, editGroup.name, editGroup.primary));
					}
				} else if (editGroup.deleted) {
					promises.push(deleteArtistGroup(editGroup.id, id));
				} else {
					promises.push(updateArtistGroup(editGroup.id, id, editGroup.primary));
				}
			}
			
			for (i in input.editMembers) {
				var editMember = input.editMembers[i];
				if (editMember.created) {
					if (editMember.name !== null) {
						promises.push(addArtistMember(id, editMember.name, editMember.primary));
					}
				} else if (editMember.deleted) {
					promises.push(deleteArtistGroup(id, editMember.id));
				} else {
					promises.push(updateArtistGroup(id, editMember.id, editMember.primary));
				}
			}

			Promise.all(promises)
			.then(function () {
				return models.Artist.findOne({
					where: { name: input.name, id: {ne: id} }
				}).then (function (artist) {
					if (artist !== null) {
						id = artist.id;
						return models.AlbumArtist.update({
							ArtistId: id,
						},
						{ where: {ArtistId: input.id}
						})
						.then(function () {
							return models.SongArtist.update({
								ArtistId: id,
							},
							{ where: {ArtistId: input.id}
							});
						})
						.then(function () {
							return models.Artist.destroy({
								where: {id: input.id}
							});
						});
					} else {
						return models.Artist.update({
							name: input.name,
							nameNorm: input.nameNorm,
							origin: input.origin,
							type: input.type,
							gender: input.gender
						},
						{	where: { id: id }	});
					}
				}).then(function (array) {
					res.json(id);
				});
			});
		});
		
		function addAlbumArtist(albumId, artistName, order, feat) {
			return models.Artist.findOrCreate({
				where: { name: artistName },
				defaults: { nameNorm: artistName }
			})
			.spread(function (artist, created) {
				return models.AlbumArtist.findOrCreate({
					where: { AlbumId: albumId, ArtistId: artist.id },
					defaults: { order: order }
				});
			});
		}

		function deleteAlbumArtist(albumId, artistId) {
			return models.AlbumArtist.destroy({
				where: { AlbumId: albumId, ArtistId: artistId }
			});
		}

		function updateAlbumArtist(albumId, artistId, order, feat) {
			return models.AlbumArtist.update({
				order: order
			},
			{ where: { AlbumId: albumId, ArtistId: artistId }
			});
		}
		
		router.put('/api/edit/album', function (req, res) {
			var input = req.body;
			var id = input.id;
			var promises = [];
			
			for (var i in input.editArtists) {
				var editArtist = input.editArtists[i];
				if (editArtist.created) {
					if (editArtist.name !== null) {
						promises.push(addAlbumArtist(id, editArtist.name, editArtist.order));
					}
				} else if (editArtist.deleted) {
					promises.push(deleteAlbumArtist(id, editArtist.id));
				} else {
					promises.push(updateAlbumArtist(id, editArtist.id, editArtist.order));
				}
			}

			Promise.all(promises)
			.then(function () {
				return models.Album.update({
					title: input.title,
					titleNorm: input.titleNorm,
					release: input.release,
					type: input.type
				},
				{ where: { id: id } });
			})
			.then(function (array) {
				return models.AlbumArtist.findAll({
					where: { AlbumId: id }
				});
			})
			.then(function (albumArtistArray) {
				for (var i in albumArtistArray) {
					var albumArtistRow = albumArtistArray[i];
					if (albumArtistRow.order === 0) {
						res.json(albumArtistRow.ArtistId);
					}
				}
			});
		});
		
		function addSongArtist(songId, artistName, order, feat) {
			return models.Artist.findOrCreate({
				where: { name: artistName },
				defaults: { nameNorm: artistName }
			})
			.spread(function (artist, created) {
				return models.SongArtist.findOrCreate({
					where: { SongId: songId, ArtistId: artist.id },
					defaults: { order: order, feat: feat }
				});
			});
		}

		function deleteSongArtist(songId, artistId) {
			return models.SongArtist.destroy({
				where: { SongId: songId, ArtistId: artistId }
			});
		}

		function updateSongArtist(songId, artistId, order, feat) {
			return models.SongArtist.update({
				order: order,
				feat: feat
			},
			{ where: { SongId: songId, ArtistId: artistId }
			});
		}
		
		router.put('/api/edit/song', function (req, res) {
			var input = req.body;
			var id = input.id;
			var promises = [];

			for (var i in input.editArtists) {
				var editArtist = input.editArtists[i];
				if (editArtist.created) {
					if (editArtist.name !== null) {
						promises.push(addSongArtist(id, editArtist.name, editArtist.order, editArtist.feat));
					}
				} else if (editArtist.deleted) {
					promises.push(deleteSongArtist(id, editArtist.id));
				} else {
					promises.push(updateSongArtist(id, editArtist.id, editArtist.order, editArtist.feat));
				}
			}

			Promise.all(promises)
			.then(function () {
				return models.Song.update({
					title: input.title,
					titleNorm: input.titleNorm,
					plays: input.plays
				},
				{ where: { id: id } });
			})
			.then(function (array) {
				return models.SongArtist.findAll({
					where: { SongId: id }
				});
			})
			.then(function (songArtistArray) {
				for (var i in songArtistArray) {
					var songArtistRow = songArtistArray[i];
					if (!songArtistRow.feat && songArtistRow.order === 0) {
						res.json(songArtistRow.ArtistId);
					}
				}
			});
		});

		router.put('/api/play/song', function (req, res) {
			var input = req.body;
			var id = input.id;
			var date = new Date();

			models.Song.findOne({
				where: {id: id}
			})
			.then(function (song) {
				song.increment('plays');
				song.setDataValue('lastPlayed', date);
				song.save();
				res.sendStatus(200);
			});
		});
	};
}());
