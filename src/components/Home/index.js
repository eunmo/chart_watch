import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

export default class Home extends Component {

	constructor(props) {
		super(props);

		this.state = {summary: null};
	}
	
	componentDidMount() {
		this.fetch();
	}

	render() {
		const summary = this.state.summary;
		if (summary === null)
			return null;

		const array = this.getArray();

		const style = {fontSize: '1.5em', lineHeight: '100px'};

		return (
			<div>
				<div className="top text-center">Chart Watch React</div>
				<div style={style}>&nbsp;</div>
				{array.map(elem => (
					<div key={elem.desc} style={style}>
						<Link to={elem.link}>
							<div className="flex-container">
								<div className="flex-1 text-right">{elem.num}</div>
								<div>&nbsp;</div>
								<div className="flex-1">{elem.desc}</div>
							</div>
						</Link>
					</div>
				))}
			</div>
		);
	}

	getArray() {
		const summary = this.state.summary;
		var array = [];

		array.push({link: 'initials', num: summary.Artists, desc: 'Artists'});

		var date = new Date().toISOString().split('-').slice(0, 2).join('');
		array.push({link: 'monthly/' + date, num: summary.Albums, desc: 'Albums'});
		
		array.push({link: '', num: summary.SingleCharts, desc: 'Chart Weeks'});
		array.push({link: 'play-history', num: summary.Songs, desc: 'Songs'});

		return array;
	}

	fetch() {
		const that = this;
		const url = '/api/summary';

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({summary: data});
    });

	}
}
