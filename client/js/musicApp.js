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
	.when('/add/artist-album/:id', {
		templateUrl: '/partials/add-artist-album.html',
		controller: 'AddArtistAlbumCtrl'
	})
	.when('/album/format/:format', {
		templateUrl: '/partials/album-format.html',
		controller: 'AlbumFormatCtrl'
	})
	.when('/album/format2/:format', {
		templateUrl: '/partials/album-format.html',
		controller: 'AlbumFormat2Ctrl'
	})
	.when('/album/all', {
		templateUrl: '/partials/album-list.html',
		controller: 'AlbumListCtrl'
	})
	.when('/album/:id', {
		templateUrl: '/partials/album.html',
		controller: 'AlbumCtrl'
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
	.when('/chart/batch', {
		templateUrl: '/partials/batch.html',
		controller: 'BatchCtrl'
	})
	.when('/chart/current', {
		templateUrl: '/partials/current-chart.html',
		controller: 'CurrentChartCtrl'
	})
	.when('/chart/ones', {
		templateUrl: '/partials/chart-history.html',
		controller: 'OneSongsCtrl'
	})
	.when('/chart/missing/album/:rank', {
		templateUrl: '/partials/missing1.html',
		controller: 'ChartMissingAlbumCtrl'
	})
	.when('/chart/missing/album/:rank/:year', {
		templateUrl: '/partials/missing1.html',
		controller: 'ChartMissingAlbumYearCtrl'
	})
	.when('/chart/album/:name', {
		templateUrl: '/partials/album-chart.html',
		controller: 'AlbumChartCtrl'
	})
	.when('/chart/album/:name/:date', {
		templateUrl: '/partials/album-chart.html',
		controller: 'AlbumChartCtrl'
	})
	.when('/chart/single/ones/:name', {
		templateUrl: '/partials/single-ones.html',
		controller: 'SingleOnesCtrl'
	})
	.when('/chart/single/:name', {
		templateUrl: '/partials/single-chart.html',
		controller: 'SingleChartCtrl'
	})
	.when('/chart/single/:name/:date', {
		templateUrl: '/partials/single-chart.html',
		controller: 'SingleChartCtrl'
	})
	.when('/recent', {
		templateUrl: '/partials/recent.html',
		controller: 'RecentCtrl'
	})
	.when('/newSongs', {
		templateUrl: '/partials/recent.html',
		controller: 'NewSongCtrl'
	})
	.when('/stats/plays/:type', {
		templateUrl: '/partials/stats-plays.html',
		controller: 'StatsPlaysCtrl'
	})
	.when('/stats/plays-table/:type', {
		templateUrl: '/partials/stats-plays-table.html',
		controller: 'StatsPlaysTableCtrl'
	})
	.when('/stats/plays-chart/:type', {
		templateUrl: '/partials/stats-plays-chart.html',
		controller: 'StatsPlaysChartCtrl'
	})
	.when('/add-album-chart-note', {
		templateUrl: '/partials/add-album-chart-note.html',
		controller: 'AddAlbumChartNoteCtrl'
	})
	.when('/ios', {
		templateUrl: '/partials/ios.html',
		controller: 'IOSCtrl'
	})
	.when('/season/single', {
		templateUrl: '/partials/season-single.html',
		controller: 'SeasonSingleCtrl'
	})
	.when('/season/single-list', {
		templateUrl: '/partials/season-single-list.html',
		controller: 'SeasonSingleListCtrl'
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
