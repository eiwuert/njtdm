function jobsController($scope) {

	
	$scope.jobs = server_jobs;
	$scope.current_jobs ={};
	$scope.finished_jobs = {};
	$scope.num_active = 0;
	
	$scope.jobs.forEach(function(job){
		//job.info = JSON.parse(job.info);
		if(job.isFinished){
			$scope.finished_jobs[job.id] = job;
		}else{
			$scope.current_jobs[job.id] = job;
		}
	})

	//console.log($scope.jobs);

	$scope.cancelJob=function(id){
		
		d3.json('/job/'+id)
		.post(JSON.stringify({isFinished:true,status:'Cancelled',pid:$scope.current_jobs[id].pid}),function(err,data){
			console.log('return',data);
			if(err){ console.log('error:',err);}
			delete $scope.current_jobs[id];
			$scope.finished_jobs[data.id] = data;
			$scope.$apply();	
		})

	}
	$scope.sortJob = function(job) {
    	var date = new Date(job.createdAt);
    	return date;
	};

	io.socket.on('connect',function(){

		io.socket.on('job_created', function(data) {
	      $scope.current_jobs[data.id] = data;
	    });

	    io.socket.on('job_updated', function(data) {
	      $scope.current_jobs[data[0].id] = data[0];
	      $scope.$apply();
	    });
	})
   
};