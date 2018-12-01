import React, { Component } from 'react';

import { Image } from '../../Common';

export default class CurrentGrid extends Component {
	
	constructor(props) {
		super(props);

		var songs = this.props.data.songs;
		
		this.state = {rankGroups: this.groupAlbums(songs), filtered: []};
	}

	render() {
		
		var headerGridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 25px 1fr',
			gridColumnGap: '10px',
			lineHeight: '20px',
			marginTop: '10px',
		};

		var headerStyle = {
			width: '100%',
			textAlign: 'center',
			borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
			lineHeight: '0.1em',
			margin: '10px 0 20px',
		};

		return (
			<div>
				{this.state.rankGroups.map(row => {
					return (
						<div key={row.rank}>
							<div style={headerGridStyle}>
								<div style={headerStyle} />
								<div className="text-center">{row.rank}{row.rank > 5 && '+'}</div>
								<div style={headerStyle} />
							</div>
							<div className="flex-container flex-center">
								{row.albums.map(albumId => 
									<Image id={albumId} size={50} key={albumId} />
								)}
							</div>
						</div>
					);
				})}
			</div>
		);
	}

	groupAlbums(songs) {
		var ranks = [];

		songs.forEach(song => {
			var minRank = song.curRank[0];

			if (minRank > 10) {
				minRank = 11;
			} else if (minRank > 5) {
				minRank = 6;
			}

			if (ranks[minRank] === undefined)
				ranks[minRank] = {rank: minRank, albums: []};

			if (ranks[minRank].albums.includes(song.ablumId))
				return;

			ranks[minRank].albums.push(song.albumId);
		});

		return ranks.filter(e => e);
	}
}
