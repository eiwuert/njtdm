/**
* HOME Module
**/
var homeMod = angular.module( 'njTDM.home', [
  'ui.state',
  'leaflet-directive',
  'ui.bootstrap',
  'ui.select2',
  'ngResource'
])
.filter('startFrom', function() {
  return function(input, start) {
      start = +start; //parse to int
      if(typeof input !== 'undefined'){
         if(typeof input.length !== 'undefined'){
            return input.slice(start);
        }else{
          return [];
        }
      }
      else{
        return [];
      }
  };
})
/**
 *PAGE CONFIG
 */
.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.tpl.html'
      }
    },
    data:{ pageTitle: 'Scenario Editor' }
  });
})
//Services
.factory("Scenario", function ($resource) {
   //var api = 'http://lor.availabs.org:1338/'
    return $resource(
        "http://lor.availabs.org\\:1338/scenario/:id",
        {id: "@id" },
        {
            //custom route
            "templates": {'method': 'GET', 'params': {'where': {'name':null}}},
            'update': { method:'PUT' }
 
        }
    );
})
.factory("TripTable", function ($resource) {
   //var api = 'http://lor.availabs.org:1338/'
    return $resource(
        "http://lor.availabs.org\\:1338/triptable/:id",
        {id: "@id" },
        {
          //custom routes
        }
    );
})
.filter('filterRoutes', function(){

  return function(items, input){
    if (!items) {
      return [];
    }
    var arrayToReturn = [];        
    for (var i=0; i<items.length; i++){
        if (items[i].properties.route_short_name.indexOf(input) != -1) {
            arrayToReturn.push(items[i]);
        }
    }

    return arrayToReturn;
  };
})
.filter('filterStops', function(){

  return function(items, input){
    if (!items) {
      return [];
    }
    var arrayToReturn = [];        
    for (var i=0; i<items.length; i++){
        if (items[i].properties.stop_code.indexOf(input) != -1) {
            arrayToReturn.push(items[i]);
        }
    }

    return arrayToReturn;
  };
})
/**
 * CONTROLLER
 */
.controller( 'HomeCtrl', function HomeController( $scope,$http,leafletData,$filter,Scenario,TripTable,$modal) {
  $scope.api = 'http://lor.availabs.org:1338/';
  //$scope.api = 'http://localhost:1337/';
  $scope.current_template_index = 0;
  $scope.model_time = 'am';
  $scope.census_vars = censusData.variables;
  $scope.census_categories = censusData.categories;
  $scope.model_type = 'lehdbus';
  $scope.model_message = '';
  $scope.active_run = false;
  $scope.run_progress = 0;
  $scope.run_max = 0;
  $scope.finished_models = [];
  $scope.model_od = 'stops';
  $scope.show_routes = true;
  $scope.show_stops = false;
  $scope.marketArea = 0;
    

  /**********************************************
  *
  * Trip Table setup
  ***********************************************/

  $scope.trip_table = [];
  $scope.tt_currentPage = 0;
  $scope.tt_pageSize = 11;
  $scope.tt_total = 0;
  $scope.trips_loaded = false;
  $scope.show_trips = false;
  $scope.tt_search = {};
  $scope.routeFilter = '';
  $scope.stopFilter = '';
  
  /***************************
  Model Tabs variables

  *****************************/
  // to select active model tab
  $scope.modelTabs = {active: 'true'};

  // functions to filter drawn routes and stops
  $scope.updateRoutes = function(value){
    gtfsGeo.routeData = $filter('filterRoutes')($scope.route_properties, value);
    gtfsGeo.drawRoutes();
  };

  $scope.updateStops = function(value){
    gtfsGeo.stopData = $filter('filterStops')($scope.stop_properties, value);
    gtfsGeo.drawStops();
  };
  
  $scope.$watch('tt_search', function() {
      $scope.tt_total = $filter('filter')($scope.trip_table,$scope.tt_search).length;
      $scope.tt_currentPage = 0;
      tripTable.tt_array=  $filter('filter')($scope.trip_table,$scope.tt_search);
      tripTable.update_trips();
  }, true);
  //------------------------------------------
  //Map Setup
  //
  //------------------------------------------
  angular.extend($scope, {
    center: {lat: 39.349667,lng: -74.465093,zoom: 12},
    layers: {baselayers: {mapbox:{name:'mapbox',url:'http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png',type:'xyz'}}},
    events: {map: {enable: ['load','zoomstart', 'drag', 'click', 'mousemove'],logic: 'emit'}}
  });


  //---------------------------------------------
  //Utility Functions Section
  //Top Level Functions
  //---------------------------------------------
  // This will query /accounts and return a promise.
  $scope.loadScenario = function(scenario){
    $scope.scenario = scenario;
    if($scope.scenario.id == 11){
      //atlantic city
      $scope.marketArea = 6;
    }else if($scope.scenario.id == 9){
      //princeton trenton
      $scope.marketArea = 2;
    }else if($scope.scenario.id == 7){
      //AC
      $scope.marketArea = 1;
    }
    console.log('marketArea',$scope.marketArea);

    $scope.map.panTo(new L.LatLng(scenario.center[1], scenario.center[0]));
    $scope.tracts = scenario.tracts;
    censusGeo.scenario_tracts = $scope.tracts;
    $http.post($scope.api+'tracts/acs', {tracts:scenario.tracts}).success(function(tract_data){
      $http.post($scope.api+'gtfs/routes', {routes:scenario.routes}).success(function(route_data){
        $http.post($scope.api+'gtfs/stops', {routes:scenario.routes}).success(function(stop_data){
          $scope.loadTripTable($scope.model_type).then(function(trip_table){
            $scope.trip_table = trip_table.data.tt;
            $scope.tt_total = trip_table.data.tt.length;
            $scope.tt_failed = trip_table.data.failed.length;
            tripTable.update_data(trip_table.data.tt);
            //tripTable.draw_trips();
            censusData.update_data(tract_data);
            censusGeo.update_scenario();

            gtfsGeo.routeData = topojson.feature(route_data, route_data.objects.routes).features;
            $scope.route_properties = gtfsGeo.routeData;

            gtfsGeo.stopData = topojson.feature(stop_data, stop_data.objects.stops).features;
            $scope.stop_properties = gtfsGeo.stopData;

            gtfsGeo.drawRoutes();
            gtfsGeo.drawStops();
            
            //two way data binding, lol
            $scope.census_vars = censusData.census_vars;
            censusData.census_vars = $scope.census_vars;
            
            $scope.$watch('tracts', function () {
              $http.post($scope.api+'tracts/acs', {tracts:$scope.tracts}).success(function(data){
                $scope.loadTripTable($scope.model_type).then(function(trip_table){
                  $scope.trip_table = trip_table.data.tt;
                  $scope.tt_failed = trip_table.data.failed.length;
                  tripTable.update_data(trip_table.data.tt);
                  censusData.update_data(data);
                  censusGeo.choropleth_trip_table('outbound_trips');
                });
              });
            }, true);
          });
        });
      });
    });
  };

  $scope.tt_choropleth = function(var_name){
    censusGeo.choropleth_trip_table(var_name);
  };

  $scope.mapTripTable =function(){
    if(!$scope.trips_loaded){
      tripTable.draw_trips();
      $scope.trips_loaded = true;
      $scope.show_trips = true;
    }else{
      if($scope.show_trips){
        tripTable.update_trips();
        $('circle.dest').css('display','none');
        $('circle.origin').css('display','none');
        $scope.show_trips = false;
        $('#origin-dest-div').hide();
      }else{
         $('circle.dest').css('display','block');
        $('circle.origin').css('display','block');
        $scope.show_trips = true;
        $('#origin-dest-div').show();
      }
    }
  };
  $scope.routes_visible = function(){
 
    if($scope.show_routes){
      $('.route').hide();
      $('#route-legend-div').hide();
      $scope.show_routes = false;
    }else{
      $('.route').show();
      $('#route-legend-div').show();
      $scope.show_routes = true;
    }

  };

  $scope.stops_visible = function(){
 
    if($scope.show_stops){
      $('.stop').hide();
      $('#stop-legend-div').hide();
      $scope.show_stops = false;
    }else{
      $('.stop').show();
      $('#stop-legend-div').show();
      $scope.show_stops = true;
    }

  };

  $scope.newTripTable =function(type){
    $scope.loadTripTable(type,$scope.scenario.tracts).then(function(trip_table){
      $scope.trip_table = trip_table.data.tt;
      $scope.tt_failed = trip_table.data.failed.length;
      tripTable.update_data(trip_table.data.tt);
      if($scope.show_trips){
        tripTable.update_trips();
      }
      censusGeo.choropleth_trip_table('outbound_trips');
      $scope.tt_total = trip_table.data.length;
    });
  };
  $scope.saveScenario = function(){
    Scenario.update({id:$scope.scenario.id },$scope.scenario);
  };

  $scope.route_trips = function(route) {
    $http.post($scope.api+'gtfs/routetrips', {route: route})
          .success(function(data){
            //console.log(data);
            $scope.route_trip_data = data;
          });
  };
  $scope.switchView = function(to){
    if(to =='model'){
      $('#map').hide();
      $('#model').show();
    }
  };
  $scope.loadTripTable = function(model_type){
    var busdata = {};
      for(var tract in censusData.acs){
        busdata[tract] = {};
        busdata[tract].buspercent = censusData.acs[tract].bus_to_work/censusData.acs[tract].travel_to_work_total;
        busdata[tract].bus_to_work = censusData.acs[tract].bus_to_work;
        busdata[tract].travel_to_work_total = censusData.acs[tract].travel_to_work_total;
        busdata[tract]['pttotal'] = censusData.acs[tract]['pttotal'];
        busdata[tract]['12_00ampt'] = censusData.acs[tract]['12_00ampt'];
        busdata[tract]['5_00ampt'] = censusData.acs[tract]['5_00ampt'];
        busdata[tract]['5_30ampt'] = censusData.acs[tract]['5_30ampt'];
        busdata[tract]['6_00ampt'] = censusData.acs[tract]['6_00ampt'];
        busdata[tract]['6_30ampt'] = censusData.acs[tract]['6_30ampt'];
        busdata[tract]['7_00ampt'] = censusData.acs[tract]['7_00ampt'];
        busdata[tract]['7_30ampt'] = censusData.acs[tract]['7_30ampt'];
        busdata[tract]['8_00ampt'] = censusData.acs[tract]['8_00ampt'];
        busdata[tract]['8_30ampt'] = censusData.acs[tract]['8_30ampt'];
        busdata[tract]['9_00ampt'] = censusData.acs[tract]['9_00ampt'];
        busdata[tract]['10_00ampt']= censusData.acs[tract]['10_00ampt'];
        busdata[tract]['11_00ampt']= censusData.acs[tract]['11_00ampt'];
        busdata[tract]['12_00pmpt']= censusData.acs[tract]['12_00pmpt'];
        busdata[tract]['4_00pmpt'] = censusData.acs[tract]['4_00pmpt'];
      }
    //console.log('bus_data',busdata);
    /*******
    * Model Types
    * 1 - LEHD + % Bus
    * 1 - CTPP Bus Trips
    * 1 - AC Survey
    */
    var promise = [];
    if(model_type == 'lehdbus'){
      
      promise = $http.post($scope.api+'tracts/triptable', {timeOfDay:$scope.model_time,mode:'lehd',tracts:$scope.tracts,buspercent:busdata,od:$scope.model_od}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'ctpp'){
      promise = $http.post($scope.api+'tracts/triptable', {timeOfDay:$scope.model_time,mode:'ctpp',tracts:$scope.tracts,od:$scope.model_od,buspercent:busdata}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'censusregression'){
      var regData = {};
      censusGeo.scenario_tracts_features.forEach(function(feat){
        tract = feat.properties.geoid;
        regData[tract] = {};
        regData[tract].arts = censusData.acs[tract].arts;
        regData[tract].car_0 = censusData.acs[tract].car_0;
        regData[tract].car_1 = censusData.acs[tract].car_1;
        regData[tract].age18_19 = censusData.acs[tract].age18_19;
        regData[tract].age21 = censusData.acs[tract].age21;
        regData[tract].age25_29 = censusData.acs[tract].age25_29;
        regData[tract]['10_19units'] = censusData.acs[tract]['10_19units'];
        regData[tract]['20_49units'] = censusData.acs[tract]['20_49units'];
        regData[tract]['50+_units'] = censusData.acs[tract]['50+_units'];
        regData[tract]['25000_29999'] = censusData.acs[tract]['25000_29999'];
        regData[tract]['30000_34999'] = censusData.acs[tract]['30000_34999'];
        regData[tract]['50000_59999'] = censusData.acs[tract]['50000_59999'];
        regData[tract].foreign_born = censusData.acs[tract].foreign_born;
        regData[tract].occupancy_renter = censusData.acs[tract].occupancy_renter;
        regData[tract].occupied_housing = censusData.acs[tract].occupied_housing;
        regData[tract].race_other = censusData.acs[tract].race_other;
        regData[tract].race_black = censusData.acs[tract].race_black;
        regData[tract].race_white = censusData.acs[tract].race_white;
        regData[tract].information = censusData.acs[tract].information;
        regData[tract].employment_density = (censusData.acs[tract].employment/d3.geo.area(feat))/15705369;
      });
      console.log(regData);
      promise = $http.post($scope.api+'tracts/triptable', {marketarea:$scope.marketArea,timeOfDay:$scope.model_time,mode:'ctpp',tracts:$scope.tracts,od:$scope.model_od,buspercent:busdata,cenData:regData}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'survey'){
      promise = $http.post($scope.api+'tracts/surveyTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }
    return promise;
  };

  $scope.update_od = function(od){
    $scope.model_od = od;
  };
  $scope.update_time = function(time){
    console.log('time',time);
    $scope.model_time = time;
  };

  //Click On The Run Model Button
  $scope.newModel =function(){

    var modalInstance = $modal.open({
      templateUrl: 'home/partials/new_model.tpl.html',
      controller: ModalInstanceCtrl
    });

    modalInstance.result.then(function (model_name) {
      //Save Trip Table and Start Model Run
      var newTT = new TripTable({trips:$scope.trip_table,model_type:$scope.model_type,model_time:$scope.model_time});
      newTT.$save(function(){
          $http.post($scope.api+'triptable/'+ newTT.id+'/run').success(function(data){
            $scope.active_run = true;
            $scope.getRunStatus(newTT.id);
          });
          var ma = 0;
          if($scope.scenario.id == 11){
            ma = 1;
          }else if($scope.scenario.id == 9){
            ma = 2;
          }
          var newScenario = new Scenario({
                                          name:model_name,
                                          center:$scope.scenario.center,
                                          parent:$scope.scenario.id,
                                          routes:$scope.scenario.routes,
                                          tracts:$scope.scenario.tracts,
                                          trip_table_id:newTT.id,
                                          ampm: $scope.model_time,
                                          marketArea: ma
                                        });
          newScenario.$save();
          // $scope.allScenarios.push(newScenario);
          // $scope.current_template_index = $scope.allScenarios.length-1;
      });
      //Save Scenario And Make it currently selected
      
    }, function () {
      //console.log('Modal dismissed at: ' + new Date());
    });

  };

  $scope.vizRoutes = function(){
    gtfsGeo.vizRoutes($scope.model_data.routes.all());
  };

  $scope.vizBoardings = function(name) {
    //var button =
    gtfsGeo.vizBoardings($scope.on_stops);
  };

  $scope.vizAlightings = function(name) {
    gtfsGeo.vizAlightings($scope.off_stops);
  };

  $scope.getRunStatus = function(id){
    $http.post($scope.api+'triptable/'+id+'/status').success(function(data){
      if(data.status == "finished"){
        $scope.active_run = false;
      }else{
        $scope.run_progress = data.runs_processed;
        $scope.run_max = data.total;
        setTimeout(function() { $scope.getRunStatus(id);},3000);
      }
    });
  };

  $scope.choropleth = function(input,divisor){
    if(typeof divisor == 'undefined'){
      censusGeo.choropleth_single(input);
    }else{
      censusGeo.choropleth_percent(input,divisor);
    }
  };
  
  $scope.showOD = function(type){
    //console.log($scope.model_type);
    if(type == 'lehd' || type == 'lehdbus' || type == 'ctpp' || type == 'censusregression'){
      return true;
    }
    return false;
  };

  $scope.loadModelData = function(id){
    
    $http.post($scope.api+'triptable/'+id+'/modeldata').success(function(data){
      
        $scope.model_data = modelAnalyst.update_data(data);
        $scope.route_count = $scope.model_data.routes.all();
        $scope.route_total = 0;
        $scope.model_data.routes.all().forEach(function(d){
          $scope.route_total += d.value;
        });

        // get all on_stop objects
        $scope.on_stops = $scope.model_data.on_stops.all();
        // sum number of boardings at each stop
        $scope.on_stops_total = d3.sum($scope.on_stops, function(d) {return d.value;});

        // get all off_stop objects
        $scope.off_stops = $scope.model_data.off_stops.all();
        // sum number of alightings at each stop
        $scope.off_stops_total = d3.sum($scope.off_stops, function(d) {return d.value;});

        $scope.transfer_counts = $scope.model_data.transfer_counts.all();

        $scope.start_time_group = $scope.model_data.start_time_group.all();

        $scope.model_bad_trips = $scope.model_data.model_bad_trips;

        $scope.wait_time_group = $scope.model_data.wait_time_group.all();

        var noWaits = $scope.wait_time_group[0].value,
            normWaits = 0,
            badWaits = $scope.model_data.model_bad_trips.length,
            totalWaits = 0;
        for (var i = 1; i < $scope.wait_time_group.length; i++) {
          normWaits += $scope.wait_time_group[i].value;
        }
        totalWaits = noWaits + normWaits + badWaits;
        //console.log(noWaits, normWaits, badWaits, totalWaits);
        $scope.wait_time_data = {no_waits: noWaits,
                                  normal_waits: normWaits,
                                  bad_waits: badWaits,
                                  total_waits: totalWaits,
                                  percent_no_waits: (100*noWaits/totalWaits).toFixed(2),
                                  percent_norm_waits: (100*normWaits/totalWaits).toFixed(2),
                                  percent_bad_waits: (100*badWaits/totalWaits).toFixed(2)};

        gtfsGeo.clearGraphs();
        gtfsGeo.drawStartTimeGraph($scope.start_time_group);
        gtfsGeo.drawWaitTimeGraph($scope.wait_time_group.splice(1));
    });

  };

  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //Get the Map & Go
  //Main Loop
  leafletData.getMap().then(function(map) {
    
    //Grab the Map & Draw all Tracts
    L.control.scale({position:"bottomleft"}).addTo(map);
    censusGeo.map = map;
    $scope.map = map;
    censusGeo.geodata= njTracts; //loaded in index as seperate file
    censusGeo.draw();
    gtfsGeo.svg = censusGeo.svg;
    gtfsGeo.init();
    tripTable.init();

    //Get Scenarios & Load the first one
      $scope.loadScenarios = Scenario.query(function(){
        $scope.allScenarios = [];
        $scope.loadScenarios.forEach(function(scen){
          if(scen.name.indexOf("Template") != -1){
            console.log(scen.name,scen.name.indexOf("Template") != -1);
            $scope.allScenarios.push(scen);
          }
        });
        $scope.current_template= $scope.allScenarios[2];
        $scope.first = true;
        $scope.scenario_select = function(index){
          if($scope.first){index = 2;$scope.first=false;}
          $scope.loadScenario($scope.allScenarios[index]);
        };
        $http.post($scope.api+'triptable/finished').success(function(data){
          $scope.finished_models = data;
        });
      });
  });
  //************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
});

//--------------------------------------------------------------
function ModalInstanceCtrl($scope, $modalInstance) {
  
  $scope.ok = function (info) {
    $modalInstance.close(info);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}





