import React, { Component } from 'react';

import './style.css';

import { Dropdown, Loader, PageSelector } from '../Common';

import Albums from './albums';
import Singles from './singles';
import Songs from './songs';
import Features from './features';
import Relations from './relations';

import TextUtil from '../../util/text';

export default class Artist extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, artist: null};

		this.cmpSingle = this.cmpSingle.bind(this);
	}
	
	componentDidMount() {
		this.fetch(this.state.id);
	}
	
	componentWillReceiveProps(nextProps) {
		const id = nextProps.match.params.id;

		if (id !== this.state.id) {
			this.setState({id: id, artist: null});
			this.fetch(id);
		}
	}

	render() {
		const artist = this.state.artist;

		if (artist === null)
			return <Loader />;
		
		const basename = '/artist/' + artist.id;

		return (
			<div>
				<div className="top text-right">
					<Dropdown array={this.getDropdownArray()} />
				</div>
				<div className="top text-center">
					{TextUtil.normalize(artist.name)}
				</div>
				<div className="text-center">
					{this.getDescription()}
				</div>
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-1">
						<PageSelector views={this.state.views} basename={basename} />
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
	}

	getDropdownArray() {
		const artist = this.state.artist;
		return [
			{name: 'Edit', href: '/#/edit/artist/' + artist.id},
			{name: 'Old Page', href: '/#/artist/' + artist.id},
		];
	}

	createSingle(song) {
		var min = 10;
		var run = 0;
		var count = 0;
		var i;

		for (i in song.rank) {
			if (song.rank[i]) {
				if (min > song.rank[i].min)
					count = 0;

				min = Math.min(min, song.rank[i].min);
				run += song.rank[i].run;

				if (min === song.rank[i].min)
					count += song.rank[i].count;
			}
		}

		song.rank = {min: min, run: run + count, count: count};

		return {
			songs: [song],
			album: song.album,
			artists: song.artists,
			features: song.features,
			rank: song.rank,
		};
	}

	// b into a
	mergeArtistArrays(a, b) {
		b.forEach(artist => {
			if (a.filter(a => (a.id === artist.id)).length === 0)
				a.push(artist);
		});
	}

	getSingles(artist, songs) {
		var singles = [];

		songs.forEach(song => {
			if (song.rank) {
				singles[song.id] = this.createSingle(song);
			}
		});

		if (artist.singleGroups.length > 0) {
			artist.singleGroups.forEach(group => {
				if (singles[group[0]]) {
					var single = singles[group[0]];
					var cur;
					var songs = [];
					group.forEach((songId, index) => {
						cur = singles[songId];

						if (cur === undefined)
							return;

						songs[index] = singles[songId].songs[0];
						this.mergeArtistArrays(single.artists, cur.artists);
						this.mergeArtistArrays(single.features, cur.features);

						if (index > 0)
							singles[songId].merged = true;
					})
					single.songs = songs;
				}
			});

			singles = singles.filter(s => (s.merged !== true));
		}
		
		singles.sort(this.cmpSingle);

		return singles;
	}

	cmpSingle(a, b) {
		if (a.rank.min !== b.rank.min)
			return a.rank.min - b.rank.min;

		if (a.rank.count !== b.rank.count)
			return b.rank.count - a.rank.count;

		if (a.rank.run !== b.rank.run)
			return b.rank.run - a.rank.run;

		return this.cmpSong(a, b);
	}

	cmpSong(a, b) {
		if (a.album === b.album) {
			if (a.disk === b.disk)
				return a.track - b.track;

			return a.disk - b.disk;
		}

		if (a.album.release === b.album.release)
			return a.album.id - b.album.id;

		return a.album.release < b.album.release ? 1 : -1;
	}

	getSongs(artist) {
		var songs = [];
		
		artist.albums.forEach(album => {
			album.songs.forEach((song, index) => {
				if (songs[song.id] === undefined) {
					songs[song.id] = song;
				} else {
					album.songs[index] = songs[song.id];
				}
			})
		});

		artist.albums.forEach(album => {
			album.songs.forEach(song => {
				if (song.album === undefined || song.album.release > album.release) {
					song.album = album;
					songs[song.id] = song;
				}
			});
		});
		
		songs = songs.filter(song => song.id);
		songs.sort(this.cmpSong);

		return songs;
	}

	getFeatures(albums) {
		var songs = [];

		albums.forEach(album => {
			album.songs.forEach(song => {
				if (song.album === album)
					songs[song.id] = song;
			});
		});
		
		songs = songs.filter(song => song.id);
		songs.sort((a, b) => a.album.release < b.album.release ? 1 : -1);

		return songs;
	}

	cmpIds(ids, artists) {
		if (ids.length !== artists.length)
			return false;

		for (var i = 0; i < ids.length; i++) {
			if (ids[i] !== artists[i].id)
				return false;
		}

		return true;
	}

	getDirectAlbums(artist) {
		const ids = artist.ids;
		var albums = [];
		var others = [];
		
		artist.albums.sort((a, b) => {
			if (a.release === b.release)
				return a.id - b.id;
				
			return a.release < b.release ? 1 : -1;
		});

		artist.albums.forEach(album => {
			var isDirect = false;

			album.albumArtists.forEach(artist => {
				if (ids.includes(artist.id)) {
					isDirect = true;
				}
			});

			if (isDirect) {
				albums.push(album);
			} else {
				others.push(album);
			}
		});

		return [albums, others];
	}

	getDescription() {
		const artist = this.state.artist;
		var desc = '';

		if (artist.gender !== null)
			desc += artist.gender + ' ';

		if (artist.type !== null)
			desc += artist.type + ' ';

		if (artist.origin !== null)
			desc += 'from ' + artist.origin;

		return desc;
	}

	formatSinglePeaks(artist) {
		var map = {};

		artist.singlePeaks.forEach(single => {
			map[single.id] = single.week;
		});

		return map;
	}

	getViews(artist) { 
		const [directAlbums, otherAlbums] = this.getDirectAlbums(artist);
		const songs = this.getSongs(artist);
		const singles = this.getSingles(artist, songs);
		var features = this.getFeatures(otherAlbums);

		if (this.cmpIds(songs.map(s => s.id), features))
			features = [];
		
		var views = [];
		
		if (directAlbums.length > 0)
			views.push({
				name: 'Albums', link: '/albums', component: Albums,
				data: {albums: directAlbums, id: artist.id}
			});
		if (singles.length > 0)
			views.push({
				name: 'Singles', link: '/singles', component: Singles,
				data: {singles: singles, id: artist.id, peaks: this.formatSinglePeaks(artist)}
			});
		if (songs.length > 0)
			views.push({
				name: 'Songs', link: '/songs', component: Songs,
				data: {albums: artist.albums, id: artist.id}
			});
		if (features.length > 0)
			views.push({
				name: 'Features', link: '/features', component: Features,
				data: {songs: features}
			});
		if (artist.As.length > 0 || artist.Bs !== undefined)
			views.push({
				name: 'Relations', link: '/relations', component: Relations,
				data: {artist: artist}
			});

		return views;
	}

	fetch(id) {
		const that = this;
		const url = '/api/artist/' + id;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({artist: data, views: that.getViews(data)});
    });
	}
}
