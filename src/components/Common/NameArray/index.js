import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

import './style.css';

import TextUtil from '../../../util/text';

export default class NameArray extends Component {
	render() {
		const array = this.props.array;

		return (
			<span>
				{array.filter(e => e).map((artist, index) => {
					return (
						<span key={artist.id}>
							{index > 0 && ', '}
							{this.getLink(artist)}
							{this.getBs(artist)}
						</span>
					);
				})}
			</span>
		);
	}

	getBs(artist) {
		if (artist.Bs === undefined)
			return null;
		
		var Bs = [];
		var type = '';
		// display precedence -> a, p, c, m, u, f
		if (artist.Bs.a) {
			Bs = [artist.Bs.a];
			type = 'aka ';
		} else if (artist.Bs.p) {
			Bs = artist.Bs.p;
		} else if (artist.Bs.c) {
			Bs = [artist.Bs.c];
			type = 'cv ';
		} else if (artist.Bs.m) {
			Bs = [artist.Bs.m];
		} else if (artist.Bs.u) {
			Bs = [artist.Bs.u];
		} else if (artist.Bs.f) {
			Bs = [artist.Bs.f];
		}

		if (Bs.length === 0)
			return null;

		return (
			<span>
			 	{' ('}{type}{Bs.map((artist, index) => (
					<span key={artist.id}>
						{index > 0 && '+'}
						{this.getLink(artist)}
					</span>
				))})
			</span>
		);
	}

	getLink(artist) {
		var style = {color: 'aqua'};
		var activeStyle = {color: 'white'};
		var text = TextUtil.normalize(artist.name);

		if (this.props.noLink)
			return text;


		return (
			<NavLink to={'/artist/' + artist.id} style={style} activeStyle={activeStyle}>
				{text}
			</NavLink>
		);
	}
}
