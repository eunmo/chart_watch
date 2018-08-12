import React, { Component } from 'react';

import './style.css';

export default class Monthly extends Component {

	constructor(props) {
		super(props);

		const year = this.props.match.params.month.substring(0, 4);
		const month = this.props.match.params.month.substring(4, 6);
		const [weeks, days] = this.getDayGrid(year, month);

		this.state = {year: year, month: month, weeks: weeks, days: days};
	}

	componentDidMount() {
		this.fetch();
	}

	render() {
		const weeks = this.state.weeks;
		console.log(weeks);

		return (
			<div className="text-center">
				<div>
				{this.state.month} {this.state.year}
				</div>
				<div>
					{weeks.map((week, index) => {
						return (
							<div key={index} className="flex-container">
								{week.map((day, index) => {
									var style = {width: '14%'};
									var headerStyle = {lineHeight: '50px', fontSize: '1.2em'};
									if (day === null)
										return (<div key={index} className="flex-1" style={style}/>);

									const albums = day.albums;

									if (day.albums.length > 0)
										headerStyle.fontWeight = 'bold';

									if (index === 0)
										headerStyle.color = 'red';

									if (index === 6)
										headerStyle.color = 'blue';

									return (
										<div key={index} className="flex-1" style={style}>
											<div style={headerStyle}>{day.day}</div>
											{albums.length > 0 &&
												<div className="flex-container flex-wrap flex-center">
													{albums.map(album => {
														var size = 50;
														var pixel = size + 'px';
														var outerStyle = {display: 'flex', alignContent: 'center', maxHeight: pixel, maxWidth: pixel};
														var innerStyle = {margin: 'auto', width: pixel, height: pixel, borderRadius: size/5 + 'px'};

														return (
															<div key={album.id} className="flex-1" style={outerStyle}>
																<img src={'/' + album.id + '.jpg'} style={innerStyle} alt={album.id} />
															</div>
														);
													})}
												</div>
											}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	getDayGrid(year, month) {
		var weeks = [];
		var days = [];
		var weekIndex = 0;

		var endDate = new Date(year, month, 0).getDate();
		var dateIndex = 1;
		var date, day, dayO;

		while (dateIndex <= endDate) {
			date = new Date(year, month - 1, dateIndex);
			day = date.getDay();

			dayO = {day: dateIndex, albums: []};
			if (weeks[weekIndex] === undefined)
				weeks[weekIndex] = [null, null, null, null, null, null, null];
			weeks[weekIndex][day] = dayO;
			days[dateIndex] = dayO;

			if (day === 6)
				weekIndex++;
			dateIndex++;
		}

		return [weeks, days];
	}

	fetch() {
		const year = this.state.year;
		const month = this.state.month;
		const that = this;
		const url = '/api/album/monthly/' + year + month;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
			const [weeks, days] = that.getDayGrid(year, month);
			data.forEach(row => {
				var date = new Date(row.release).getDate();
				days[date].albums.push(row);
			});
      that.setState({weeks: weeks, days: days});
    });
	}
}
