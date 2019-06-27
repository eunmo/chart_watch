import React, { Component } from 'react';

import './style.css';

import { Image } from '../../Common';

export default class CurrentGrid extends Component {
  constructor(props) {
    super(props);

    var songs = this.props.data.songs;

    this.state = { rankGroups: this.groupAlbums(songs), filtered: [] };
  }

  render() {
    return (
      <div>
        {this.state.rankGroups.map(row => {
          return (
            <div key={row.rank}>
              <div className="CurrentGrid-header">
                <div className="CurrentGrid-line" />
                <div className="text-center">
                  {row.rank}
                  {row.rank > 5 && '+'}
                </div>
                <div className="CurrentGrid-line" />
              </div>
              <div className="flex-container flex-center flex-wrap">
                {row.albums.map(albumId => (
                  <Image id={albumId} size={50} key={albumId} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  groupAlbums(songs) {
    var ranks = [];

    songs.forEach(song => {
      var minRank = song.curRank[0];

      if (minRank > 10) {
        minRank = 11;
      } else if (minRank > 5) {
        minRank = 6;
      }

      if (ranks[minRank] === undefined)
        ranks[minRank] = { rank: minRank, albums: [] };

      if (ranks[minRank].albums.includes(song.albumId)) return;

      ranks[minRank].albums.push(song.albumId);
    });

    return ranks.filter(e => e);
  }
}
