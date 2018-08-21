import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Image, NameArray } from '../Common';

import TextUtil from '../../util/text';

var charts = ['billboard', 'uk', 'deutsche', 'francais', 'oricon', 'gaon', 'melon'];
var abbrs = {
	'billboard': 'US',
	'uk': 'UK', 
	'deutsche': 'DE',
	'francais': 'FR',
	'oricon': 'JP',
	'gaon': 'KR',
	'melon': 'Melon'
};

export default class Selector extends Component {
	
	constructor(props) {
		super(props);

		this.state = {array: []};
	}
	
	componentDidMount() {
		this.fetch();
	}

	render() {
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 50px 1fr',
			gridColumnGap: '10px',
			lineHeight: '25px',
			marginBottom: '10px',
		};
		var headerStyle = { fontSize: '1.2em', lineHeight: '50px' };

		return (
			<div>
				<div className="top text-center">Charts</div>
				<div style={Object.assign({}, gridStyle, headerStyle)}>
					<div className="text-right">Album</div>
					<div></div>
					<div><Link to={'/chart/single/current'}>Single</Link></div>
				</div>
				{this.state.array.map(entry => (
					<div style={gridStyle} key={entry.chart}>
						{this.getChartAlbumView(entry)}
						<div className="text-center">
							<div>{abbrs[entry.chart]}</div>
							<div className="gray">{this.getWeek(entry)}</div>
						</div>
						{this.getChartSingleView(entry)}
					</div>
				))}
			</div>
		);
	}

	getChartSingleView(entry) {
		const single = entry.single;
		if (single === undefined)
			return <div></div>;
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '50px 1fr',
			gridColumnGap: '10px',
		};

		const url = '/chart/single/' + entry.chart + '/' + entry.week.substring(0, 10);
		const song = single.songs[0];

		return (
			<Link to={url}>
				<div className="overflow-hidden" style={gridStyle}>
					<Image id={song.albumId} size={50} noLink={true}/>
					<div>
						<div className="ellipsis">{TextUtil.normalize(song.title)}</div>
						<div className="ellipsis lightgray">
							<NameArray array={song.artists} noLink={true}/>
							{song.features.length > 0 &&
								<span> ft. <NameArray array={song.features} noLink={true}/></span>}
						</div>
					</div>
				</div>
			</Link>
		);
	}

	getChartAlbumView(entry) {
		const album = entry.album;
		if (album === undefined)
			return <div></div>;
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 50px',
			gridColumnGap: '10px',
		};
		
		const url = '/chart/album/' + entry.chart + '/' + entry.week.substring(0, 10);

		return (
			<Link to={url}>
				<div className="overflow-hidden text-right" style={gridStyle}>
					<div>
						<div className="ellipsis">{TextUtil.normalize(album.title)}</div>
						<div className="ellipsis lightgray">
							{album.format2 === 'Soundtrack' ? 'Soundtrack' :
								<NameArray array={album.artists} noLink={true}/>}
						</div>
					</div>
					<Image id={album.id} size={50} noLink={true}/>
				</div>
			</Link>
		);
	}

	getWeek(entry) {
		return entry.week.substring(5, 10).replace('-', '/');
	}

	group(data) {
		var array = [];

		charts.forEach((chart, index) => {
			var entry = {chart: chart};
			data.singles.forEach(single => {
				if (single.type === chart)
					entry.single = single;
			});
			data.albums.forEach(album => {
				if (album.type === chart)
					entry.album = album.album;
			});
			entry.week = entry.single.week;
			array[index] = entry;
		});

		return array;
	}
	
	fetch() {
		const that = this;
		const url = '/api/chart/summary';

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({array: that.group(data)});
    });
	}
}
