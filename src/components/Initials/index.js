import React, { Component } from 'react';

import './style.css';

import Image from '../Image';
import NameArray from '../NameArray';

import TextUtil from '../../util/text';

export default class Initial extends Component {

	constructor(props) {
		super(props);

		const initials = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

		this.state = {initials: initials, prefix: ''};
		this.add = this.add.bind(this);
		this.erase = this.erase.bind(this);
	}
	
	render() {
		var artistRowStyle = { lineHeight: '30px', marginTop: '5px' };
		var artistImageStyle = { width: '30px', marginRight: '5px', minWidth: '30px' };
		var grayStyle = {color: 'gray'};

		var view = null;
		if (this.state.prefix === '') {
			view = (
				<div>
					<div className="top text-center">
						Artists
					</div>
					<div className="flex-container flex-center flex-wrap">
						{this.state.initials.map(initial => (
							<div key={initial} className="Initials-key text-center" onClick={() => this.fetch(initial)}>
								{initial}
							</div>
						))}
						<div className="Initials-key text-center" style={grayStyle}>⌫</div>
					</div>
				</div>
			);
		} else {
			const filtered = this.filter();
			const validMap = this.getValidKeys(filtered);
			view = (
				<div>
					<div className="top text-center">
						{filtered.length} Artists: {this.state.prefix}
					</div>
					<div className="flex-container flex-center flex-wrap">
						{this.state.initials.map(initial => {
							var style = {};
							var onClick = () => this.add(initial);

							if (validMap[initial] !== true) {
								style.color = 'gray';
								onClick = null;
							}

							return (
								<div key={initial} style={style} className="Initials-key text-center" onClick={onClick}>
									{initial}
								</div>
							);
						})}
						<div onClick={() => this.erase()}  className="Initials-key text-center">⌫</div>
					</div>
					<div>
						{filtered.map(artist => (
							<div key={artist.id} className="flex-container" style={artistRowStyle}>
								<div style={artistImageStyle}>
									{artist.maxAlbum !== 0 && <Image id={artist.maxAlbum} size={30} />}
								</div>
								<div>
									<NameArray array={[artist]} />
								</div>
							</div>
						))}
					</div>
				</div>
			);
		}

		return (
			<div className="flex-container">
				<div className="flex-1 hide-mobile" />
				<div className="flex-1">
					{view}
				</div>
				<div className="flex-1 hide-mobile" />
			</div>
		);
	}
	
	add(initial) {
		this.setState({prefix: this.state.prefix + initial});
	}

	erase() {
		const prefix = this.state.prefix;
		this.setState({prefix: prefix.substring(0, prefix.length -1)});
	}

	filter() {
		var filtered = this.state.artists.filter(artist => (artist.initial.startsWith(this.state.prefix)));

		return filtered;
	}

	getValidKeys(filtered) {
		var map = {};
		var len = this.state.prefix.length;

		filtered.forEach(artist => {
			map[artist.initial.charAt(len)] = true;
		});

		return map;
	}

	getInitial(nameNorm) {
		const krn = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
		const krnFull = '가나다라마바사아자차카타파하';
		var name = nameNorm;
		var initialized = '';
		var i;
		
		name = name.replace(/\(.*\)/g, '');
		name = name.replace(/[ `(),.&+\-!]/g, '');
		name = TextUtil.removeDiacritics(name);

		name.split('').forEach(c => {
			if (c.match(/[A-Za-z]/)) {
				initialized += c.toUpperCase();
			} else if (c < '가') {
				initialized += '#';
			} else {
				for (i = 0; i < 13; i++) {
					if (c < krnFull.charAt(i + 1)) {
						break;
					}
				}
						
				initialized += krn.charAt(i);
			}
		});
		
		return initialized;
	}

	cmpFn(a, b) {
		if (a.maxAlbum === 0 && b.maxAlbum === 0)
			return a.nameNorm < b.nameNorm ? -1 : 1;

		if (a.maxAlbum === 0)
			return 1;

		if (b.maxAlbum === 0)
			return -1;

		return a.nameNorm < b.nameNorm ? -1 : 1;
	}
	
	fetch(initial) {
		const that = this;
		var req = initial;

		if (req === '#')
			req = '0-9';

		const url = '/api/initial/short/' + req;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
			data.sort(that.cmpFn);
			data.forEach(artist => { artist.initial = that.getInitial(artist.nameNorm); });
      that.setState({prefix: initial, artists: data, filteredArtists: data});
    });
	}
}
