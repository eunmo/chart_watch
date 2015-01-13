musicApp.controller('MusicCtrl', function($rootScope, $scope, musicFactory) {
 
  $scope.songs = [];
 
  // get all Todos on Load
  musicFactory.getMusic().then(function(data) {
    $scope.songs = data.data;
  });
});
