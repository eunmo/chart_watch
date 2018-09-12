import React, { Component } from 'react';

import { Dropdown, Image, NameArray, Loader, WeekPicker } from '../Common';

import TextUtil from '../../util/text';

export default class Album extends Component {

	constructor(props) {
		super(props);

		const chart = this.props.match.params.chart;
		const week = this.props.match.params.week;

		this.state = {chart: chart, week: week, data: null};

		this.fetch = this.fetch.bind(this);
		this.match = this.match.bind(this);
		this.clear = this.clear.bind(this);
	}
	
	componentDidMount() {
		this.view(this.state.week);
	}
	
	componentWillReceiveProps(nextProps) {
		const week = nextProps.match.params.week;

		if (this.state.week !== week) {
			this.setState({week: week});
			this.view(week);
		}
	}
	
	render() {
		const chart = this.state.chart;
		const data = this.state.data;
		if (data === null)
			return <Loader />;

		var albums = [];

		data.albums.forEach(album => { albums[album.id] = album; });
		data.thisWeek.forEach(row => {
			if (albums[row.AlbumId]) {
				row.album = albums[row.AlbumId];
				row.lastWeek = row.album.lastWeek;
			}
		});
		
		var gridStyle = {
			display: 'grid',
			gridTemplateColumns: '50px 50px 1fr',
			gridColumnGap: '10px',
			lineHeight: '25px',
			marginBottom: '10px',
		};

		return (
			<div>
				<div className="top flex-container">
					<div className="flex-1" />
					<div className="text-center">{TextUtil.capitalize(chart)} Albums Chart</div>
					<div className="flex-1 text-right"><Dropdown array={this.getDropdownArray()} /></div>
				</div>
				<WeekPicker week={this.state.week} chart={chart} basename={'/chart/single'} />
				<div className="vertical-buffer" />
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-3">
						{data.thisWeek.map(row => 
							<div key={row.rank} style={gridStyle}>
								{this.getRankView(row)}
								{row.album ? 
									<Image id={row.album.id} size={50} /> :
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

	getDropdownArray() {
		const chart = this.state.chart;
		return [
			{name: 'Fetch', onClick: this.fetch},
			{name: 'Match', onClick: this.match},
			{name: 'Clear', onClick: this.clear},
			{name: 'Old page', href: '/#/chart/album/' + chart + '/' + this.state.week},
		];
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
					{(row.album && row.album.rank) ? 're' : 'new'}
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

	getRowDetailView(row) {
		const album = row.album;
		var title = null;
		var artist = null;

		if (album) {
			title = TextUtil.normalize(row.album.title);
			artist = <NameArray array={row.album.artists} />;
		} else {
			title = TextUtil.normalize(row.title);
			artist = <span className="lightgray">{TextUtil.normalize(row.artist)}</span>;
		}

		return (
			<div className="overflow-hidden">
				<div className="ellipsis">{title}</div>
				<div className="ellipsis">{artist}</div>
			</div>
		);
	}

	update(type) {
		const that = this;
		var url = '/chart/album/' + type + '/' + this.state.chart;
		var week = this.state.week.split('-');
		url += '?year=' + week[0];
		url += '&month=' + week[1];
		url += '&day=' + week[2];

		this.setState({data: null});

		fetch(url)
		.then(function(response) {
			that.view(that.state.week);
    })
	}
	
	fetch() {
		this.update('fetch');
	}
	
	match() {
		this.update('match');
	}
	
	clear() {
		this.update('clear');
	}

	view(week) {
		const that = this;
		const url = '/api/chart/album/view/full/' + this.state.chart + '/' + week;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({data: data});
    });
	}
}
