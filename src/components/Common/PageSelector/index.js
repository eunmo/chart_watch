import React, { Component } from 'react';
import { Route, Switch, Redirect, NavLink } from 'react-router-dom';

import './style.css';

export default class PageSelector extends Component {
  constructor(props) {
    super(props);

    this.state = { width: 0, height: 0 };

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  updateDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  componentWillMount() {
    this.updateDimensions();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  render() {
    if (this.props.expand && this.state.width > 543) {
      return this.getExpandedView();
    } else {
      return this.getDefaultView();
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

      for (; j < rowLimit; j++) {
        view = views[j];
        inner.push(
          <div key={view.name} className="flex-1">
            <view.component data={view.data} />
          </div>
        );
      }

      rows.push(
        <div key={i} className="flex-container flex-container-wrap">
          {inner}
        </div>
      );
    }

    return rows;
  }

  getDefaultView() {
    const basename = this.props.basename;
    const views = this.props.views;

    return (
      <div className="PageSelector">
        <div className="PageSelector text-center flex-container">
          {this.getHeaders()}
        </div>
        <Switch>
          <Redirect
            from={basename}
            to={basename + views[0].link}
            exact={true}
          />
          {views.map(view => (
            <Route
              key={view.name}
              path={basename + view.link}
              render={props => <view.component data={view.data} />}
            />
          ))}
        </Switch>
      </div>
    );
  }

  getHeaders() {
    const views = this.props.views;
    var validCount = views.length;

    if (validCount === 1 && this.props.removeHeadersOnSingle)
      return <div>&nbsp;</div>;

    var array = [];

    this.props.views.forEach((view, index) => {
      var style = {
        lineHeight: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        display: 'block'
      };
      var spacerStyle = { width: '5px' };
      var activeStyle = { fontWeight: 'bold' };

      var sh = view.sh ? view.sh : view.name;

      if (index > 0) array.push(<div key={index} style={spacerStyle} />);

      array.push(
        <NavLink
          key={view.name}
          to={this.props.basename + view.link}
          style={style}
          activeStyle={activeStyle}
          className="flex-1"
        >
          <span className="hide-mobile">{view.name}</span>
          <span className="show-mobile">{sh}</span>
        </NavLink>
      );
    });

    return array;
  }

  selectView(view) {
    if (view !== this.state.view) {
      this.setState({ view: view });
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
