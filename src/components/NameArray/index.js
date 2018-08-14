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

			if (artist.Bs) {
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

				if (Bs.length > 0) {
					string += ' (' + type;
						Bs.forEach((artist, index) => {
							if (index > 0)
								string += '+';

							string += TextUtil.normalize(artist.name);
						});
					string += ')';
				}
			}
		});

		return <span>{string}</span>;
	}
}
