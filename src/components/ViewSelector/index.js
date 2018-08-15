import React, { Component } from 'react';

import './style.css';

export default class ViewSelector extends Component {

	/* Giving up on swipe to next view behavior.
	 * react-swipable-views doesn't work well when stacked.
	 * For css transitions, it becomes too heavy to show all possible views,
	 * which happends after having stacked multiple layers of view selectors. */
	
	constructor(props) {
		super(props);

		var state = {view: ''};

		if (this.props.views.length > 0) {
			state.view = this.props.views[0].name;
		}

		this.state = state;
		
		this.selectView = this.selectView.bind(this);
	}
	
	componentWillReceiveProps(props) {
		var i, view;
		if (props.views.length > 0) {
			for (i = 0; i < props.views.length; i++) {
				view = props.views[i];

				if (view.name === this.state.view) {
					return;
				}
			}
			
			this.setState({view: props.views[0].name});
		}
	}

	render() {
		const defaultView = this.getDefaultView();
		if (this.props.expand) {
			return (
				<div>
					<div className="hide-mobile">
						{this.getExpandedView()}
					</div>
					<div className="show-mobile">
						{defaultView}
					</div>
				</div>
			);
		} else {
			return defaultView;
		}
	}

	getExpandedView() {
		const views = this.props.views;
		const rowLimits = this.props.rows ? this.props.rows : [views.length];

		var i, rowLimit, j, view, inner;
		var rows = [];

		j = 0;
		for (i = 0; i < rowLimits.length; i++) {
			rowLimit = rowLimits[i];
			inner = [];

			for ( ; j < rowLimit; j++) {
				view = views[j];
				inner.push(<div key={view.name} className="flex-1">{view.view}</div>);
			}

			rows.push(<div key={i} className="flex-container flex-container-wrap">{inner}</div>);
		}

		return rows;
	}

	getDefaultView() {
		return (
			<div className="ViewSelector">
				<div className="ViewSelector text-center flex-container">
					{this.getHeaders()}
				</div>
				{this.getView()}
			</div>
		);
	}

	getHeaders() {
		const views= this.props.views;
		var validCount = views.filter(view => (view.view !== null)).length;

		if (validCount === 1 && this.props.removeHeadersOnSingle)
			return <div>&nbsp;</div>;
		
		var array = [];
		
		this.props.views.forEach((view, index) => {
			var style = {
				lineHeight: '30px',
				backgroundColor: 'rgba(255, 255, 255, 0.2)',
			};
			var spacerStyle = {
				width: '5px'
			};

			if (view.name === this.state.view) {
				style.fontWeight = 'bold';
			}

			var sh = view.sh ? view.sh : view.name;

			if (index > 0)
				array.push(<div key={index} style={spacerStyle} />);

			array.push(
				<div key={view.name} style={style} className="flex-1"
				onClick={() => this.selectView(view.name)}>
				<span className="hide-mobile">{view.name}</span>
				<span className="show-mobile">{sh}</span>
				</div>
			);
		});
		
		return array;
	}
	
	selectView(view) {
		if (view !== this.state.view) {
			this.setState({view: view});
		}
	}

	getView() {
		var i, view;

		for (i = 0; i < this.props.views.length; i++) {
			view = this.props.views[i];
			if (view.name === this.state.view) {
				return view.view;
			}
		}

		return null;
	}
}

