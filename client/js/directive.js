musicApp.directive('upNext', function() {
	return {
		restrict: 'E',
		templateUrl: 'partials/up-next.html'
	};
});

musicApp.directive('player', function() {
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: 'partials/player.html'
	};
});
