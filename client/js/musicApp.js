musicApp = angular.module('musicApp', ['ngRoute'])
.config(function($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: '/partials/initials.html',
		controller: 'InitialCtrl'
	})
	.when('/initial/:initial', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistInitialCtrl'
	})
	.when('/artist/:id', {
		templateUrl: '/partials/artist.html',
		controller: 'ArtistListCtrl'
	})
	.when('/artist', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistListCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});
