
//Group by Item ID
//Aggregate by Coordinate
function aggregation(req, res, Output, Aggretation, Functions) {

        this.aggregate = aggregate;

        function aggregate(){        
		var cur= '';
        	var it=-1;
	        var items = new Array();
        	Output.find({},function (err, C) {
                	if (err) return console.error(err);
	                for(var i=0; i < C.length; i++){
        	                if( Functions.levenshtein(C[i].item_id,cur) != 0 ){
                	                it++;
                        	        cur = C[i].item_id;
                                	items[it] = new Array();
	                        }
        	                if(items[it]) items[it].push(C[i]);
                	}
	                for(var i=0; i<items.length; i++){
        	                var item = items[i];
                	        var x = 0;
                        	var y = 0;
	                        for(var j=0; j<item.length; j++){
        	                        x += parseFloat(item[j].x);
                	                y += parseFloat(item[j].y);
                        	}
	                        x /= item.length;
        	                y /= item.length;
                	        var mode = item[0];
                        	var data ={'x':x+'px', 'y':y+'px', 'item_id':mode.item_id, 'type':mode.type, 'point':mode.point, 'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'image': mode.image}
	                        var a = new Aggregation(data);
        	                a.save(function (err, m0) {if (err) return console.error(err);});
                	}
	                res.end();
        	}).sort({'item_id' : 1});
        }
}

module.exports.aggregation = aggregation;

