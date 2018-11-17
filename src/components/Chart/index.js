import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Selector from './selector';
import Album from './album';
import Single from './single';
import Current from './current';

const Chart = ({ match }) => (
  <Switch>
    <Route path={`${match.url}`} exact={true} component={Selector} />
		<Route path={`${match.url}/album/:chart/:week`} component={Album} />}
		<Route path={`${match.url}/single/:chart/:week`} component={Single} />}
		<Route path={`${match.url}/current/single`} component={Current} />}
  </Switch>
);

export default Chart;
