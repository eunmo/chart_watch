import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { ArtistView, Image, Release } from '../Common';

import TextUtil from '../../util/text';

export default class ArtistSingles extends Component {
	
	render() {
		const id = this.props.data.id;

		return this.props.data.singles.map(single => {
			const album = single.album;
			var outerStyle = {marginBottom: '5px'};
			var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
			var rankStyle = {width: '50px', height: '50px', lineHeight: '50px', fontSize: '1.5em', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', marginLeft: '10px'};

			return (
				<div key={single.songs[0].id} className="flex-container" style={outerStyle}>
					<Image id={album.id} size={50} />
					<div style={rankStyle} className="text-center">{single.rank.min}</div>
					<div className="flex-1" style={innerStyle}>
						<div className="flex-container flex-space-between">
							<div>
								{single.songs.map((song, index) => [
									<span key={'span' + index}>{index > 0 && ' / '}</span>,
									<Link to={'/song/' + song.id} key={song.id}>
										{TextUtil.normalize(song.title)}
									</Link>
								])}
							</div>
							<div>
								<Release date={this.getPeak(single)} />
							</div>
						</div>
						<div>
							<ArtistView filterIds={[id]} artists={single.artists} />
							<ArtistView prefix="feat." artists={single.features} />
						</div>
					</div>
				</div>
			);			
		});
	}

	getPeak(single) {
		const peaks = this.props.data.peaks;

		if (peaks[single.songs[0].id])
			return peaks[single.songs[0].id];

		return single.album.release;
	}
}
