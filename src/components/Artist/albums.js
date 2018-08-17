import React, { Component } from 'react';

import './style.css';

import { Image, NameArray, Release } from '../Common';

import TextUtil from '../../util/text';

export default class ArtistAlbums extends Component {

	render() {
		const albums = this.props.data.albums;
		const id = this.props.data.id;

		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '50px', height: '50px', lineHeight: '50px', fontSize: '1.5em', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', marginRight: '10px'};
		var emptyRankStyle = {width: '50px', marginRight: '10px'};

		var globalMin = 11;

		albums.forEach(album => {
			var min = 11;
			for (var i in album.rank) {
				min = Math.min(min, album.rank[i].min);
			}
			globalMin = Math.min(min, globalMin);

			if (min < 11)
				album.rank.min = min;
		});

		return albums.map(album => {
			const cmpResult = this.cmpIds(id, album.albumArtists);
			const min = album.rank ? album.rank.min : 11;

			return (
				<div key={album.id} className="flex-container" style={outerStyle}>
					{globalMin < 11 &&
						(min < 11 ?
						<div style={rankStyle} className="text-center">{min}</div> :
						<div style={emptyRankStyle} />)
					}
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
							<small>{album.format}</small>
							{cmpResult ||
								<span><small> by</small> <NameArray array={album.albumArtists} /></span>
							}
						</div>
					</div>
				</div>
			);
		});
	}

	cmpIds(id, artists) {
		return artists.length === 1 && artists[0].id === id;
	}
}
