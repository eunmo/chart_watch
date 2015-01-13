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
	.otherwise({
		redirectTo: '/music'
	});
});
