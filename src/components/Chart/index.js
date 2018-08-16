import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Selector from './Selector';
import Album from './Album';
import Single from './Single';
import Current from './Current';

const Chart = ({ match }) => (
  <Switch>
    <Route path={`${match.url}`} exact={true} component={Selector} />
		<Route path={`${match.url}/album/:chart/:week`} component={Album} />}
		<Route path={`${match.url}/single/:chart/:week`} component={Single} />}
		<Route path={`${match.url}/single/current`} component={Current} />}
  </Switch>
);

export default Chart;
