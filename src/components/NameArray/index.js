import React, { Component } from 'react';

import './style.css';

import TextUtil from '../../util/text';

export default class NameArray extends Component {
	render() {
		const array = this.props.array;

		var string = '';

		array.forEach((artist, index) => {
			if (index > 0)
				string += ', ';
			string += TextUtil.normalize(artist.name);
		});

		return <span>{string}</span>;
	}
}
