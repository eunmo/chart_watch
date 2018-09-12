import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';

import './style.css';

import DateUtil from '../../../util/date';

export default class WeekPicker extends Component {
	
	constructor(props) {
		super(props);
		
		const chart = props.chart;
		const maxDate = DateUtil.getMaxDate(chart).toISOString().substring(0, 10);
		const minDate = DateUtil.getMinDate(chart).toISOString().substring(0, 10);

		this.state = {
			year: DateUtil.getYear(props.week),
			maxDate: maxDate,
			minDate: minDate,
			open: false,
			type: 'week',
		};

		this.toggle = this.toggle.bind(this);
		this.toggleType = this.toggleType.bind(this);
		this.selectYear = this.selectYear.bind(this);
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({ year: DateUtil.getYear(nextProps.week), open: false });
	}

	render() {
		return (
			<div>
				<div className="flex-container">
					<div className="flex-1 text-right">{this.getPrevLink()}</div>
					<div className="text-center" onClick={this.toggle}>
						Week of {this.formatWeekOf(this.props.week)}
					</div>
					<div className="flex-1">{this.getNextLink()}</div>
				</div>
				{this.state.open && this.getPicker()}
			</div>
		);
	}

	getPicker() {
		const gridStyle = {
			display: 'grid',
			gridTemplateColumns: '1fr 50px 50px 50px 50px 50px 1fr',
			gridColumnGap: '10px',
			lineHeight: '25px',
			marginBottom: '10px',
		};
		const activeStyle = { fontWeight: 'bold' };
		const yearStyle = { lineHeight: '30px', margin: '5px', fontSize: '1.2em' };

		return (
			<div>
				<div className="text-center" style={yearStyle} onClick={this.toggleType}>
					{this.state.year}
				</div>
				{this.state.type === 'year' && this.getYears().map((yearRow, index) => (
					<div key={index} style={gridStyle}>
						<div/>
						{yearRow.map(year =>
							<div key={year} className="text-center" onClick={() => this.selectYear(year)}>
								{year}
							</div>
						)}
					</div>
				))}
				{this.state.type === 'week' && this.getMonths().map(month => (
					<div key={month} style={gridStyle}>
						<div/>
						{this.getWeeks(month).map(week =>
							<div key={week} className="text-center">
								<NavLink to={this.getLink(week)} activeStyle={activeStyle} >
									{this.formatWeek(week)}
								</NavLink>
							</div>
						)}
					</div>
				))}
			</div>
		);
	}
	
	getLink(date) {
		return this.props.basename + '/' + this.props.chart + '/' + date;
	}

	getPrevLink() {
		if (this.props.week === this.state.minDate)
			return ;

		return (
			<Link to={this.getLink(DateUtil.toSaturday(this.props.week, -7))}>
				◀&nbsp;
			</Link>
		);
	}

	getNextLink() {
		if (this.props.week === this.state.maxDate)
			return null;

		return (
			<Link to={this.getLink(DateUtil.toSaturday(this.props.week, 7))}>
				&nbsp;▶
			</Link>
		);
	}

	formatWeekOf(week) {
		var weekA = week.split('-');
		weekA.push(weekA.shift());
		return weekA.join('/');
	}

	formatWeek(week) {
		return week.split('-').slice(1, 3).join('/');
	}

	toggle() {
		this.setState({ open: !this.state.open });
	}

	toggleType() {
		if (this.state.type === 'week') {
			this.setState({ type: 'year' });
		} else {
			this.setState({ type: 'week' });
		}
	}

	selectYear(year) {
		this.setState({ year: year, type: 'week' });
	}

	getYears() {
		const minYear = DateUtil.getYear(this.state.minDate);
		const maxYear = DateUtil.getYear(this.state.maxDate);

		var rows = [];
		var years = [];

		for (var i = minYear; i <= maxYear; i++) {
			years.push(i);

			if (i % 5 === 4) {
				rows.push(years);
				years = [];
			}
		}

		if (years.length > 0)
			rows.push(years);

		return rows;
	}

	getMonths() {
		const year = this.state.year;
		const maxYear = DateUtil.getYear(this.state.maxDate);
		var months = [];
		var i;
		var lastMonth = 12;

		if (year === maxYear) {
			lastMonth = DateUtil.getMonth(this.state.maxDate);
		}

		for (i = 1; i <= lastMonth; i++) {
			months.push(i);
		}

		return months;
	}

	getWeeks(month) {
		const year = this.state.year;
		var weeks = [];
		var i, week;

		for (i = 0; i < 5; i++) {
			week = DateUtil.toSaturday(year + '-' + month + '-1', i * 7);

			if (DateUtil.getMonth(week) !== month)
				break;

			if (week > this.state.maxDate)
				break;

			weeks.push(week);
		}

		return weeks;
	}
}
