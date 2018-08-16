import React, { Component } from 'react';

import './style.css';

export default class Release extends Component {
	render() {
		var date = new Date(this.props.date).toLocaleDateString();
		var style = {color: 'lightgray', fontSize: 'smaller'};

		return (
			<span style={style}>
				{date}
			</span>
		)
	}
}
