import React, { Component } from 'react';

import './style.css';

import { Chart, Dropdown, Image, Loader, NameArray, Release } from '../Common';

import TextUtil from '../../util/text';

export default class Song extends Component {
  constructor(props) {
    super(props);

    const id = this.props.match.params.id;

    this.state = { id: id, song: null };
    this.play = this.play.bind(this);
    this.download = this.download.bind(this);
  }

  componentDidMount() {
    this.fetch();
  }

  render() {
    const song = this.state.song;
    if (song === null) return <Loader />;

    const headerStyle = {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      lineHeight: '30px',
      paddingLeft: '5px',
      marginBottom: '5px'
    };

    var albums = song.albums;
    albums.sort((a, b) => (a.release < b.release ? -1 : 1));

    return (
      <div className="Song">
        <div className="top text-right">
          <Dropdown array={this.getDropdownArray()} />
        </div>
        <div className="top text-center">{TextUtil.normalize(song.title)}</div>
        <div className="text-center">
          <small>by</small> <NameArray array={song.artists} />
        </div>
        {song.features.length > 0 && (
          <div className="text-center">
            <small>feat.</small> <NameArray array={song.features} />
          </div>
        )}
        <div className="text-center">
          <small className="lightgray">played</small> {song.plays}{' '}
          <small className="lightgray">times</small>
        </div>
        <div className="flex-container flex-adaptive">
          <div className="flex-1">
            <div className="flex-container">
              <div className="flex-1" />
              <div className="Song-albums">
                <div style={headerStyle}>
                  Album{song.albums.length > 1 && 's'}
                </div>
                {song.albums.map(album => this.getAlbumView(album))}
              </div>
              <div className="flex-1" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex-container flex-center">
              <Chart data={song.charts} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  getSongsToPlay() {
    const song = this.state.song;
    var newSong = {
      id: parseInt(song.id, 10),
      title: song.title,
      artists: song.artists,
      features: song.features,
      albumId: song.albums[0].id,
      plays: song.plays
    };

    if (song.charts) {
      var minRank = 101;

      song.charts.weeks.forEach(week => {
        week.ranks.forEach(rank => {
          if (rank !== '-') minRank = Math.min(rank, minRank);
        });
      });

      if (minRank <= 10) newSong.minRank = minRank;
    }

    return [newSong];
  }

  play() {
    if (window.isWebkit) {
      var songs = JSON.stringify(this.getSongsToPlay());
      window.webkit.messageHandlers.addSongs.postMessage(
        encodeURIComponent(songs)
      );
    } else {
      console.log(this.getSongsToPlay());
    }
  }

  download() {
    const song = this.state.song;
    var dl = document.createElement('a');
    dl.href = '/api/download/' + song.id;
    dl.click();
  }

  getDropdownArray() {
    const song = this.state.song;
    return [
      { name: 'Edit', href: '/#/edit/song/' + song.id },
      { name: 'Play', onClick: this.play },
      { name: 'Download', onClick: this.download }
    ];
  }

  getAlbumView(album) {
    var outerStyle = { marginBottom: '5px' };
    var innerStyle = { lineHeight: '25px', marginLeft: '10px' };
    return (
      <div key={album.id} className="flex-container" style={outerStyle}>
        <Image id={album.id} size={50} />
        <div className="flex-1" style={innerStyle}>
          <div className="flex-container flex-space-between">
            <div>{TextUtil.normalize(album.title)}</div>
            <div>
              <Release date={album.release} />
            </div>
          </div>
          <div>
            <small>by</small> <NameArray array={album.artists} />
          </div>
        </div>
      </div>
    );
  }

  fetch() {
    const that = this;
    const url = '/api/song/full/' + this.state.id;

    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        that.setState({ song: data });
      });
  }
}
