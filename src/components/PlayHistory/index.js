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
		var outerStyle = {marginBottom: '5px'};
		var timestampStyle = {lineHeight: '25px', width: '50px', marginRight: '10px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var emptyNumStyle = {width: '20px'};
		var numStyle = {width: '20px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '5px'};

		return (
			<div>
				<div className="top text-center" onClick={() => this.fetch()}>Play History</div>
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-3">
						{this.state.songs.map(song => 
							<div key={song.id} className="flex-container" style={outerStyle}>
								<div style={timestampStyle} className="text-center">
									<div className="gray">{this.getTime(song)}</div>
									<div className="flex-container flex-space-between">
										<div style={song.rank ? numStyle : emptyNumStyle}>{this.getMinRank(song)}</div>
										<div style={numStyle}>{song.plays}</div>
									</div>
								</div>
								<Image id={song.albumId} size={50} />
								<div className="flex-1" style={innerStyle}>
									<div><Link to={'/song/' + song.id}>{TextUtil.normalize(song.title)}</Link></div>
									<div><small>by</small> <NameArray array={song.artists} /></div>
								</div>
							</div>
						)}
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
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
