musicApp = angular.module('musicApp', ['ngRoute'])
.config(function($routeProvider) {
	$routeProvider
	.when('/music', {
		templateUrl: '/partials/music.html',
		controller: 'MusicCtrl'
	})
	.when('/artist', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistListCtrl'
	})
	.when('/artist/:id', {
		templateUrl: '/partials/artist.html',
		controller: 'ArtistListCtrl'
	})
	.when('/initial/:initial', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistInitialCtrl'
	})
	.when('/initial', {
		templateUrl: '/partials/initials.html',
		controller: 'InitialCtrl'
	})
	.when('/', {
		templateUrl: '/partials/artist-list.html',
		controller: 'Controller'
	})
	.otherwise({
		redirectTo: '/'
	});
});
