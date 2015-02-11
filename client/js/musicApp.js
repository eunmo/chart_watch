musicApp = angular.module('musicApp', ['ngRoute'])
.config(function ($routeProvider) {
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
		controller: 'ArtistCtrl'
	})
	.when('/artist', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistListCtrl'
	})
	.when('/edit/artist/:id', {
		templateUrl: '/partials/edit-artist.html',
		controller: 'EditArtistCtrl'
	})
	.when('/edit/album/:id', {
		templateUrl: '/partials/edit-album.html',
		controller: 'EditAlbumCtrl'
	})
	.when('/edit/song/:id', {
		templateUrl: '/partials/edit-song.html',
		controller: 'EditSongCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});
