musicApp.directive('navi', function () {
	return {
		restrict: 'E',
		templateUrl: 'partials/navi.html'
	};
});

musicApp.directive('player', function () {
	return {
		restrict: 'E',
		templateUrl: 'partials/player.html'
	};
});

musicApp.directive('artistArray', function () {
	return {
		restrict: 'E',
		scope: {
			array: '=array'
		},
		templateUrl: 'partials/artist-array.html'
	};
});

musicApp.directive('artistLink', function () {
	return {
		restrict: 'E',
		scope: {
			artist: '=artist',
			suffix: '=suffix'
		},
		templateUrl: 'partials/artist-link.html'
	};
});

musicApp.directive('artistRows', function () {
	return {
		restrict: 'E',
		scope: {
			artists: '=artists',
			desc: '=desc'
		},
		templateUrl: 'partials/artist-rows.html'
	};
});

musicApp.directive('chartBadge', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank',
			prefix: '=prefix'
		},
		link: function (scope, element) {
			var colors = ["#9ecae1","#6baed6","#4292c6","#2171b5","#ef6548"];
			if (scope.rank) {
				var color = "#c6dbef";
				if (scope.rank.min <= 5) {
					color = colors[5 - scope.rank.min];
				}
				scope.style = { "background-color" : color };
			}
		},	
		templateUrl: 'partials/chart-badge.html'
	};
});

musicApp.directive('rankBadge', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank',
			prefix: '=prefix'
		},
		link: function (scope, element) {
			var colors = ["#c6dbef","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#ef6548"];
			if (scope.rank) {
				scope.style = { "background-color" : colors[7 - scope.rank.min] };
			}
		},	
		templateUrl: 'partials/rank-badge.html'
	};
});

musicApp.directive('d3BarPlays', function () {
	return {
		restrict: 'E',
		scope: {
			data: '='
		},
		link: function (scope, element) {
			var margin = {top: 10, right: 10, bottom: 20, left: 50},
			width = parseInt(d3.select('#d3-bar-plays').style('width')),
			aspectRatio = 3/4;
			height = width * aspectRatio;

			var svg = d3.select(element[0])
			.append("svg")
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			width -= margin.left + margin.right;
			height -= margin.top + margin.bottom;

			var color = d3.scale.ordinal()
										.domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
										.range(["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]);

			function groupData (data) {
				var group = [];
				var series = [];
				var datum, i, j, order, sum;

				for (i in data) {
					datum = data[i];
					order = datum.rank ? datum.rank : 11;

					if (group[datum.plays] === undefined) {
						group[datum.plays] = [];
					}

					group[datum.plays][order] = { plays: datum.plays, rank: order, count: datum.count };
				}

				for (i in group) {
					sum = 0;
					for (j in group[i]) {
						group[i][j].offset = sum;
						sum += group[i][j].count;
					}
				}

				for (i in group) {
					for (j in group[i]) {
						series.push(group[i][j]);
					}
				}

				return series;
			}

			//Render graph based on 'data'
			scope.render = function(data) {
				var dataSeries = groupData(data);
				var i;
				var maxCount = d3.max(dataSeries, function (d) { return d.count + d.offset; } );

				var xMax = Math.ceil(d3.max(dataSeries, function (d) { return d.plays; }) / 10) * 10;
				var barWidth = Math.floor(width / (xMax + 1)) - 1;
				var x = d3.scale.linear()
				.range([0, width])
				.domain([0, xMax]);

				var yMax, yTicks = [], y;

				if (maxCount < 200) {
					yMax = Math.ceil(maxCount / 10) * 10;

					for (i = 10; i <= yMax; i += 10)
						yTicks.push(i);

					y = d3.scale.linear().range([height, 0])
					.domain([0, yMax]);
				} else { // go polylinear if max count > 100
					yMax = Math.ceil(maxCount / 100) * 100;

					for (i = 10; i < 100 && i < yMax; i += 10)
						yTicks.push(i);
					for (i = 100; i <= yMax; i += 100)
						yTicks.push(i);

					y = d3.scale.linear().range([height, height / 2, 0])
					.domain([0, 100, yMax]);
				}

				var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

				var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickValues(yTicks)
				.tickSize(-width);
				
				var bars = svg.selectAll(".bar").data(dataSeries);

				bars.enter().append("rect")
				.attr("class", "bar");

				bars
				.attr("x", function(d) { return x(d.plays) - barWidth / 2; })
				.attr("width", barWidth)
				.attr('height', function(d) { return y(d.offset) - y(d.count + d.offset + 0); })
				.attr("y", function(d) { return y(d.count + d.offset + 0); })
				.style("fill", function(d) { return color(d.rank); });

				bars.exit().remove();

				//Redraw the axes
				svg.selectAll('g.axis').remove();
				
				//X axis
				svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

				//Y axis
				svg.append("g")
				.attr("class", "y axis")
				.call(yAxis);
			};

			d3.select(window).on('resize', function () {
				width = parseInt(d3.select('#d3-bar-plays').style('width'));
				height = width * aspectRatio;

				svg
				.attr('width', width)
				.attr('height', height);

				width -= margin.left + margin.right;
				height -= margin.top + margin.bottom;

				scope.render(scope.data);
			});

			//Watch 'data' and run scope.render(newVal) whenever it changes
			//Use true for 'objectEquality' property so comparisons are done on equality and not reference
			scope.$watch('data', function(){
				scope.render(scope.data);
			}, true); 
		}
	};
});
