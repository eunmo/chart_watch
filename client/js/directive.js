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

musicApp.directive('imageLarge', function () {
	return {
		restrict: 'E',
		scope: {
			albumId: '=albumId',
			c: '=?c'
		},
		templateUrl: 'partials/album-image.html'
	};
});

musicApp.directive('imageSmall', function () {
	return {
		restrict: 'E',
		scope: {
			albumId: '=albumId',
			s: '=s'
		},
		compile: function () {
			return {
				pre: function (scope, element, attrs) {
					if (scope.albumId) {
						scope.url = '/' + scope.albumId;
						scope.xsurl = scope.url; 

						s = parseInt(scope.s);
						if (s <= 40) {
							scope.xsurl += '.80px';
						}
						if (s <= 100) {
							scope.url += '.' + s + 'px';
						}

						scope.url += '.jpg';
						scope.xsurl += '.jpg';
					} else {
						scope.url = scope.xsurl = 'null.jpg';
					}

					if (scope.s !== undefined) {
						scope.inner = 'max-height: ' + scope.s + 'px; max-width: ' + scope.s + 'px';
						scope.outer = 'height: ' + scope.s + 'px; width: ' + scope.s + 'px';
					}
				}
			};
		},
		templateUrl: 'partials/image-small.html'
	};
});


musicApp.directive('rankBadge', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank',
			min: '=?min',
			count: '=?count',
			run: '=?run',
			prefix: '=prefix',
			showMin: '=?showMin',
			song: '=song',
			detailedSong: '=detailedSong'
		},
		compile: function() {
			return {
				pre: function (scope, element, attrs) {
					scope.show = false;
					scope.showCount = false;
					scope.showMin = false;

					if (scope.rank) {
						scope.showMin = true;
						scope.min = scope.rank.min;
						scope.count = scope.rank.count;
						if (scope.rank.run)
							scope.run = scope.rank.run;
						if (scope.min <= 10)
							scope.show = true;
						if (scope.count > 1)
							scope.showCount = true;
					} else if (scope.song && scope.song.plays) {
						scope.show = true;
						scope.showCount = true;
						scope.min = scope.song.rank;
						scope.count = scope.song.plays;
						scope.style = { "background-color" : "#777" };
					} else if (scope.detailedSong && scope.detailedSong.plays) {
						scope.show = true;
						scope.showCount = true;

						var song = scope.detailedSong;
						var rank, min = 100;
						for (var prop in song.rank) {
							if (song.rank.hasOwnProperty(prop)) {
								rank = song.rank[prop].min;
								if (rank < min)
									min = rank;
							}
						}

						if (min <= 10)
							scope.min = min;

						scope.count = song.plays;
						scope.style = { "background-color" : "#777" };
					}	else if (scope.count) {
						scope.show = true;
						scope.showCount = true;
					}

					if (scope.min) {
						var colors = ["#9ecae1","#6baed6","#4292c6","#2171b5","#ef6548"];

						if (scope.min < 6)
							scope.style = { "background-color" : colors[5 - scope.min] };
						else {
							scope.style = { "background-color" : "#c6dbef" };
						}
					}
				}
			};
		},
		templateUrl: 'partials/rank-badge.html'
	};
});

musicApp.directive('d3BarPlays', function () {
	return {
		restrict: 'E',
		scope: {
			data: '=',
			showSongs: '&onClick'
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
			
			var tooltip;

			width -= margin.left + margin.right;
			height -= margin.top + margin.bottom;

			var color = d3.scale.ordinal()
										.domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
										.range(["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]);

			function groupData (data) {
				var group = [];
				var series = [];
				var datum, i, j, order, sum;
				var plays;

				for (i in data) {
					datum = data[i];
					order = datum.rank ? datum.rank : 11;
					plays = datum.plays <= 100 ? datum.plays : 100;

					if (group[plays] === undefined) {
						group[plays] = [];
					}

					if (group[plays][order] === undefined) {
						group[plays][order] = {
							plays: plays,
							rank: order,
							count: 0
						};
					}

					group[plays][order].count += datum.count;
				}

				for (i in group) {
					sum = 0;
					for (j in group[i]) {
						group[i][j].offset = sum;
						sum += group[i][j].count;
					}
					for (j in group[i]) {
						group[i][j].total = sum;
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
				var barWidth = Math.floor(width / (xMax + 1));
				var x = d3.scale.linear()
				.range([0, width])
				.domain([0, xMax]);

				if (width >= 768)
					barWidth -= 1;

				var yMax, yTicks = [], y;

				if (maxCount < 200) {
					yMax = Math.ceil(maxCount / 10) * 10;

					for (i = 10; i <= yMax; i += 10)
						yTicks.push(i);

					y = d3.scale.linear().range([height, 0])
					.domain([0, yMax]);
				} else { // go polylinear if max count > 100
					var mill = Math.ceil(maxCount / 1000);
					var unit = mill * 100;
					yMax = Math.ceil(maxCount / unit) * unit;

					for (i = 10; i < 100 && i < yMax; i += 10)
						yTicks.push(i);
					for (i = 100; i <= yMax; i += unit)
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
				.tickSize(-width-barWidth/2);

				
				var bars = svg.selectAll(".bar").data(dataSeries);

				bars.enter().append("rect")
				.attr("class", "bar");

				bars
				.attr("x", function(d) { return x(d.plays) - barWidth / 2; })
				.attr("width", barWidth)
				.attr("height", function(d) { return y(d.offset) - y(d.count + d.offset + 0); })
				.attr("y", function(d) { return y(d.count + d.offset + 0); })
				.style("fill", function(d) { return color(d.rank); })
				.on('click', function (d, i) { scope.showSongs({play: d.plays}); })
				.on('mouseover', function (d) {
					var text = "<table class=\"table table-bordered table-tooltip\" id=\"d3-bar-plays-tooltip\">" +
										   "<tr><td>" + d.total + "</td></tr>" +
										 "</table>";
					tooltip.html(text)
								 .style("opacity", 1.0);

					var table = d3.select('#d3-bar-plays-tooltip');

					var width = parseInt (table.style('width'));
					var height = parseInt (table.style('height'));
					
					tooltip.attr("x", x(d.plays) - width / 2)
								 .attr("y", Math.max (y(d.total) - height - 3, 0));
				});

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

				svg.selectAll('.tooltip').remove();
		 	
				// tooltip
				tooltip	= svg.append("foreignObject")
										 .attr("class", "tooltip");
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
