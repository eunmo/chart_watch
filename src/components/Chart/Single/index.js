import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image, NameArray, Loader } from '../../Common';

import DateUtil from '../../../util/date';
import TextUtil from '../../../util/text';

export default class Single extends Component {

	constructor(props) {
		super(props);

		const chart = this.props.match.params.chart;
		const week = this.props.match.params.week;

		this.state = {chart: chart, week: week, data: null};

		this.handleDateChange = this.handleDateChange.bind(this);
	}
	
	componentDidMount() {
		this.fetch(this.state.week);
	}
	
	componentWillReceiveProps(nextProps) {
		const week = nextProps.match.params.week;

		if (this.state.week !== week) {
			this.setState({week: week});
			this.fetch(week);
		}
	}
	
	render() {
		const chart = this.state.chart;
		const data = this.state.data;
		if (data === null)
			return <Loader />;

		var songs = [];
		var rows = [];
		var prevRow = {rank: 0};

		data.songs.forEach(song => { songs[song.id] = song; });
		data.thisWeek.forEach(row => {
			if (prevRow.rank !== row.rank) {
				prevRow = {rank: row.rank, titles: [], songs: []};
				rows.push(prevRow);
			}
				
			if (row.id === null) {
				prevRow.artist = row.artist;
				prevRow.titles[row.order] = row.title;
			} else {
				prevRow.songs[row.order] = songs[row.id];
				prevRow.lastWeek = songs[row.id].lastWeek;
				prevRow.ranked |= songs[row.id].rank;
			}
		});
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '50px 50px 1fr',
			gridColumnGap: '10px',
			lineHeight: '25px',
			marginBottom: '10px',
		};
		var weekOfStyle ={marginRight: '5px'};
		var inputStyle = {background: 'rgba(255, 255, 255, 0.2)', border: '0px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', Helvetica, Arial, sans-serif", color: 'white'};

		const maxDate = DateUtil.getMaxDate(chart).toISOString().substring(0, 10);
		const minDate = DateUtil.getMinDate(chart).toISOString().substring(0, 10);

		return (
			<div>
				<div className="top text-center">{TextUtil.capitalize(chart)} Singles Chart</div>
				<div className="text-center">
					<span style={weekOfStyle}>Week of</span><input type="date" value={this.state.week} onChange={this.handleDateChange} style={inputStyle} min={minDate} max={maxDate} />
				</div>
				<div className="vertical-buffer" />
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-3">
						{rows.map(row =>
							<div key={row.rank} style={gridStyle}>
								{this.getRankView(row)}
								{row.songs.length ? 
									<Image id={row.songs.map(s => s.albumId)[0]} size={50} /> :
									<div></div>
								}
								{this.getRowDetailView(row)}
							</div>					
						)}
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
	}

	getRankView(row) {
		var svgStyle = {width: '50px', height: '50px'};
		var textStyle = {
			fill: 'white',
			alignmentBaseline: 'middle',
			textAnchor: 'middle',
			fontSize: '1.2em'
		};
		var polygonStyle = {fill: 'rgba(255, 255, 255, 0.2)'};
		var newTextStyle = Object.assign({}, textStyle, {fill: 'lightgray', fontSize: 'smaller'});

		var y = 25;
		var polygon = <circle cx={25} cy={25} r={25} style={polygonStyle} />;
		var newText = null;

		if (row.rank < row.lastWeek) {
			polygon = <polygon points="25,0 50,50 0,50" style={polygonStyle} />;
			y += 10;
		}

		if (row.rank > row.lastWeek) {
			polygon = <polygon points="25,50 50,0 0,0" style={polygonStyle} />;
			y -= 10;
		}

		if (row.rank === row.lastWeek) {
			polygon = <polygon points="0,0 50,0 50,50 0,50" style={polygonStyle} />;
		}

		if (row.lastWeek === undefined) { 
			y -= 3;
			newText = (
				<text style={newTextStyle} x={25} y={37}>
					{(row.songs.filter(s => s.ranked).length > 0) ? 're' : 'new'}
				</text>
			);
		}

		if (row.rank === 1)
			polygonStyle.fill = 'rgb(255, 45, 85)';
		else if (row.rank <= 5)
			polygonStyle.fill = 'rgb(88, 86, 214)';

		return (
			<svg style={svgStyle}>
				{polygon}
				<text style={textStyle} x={25} y={y}>{row.rank}</text>
				{newText};
			</svg>
		);
	}

	// b into a
	mergeArtistArrays(a, b) {
		b.forEach(artist => {
			if (a.filter(a => (a.id === artist.id)).length === 0)
				a.push(artist);
		});
	}

	getArtists(row) {
		var artists = [];
		var features = [];

		row.songs.forEach(song => {
			this.mergeArtistArrays(artists, song.artists);
			this.mergeArtistArrays(features, song.features);
		});

		return (
			<span>
				<NameArray array={artists} />
				{features.length > 0 &&
					<span> feat. <NameArray array={features} /></span>
				}
			</span>
		);
	}

	getRowDetailView(row) {
		const songs = row.songs;
		var title = null;
		var artist = null;

		if (songs.length > 0) {
			title = row.songs.map((song, index) => [
				<span key={'span' + index}>{index > 0 && ' / '}</span>,
				<Link to={'/song/' + song.id} key={song.id}>
					{TextUtil.normalize(song.title)}
				</Link>
			]);
			artist = this.getArtists(row);
		} else {
			title = TextUtil.normalize(row.titles.join(' / '));
			artist = <span className="lightgray">{TextUtil.normalize(row.artist)}</span>;
		}

		return (
			<div className="overflow-hidden">
				<div className="ellipsis">{title}</div>
				<div className="ellipsis">{artist}</div>
			</div>
		);
	}

	handleDateChange(event) {
		const adjustedDate = DateUtil.toSaturday(event.target.value);
		const url = '/chart/single/' + this.state.chart + '/' + adjustedDate;

		if (this.state.week !== adjustedDate) {
			this.props.history.push(url);
		}
	}

	fetch(week) {
		const that = this;
		const url = '/api/chart/single/view/full/' + this.state.chart + '/' + week;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({data: data});
    });
	}
}
