import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { NameArray } from '../Common';

import TextUtil from '../../util/text';

export default class AlbumTracks extends Component {
	
	constructor(props) {
		super(props);

		this.getTrackView = this.getTrackView.bind(this);
	}

	render() {
		const disks = this.props.data.disks;
		const maxDisk = this.props.data.maxDisk;
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

	getRankView(song) {
		const rank = song.minRank;
		if (rank === undefined)
			return null;

		var symbol = '☆';

		if (rank === 1) {
			symbol = '★★';
		} else if (rank <= 5) {
			symbol = '★';
		}

		return <Link to={'/song/' + song.id}>{symbol}</Link>;
	}

	cmpArtists(a, b) {
		if (a.length !== b.length)
			return false;

		for (var i = 0; i < a.length; i++) {
			if (a[i].id !== b[i].id)
				return false;
		}

		return true;
	}

	getArtistView(prefix, artists) {
		var prefixStyle = {marginRight: '5px'};
		return (
			<div className="flex-container">
				<div style={prefixStyle}><small>{prefix}</small></div>
				<div className="flex-1"><NameArray array={artists} /></div>
			</div>
		);
	}

	getTrackView(song) {
		var artists = song.artists;
		var features = song.features;
		var albumArtists = this.props.data.albumArtists;
		var style = {lineHeight: '21px'};
		var rankStyle = {width: 30, textAlign: 'right'};
		var trackStyle = {width: 20, fontSize: '0.8em', marginRight: '3px'};

		return (
			<div key={song.track} className="flex-container" style={style}>
				<div className="text-center" style={rankStyle}>
					{this.getRankView(song)}
				</div>
				<div className="text-center" style={trackStyle}>{song.track}</div>
				<div className="flex-1">
					<div>{TextUtil.normalize(song.title)}</div>
					{this.cmpArtists(artists, albumArtists) === false && this.getArtistView('by', song.artists)}
					{features.length > 0 && this.getArtistView('feat.', song.features)}
				</div>
			</div>
		);
	}
}
