import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import Image from '../Image';
import NameArray from '../NameArray';
import Release from '../Release';
import ViewSelector from '../ViewSelector';

import TextUtil from '../../util/text';

export default class Artist extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, artist: null};

		this.getAlbumView = this.getAlbumView.bind(this);
		this.getSingleView = this.getSingleView.bind(this);
		this.getFeatureView = this.getFeatureView.bind(this);
		this.cmpSingle = this.cmpSingle.bind(this);
	}
	
	componentDidMount() {
		this.fetch(this.state.id);
	}
	
	componentWillReceiveProps(nextProps) {
		const id = nextProps.match.params.id;
		if (id !== this.state.id) {
			this.setState({id: id, artist: null});
			this.fetch(id);
		}
	}

	render() {
		const artist = this.state.artist;

		if (artist === null)
			return null;

		const [directAlbums, otherAlbums] = this.getDirectAlbums();
		const songs = this.getSongs();
		const singles = this.getSingles(songs);
		const features = this.getFeatures(otherAlbums);
		
		var views = [];

		if (directAlbums.length > 0)
			views.push({name: 'Albums', view: directAlbums.map(this.getAlbumView)});
		if (singles.length > 0)
			views.push({name: 'Singles', view: singles.map(this.getSingleView)});
		if (songs.length > 0)
			views.push({name: 'Songs', view: this.getSongsView(songs)});
		if (features.length > 0)
			views.push({name: 'Features', view: features.map(this.getFeatureView)});
		if (artist.As.length > 0 || artist.Bs !== undefined)
			views.push({name: 'Relations', view: this.getRelationsView()});

		return (
			<div>
				<div className="top">&nbsp;</div>
				<div className="top text-center">
					{TextUtil.normalize(artist.name)}
				</div>
				<div className="text-center">
					{this.getDescription()}
				</div>
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-1">
						<ViewSelector views={views} />
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
	}

	getAs() {
		const artist = this.state.artist;
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
		const artist = this.state.artist;
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

	getRelationsView() {
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

	getRankView(song) {
		if (song.rank === undefined)
			return null;

		var rank = song.rank.min;

		var symbol = '☆';

		if (rank === 1) {
			symbol = '★★';
		} else if (rank <= 5) {
			symbol = '★';
		}

		return symbol;
	}
	
	getSingleView(song) {
		const album = song.album;
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '50px', height: '50px', lineHeight: '50px', fontSize: '1.5em', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', marginLeft: '10px'};

		return (
			<div key={song.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div style={rankStyle} className="text-center">
					{song.rank.min}
				</div>
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							<Link to={'/song/' + song.id}>
								{TextUtil.normalize(song.title)}
							</Link>
						</div>
						<div>
							<Release date={album.release} />
						</div>
					</div>
					<div>
						{this.getArtistView('by', song.artists)}
						{song.features.length > 0 && this.getArtistView('feat.', song.features)}
					</div>
				</div>
			</div>
		);
	}

	getSongsView(songs) {
		const ids = [this.state.artist.id];
		const albums = this.state.artist.albums;
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '25px', textAlign: 'right', marginRight: '3px', minWidth: '25px'};
		var artistStyle = {marginLeft: '28px'};

		return albums.map(album => {
			const songs = album.songs.filter(song => song.album === album);
			var allSame = true;
			var showOnce = false;
			var artistIds = songs[0].artists.map(artist => artist.id);

			if (songs.length > 1 && this.cmpIds(ids, songs[0].artists) === false) {
				songs.forEach(song => {
					if (this.cmpIds(artistIds, song.artists) === false) {
						allSame = false;
					}
				});

				showOnce = allSame;
			}

			return (
			<div key={album.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div className="flex-1" style={innerStyle}>
					{showOnce &&
						<div className="flex-container flex-space-between" style={artistStyle}>
							<div>{this.getArtistView('by', songs[0].artists)}</div>
								<div>
									<Release date={album.release} />
								</div>
						</div>
					}
					{album.songs.filter(song => song.album === album).map((song, index) => [
						<div key={'title' + song.id} className="flex-container flex-space-between">
							<div>
								<Link to={'/song/' + song.id}>
									<div className="flex-container">
										<div style={rankStyle}>{this.getRankView(song)}</div>
										<div>{TextUtil.normalize(song.title)}</div>
									</div>
								</Link>
							</div>
							{showOnce === false && index === 0 &&
								<div>
									<Release date={album.release} />
								</div>
							}
						</div>,
						<div key={'artist' + song.id} style={artistStyle}>
							{showOnce || this.cmpIds(ids, album.albumArtists) || this.getArtistView('by', song.artists)}
							{song.features.length > 0 && this.getArtistView('feat.', song.features)}
						</div>
					])}
				</div>
			</div>
			);
		});
	}
	
	getFeatureView(song) {
		const album = song.album;
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '25px', textAlign: 'right', marginRight: '3px'};
		var artistStyle = {marginLeft: '28px'};

		return (
			<div key={song.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							<Link to={'/song/' + song.id}>
								<div className="flex-container">
									<div style={rankStyle}>{this.getRankView(song)}</div>
									<div>{TextUtil.normalize(song.title)}</div>
								</div>
							</Link>
						</div>
						<div>
							<Release date={album.release} />
						</div>
					</div>
					<div style={artistStyle}>
						{this.getArtistView('by', song.artists)}
						{song.features.length > 0 && this.getArtistView('feat.', song.features)}
					</div>
				</div>
			</div>
		);
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

	summarizeRank(song) {
		var min = 10;
		var run = 0;
		var count = 0;
		var i;

		for (i in song.rank) {
			if (song.rank[i]) {
				if (min > song.rank[i].min)
					count = 0;

				min = Math.min(min, song.rank[i].min);
				run += song.rank[i].run;

				if (min === song.rank[i].min)
					count += song.rank[i].count;
			}
		}

		song.rank.min = min;
		song.rank.run = run + count;
		song.rank.count = count;
	}

	getSingles(songs) {
		var singles = [];

		songs.forEach(song => {
			if (song.rank) {
				this.summarizeRank(song);
				singles.push(song);
			}
		});

		singles.sort(this.cmpSingle);

		return singles;
	}

	cmpSingle(a, b) {
		if (a.rank.min !== b.rank.min)
			return a.rank.min - b.rank.min;

		if (a.rank.count !== b.rank.count)
			return b.rank.count - a.rank.count;

		if (a.rank.run !== b.rank.run)
			return b.rank.run - a.rank.run;

		return this.cmpSong(a, b);
	}

	cmpSong(a, b) {
		if (a.album === b.album) {
			if (a.disk === b.disk)
				return a.track - b.track;

			return a.disk - b.disk;
		}

		if (a.album.release === b.album.release)
			return a.album.id - b.album.id;

		return a.album.release < b.album.release ? 1 : -1;
	}

	getSongs() {
		var songs = [];
		
		this.state.artist.albums.forEach(album => {
			album.songs.forEach((song, index) => {
				if (songs[song.id] === undefined) {
					songs[song.id] = song;
				} else {
					album.songs[index] = songs[song.id];
				}
			})
		});

		this.state.artist.albums.forEach(album => {
			album.songs.forEach(song => {
				if (song.album === undefined || song.album.release > album.release) {
					song.album = album;
					songs[song.id] = song;
				}
			});
		});
		
		songs = songs.filter(song => song.id);
		songs.sort(this.cmpSong);

		return songs;
	}

	getFeatures(albums) {
		var songs = [];

		albums.forEach(album => {
			album.songs.forEach(song => {
				if (song.album === album)
					songs[song.id] = song;
			});
		});
		
		songs = songs.filter(song => song.id);
		songs.sort((a, b) => a.album.release < b.album.release ? 1 : -1);

		return songs;
	}

	cmpIds(ids, artists) {
		if (ids.length !== artists.length)
			return false;

		for (var i = 0; i < ids.length; i++) {
			if (ids[i] !== artists[i].id)
				return false;
		}

		return true;
	}
	
	getAlbumView(album) {
		const ids = [this.state.artist.id];
		const cmpResult = this.cmpIds(ids, album.albumArtists);

		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};

		return (
			<div key={album.id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							{TextUtil.normalize(album.title)}
						</div>
						<div>
							<Release date={album.release} />
						</div>
					</div>
					<div>
						<small>{album.format}</small>
						{cmpResult ||
							<span><small> by</small> <NameArray array={album.albumArtists} /></span>
						}
					</div>
				</div>
			</div>
		);
	}

	getDirectAlbums() {
		const ids = this.state.artist.ids;
		var albums = [];
		var others = [];
		
		this.state.artist.albums.sort((a, b) => {
			if (a.release === b.release)
				return a.id - b.id;
				
			return a.release < b.release ? 1 : -1;
		});

		this.state.artist.albums.forEach(album => {
			var isDirect = false;

			album.albumArtists.forEach(artist => {
				if (ids.includes(artist.id)) {
					isDirect = true;
				}
			});

			if (isDirect) {
				albums.push(album);
			} else {
				others.push(album);
			}
		});

		return [albums, others];
	}

	getDescription() {
		const artist = this.state.artist;
		var desc = '';

		if (artist.gender !== null)
			desc += artist.gender + ' ';

		if (artist.type !== null)
			desc += artist.type + ' ';

		if (artist.origin !== null)
			desc += 'from ' + artist.origin;

		return desc;
	}

	fetch(id) {
		const that = this;
		const url = '/api/artist/' + id;

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({artist: data});
    });
	}
}
