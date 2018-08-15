import React, { Component } from 'react';

import './style.css';

import Chart from '../Chart';
import Image from '../Image';
import NameArray from '../NameArray';
import Release from '../Release';

import TextUtil from '../../util/text';

export default class Song extends Component {
	
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
				<div className="top text-right">
					<a href={'/#/edit/song/' + song.id} className="gray"><small>Edit</small></a>
				</div>
				<div className="top text-center">
					{TextUtil.normalize(song.title)}
				</div>
				<div className="text-center">
					<small>by</small> <NameArray array={song.artists} />
				</div>
				{song.features.length > 0 &&
				<div className="text-center">
					<small>feat.</small> <NameArray array={song.features} />
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
		return (
			<div key={album.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							{TextUtil.normalize(album.title)}
						</div>
						<div>
							<Release date={album.release} />
						</div>
					</div>
					<div>
						<small>by</small> <NameArray array={album.artists} />
					</div>
				</div>
			</div>
		);
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
