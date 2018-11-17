import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Image, NameArray } from '../../Common';

import TextUtil from '../../../util/text';
		
var charts = ['billboard', 'uk', 'deutsche', 'francais', 'oricon', 'gaon', 'melon'];
var abbrs = {
	'billboard': 'US',
	'uk': 'UK', 
	'deutsche': 'DE',
	'francais': 'FR',
	'oricon': 'JP',
	'gaon': 'KR',
	'melon': 'M'
};

export default class CurrentList extends Component {
	
	constructor(props) {
		super(props);

		this.state = {songs: this.props.data.songs, filtered: []};
	}
	
	render() {
		const songs = this.state.songs;

		const filtered = this.state.filtered.length > 0 ? this.state.filtered : songs;
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '110px 50px 1fr',
			gridColumnGap: '10px',
			lineHeight: '25px',
			marginBottom: '10px',
		};

		var spacerStyle = {
			width: '50px',
			lineHeight: '50px',
			fontSize: '1.2em',
			background: 'rgba(255, 255, 255, 0.2)',
			borderRadius: '25px',
		}

		return (
			<div>
				<div style={gridStyle}>
					{this.getHeaderView()}
					<div style={spacerStyle} className="text-center">{filtered.length}</div>
				</div>
				{filtered.map((song, index) => {
					var spacer = null;

					if (index % 10 === 9) {
						spacer = (
							<div style={gridStyle} key={'header' + index}>
								{index % 10 === 9 && this.getHeaderView()}
								<div style={spacerStyle} className="text-center">{index + 1}</div>
							</div>
						);
					}

					return [
						<div key={song.id} style={gridStyle}>
							<div>{this.getRankView(song)}</div>
								<Image id={song.albumId} size={50} />
								<div className="overflow-hidden">
									<div className="ellipsis">
										<Link to={'/song/' + song.id}>{TextUtil.normalize(song.title)}</Link>
									</div>
									<div className="ellipsis">
										<NameArray array={song.artists} />
										{song.features.length > 0 &&
											<span> feat. <NameArray array={song.features} /></span>
										}
									</div>
								</div>
							</div>,
							spacer
						];
					})}
			</div>
		);
	}

	filterBy(chart) {
		const songs = this.state.songs;

		if (this.state.selectedChart === chart) {
			this.setState({filtered: [], selectedChart: null});
			return;
		}

		var filtered = [];

		songs.forEach(song => { if (song[chart]) filtered.push(song); });

		filtered.sort((a, b) => a[chart] - b[chart]);

		this.setState({filtered: filtered, selectedChart: chart});
	}

	getRankStyle(rank) {
		var style = {width: '20px', borderRadius: '5px'};

		if (rank === undefined)
			return style;
		
		if (rank <= 1)
			style.backgroundColor = 'rgb(255, 45, 85)';
		else if (rank <= 5)
			style.backgroundColor = 'rgb(88, 86, 214)';
		else if (rank <= 10)
			style.backgroundColor = 'rgb(0, 122, 255)';
		else
			style.backgroundColor = 'rgba(255, 255, 255, 0.2)';

		return style;
	}

	getRankView(song) {
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr 1fr 1fr',
			gridColumnGap: '10px',
			gridRowGap: '10px',
			lineHeight: '20px',
		};

		return (
			<div style={gridStyle} className="text-center">
				{charts.map(chart => {
					var rank = song[chart];
					return <div key={chart} style={this.getRankStyle(rank)}>{rank ? rank : <span>&nbsp;</span>}</div>;
				})}
				<div className="lightgray">{song.plays}</div>
			</div>
		);
	}

	getHeaderView() {
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr 1fr 1fr',
			gridColumnGap: '10px',
			gridRowGap: '10px',
			lineHeight: '20px',
			fontSize: 'smaller',
		};
		
		return (
			<div style={gridStyle} className="text-center">
				{charts.map(chart => {
					return <div key={chart} style={this.getRankStyle(100)} onClick={() => this.filterBy(chart)}>{abbrs[chart]}</div>;
				})}
				<div className="lightgray">P</div>
			</div>
		);

	}
}
