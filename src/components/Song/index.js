import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import Chart from '../Chart';

import TextUtil from '../../util/text';

export default class Album extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, song: null};
	}
	
	componentDidMount() {
		this.fetch();
	}
	
	render() {
		const song = this.state.song;
		if (song === null)
			return null;
		const headerStyle = {
			width: '100%',
			backgroundColor: 'rgba(255, 255, 255, 0.2)',
			lineHeight: '30px',
			paddingLeft: '5px',
			marginBottom: '5px',
		};

		var albums = song.albums;
		albums.sort((a, b) => a.release < b.release ? -1 : 1);

		return (
			<div className="Song">
				<div className="top text-center">
					&nbsp;
				</div>
				<div className="top text-center">
					{TextUtil.normalize(song.title)}
				</div>
				<div className="text-center">
					<small>by</small> {this.getArtists(song.artists)}
				</div>
				{song.features.length > 0 &&
				<div className="text-center">
					<small>feat.</small> {this.getArtists(song.features)}
				</div>
				}
				<div className="flex-container flex-adaptive">
					<div className="flex-1">
						<div className="flex-container">
							<div className="flex-1" />
							<div className="Song-albums">
								<div style={headerStyle}>
									Album{song.albums.length > 1 && 's'}
								</div>
								{song.albums.map(album => this.getAlbumView(album))}
							</div>
							<div className="flex-1" />
						</div>
					</div>
					<div className="flex-1">
						<div className="flex-container flex-center">
							<Chart data={song.charts} />
						</div>
					</div>
				</div>
			</div>
		);
	}
	
	getAlbumView(album) {
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var releaseStyle = {color: 'lightgray'};
		return (
			<div key={album.id} className="flex-container" style={outerStyle}>
				{this.getAlbumImage(album)}
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							{TextUtil.normalize(album.title)}
						</div>
						<div>
							<small style={releaseStyle}>{this.getRelease(album)}</small>
						</div>
					</div>
					<div>
						<small>by</small> {this.getArtists(album.artists)}
					</div>
				</div>
			</div>
		);
	}
	
	getAlbumImage(album) {
		const id = album.id;
		var size = 50;
		var pixel = size + 'px';
		var outerStyle = {display: 'flex', alignContent: 'center', maxHeight: pixel, maxWidth: pixel};
		var innerStyle = {margin: 'auto', width: pixel, height: pixel, borderRadius: size/5 + 'px'};

		return (
			<Link to={'/album/' + album.id}>
				<div style={outerStyle}>
					<img src={'/' + id + '.jpg'} style={innerStyle} alt={id} />
				</div>
			</Link>
		);
	}

	getRelease(album) {
		var date = new Date(album.release);
		return date.toLocaleDateString();
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

	fetch() {
		const that = this;
		const url = '/api/song/full/' + this.state.id;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({song: data});
    });
	}
}
