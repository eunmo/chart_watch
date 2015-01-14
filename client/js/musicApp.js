musicApp = angular.module('musicApp', ['ngRoute'])
.config(function($routeProvider) {
	$routeProvider
	.when('/music', {
		templateUrl: '/partials/music.html',
		controller: 'MusicCtrl'
	})
	.when('/artist', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistCtrl'
	})
	.when('/initial/:initial', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistInitialCtrl'
	})
	.when('/', {
		templateUrl: '/partials/initials.html',
		controller: 'InitialCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});
