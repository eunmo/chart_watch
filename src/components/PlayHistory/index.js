import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image, NameArray } from '../Common';

import TextUtil from '../../util/text';

export default class PlayHistory extends Component {
	
	constructor(props) {
		super(props);

		this.state = {songs: []};
		this.fetch = this.fetch.bind(this);
	}

	componentDidMount() {
		this.fetch();
	}

	render() {
		var numStyle = {width: '20px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '5px'};
		var gridStyle = {
      display: 'grid',
      gridTemplateColumns: '50px 50px 1fr',
      gridColumnGap: '10px',
      lineHeight: '25px',
			marginBottom: '5px',
    };

		return (
			<div>
				<div className="top text-center" onClick={() => this.fetch()}>Play History</div>
				<div className="vertical-buffer" />
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-3">
						{this.state.songs.map(song => 
							<div key={song.id} style={gridStyle}>
								<div className="text-center">
									<div className="gray">{this.getTime(song)}</div>
									<div className="flex-container flex-space-between">
										<div style={this.getRankStyle(song.rank)}>{this.getMinRank(song)}</div>
										<div style={numStyle}>{song.plays}</div>
									</div>
								</div>
								<Image id={song.albumId} size={50} />
								<div className="overflow-hidden">
									<div className="ellipsis"><Link to={'/song/' + song.id}>{TextUtil.normalize(song.title)}</Link></div>
									<div className="ellipsis"><small>by</small> <NameArray array={song.artists} /></div>
								</div>
							</div>
						)}
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
	}

	getRankStyle(rank) {
		var style = {width: '20px'};

		if (rank === undefined)
			return style;
		
		var min = 11;

		for (var i in rank) {
			min = Math.min(min, rank[i].min);
		}

		style.borderRadius = '5px';

		if (min <= 1)
			style.backgroundColor = 'rgb(255, 45, 85)';
		else if (min <= 5)
			style.backgroundColor = 'rgb(88, 86, 214)';
		else
			style.backgroundColor = 'rgb(0, 122, 255)';

		return style;
	}

	getMinRank(song) {
		var min = 11;

		for (var i in song.rank) {
			min = Math.min(min, song.rank[i].min);
		}

		return min < 11 ? min : null;
	}

	getTime(song) {
		var date = new Date(song.lastPlayed);
		var now = new Date();

		if (date.toLocaleDateString() === now.toLocaleDateString()) {
			var hour = date.getHours();
			var minute = date.getMinutes();

			if (minute < 10)
				minute = '0' + minute;

			return hour + ':' + minute;
		} else {
			var month = date.getMonth() + 1;
			var day = date.getDate();

			return month + '/' + day;
		}
	}

	fetch() {
		const that = this;
		const url = '/api/lastPlayed';

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({songs: data});
    });
	}
}
