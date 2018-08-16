import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image, Loader, NameArray, Release, ViewSelector } from '../Common';

import TextUtil from '../../util/text';

export default class Artist extends Component {
	
	constructor(props) {
		super(props);

		const id = this.props.match.params.id;

		this.state = {id: id, artist: null};

		this.getSingleView = this.getSingleView.bind(this);
		this.cmpSingle = this.cmpSingle.bind(this);
	}
	
	componentDidMount() {
		this.fetch(this.state.id);
	}
	
	componentWillReceiveProps(nextProps) {
		const id = nextProps.match.params.id;
		this.setState({id: id, artist: null});
		this.fetch(id);
	}

	render() {
		const artist = this.state.artist;

		if (artist === null)
			return <Loader />;

		const [directAlbums, otherAlbums] = this.getDirectAlbums();
		const songs = this.getSongs();
		const singles = this.getSingles(songs);
		var features = this.getFeatures(otherAlbums);

		if (this.cmpIds(songs.map(s => s.id), features))
			features = [];
		
		var views = [];

		if (directAlbums.length > 0)
			views.push({name: 'Albums', view: this.getAlbumsView(directAlbums)});
		if (singles.length > 0)
			views.push({name: 'Singles', view: singles.map(this.getSingleView)});
		if (songs.length > 0)
			views.push({name: 'Songs', view: this.getSongsView(songs)});
		if (features.length > 0)
			views.push({name: 'Features', view: this.getFeaturesView(features)});
		if (artist.As.length > 0 || artist.Bs !== undefined)
			views.push({name: 'Relations', view: this.getRelationsView()});

		return (
			<div>
				<div className="top text-right">
					<a href={'/#/edit/artist/' + artist.id} className="gray"><small>Edit</small></a>
				</div>
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
	
	getSingleView(single) {
		const album = single.album;
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '50px', height: '50px', lineHeight: '50px', fontSize: '1.5em', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', marginLeft: '10px'};

		return (
			<div key={single.songs[0].id} className="flex-container" style={outerStyle}>
				<Image id={album.id} size={50} />
				<div style={rankStyle} className="text-center">
					{single.rank.min}
				</div>
				<div className="flex-1" style={innerStyle}>
					<div className="flex-container flex-space-between">
						<div>
							{single.songs.map((song, index) => [
								<span key={'span' + index}>{index > 0 && ' / '}</span>,
								<Link to={'/song/' + song.id} key={song.id}>
									{TextUtil.normalize(song.title)}
								</Link>
							])}
						</div>
						<div>
							<Release date={album.release} />
						</div>
					</div>
					<div>
						{this.getArtistView('by', single.artists)}
						{single.features.length > 0 && this.getArtistView('feat.', single.features)}
					</div>
				</div>
			</div>
		);
	}

	getSongsView(songs) {
		const ids = [this.state.artist.id];
		const albums = this.state.artist.albums;
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px'};
		var rankStyle = {width: '32px', textAlign: 'right', marginRight: '3px', minWidth: '32px'};
		var artistStyle = {marginLeft: '35px'};

		var globalMin = 11;

		albums.forEach(album => {
			album.songs.filter(song => song.album === album).forEach(song => {
				if (song.rank)
					globalMin = Math.min(song.rank.min, globalMin);
			});
		});

		if (globalMin === 11) {
			rankStyle.width = '7px';
			rankStyle.minWidth = '7px';
			artistStyle.marginLeft = '10px';
		}

		return albums.map(album => {
			const songs = album.songs.filter(song => song.album === album);

			if (songs.length === 0)
				return null;

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
					{showOnce && songs.length > 2 &&
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
							{(showOnce === false || songs.length === 2) && index === 0 &&
								<div>
									<Release date={album.release} />
								</div>
							}
						</div>,
						<div key={'artist' + song.id} style={artistStyle}>
							{showOnce || this.cmpIds(ids, song.artists) || this.getArtistView('by', song.artists)}
							{song.features.length > 0 && this.getArtistView('feat.', song.features)}
						</div>
					])}
					{showOnce && songs.length === 2 &&
						<div className="flex-container flex-space-between" style={artistStyle}>
							<div>{this.getArtistView('by', songs[0].artists)}</div>
						</div>
					}
				</div>
			</div>
			);
		});
	}
	
	getFeaturesView(songs) {
		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px'};
		var rankStyle = {width: '32px', textAlign: 'right', marginRight: '3px', minWidth: '32px'};
		var artistStyle = {marginLeft: '35px'};

		var globalMin = 11;

		songs.forEach(song => {
			if (song.rank)
				globalMin = Math.min(song.rank.min, globalMin);
		});

		if (globalMin === 11) {
			rankStyle.width = '7px';
			rankStyle.minWidth = '7px';
			artistStyle.marginLeft = '10px';
		}

		return songs.map(song => {
			const album = song.album;
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
		});
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

	createSingle(song) {
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

		song.rank = {min: min, run: run + count, count: count};

		return {
			songs: [song],
			album: song.album,
			artists: song.artists,
			features: song.features,
			rank: song.rank,
		};
	}

	// b into a
	mergeArtistArrays(a, b) {
		b.forEach(artist => {
			if (a.filter(a => (a.id === artist.id)).length === 0)
				a.push(artist);
		});
	}

	getSingles(songs) {
		const artist = this.state.artist;
		var singles = [];

		songs.forEach(song => {
			if (song.rank) {
				singles[song.id] = this.createSingle(song);
			}
		});

		if (artist.singleGroups.length > 0) {
			artist.singleGroups.forEach(group => {
				if (singles[group[0]]) {
					var single = singles[group[0]];
					var cur;
					var songs = [];
					group.forEach((songId, index) => {
						cur = singles[songId];
						songs[index] = singles[songId].songs[0];
						this.mergeArtistArrays(single.artists, cur.artists);
						this.mergeArtistArrays(single.features, cur.features);

						if (index > 0)
							singles[songId].merged = true;
					})
					single.songs = songs;
				}
			});

			singles = singles.filter(s => (s.merged !== true));
		}
		
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
	
	getAlbumsView(albums) {
		const ids = [this.state.artist.id];

		var outerStyle = {marginBottom: '5px'};
		var innerStyle = {lineHeight: '25px', marginLeft: '10px'};
		var rankStyle = {width: '50px', height: '50px', lineHeight: '50px', fontSize: '1.5em', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', marginRight: '10px'};
		var emptyRankStyle = {width: '50px', marginRight: '10px'};

		var globalMin = 11;

		albums.forEach(album => {
			var min = 11;
			for (var i in album.rank) {
				min = Math.min(min, album.rank[i].min);
			}
			globalMin = Math.min(min, globalMin);

			if (min < 11)
				album.rank.min = min;
		});

		return albums.map(album => {
			const cmpResult = this.cmpIds(ids, album.albumArtists);
			const min = album.rank ? album.rank.min : 11;

			return (
				<div key={album.id} className="flex-container" style={outerStyle}>
					{globalMin < 11 &&
						(min < 11 ?
						<div style={rankStyle} className="text-center">{min}</div> :
						<div style={emptyRankStyle} />)
					}
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
		});
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
