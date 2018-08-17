import React, { Component } from 'react';

import './style.css';

import { NameArray } from '..';

export default class ArtistView extends Component {

	render() {
		const filterIds = this.props.filterIds;
		var prefix = 'by';
		var artists = this.props.artists;
		var prefixStyle = {marginRight: '5px'};

		if (filterIds) {
			var map = [];

			filterIds.forEach(id => { map[id] = true });
			artists = artists.filter(a => map[a.id] !== true);
			if (artists.length !== this.props.artists.length) {
				prefix = 'with';
			}
		}

		if (this.props.prefix)
			prefix = this.props.prefix;
			
		if (artists.length === 0)
			return null;

		if (this.props.isSpan) {
			return (
				<span>
					<small>&nbsp;{prefix}</small> <NameArray array={artists} />
				</span>
			);
		}

		return (
			<div className="flex-container">
				<div style={prefixStyle}><small>{prefix}</small></div>
				<div className="flex-1"><NameArray array={artists} /></div>
			</div>
		);
	}
}
