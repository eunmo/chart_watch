import React from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom';

import Home from './components/Home';
import Monthly from './components/Monthly';
import Album from './components/Album';
import Song from './components/Song';
import Initials from './components/Initials';
import Artist from './components/Artist';
import PlayHistory from './components/PlayHistory';
import Chart from './components/Chart';

const gradients = {
	purple: 'linear-gradient(165deg, #1a2a6c, #b21f1f, #fd9b2d, #b21f1f, #1a2a6c)', // King Yna
	green: 'linear-gradient(165deg, #360033, #0b8793, #360033)', // Purple Bliss
	pink: 'linear-gradient(165deg, #dd2476, #ff512f, #dd2476)', // Aubergine
};

const renders = {
	purple: (props) => { document.body.style.backgroundImage = gradients.purple; return null; },
	green: (props) => { document.body.style.backgroundImage = gradients.green; return null; },
	pink: (props) => { document.body.style.backgroundImage = gradients.pink; return null; },
};

const routes = [
	{ path: '/', render: renders.purple, component: Home, exact: true },
	{ path: '/monthly/:month', render: renders.purple, component: Monthly },
	{ path: '/album/:id', render: renders.purple, component: Album },
	{ path: '/song/:id', render: renders.purple, component: Song },
	{ path: '/initials', render: renders.purple, component: Initials },
	{ path: '/artist/:id', render: renders.purple, component: Artist },
	{ path: '/play-history', render: renders.purple, component: PlayHistory },
	{ path: '/chart', render: renders.purple, component: Chart },
];

const Routes = (props) => (
	<BrowserRouter basename={props.basename}>
		<div className="router-outer">
			<div className="router-inner">
				{routes.map(route => (<Route path={route.path} key={route.path} component={route.component} exact={route.exact}/>))}
				<br />
			</div>
			<div className="router-inner logo"><Link to="/">㋠</Link></div>
			{/*routes.map(route => (<Route path={route.path} key={route.path} render={route.render} />))*/}
		</div>
	</BrowserRouter>
);

export default Routes;
