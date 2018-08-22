import React, { Component } from 'react';

import './style.css';

export default class Dropdown extends Component {

	constructor(props) {
		super(props);

		this.state = {expand: false};
		this.toggle = this.toggle.bind(this);
		this.expand = this.expand.bind(this);
		this.clickItem = this.clickItem.bind(this);
	}

	componentDidMount() {
		window.addEventListener("touchstart", this.toggle);
		window.addEventListener("mousedown", this.toggle);
	}

	componentWillUnmount() {
		window.removeEventListener("touchstart", this.toggle);
		window.removeEventListener("mousedown", this.toggle);
	}

	render() {
		var contentStyle = {display: 'none'};

		if (this.state.expand) {
			contentStyle.display = 'block';
		}

		return (
			<div className="Dropdown">
				<div className="lightgray" onClick={() => this.expand()}>☰</div>
				<div className="Dropdown-content" style={contentStyle}>
					{this.props.array.map(item => 
						item.href ?
						<a key={item.name} href={item.href}>
							{this.replaceSpace(item.name)}
						</a> :
						<div key={item.name} onClick={() => this.clickItem(item)}>
							{this.replaceSpace(item.name)}
						</div>
					)}
				</div>
			</div>
		);
	}

	replaceSpace(string) {
		return string.replace(/ /g, '\u00A0');
	}

	clickItem(item) {
		item.onClick();
		this.close();
	}
	
	expand() {
		this.setState({expand: true});
	}
	
	close() {
		this.setState({expand: false});
	}

	toggle(event) {
		const parentNode = event.target.parentNode;
		if (!(parentNode && parentNode.classList && parentNode.classList.contains('Dropdown-content')))
			this.setState({expand: false});
	}
}
