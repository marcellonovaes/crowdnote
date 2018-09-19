
//Group by Instant
//Aggregate by String Similarity
function aggregation(req, res, Output, Aggretation, Functions) {

	this.aggregate = aggregate;	

	function aggregate(){
	        var cur=-2;
	        var grp=0;
        	var groups = new Array();
	        Output.find({},function (err, C) {
        	        if (err) return console.error(err);
                	for(var i=0; i < C.length; i++){
	                        if( (parseFloat(C[i].instant)-cur) >= 1 ){
        	                        grp++;
                	                cur = parseFloat(C[i].instant);
                        	        groups[grp] = new Array();
	                        }
        	                if(groups[grp]) groups[grp].push(C[i]);
                	}
	                for(var i=1; i<groups.length; i++){
        	                var group = groups[i];
                	        var mode = group[0];
                        	var qtd = -1;
	                        var instant = parseFloat(group[0].instant);
        	                if(group.length > 1){
                	                for(var j=0; j<group.length-1; j++){
                        	                instant += parseFloat(group[j+1].instant);
                                	        var similars = 0;
                                        	for(var k=1; k<group.length; k++){
	                                                if(j == k) continue;
        	                                        var delta = Functions.levenshtein(group[j].point,group[k].point);
                	                                if(delta < 2) similars++;
                        	                }
	                                        if(qtd < similars){
        	                                        qtd = similars;
                	                                mode = group[j];
	                                        }
        	                        }
                	                instant /= group.length;
                        	}
	                        var data ={'item_id':mode.item_id, 'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': instant,'point': mode.point}
        	                var a = new Aggregation(data);
                	        a.save(function (err, m0) {if (err) return console.error(err);});
	                }
        	        res.end();
	        }).sort({'instant' : 1});
	}
}

module.exports.aggregation = aggregation;

