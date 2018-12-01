import React, { Component } from 'react';

import { Loader, PageSelector } from '../../Common';

import List from './list';
import Grid from './grid';

export default class Current extends Component {
	
	constructor(props) {
		super(props);

		this.state = {songs: null};
	}
	
	componentDidMount() {
		this.fetch();
	}

	render() {
		const songs = this.state.songs;
		if (songs === null)
			return <Loader />;

		var basename = '/chart/current/single';

		return (
			<div>
				<div className="top text-center">Current Charts</div>
				<div className="flex-container">
					<div className="flex-1 hide-mobile" />
					<div className="flex-3">
						<PageSelector views={this.state.views} basename={basename} />
					</div>
					<div className="flex-1 hide-mobile" />
				</div>
			</div>
		);
	}

	getViews(songs) {
		var views = [];

		views.push({name: '☰', link: '/list', component: List, data: {songs: songs}});
		views.push({name: '⠿', link: '/grid', component: Grid, data: {songs: songs}});

		return views;
	}

	fetch() {
		const that = this;
		const url = '/chart/single/current';

		fetch(url)
		.then(function(response) {
      return response.json();
    })
    .then(function(data) {
      that.setState({songs: data, views: that.getViews(data)});
    });
	}
}
