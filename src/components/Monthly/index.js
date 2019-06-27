import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './style.css';

import { Image } from '../Common';

export default class Monthly extends Component {
  constructor(props) {
    super(props);

    const year = this.props.match.params.month.substring(0, 4);
    const month = this.props.match.params.month.substring(4, 6);
    const [weeks, days] = this.getDayGrid(year, month);

    this.state = {
      year: year,
      month: month,
      weeks: weeks,
      days: days,
      width: 0,
      height: 0
    };
    this.updateDimensions = this.updateDimensions.bind(this);
    this.selectDay = this.selectDay.bind(this);
  }

  updateDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  componentWillMount() {
    this.updateDimensions();
  }

  componentDidMount() {
    this.fetch(this.state.year, this.state.month);
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  componentWillReceiveProps(nextProps) {
    const year = nextProps.match.params.month.substring(0, 4);
    const month = nextProps.match.params.month.substring(4, 6);

    if (this.state.year !== year || this.state.month !== month) {
      this.setState({ year: year, month: month });
      this.fetch(year, month);
    }
  }

  getPrevMonth() {
    return new Date(Date.UTC(this.state.year, this.state.month - 2, 1))
      .toISOString()
      .split('-')
      .slice(0, 2)
      .join('');
  }

  getNextMonth() {
    return new Date(Date.UTC(this.state.year, this.state.month, 1))
      .toISOString()
      .split('-')
      .slice(0, 2)
      .join('');
  }

  render() {
    const weeks = this.state.weeks;

    return (
      <div className="text-center">
        <div className="top">
          <Link to={'/monthly/' + this.getPrevMonth()}>◀</Link>
          <span>
            {' '}
            {this.state.month} {this.state.year}{' '}
          </span>
          <Link to={'/monthly/' + this.getNextMonth()}>▶</Link>
        </div>
        <div>
          {weeks.map((week, index) => {
            return (
              <div key={index}>
                <div className="flex-container">
                  {week.days.map((day, index) => {
                    var style = { width: '14%' };
                    var headerStyle = { lineHeight: '50px', fontSize: '1.2em' };
                    if (day === null)
                      return (
                        <div key={index} className="flex-1" style={style} />
                      );

                    var albums = day.albums;

                    if (this.state.width <= 543) {
                      albums = albums.slice(0, 1);
                      if (albums.length !== day.albums.length) {
                        headerStyle.textDecoration = 'underline';
                      }
                    }

                    if (this.state.selectedDay === day) albums = day.albums;

                    return (
                      <div key={index} className="flex-1" style={style}>
                        <div
                          style={headerStyle}
                          onClick={() => this.selectDay(day)}
                        >
                          {day.day}
                        </div>
                        {this.getAlbums(albums)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  selectDay(day) {
    this.setState({ selectedDay: this.state.selectedDay === day ? null : day });
  }

  getAlbums(albums) {
    if (albums.length === 0) return null;

    return (
      <div className="flex-container flex-wrap flex-center">
        {albums.map(album => {
          const size = this.state.width <= 543 ? 50 : 75;

          return (
            <div key={album.id}>
              <Image id={album.id} size={size} />
            </div>
          );
        })}
      </div>
    );
  }

  getDayGrid(year, month) {
    var weeks = [];
    var days = [];
    var weekIndex = 0;

    var endDate = new Date(year, month, 0).getDate();
    var dateIndex = 1;
    var date, day, dayO;

    while (dateIndex <= endDate) {
      date = new Date(year, month - 1, dateIndex);
      day = date.getDay();

      dayO = { day: dateIndex, albums: [] };
      if (weeks[weekIndex] === undefined)
        weeks[weekIndex] = { days: [null, null, null, null, null, null, null] };
      weeks[weekIndex].days[day] = dayO;
      days[dateIndex] = dayO;

      if (day === 6) weekIndex++;
      dateIndex++;
    }

    return [weeks, days];
  }

  fetch(year, month) {
    const that = this;
    const url = '/api/album/monthly/' + year + month;

    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        const [weeks, days] = that.getDayGrid(year, month);
        data.forEach(row => {
          var date = new Date(row.release).getDate();
          days[date].albums.push(row);
        });
        that.setState({ weeks: weeks, days: days });
      });
  }
}
