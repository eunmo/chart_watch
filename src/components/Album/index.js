import React, { Component } from 'react';

import './style.css';

import { Dropdown, Image, Loader, NameArray, Release, PageSelector } from '../Common';
import Tracks from './tracks';
import Chart from './chart';

import TextUtil from '../../util/text';

export default class Album extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, album: null};
		this.play = this.play.bind(this);
		this.download = this.download.bind(this);
	}
	
	componentDidMount() {
		this.fetch(this.state.id);
	}
	
	componentWillReceiveProps(nextProps) {
		const id = nextProps.match.params.id;

		if (id !== this.state.id) {
			this.setState({id: id, album: null});
			this.fetch(id);
		}
	}

	render() {
		const album = this.state.album;
		if (album === null)
			return <Loader />;

		const titleStyle = {fontSize: '1.2em'};
		const views = this.state.views;
		const basename = '/album/' + album.id;

		return (
			<div>
				<div className="top text-right">
					<Dropdown array={this.getDropdownArray()} />
				</div>
				<div className="text-center" style={titleStyle}>
					{TextUtil.normalize(album.title)}
				</div>
				<div className="text-center">
					{this.getFormat()}
				</div>
				<div className="flex-container flex-adaptive">
					<div className="flex-1 text-center">
						<div className="flex-container flex-center">
							<Image id={this.state.album.id} size={300} />
						</div>
						<div style={titleStyle}><NameArray array={album.artists} /></div>
						<div><Release date={album.release} /></div>
					</div>
					<div className="flex-2">
						<PageSelector views={views} expand={true} removeHeadersOnSingle={true} basename={basename} />
					</div>
				</div>
			</div>
		);
	}

	getSongsToPlay() {
		const album = this.state.album;
		var disks = [];
		var songs = [];

		album.songs.forEach(song => {
			var disk = song.disk;

			if (disks[disk] === undefined)
				disks[disk] = {disk: disk, songs: []};
			disks[disk].songs.push(song);
		});

		disks.sort((a, b) => { return a.disk - b.disk; });
		disks.forEach(disk => { disk.songs.sort((a, b) => { return a.track - b.track; })});

		disks.forEach(disk => {
			disk.songs.forEach(song => {
				var newSong = {
					id: song.id,
					title: song.title,
					artists: song.artists,
					features: song.features,
					albumId: parseInt(album.id, 10),
					plays: song.plays,
				};

				if (song.minRank)
					newSong.minRank = song.minRank;

				songs.push(newSong);
			});
		});

		return songs;
	}

	play() {
		if (window.isWebkit) {
			var songs = JSON.stringify(this.getSongsToPlay());
      window.webkit.messageHandlers.addSongs.postMessage(encodeURIComponent(songs));
		} else {
			console.log(this.getSongsToPlay());
		}
	}

	getDropdownArray() {
		const album = this.state.album;
		return [
			{name: 'Edit', href: '/#/edit/album/' + album.id},
			{name: 'Play', onClick: this.play},
			{name: 'Download', onClick: this.download},
		];
	}

	getFormat() {
		const format = this.state.album.format;
		var map = {'EP': 'Extended Play', 'Studio': 'Studio Album', 'Greatest': 'Greatest Hits'};

		return map[format] ? map[format] : format;
	}

	getRelease() {
		var date = new Date(this.state.album.release);
		return date.toLocaleDateString();
	}

	getDataForTracksView(album) {
		var disks = [];
		var maxDisk = 0;

		album.songs.forEach(song => {
			var disk = song.disk;

			if (disks[disk] === undefined)
				disks[disk] = {disk: disk, songs: []};
			disks[disk].songs.push(song);

			maxDisk = Math.max(disk, maxDisk);
		});

		disks.sort((a, b) => { return a.disk - b.disk; });
		disks.forEach(disk => { disk.songs.sort((a, b) => { return a.track - b.track; })});

		return {disks: disks, maxDisk: maxDisk, albumArtists: album.artists};
	}

	getViews(album) {
		var views = [
			{name: 'Tracks', link: '/tracks', component: Tracks, data: this.getDataForTracksView(album)}
		];

		if (album.charts.weeks.length > 0)
			views.push({name: 'Chart', link: '/chart', component: Chart, data: album.charts});

		return views;
	}

	download() {
		this.state.album.songs.forEach((song, index) => {
			setTimeout(() => {
				var dl = document.createElement('a');
				dl.href = '/api/download/' + song.id;
				dl.click();
			}, index * 1000);
		});
	}

	fetch(id) {
		const that = this;
		const url = '/api/album/full/' + id;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({album: data, views: that.getViews(data)});
    });
	}
}
