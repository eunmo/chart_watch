import React, { Component } from 'react';

import './style.css';

import Chart from '../Chart';
import ViewSelector from '../ViewSelector';

import TextUtil from '../../util/text';

export default class Album extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, album: null};

		this.getTrackView = this.getTrackView.bind(this);
	}
	
	componentDidMount() {
		this.fetch();
	}

	render() {
		const album = this.state.album;
		if (album === null)
			return null;
		const titleStyle = {fontSize: '1.2em'};
		var views = [
			{name: 'Tracks', view: this.getTracksView()},
			{name: 'Chart', view: this.getChartView()},
		];

		return (
			<div>
				<div className="top text-center">
					{this.getFormat()}
				</div>
				<div className="text-center" style={titleStyle}>
					{TextUtil.normalize(album.title)}
				</div>
				<div className="flex-container flex-adaptive">
					<div className="flex-1 text-center">
						<div className="flex-container flex-center">
							{this.getAlbumImage()}
						</div>
						<div style={titleStyle}>{this.getArtists(album.artists)}</div>
						<div>{this.getRelease()}</div>
					</div>
					<div className="flex-2">
						<ViewSelector views={views} expand={true} />
					</div>
				</div>
			</div>
		);
	}

	getTracksView() {
		const [disks, maxDisk] = this.getDisks();
		const diskStyle = {width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.2)'};
		return (
			<div>
				{maxDisk === 1 && <br className="hide-mobile" />}
				{disks.map(disk => {
					return (
						<div key={disk.disk}>
							{maxDisk > 1 && <div style={diskStyle}>&nbsp;Disk {disk.disk}</div>}
							{disk.songs.map(this.getTrackView)}
						</div>
					);
				})}
			</div>
		);
	}

	getChartView() {
		const album = this.state.album;
		return (
			<div className="flex-container flex-center">
				<Chart data={album.charts} />
			</div>
		);
	}

	getArtists(artists) {
		var string = '';
		artists.forEach((artist, index) => {
			if (index > 0)
				string += ', ';
			string += TextUtil.normalize(artist.name);
		});

		return string;
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

	getAlbumImage() {
		const id = this.state.album.id;
		var size = 300;
		var pixel = size + 'px';
		var outerStyle = {display: 'flex', alignContent: 'center', maxHeight: pixel, maxWidth: pixel};
		var innerStyle = {margin: 'auto', width: pixel, height: pixel, borderRadius: size/20 + 'px'};

		return (
			<div key={id} className="flex-1" style={outerStyle}>
				<img src={'/' + id + '.jpg'} style={innerStyle} alt={id} />
			</div>
		);
	}

	getRankView(rank) {
		if (rank === undefined)
			return null;

		if (rank > 5)
			return '☆';

		if (rank > 1)
			return '★';

		return '★★';
	}

	getTrackView(song) {
		var artists = this.getArtists(song.artists);
		var features = this.getArtists(song.features);
		var albumArtists = this.getArtists(this.state.album.artists);
		var style = {lineHeight: '21px'};
		var rankStyle = {width: 30, textAlign: 'right'};
		var trackStyle = {width: 20, fontSize: '0.8em', marginRight: '3px'};

		return (
			<div key={song.track} className="flex-container" style={style}>
				<div className="text-center" style={rankStyle}>
					{this.getRankView(song.minRank)}
				</div>
				<div className="text-center" style={trackStyle}>{song.track}</div>
				<div className="flex-1">
					<div>{TextUtil.normalize(song.title)}</div>
					{artists !== albumArtists && this.getArtistView('by', artists)}
					{features !== '' && this.getArtistView('feat.', features)}
				</div>
			</div>
		);
	}

	getArtistView(prefix, artists) {
		var prefixStyle = {marginRight: '5px'};
		return (
			<div className="flex-container">
				<div style={prefixStyle}><small>{prefix}</small></div>
				<div className="flex-1">{artists}</div>
			</div>
		);
	}

	getDisks() {
		var disks = [];
		var maxDisk = 0;

		this.state.album.songs.forEach(song => {
			var disk = song.disk;

			if (disks[disk] === undefined)
				disks[disk] = {disk: disk, songs: []};
			disks[disk].songs.push(song);

			maxDisk = Math.max(disk, maxDisk);
		});

		disks.sort((a, b) => { return a.disk - b.disk; });
		disks.forEach(disk => { disk.songs.sort((a, b) => { return a.track - b.track; })});

		return [disks, maxDisk];
	}

	fetch() {
		const that = this;
		const url = '/api/album/full/' + this.state.id;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({album: data});
    });
	}
}
