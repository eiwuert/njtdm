modelAnalyst = {
	modelTrips : [],
	modelBadTrips : [],
	modelRoute : {},
	modelRoutesGroup : {},
	modelOnStop : {},
	modelOnStopGroup : {},
	modelOffStop : {},
	modelOffStopGroup : {},
	modelTripCount : {},
	modelTripCountGroup : {},
	update_data:function(data,i){
		var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.000Z");
		data.forEach(function(d){
			d.start_time_d = timeFormat.parse(d.start_time);
			d.minute = d3.time.minute(d.start_time_d);
			d.minute.setHours(d.minute.getHours()-4);
		});
		modelAnalyst.modelBadTrips = [];
		for (var i = data.length-1; i >= 0; i--) {
			if (data[i].waiting_time <= 3)
				data[i].waiting_time = 0;

			if (data[i].waiting_time > 1200) {
				modelAnalyst.modelBadTrips.push(data[i]);
				data = data.slice(0, i).concat(data.slice(i+1));
			}
		}
		//console.log('model analyst data', data);
		modelAnalyst.modelTrips = crossfilter(data);

		modelRoutes = modelAnalyst.modelTrips.dimension(function(d){return d.route;});
		modelRoutesGroup = modelRoutes.group(function(d){return d;});

		modelOnStop = modelAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
		modelOnStopGroup = modelOnStop.group(function(d) {return d});

		modelOffStop = modelAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
		modelOffStopGroup = modelOffStop.group();

		modelAnalyst.modelTripCount= modelAnalyst.modelTrips.dimension(function(d){return d.trip_id;});
		modelAnalyst.modelTripCountGroup = modelAnalyst.modelTripCount.group();

		var transfer_counts = crossfilter(modelAnalyst.modelTripCountGroup.all())
				.dimension(function(d){return d.value-1;}).group();

		var startMinuteDimension = modelAnalyst.modelTrips.dimension(function(d){return d.minute;}),
			startTimeGroup = startMinuteDimension.group();

		var waitTimeDimension = modelAnalyst.modelTrips.dimension(function(d){return Math.round(d.waiting_time/60);}),
			waitTimeGroup = waitTimeDimension.group();

		return {"routes": modelRoutesGroup, "on_stops": modelOnStopGroup,
				"off_stops": modelOffStopGroup, "transfer_counts": transfer_counts,
				"start_time_group": startTimeGroup, "wait_time_group": waitTimeGroup,
				"model_bad_trips" : modelAnalyst.modelBadTrips};
	},
  clearGraphs: function() {
    d3.select('#graphDiv').selectAll('svg').remove();
  },
	drawStartTimeGraph: function(data) {
    var margin = {top: 10, right: 5, bottom: 20, left: 25},
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom,
        dims = {margin: margin, width: width, height: height};

    var timeScale = d3.time.scale()
                      .domain([data[0].key, data[data.length-1].key])
                      .range([0, width]);
    gtfsGeo.drawGraph(data, timeScale, dims);
  },
  drawWaitTimeGraph: function(data) {
    var margin = {top: 10, right: 10, bottom: 20, left: 35},
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom,
        dims = {margin: margin, width: width, height: height};

    var Xmin = d3.min(data, function(d) { return d.key });
        Xmax = d3.max(data, function(d) { return d.key });
    var Xscale = d3.scale.linear()
                    .domain([Xmin, Xmax])
                    .range([0, width]);

    gtfsGeo.drawGraph(data, Xscale, dims);
  },
  drawGraph: function(data, xScale, dims) {
    //console.log('drawModelGraph', data);
    var margin = dims.margin,
        width = dims.width,
        height = dims.height;

    var maxCount = d3.max(data, function(d) { return d.value; });

    var heightScale = d3.scale.linear()
                  .domain([0, maxCount])
                  .range([height, 0]);

    var barWidth = Math.max(Math.round(width/data.length), 1);

    var svg = d3.select('#graphDiv').append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate("+margin.left+", "+margin.top+")");

    var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient('bottom')
                  .ticks(4);

    svg.append('g')
        .attr('transform', 'translate(0, '+height+')')
        .call(xAxis);

    var yAxis = d3.svg.axis()
                  .scale(heightScale)
                  .orient('left')
                  .ticks(10);

    svg.append('g')
        .call(yAxis);

    var bars = svg.selectAll('rect')
                  .data(data);

    bars.exit().remove();
    bars.enter().append('rect');

    bars.attr('height', function(d) { return height - heightScale(d.value); })
        .attr('width', barWidth)
        .attr('x', function(d, i) { return i*barWidth; })
        .attr('y', function(d) { return heightScale(d.value); })
        .attr('stroke-width', 0)
        .attr('fill', '#44bb44');
  },
};