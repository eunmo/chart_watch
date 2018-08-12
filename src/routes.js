import React from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom';

import Monthly from './components/Monthly';

const Routes = (props) => (
	<BrowserRouter basename={props.basename}>
		<div className="router-outer">
			<div className="router-inner">
				<Route path="/monthly/:month/" component={Monthly} />
			</div>
			<div className="router-inner logo"><Link to="/monthly/201808">㋠</Link></div>
		</div>
	</BrowserRouter>
);

export default Routes;
