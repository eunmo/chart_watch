import React, { Component } from 'react';
import { Route, Switch, Link } from 'react-router-dom';

import './style.css';

import Prefix from './prefix';

export default class Initial extends Component {
	
	render() {
		const initials = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

		var view = (
			<div>
				<div className="top text-center">
					Artists
				</div>
				<div className="flex-container flex-center flex-wrap">
					{initials.map(initial => (
						<div key={initial} className="Initials-key text-center">
							<Link to={'/initials/' + initial}>
								{initial}
							</Link>
						</div>
					))}
					<div className="Initials-key text-center gray">⌫</div>
				</div>
			</div>
		);

		return (
			<div className="flex-container">
				<div className="flex-1 hide-mobile" />
				<div className="flex-1">
					<Switch>
						<Route path={'/initials'} exact={true} render={() => view} />
						<Route path={'/initials/:prefix'} component={Prefix} />
					</Switch>
				</div>
				<div className="flex-1 hide-mobile" />
			</div>
		);
	}
}
