import React, { Component } from 'react';

import './style.css';

export default class Loader extends Component {
  render() {
    return (
      <div className="Spinner">
        <div className="Spinner-cube1"></div>
        <div className="Spinner-cube2"></div>
      </div>
    );
  }
}
