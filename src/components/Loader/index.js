import React, { Component } from 'react';

import './style.css';

export default class Loader extends Component {
	render() {
		return (
			<div class="Spinner">
  			<div class="Spinner-cube1"></div>
			  <div class="Spinner-cube2"></div>
			</div>
		);
	}
}
