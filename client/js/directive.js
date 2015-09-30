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

			//Render graph based on 'data'
			scope.render = function(data) {
				var maxCount = d3.max(data, function (d) { return d.count } );

				var xMax = Math.ceil(d3.max(data, function (d) { return d.plays; }) / 10) * 10;
				var barWidth = Math.floor(width / (xMax + 1)) - 1;
				var x = d3.scale.linear()
				.range([0, width])
				.domain([0, xMax]);

				var yMax, yTicks = [], y;

				if (maxCount < 100) {
					yMax = Math.ceil(d3.max(data, function (d) { return d.count; }) / 10) * 10;

					for (var i = 10; i <= yMax; i += 10)
						yTicks.push(i);

					y = d3.scale.linear().range([height, 0])
					.domain([0, yMax]);
				} else { // go polylinear if max count > 100
					yMax = Math.ceil(d3.max(data, function (d) { return d.count; }) / 100) * 100;

					for (var i = 10; i <= 50 && i < yMax; i += 10)
						yTicks.push(i);
					for (var i = 100; i <= yMax; i += 100)
						yTicks.push(i);

					y = d3.scale.linear().range([height, height / 2, 0])
					.domain([0, 50, yMax]);
				}

				var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

				var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickValues(yTicks);

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
				.call(yAxis)
				
				var bars = svg.selectAll(".bar").data(data);

				bars.enter().append("rect")
				.attr("class", "bar");

				bars
				.attr("x", function(d) { return x(d.plays) - barWidth / 2; })
				.attr("width", barWidth)
				.attr('height', function(d) { return height - y(d.count + 0); })
				.attr("y", function(d) { return y(d.count + 0); });

				bars.exit().remove();
			};

			d3.select(window).on('resize', function () {
				width = parseInt(d3.select('#d3-bar-plays').style('width'));
				height = width * aspectRatio;

				console.log(width);
				console.log(height);

				svg
				.attr('width', width)
				.attr('height', height)

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
