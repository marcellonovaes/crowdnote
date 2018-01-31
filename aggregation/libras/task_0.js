
//Group by Instant
//Aggregate by String Similarity
function aggregation(req, res, Output, Aggretation, Functions) {

	this.aggregate = aggregate;	

	function aggregate(){
	        var cur_uri='';
		var cur_end = -1;
	        var grp=-1;
        	var groups = new Array();
		var group_names = new Array();
		var group_ends = new Array();
	        Output.find({},function (err, C) {
        	        if (err) return console.error(err);

			//Group
                	for(var i=0; i < C.length; i++){
                                if( C[i].uri != cur_uri ){
                                        grp++;
                                        cur_uri = C[i].uri;
                                        cur_end = C[i].end;
                                        groups[grp] = new Array();
					group_names.push(cur_uri);
					group_ends.push(cur_end);
                                }
                                if(groups[grp]){
					var marks = C[i].marks.split(',').map(Number);
					for(var j=0; j < marks.length; j++){
						if(marks[j] > 0){
							groups[grp].push(marks[j]);
						}
					}
				}
                	}

			var videos = new Array;
			for(var i=0; i < groups.length; i++){
				var group = groups[i];
				group.sort(function(a,b){return a - b;});
				console.log('#'+group_names[i]);
				var ranges = new Array;
				var cur_range = -1;
				var cur_value = -1;
				var cont = 0;
				var total = 0;
				for(var j=0; j < group.length; j++){
					if(parseFloat(group[j]) > (cur_value + 1)){
						if(cur_range >= 0 && cont > 2){
							ranges.push(parseFloat(total/cont));
						}
						cur_range++;
						cur_value = parseFloat(group[j]);
						cont = 0;
						total = 0;
					}
					cont++;
					total += parseFloat(group[j]);
				}
				videos.push({'uri':group_names[i], 'starts':ranges, 'end':group_ends[i]});
				for(var j=0; j < ranges.length; j++){
					console.log(ranges[j]);
				}
			}

			//Store
			for(i=0; i < videos.length; i++){
				//console.log(videos[i]);
				var starts = videos[i].starts;
				var uri = videos[i].uri;
				var end = videos[i].end;
				for(var j=0; j < starts.length -1; j++){
				 	var data ={'uri': uri,'start': starts[j],'end': starts[j+1]}
                                	var a = new Aggregation(data);
                                	a.save(function (err, m0) {if (err) return console.error(err);});	
				}
                        	var data ={'uri': uri,'start': starts[starts.length-1],'end': end}
                                var a = new Aggregation(data);
                                a.save(function (err, m0) {if (err) return console.error(err);});
			}

        	    res.end();
	        }).sort({'uri' : 1});
	}
}

module.exports.aggregation = aggregation;

