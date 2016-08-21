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
	.when('/song/:id', {
		templateUrl: '/partials/song.html',
		controller: 'SongCtrl'
	})
	.when('/edit/song/:id', {
		templateUrl: '/partials/edit-song.html',
		controller: 'EditSongCtrl'
	})
	.when('/chart/current', {
		templateUrl: '/partials/current-chart.html',
		controller: 'CurrentChartCtrl'
	})
	.when('/chart/ones', {
		templateUrl: '/partials/chart-history.html',
		controller: 'OneSongsCtrl'
	})
	.when('/chart/missing/1', {
		templateUrl: '/partials/missing1.html',
		controller: 'ChartMissing1Ctrl'
	})
	.when('/chart/missing/', {
		templateUrl: '/partials/missing.html',
		controller: 'ChartMissingCtrl'
	})
	.when('/chart/history/:name', {
		templateUrl: '/partials/chart-history.html',
		controller: 'ChartHistoryCtrl'
	})
	.when('/chart/:name', {
		templateUrl: '/partials/chart.html',
		controller: 'ChartCtrl'
	})
	.when('/chart/:name/:date', {
		templateUrl: '/partials/chart.html',
		controller: 'ChartCtrl'
	})
	.when('/recent', {
		templateUrl: '/partials/recent.html',
		controller: 'RecentCtrl'
	})
	.when('/newSongs', {
		templateUrl: '/partials/recent.html',
		controller: 'NewSongCtrl'
	})
	.when('/stats/plays-table', {
		templateUrl: '/partials/stats-plays-table.html',
		controller: 'StatsPlaysTableCtrl'
	})
	.when('/stats/plays-chart', {
		templateUrl: '/partials/stats-plays-chart.html',
		controller: 'StatsPlaysChartCtrl'
	})
	.when('/blank', {
		templateUrl: '/partials/blank.html',
	})
	.otherwise({
		redirectTo: '/'
	});
});

musicApp.config(['$httpProvider', function($httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};    
    }    

    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    // extra
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.Pragma = 'no-cache';
}]);
