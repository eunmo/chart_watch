import React, { Component } from 'react';

import './style.css';

import { Chart } from '../Common';

export default class AlbumChart extends Component {

	render() {
		const charts = this.props.data;

		if (charts.weeks.length === 0)
			return null;

		return (
			<div className="flex-container flex-center">
				<Chart data={charts} />
			</div>
		);
	}
}
	
