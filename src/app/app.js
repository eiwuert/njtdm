angular.module( 'njTDM', [
  'templates-app',
  'templates-common',
  'njTDM.home',
  'njTDM.report',
  'ui.state',
  'ui.route'
])
.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/' );
})
.run( function run () {
})
.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | NJTranist Demand' ;
    }
  });
});


