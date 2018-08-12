import React from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom';

import Monthly from './components/Monthly';

const Routes = (props) => (
	<BrowserRouter basename={props.basename}>
		<div>
			Chart Watch React
			<Route path="/monthly/:month/" component={Monthly} />
		</div>
	</BrowserRouter>
);

export default Routes;
