import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

export default class Image extends Component {
	render() {
		const id = this.props.id;
		const size = this.props.size;
		var pixel = size + 'px';
		var borderRadius = size === 300 ? size/20 : size/5;
		var outerStyle = {display: 'flex', alignContent: 'center', maxHeight: pixel, maxWidth: pixel};
		var innerStyle = {margin: 'auto', width: pixel, height: pixel, borderRadius: borderRadius + 'px'};

		return (
			<Link to={'/album/' + id}>
				<div style={outerStyle}>
					<img src={'/' + id + '.jpg'} style={innerStyle} alt={id} />
				</div>
			</Link>
		);
	}
}
