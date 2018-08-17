import React, { Component } from 'react';

import './style.css';

import { NameArray } from '../Common';

export default class ArtistRelations extends Component {
	
	render() {
		var As = {
			a: 'Alias of ',
			c: 'Voiced Character ',
			f: 'Had Former Member ',
			m: 'Has Member ',
			p: 'In Project Group ',
			u: 'Has Unit '
		};

		var Bs = {
			a: 'Alias of ',
			c: 'Voiced by ',
			f: 'Former Member of ',
			m: 'Member of ',
			p: 'Project Group of ',
			u: 'Unit of '
		};

		var aViews = this.getAs().map(rel => (
			<div key={'A' + rel.type}>
				{this.getArtistView(As[rel.type], rel.artists)}
			</div>
		));
		
		var bViews = this.getBs().map(rel => (
			<div key={'B' + rel.type}>
				{this.getArtistView(Bs[rel.type], rel.artists)}
			</div>
		));
		
		return aViews.concat(bViews);
	}

	getAs() {
		const artist = this.props.data.artist;
		if (artist.As.length === 0)
			return [];

		var i, A;
		var As = {};

		for (i in artist.As) {
			A = artist.As[i];
			if (As[A.type] === undefined)
				As[A.type] = [];

			As[A.type].push(A);
		}

		var array = [];
		for (i in As) {
			As[i].sort((a, b) => { var x = a.name; var y = b.name; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
			array.push({ type: i, artists: As[i] });
		}

		array.sort((a, b) => { var x = a.type; var y = b.type; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
		return array;
	}

	getBs() {
		const artist = this.props.data.artist;
		if (artist.Bs === undefined)
      return [];

    var array = [];
    for (var i in artist.Bs) {
      if (i === 'p') {
        array.push({ type: i, artists: artist.Bs[i] });
      }else {
        array.push({ type: i, artists: [artist.Bs[i]] });
      }
    }

    array.sort((a, b) => { var x = a.type; var y = b.type; return ((x < y) ? -1 : ((x > y) ? 1 : 0)); });
		return array;
	}

	getArtistView(prefix, artists) {
		var prefixStyle = {marginRight: '5px'};
		return (
			<div className="flex-container">
				<div style={prefixStyle}><small>{prefix}</small></div>
				<div className="flex-1"><NameArray array={artists} /></div>
			</div>
		);
	}
}
