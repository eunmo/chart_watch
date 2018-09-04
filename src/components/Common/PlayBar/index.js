import React, { Component } from 'react';

import './style.css';

export default class PlayBar extends Component {

	render() {
		const tiers = this.group(this.props.stats);
		const totalCount = tiers.reduce(((total, tier) => total + tier.count), 0);
		const totalSum = tiers.reduce(((total, tier) => total + tier.sum), 0);
		var colors = ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.2)'];

		if (totalCount === 0)
			return null;

		return (
			<div style={{margin: '10px 0px'}}>
				<div className="flex-container">
					{tiers.map((tier, index) => 
						<div key={index} className="flex-1 text-center">
							Tier {index + 1}
						</div>
					)}
				</div>
				<div className="flex-container">
					{tiers.map((tier, index) => 
						<div key={index} style={{width: tier.count / totalCount * 100 + '%', height: '5px', background: colors[index]}} />
					)}
				</div>
				<div className="flex-container">
					{tiers.map((tier, index) => 
						<div key={index} className="flex-1 text-center">
							σ {tier.count}
						</div>
					)}
				</div>
				<div className="flex-container">
					{tiers.map((tier, index) => 
						<div key={index} style={{width: tier.sum / totalSum * 100 + '%', height: '5px', background: colors[index]}} />
					)}
				</div>
				<div className="flex-container">
					{tiers.map((tier, index) => 
						<div key={index} className="flex-1 text-center">
							μ {(tier.sum / tier.count).toFixed(3)}
						</div>
					)}
				</div>
			</div>
		);
	}

	group(stats) {
		var tiers = [];

		for (var i = 0; i < 4; i++) {
			tiers[i] = {sum: 0, count: 0};
		}

		stats.forEach(entry => {
			var tier;
			if (entry.rank) {
				tier = entry.plays >= 10 ? 0 : 1;
			} else {
				tier = entry.plays <= 2 ? 2 : 3;
			}
			tiers[tier].count += entry.count;
			tiers[tier].sum += entry.count * entry.plays;
		});

		return tiers;
	}
}
