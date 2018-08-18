import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

export default class Image extends Component {
	render() {
		const id = this.props.id;
		const size = this.props.size;
		const borderRadiusMap = {
			300: 15,
			30: 15,
		}
		var pixel = size + 'px';
		var borderRadius = borderRadiusMap[size] ? borderRadiusMap[size] : size/5;
		var outerStyle = {display: 'flex', alignContent: 'center', maxHeight: pixel, maxWidth: pixel};
		var innerStyle = {margin: 'auto', width: pixel, height: pixel, borderRadius: borderRadius + 'px'};

		var image = (
			<div style={outerStyle}>
				<img src={'/' + id + '.jpg'} style={innerStyle} alt={id} />
			</div>
		);

		if (this.props.noLink)
			return image;

		return (
			<Link to={'/album/' + id}>
				{image}
			</Link>
		);
	}
}