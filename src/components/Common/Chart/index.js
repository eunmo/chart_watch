import React, { Component } from 'react';

import './style.css';

export default class Chart extends Component {

	constructor(props) {
		super(props);
		
		const size = this.props.size ? this.props.size : 300;
		const newWeeks = this.createNewWeeksArray(this.props.data.weeks);

		this.state = {size: size, inset: 20, weeks: newWeeks};
	}

	createNewWeeksArray(array) {
		var newArray = [];

		array.forEach(week => { newArray.push(week) });

		return newArray.reverse();
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({weeks: this.createNewWeeksArray(nextProps.weeks)});
	}

	render() {
		const size = this.state.size;
		const style = {
			svg: {backgroundColor: 'rgba(255, 255, 255, 0.3)'},
		};
		
		var [months, ranks] = this.calculate();

		if (months.min === '300010')
			return null;

		const yAxis = this.getYAxis(ranks);
		const [xAxisTicks, xAxisMarkers] = this.getXAxis(months);
		const [points, lines] = this.getPoints(months, ranks);

		return (
			<div>
				<svg width={size} height={size} style={style.svg}>
					{yAxis}
					{xAxisTicks}
					{xAxisMarkers}
					{lines}
					{points}
				</svg>
				<div className="flex-container flex-center">
					<div style={style.legend} className="Chart-legend text-right">
						<div>Chart</div>
						<div>Peak</div>
						<div>Run</div>
						<div>WoC</div>
					</div>
					{this.props.data.headers.map((header, index) => {
						var style = {color: this.getColor(header)};

						if (ranks.peaks[index] === 101)
							return null;

						return (
							<div key={header} className="Chart-legend text-center">
								<div style={style}><b>{this.getAbbr(header)}</b></div>
								<div>{ranks.peaks[index]}</div>
								<div>{ranks.runs[index]}</div>
								<div>{ranks.wocs[index]}</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	getX(week, months) {
		const size = this.state.size;
		const inset = this.state.inset;

		var date = new Date(week);

		return (date - months.start) / (months.end - months.start) * (size - inset * 3) + inset * 2;
	}

	getY(rank, ranks) {
		const size = this.state.size;
		const inset = this.state.inset;

		return rank / ranks.max * (size - inset * 3) + inset;
	}

	getColor(type) {
		const map = {
			'billboard': '#ff0000',
			'oricon': '#1a2a6c',
			'deutsche': '#ffdd00',
			'uk': '#c1d82f',
			'francais': '#00a4e4',
			'melon': 'black',
			'gaon': 'white'
		};

		return map[type] ? map[type] : 'black';
	}

	getAbbr(type) {
		const map = {
			'billboard': 'US',
			'oricon': 'オ',
			'deutsche': 'D',
			'uk': 'UK',
			'francais': 'F',
			'melon': 'M',
			'gaon': 'G'
		};

		return map[type];
	}

	getPoints(months, ranks) {
		const weeks = this.state.weeks;
		const headers = this.props.data.headers;
		var points = [];
		var lines = [];
      
		
		headers.forEach((header, index) => {
			const color = this.getColor(header);
			const lineStyle = {stroke: color, strokeWidth: '1px'};
			var prev;

			weeks.forEach(week => {
				const rank = week.ranks[index];
				if (rank === '-' || rank > 100)
					return;

				var r = 3;

				if (rank === 1)
					r = 5;

				var x = this.getX(week.week, months);
				var y = this.getY(rank, ranks);
				var date = new Date(week.week);
				var key = index + week.week;

				points.push(<circle key={key} cx={x} cy={y} r={r} fill={color} />);

				if (prev !== undefined && date - prev.week === 604800000) {
					lines.push(<line key={key} x1={prev.x} y1={prev.y} x2={x} y2={y} style={lineStyle} />);
				}

				prev = {week: date, x: x, y: y};
			});
		});

		return [points, lines];
	}

	getYAxis(ranks) {
		const size = this.state.size;
		const inset = this.state.inset;

    const style = {
      text: {
        fill: 'white',
        alignmentBaseline: 'middle',
        textAnchor: 'end',
        fontSize: '1.2em'
      },
      line: {
        stroke: 'gray',
        strokeWidth: '1px'
      }
    };

		var i, y;
		const x = inset * 2;
		var axis = [];

		for (i = 10; i <= ranks.max; i += 10) {
			y = this.getY(i, ranks);
			axis.push(<text key={'axisText' + i} x={x} y={y} style={style.text}>{i}</text>);
			axis.push(<line key={'axisLine' + i} x1={x + 5} y1={y} x2={size - inset} y2={y} style={style.line} />);
		}

		return axis;
	}

	getXAxis(months) {
		const size = this.state.size;
		const inset = this.state.inset;

		var ticks = [];
		var markers = [];
		var startYear = months.min.substring(0, 4);
		var startMonth = parseInt(months.min.substring(4, 6), 10);
		var date, month, year;
		var i = 0;
		var xs = [], dates = [];
		var x, j;
		var y1 = size - inset * 2;
		var y2 = y1 + 5;
		var prev = {m: inset * 2, y: inset * 2};

		const tickStyle = { stroke: 'gray', strokeWidth: '2px' };
		const markerStyle = { fill: 'black', alignmentBaseline: 'middle', textAnchor: 'middle' };

		if (startYear === '3000')
			return [ticks, markers];

		while (true) {
			date = new Date(Date.UTC(startYear, startMonth + i, 1));
			x = Math.min(this.getX(date, months), size - inset);
			ticks.push(<line key={i} x1={x} x2={x} y1={y1} y2={y2} style={tickStyle} />);
			xs[i] = x;
			dates[i] = date.toISOString().split('-').slice(0, 2).join('');
			i++;
			if (x >= size - inset)
				break;

			if (i > 2000)
				break;
		}

		if (i <= 12) {
			for (j = 0; j < i; j++) {
				date = new Date(Date.UTC(startYear, startMonth + j - 1, 1)).toISOString().split('-');
				year = date[0];
				month = date[1];
				x = xs[j];
				markers.push(<text key={j} x={(prev.m + x) / 2} y={y2 + 8} style={markerStyle}>{month}</text>);
				prev.m = x;

				if (j === i - 1 || year !== dates[j].substring(0, 4)) {
					if (month === '12')
						ticks.push(<line key={year} x1={x} x2={x} y1={y2} y2={y2 + 5} style={tickStyle} />);
					markers.push(<text key={year} x={(prev.y + x) / 2} y={y2 + 23} style={markerStyle}>{year}</text>);
					prev.y = x;
				}
			}
		} else {
			for (j = 0; j < i; j++) {
				date = new Date(Date.UTC(startYear, startMonth + j - 1, 1)).toISOString().split('-');
				year = date[0];
				month = date[1];
				x = xs[j];
				prev.m = x;

				if (j === i - 1 || year !== dates[j].substring(0, 4)) {
					if (month === '12')
						ticks.push(<line key={year} x1={x} x2={x} y1={y2} y2={y2 + 5} style={tickStyle} />);
					markers.push(<text key={year} x={(prev.y + x) / 2} y={y2 + 23} style={markerStyle}>{year}</text>);
					prev.y = x;
				}
			}
		}

		return [ticks, markers];
	}

	calculate() {
		const headers = this.props.data.headers;
		const weeks = this.props.data.weeks;
		var months = {min: '300010', max: '100010'};
		var ranks = {max: 0, peaks: [], runs: [], wocs: []};

		headers.forEach((header, index) => {
			ranks.peaks[index] = 101;
			ranks.runs[index] = 0;
			ranks.wocs[index] = 0;
		});

		weeks.forEach(week => {
			var month = week.week.split('-').slice(0, 2).join('');
			var valid = false;

			week.ranks.forEach((rank, index) => {
				if (rank !== '-' && rank <= 100) {
					ranks.max = Math.max(ranks.max, rank);
					if (ranks.peaks[index] > rank)
						ranks.runs[index] = 0;
					ranks.peaks[index] = Math.min(ranks.peaks[index], rank);
					ranks.wocs[index]++;
					if (ranks.peaks[index] === rank)
						ranks.runs[index]++;
					valid = true;
				}
			});

			if (valid) {
				if (months.min > month)
					months.min = month;

				if (months.max < month)
					months.max = month;
			}
		});

		months.start = new Date(Date.UTC(months.min.substring(0, 4), months.min.substring(4, 6) - 1, 1));
		months.end = new Date(Date.UTC(months.max.substring(0, 4), months.max.substring(4, 6), 0));
		ranks.max = Math.ceil(ranks.max / 10) * 10;

		return [months, ranks];
	}
}
