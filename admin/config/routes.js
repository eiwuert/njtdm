/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * For more information on routes, check out:
 * http://links.sailsjs.org/docs/config/routes
 */

module.exports.routes = {
  //---------------------------------
  // User Login & Admin
  //---------------------------------
  '/login':'UserController.login',
  '/login/auth':'UserController.auth',
  '/logout':'UserController.logout',
  '/user/admin':'UserController.admin',

  //---------------------------------
  // Home Pages
  //---------------------------------
  '/': 'HomeController.dashboard',
  '/data/gtfs': 'HomeController.gtfs',
  '/data/acs': 'HomeController.acs',
  '/data/ctpp': 'HomeController.ctpp',
  '/data/lodes': 'HomeController.lodes',
  '/marketarea/new': 'HomeController.marketareaNew',
  
  //---------------------------------
  // Triptable
  //---------------------------------
  '/triptable':'TriptableController.calculateTripTable',
  '/triptable/run':'TriptableController.runModel',
  '/triptable/finished/:marketarea':'TriptableController.finishedModels',
  '/triptable/:id/modeldata':'TriptableController.modelData',

  //---------------------------------
  // Job
  //---------------------------------
  '/jobs':'JobController.dash',

  //---------------------------------
  // Market Area Pages
  //---------------------------------
  '/marketarea/new': 'MarketAreaController.new',
  '/marketarea/:id': 'MarketAreaController.show',
  '/marketarea/:id/models': 'MarketAreaController.models',
  '/marketarea/:id/:route/route_geo': 'MarketAreaController.getRouteGeo',
  '/marketarea/:id/routes_geo': 'MarketAreaController.getRouteGeo',
  
  // CTPP routes
  '/marketarea/outbound/all_ctpp_data': 'MarketAreaController.getAllCTPPoutbound',
  '/marketarea/:id/outbound/ctpp_travel_data': 'MarketAreaController.getCTPPoutbound',

  '/marketarea/inbound/all_ctpp_data': 'MarketAreaController.getAllCTPPinbound',
  '/marketarea/:id/inbound/ctpp_travel_data': 'MarketAreaController.getCTPPinbound',
  
  // LODES routes
  '/marketarea/towork/all_lodes_data': 'MarketAreaController.getAllLODEStowork',
  '/marketarea/:id/towork/lodes_travel_data': 'MarketAreaController.getLODEStowork',

  '/marketarea/tohome/all_lodes_data': 'MarketAreaController.getAllLODEStohome',
  '/marketarea/:id/tohome/lodes_travel_data': 'MarketAreaController.getLODEStohome',

  '/marketarea/:id/ma_route_data': 'MarketAreaController.getAllMARoutes',
  '/marketarea/:id/census/:tableName' : 'MarketAreaController.getCensus',
  
  // Convert to shp
  '/jsonToShp' : 'MarketAreaController.geojsonToShp',

  //---------------------------------
  // Users Guide Pages
  //---------------------------------
  '/guide/overview': 'GuideController.overview',
  '/guide/getting_started': 'GuideController.getting_started',
  '/guide/quickstart': 'GuideController.quickstart',
  '/guide/gtfs' : 'GuideController.gtfs',
  '/guide/acs' : 'GuideController.acs',
  '/guide/ctpp' : 'GuideController.ctpp',
  '/guide/lodes' : 'GuideController.lodes',
  '/guide/farebox' : 'GuideController.farebox',
  '/guide/custom_data' : 'GuideController.custom_data',
  '/guide/new_market_area' : 'GuideController.new_market_area',
  '/guide/edit_market_area' : 'GuideController.edit_market_area',
  '/guide/mapmodeling' : 'GuideController.mapmodeling',
  '/guide/mapgtfs' : 'GuideController.mapgtfs',
  '/guide/mapcensus' : 'GuideController.mapcensus',
  '/guide/quickstart' : 'GuideController.quickstart',
  '/guide/triptables' : 'GuideController.triptables',
  '/guide/odsources' : 'GuideController.odsources',
  //'/guide/demographics' : 'GuideController.demographics'

  //---------------------------------
  // Data Routes
  //---------------------------------
  '/gtfs/upload':'MetaGtfsController.upload',
  '/gtfs/:id/routes' :'MetaGtfsController.getRoutes',
  '/gtfs/delete/:id':'MetaGtfsController.deleteGtfs',

  '/acs/load':'MetaAcsController.loadData',
  '/acs/delete/:id':'MetaAcsController.deleteACS',

  //---------------------------------
  // Regression Routes
  //---------------------------------
  '/regressions' : 'RegressionController.index'

  
  //----------------------------------/
  //File Uploads
  //----------------------------------
  //'/data/gtfs/upload':'UploadsController.gtfsupload'


  // Custom routes here...


  // If a request to a URL doesn't match any of the custom routes above,
  // it is matched against Sails route blueprints.  See `config/blueprints.js`
  // for configuration options and examples.

};
