import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { ArtistView, Image, Release } from '../Common';

import TextUtil from '../../util/text';

export default class ArtistFeatures extends Component {
  render() {
    const songs = this.props.data.songs;

    var outerStyle = { marginBottom: '5px' };
    var innerStyle = { lineHeight: '25px' };
    var rankStyle = {
      width: '32px',
      textAlign: 'right',
      marginRight: '3px',
      minWidth: '32px'
    };
    var artistStyle = { marginLeft: '35px' };

    var globalMin = 11;

    songs.forEach(song => {
      if (song.rank) globalMin = Math.min(song.rank.min, globalMin);
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
              <ArtistView artists={song.artists} />
              <ArtistView prefix="feat." artists={song.features} />
            </div>
          </div>
        </div>
      );
    });
  }

  getRankView(song) {
    if (song.rank === undefined) return null;

    var rank = song.rank.min;

    var symbol = '☆';

    if (rank === 1) {
      symbol = '★★';
    } else if (rank <= 5) {
      symbol = '★';
    }

    return symbol;
  }
}
