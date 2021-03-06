import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image, Loader, NameArray } from '../Common';

import TextUtil from '../../util/text';

export default class Initial extends Component {
  constructor(props) {
    super(props);

    const initials = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split(
      ''
    );

    this.state = { initials: initials, link: this.props.match.params.prefix };
    this.add = this.add.bind(this);
    this.erase = this.erase.bind(this);
    this.cmpFn = this.cmpFn.bind(this);
  }

  componentDidMount() {
    this.fetch(this.state.link);
  }

  render() {
    var artistRowStyle = { lineHeight: '30px', marginTop: '5px' };
    var artistImageStyle = {
      width: '30px',
      marginRight: '5px',
      minWidth: '30px'
    };

    if (this.state.artists === undefined) return <Loader />;

    const filtered = this.filter();
    const validMap = this.getValidKeys(filtered);

    return (
      <div>
        <div className="top text-center">
          {filtered.length}
          {this.state.link === 'Favorites' && ' Favorite'} Artists:{' '}
          {this.state.prefix}
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
              <div
                key={initial}
                style={style}
                className="Initials-key text-center"
                onClick={onClick}
              >
                {initial}
              </div>
            );
          })}
          {this.getDeleteView()}
        </div>
        <div>
          {filtered.map(artist => (
            <div
              key={artist.id}
              className="flex-container"
              style={artistRowStyle}
            >
              <div style={artistImageStyle}>
                {artist.maxAlbum !== 0 && (
                  <Image id={artist.maxAlbum} size={30} />
                )}
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

  getDeleteView() {
    const prefix = this.state.prefix;

    var toAll = (
      <div className="Initials-key text-center">
        <Link to="/initials">⌫</Link>
      </div>
    );
    var deleteChar = (
      <div onClick={() => this.erase()} className="Initials-key text-center">
        ⌫
      </div>
    );

    if (
      (this.state.link === 'Favorites' && prefix.length === 0) ||
      prefix.length === 1
    )
      return toAll;

    return deleteChar;
  }

  add(initial) {
    this.setState({ prefix: this.state.prefix + initial });
  }

  erase() {
    const prefix = this.state.prefix;
    this.setState({ prefix: prefix.substring(0, prefix.length - 1) });
  }

  filter() {
    const prefix = this.state.prefix;
    var exactMatch = this.state.artists.filter(
      artist => artist.initial === prefix
    );
    var prefixMatch = this.state.artists.filter(
      artist => artist.initial !== prefix && artist.initial.startsWith(prefix)
    );

    exactMatch.sort(this.cmpFn);
    prefixMatch.sort(this.cmpFn);

    return exactMatch.concat(prefixMatch);
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

  cmpFnU(a, b) {
    return a.nameNorm.toUpperCase() < b.nameNorm.toUpperCase() ? -1 : 1;
  }

  cmpFn(a, b) {
    if (a.maxAlbum === 0 && b.maxAlbum === 0) return this.cmpFnU(a, b);

    if (a.maxAlbum === 0) return 1;

    if (b.maxAlbum === 0) return -1;

    return this.cmpFnU(a, b);
  }

  filterPrefix(prefix) {
    if (prefix === '0-9') return '#';

    if (prefix === 'Favorites') return '';

    return prefix;
  }

  fetch(initial) {
    const that = this;
    var req = initial;

    const url = '/api/initial/short/' + req;

    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        data.sort(that.cmpFn);
        data.forEach(artist => {
          artist.initial = that.getInitial(artist.nameNorm);
        });
        that.setState({
          prefix: that.filterPrefix(initial),
          artists: data,
          filteredArtists: data
        });
      });
  }
}
