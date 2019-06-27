import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Dropdown, Image, NameArray, Loader, WeekPicker } from '../Common';

import TextUtil from '../../util/text';

export default class Single extends Component {
  constructor(props) {
    super(props);

    const chart = this.props.match.params.chart;
    const week = this.props.match.params.week;

    this.state = { chart: chart, week: week, data: null };

    this.play = this.play.bind(this);
    this.fetch = this.fetch.bind(this);
    this.match = this.match.bind(this);
    this.clear = this.clear.bind(this);
  }

  componentDidMount() {
    this.view(this.state.week);
  }

  componentWillReceiveProps(nextProps) {
    const week = nextProps.match.params.week;

    if (this.state.week !== week) {
      this.setState({ week: week });
      this.view(week);
    }
  }

  render() {
    const chart = this.state.chart;
    const data = this.state.data;
    if (data === null) return <Loader />;

    var songs = [];
    var rows = [];
    var prevRow = { rank: 0 };

    data.songs.forEach(song => {
      songs[song.id] = song;
    });
    data.thisWeek.forEach(row => {
      if (prevRow.rank !== row.rank) {
        prevRow = { rank: row.rank, titles: [], songs: [] };
        rows.push(prevRow);
      }

      if (row.id === null) {
        prevRow.artist = row.artist;
        prevRow.titles[row.order] = row.title;
        prevRow.lastWeek = row.lastWeek;
      } else {
        prevRow.songs[row.order] = songs[row.id];
        prevRow.lastWeek = songs[row.id].lastWeek;
        prevRow.ranked |= songs[row.id].rank;
      }
    });

    var gridStyle = {
      display: 'grid',
      gridTemplateColumns: '50px 50px 1fr',
      gridColumnGap: '10px',
      lineHeight: '25px',
      marginBottom: '10px'
    };

    return (
      <div>
        <div className="top flex-container">
          <div className="flex-1" />
          <div className="text-center">
            {TextUtil.capitalize(chart)} Singles Chart
          </div>
          <div className="flex-1 text-right">
            <Dropdown array={this.getDropdownArray()} />
          </div>
        </div>
        <WeekPicker
          week={this.state.week}
          chart={chart}
          basename={'/chart/single'}
        />
        <div className="vertical-buffer" />
        <div className="flex-container">
          <div className="flex-1 hide-mobile" />
          <div className="flex-3">
            {rows.map(row => (
              <div key={row.rank} style={gridStyle}>
                {this.getRankView(row)}
                {row.songs.length ? (
                  <Image id={row.songs.map(s => s.albumId)[0]} size={50} />
                ) : (
                  <div></div>
                )}
                {this.getRowDetailView(row)}
              </div>
            ))}
          </div>
          <div className="flex-1 hide-mobile" />
        </div>
      </div>
    );
  }

  getSongsToPlay() {
    const data = this.state.data;
    var songs = [];
    var songMap = {};

    data.songs.forEach(song => {
      songMap[song.id] = song;
    });
    data.thisWeek.forEach(row => {
      if (row.id === null) return;

      var song = songMap[row.id];

      var newSong = {
        id: row.id,
        title: song.title,
        artists: song.artists,
        features: song.features,
        albumId: song.albumId,
        plays: song.plays
      };

      if (row.rank <= 10) newSong.minRank = row.rank;

      songs.push(newSong);
    });

    return songs;
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

  getDropdownArray() {
    const chart = this.state.chart;
    return [
      { name: 'Fetch', onClick: this.fetch },
      { name: 'Match', onClick: this.match },
      { name: 'Clear', onClick: this.clear },
      {
        name: 'Old page',
        href: '/#/chart/single/' + chart + '/' + this.state.week
      },
      { name: 'Play', onClick: this.play }
    ];
  }

  getRankView(row) {
    var svgStyle = { width: '50px', height: '50px' };
    var textStyle = {
      fill: 'white',
      alignmentBaseline: 'middle',
      textAnchor: 'middle',
      fontSize: '1.2em'
    };
    var polygonStyle = { fill: 'rgba(255, 255, 255, 0.2)' };
    var newTextStyle = Object.assign({}, textStyle, {
      fill: 'lightgray',
      fontSize: 'smaller'
    });

    var y = 25;
    var polygon = <circle cx={25} cy={25} r={25} style={polygonStyle} />;
    var newText = null;

    if (row.rank < row.lastWeek) {
      polygon = <polygon points="25,0 50,50 0,50" style={polygonStyle} />;
      y += 10;
    }

    if (row.rank > row.lastWeek) {
      polygon = <polygon points="25,50 50,0 0,0" style={polygonStyle} />;
      y -= 10;
    }

    if (row.rank === row.lastWeek) {
      polygon = <polygon points="0,0 50,0 50,50 0,50" style={polygonStyle} />;
    }

    if (row.lastWeek === undefined) {
      y -= 3;
      newText = (
        <text style={newTextStyle} x={25} y={37}>
          {row.songs.filter(s => s.ranked).length > 0 ? 're' : 'new'}
        </text>
      );
    }

    if (row.rank === 1) polygonStyle.fill = 'rgb(255, 45, 85)';
    else if (row.rank <= 5) polygonStyle.fill = 'rgb(88, 86, 214)';

    return (
      <svg style={svgStyle}>
        {polygon}
        <text style={textStyle} x={25} y={y}>
          {row.rank}
        </text>
        {newText};
      </svg>
    );
  }

  // b into a
  mergeArtistArrays(a, b) {
    b.forEach(artist => {
      if (a.filter(a => a.id === artist.id).length === 0) a.push(artist);
    });
  }

  getArtists(row) {
    var artists = [];
    var features = [];

    row.songs.forEach(song => {
      this.mergeArtistArrays(artists, song.artists);
      this.mergeArtistArrays(features, song.features);
    });

    return (
      <span>
        <NameArray array={artists} />
        {features.length > 0 && (
          <span>
            {' '}
            feat. <NameArray array={features} />
          </span>
        )}
      </span>
    );
  }

  getRowDetailView(row) {
    const songs = row.songs;
    var title = null;
    var artist = null;

    if (songs.length > 0) {
      title = row.songs.map((song, index) => [
        <span key={'span' + index}>{index > 0 && ' / '}</span>,
        <Link to={'/song/' + song.id} key={song.id}>
          {TextUtil.normalize(song.title)}
        </Link>
      ]);
      artist = this.getArtists(row);
    } else {
      title = TextUtil.normalize(row.titles.join(' / '));
      artist = (
        <span className="lightgray">{TextUtil.normalize(row.artist)}</span>
      );
    }

    return (
      <div className="overflow-hidden">
        <div className="ellipsis">{title}</div>
        <div className="ellipsis">{artist}</div>
      </div>
    );
  }

  update(type) {
    const that = this;
    var url = '/chart/single/' + type + '/' + this.state.chart;
    var week = this.state.week.split('-');
    url += '?year=' + week[0];
    url += '&month=' + week[1];
    url += '&day=' + week[2];

    this.setState({ data: null });

    fetch(url).then(function(response) {
      that.view(that.state.week);
    });
  }

  fetch() {
    this.update('fetch');
  }

  match() {
    this.update('match');
  }

  clear() {
    this.update('clear');
  }

  view(week) {
    const that = this;
    const url = '/api/chart/single/view/full/' + this.state.chart + '/' + week;

    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        that.setState({ data: data });
      });
  }
}
