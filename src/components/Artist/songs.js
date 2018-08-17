import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image, NameArray, Release } from '../Common';

import TextUtil from '../../util/text';

export default class ArtistSongs extends Component {
	
	render() {
		const id = this.props.data.id;
		const albums = this.props.data.albums;

		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px'};
		var rankStyle = {width: '32px', textAlign: 'right', marginRight: '3px', minWidth: '32px'};
		var artistStyle = {marginLeft: '35px'};

		var globalMin = 11;

		albums.forEach(album => {
			album.songs.filter(song => song.album === album).forEach(song => {
				if (song.rank)
					globalMin = Math.min(song.rank.min, globalMin);
			});
		});

		if (globalMin === 11) {
			rankStyle.width = '7px';
			rankStyle.minWidth = '7px';
			artistStyle.marginLeft = '10px';
		}

		return albums.map(album => {
			const songs = album.songs.filter(song => song.album === album);

			if (songs.length === 0)
				return null;

			var allSame = true;
			var showOnce = false;
			var artistIds = songs[0].artists.map(artist => artist.id);

			if (songs.length > 1 && this.cmpId(id, songs[0].artists) === false) {
				songs.forEach(song => {
					if (this.cmpIds(artistIds, song.artists) === false) {
						allSame = false;
					}
				});

				showOnce = allSame;
			}

			return (
			<div key={album.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div className="flex-1" style={innerStyle}>
					{showOnce && songs.length > 2 &&
						<div className="flex-container flex-space-between" style={artistStyle}>
							<div>{this.getArtistView('by', songs[0].artists)}</div>
							<div>
								<Release date={album.release} />
							</div>
						</div>
					}
					{album.songs.filter(song => song.album === album).map((song, index) => [
						<div key={'title' + song.id} className="flex-container flex-space-between">
							<div>
								<Link to={'/song/' + song.id}>
									<div className="flex-container">
										<div style={rankStyle}>{this.getRankView(song)}</div>
										<div>{TextUtil.normalize(song.title)}</div>
									</div>
								</Link>
							</div>
							{(showOnce === false || songs.length === 2) && index === 0 &&
								<div>
									<Release date={album.release} />
								</div>
							}
						</div>,
						<div key={'artist' + song.id} style={artistStyle}>
							{showOnce || this.cmpId(id, song.artists) || this.getArtistView('by', song.artists)}
							{song.features.length > 0 && this.getArtistView('feat.', song.features)}
						</div>
					])}
					{showOnce && songs.length === 2 &&
						<div className="flex-container flex-space-between" style={artistStyle}>
							<div>{this.getArtistView('by', songs[0].artists)}</div>
						</div>
					}
				</div>
			</div>
			);
		});
	}

	getRankView(song) {
		if (song.rank === undefined)
			return null;

		var rank = song.rank.min;

		var symbol = '☆';

		if (rank === 1) {
			symbol = '★★';
		} else if (rank <= 5) {
			symbol = '★';
		}

		return symbol;
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

	cmpId(id, artists) {
		return artists.length === 1 && artists[0].id === id;
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
}
