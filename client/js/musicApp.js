musicApp = angular.module('musicApp', ['ngRoute'])
.config(function($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: '/partials/music.html',
		controller: 'MusicCtrl'
	}).otherwise({
		redirectTo: '/'
	});
});
