
//Group by Point of Interest
//Aggregate by Duplicated
function aggregation(req, res, Output, Aggretation, Functions) {

        this.aggregate = aggregate;

        function aggregate(){
	        var cur= '';
        	var grp=0;
	        var groups = new Array();
        	Output.find({},function (err, C) {
	                if (err) return console.error(err);
        	        for(var i=0; i < C.length; i++){
                	        if( Functions.levenshtein(C[i].point,cur) != 0 ){
                        	        grp++;
                                	cur = C[i].point;
	                                groups[grp] = new Array();
        	                }
                	        if(groups[grp]) groups[grp].push(C[i]);
	                }
        	        for(var i=1; i<groups.length; i++){
                	        var group = groups[i];
                        	group.sort(function(a, b){ return Functions.levenshtein(a.content_type,b.content_type); });
	                        var types = new Array();
        	                var cur_type = '';
                	        var type_grp = 0;
                        	for(var j=0; j < group.length; j++){
	                                var l = Functions.levenshtein(group[j].content_type,cur_type);
        	                        if( l >= 2 || l <= -2){
                	                        type_grp++;
                        	                cur_type = group[j].content_type;
                                	        types[type_grp] = new Array();
	                                }
        	                        if(types[type_grp]) types[type_grp].push(group[j]);
                	        }
	                        for(var j=0; j < types.length; j++){
        	                        var type = types[j];
                	                if(type){
                        	                if(type[0].content_type!='image'){
	                                                type.sort(function(a, b){ return Functions.levenshtein(a.content,b.content) });
        	                                        var cur_content = '';
                	                                for(k=0; k < type.length; k++){
                        	                                var duplicated = true;
                                	                        var l = Functions.levenshtein(cur_content,type[k].content);
                                        	                if(l >= 2 ||l <= -2 ){
                                                	                duplicated = false;
                                                        	        cur_content = type[k].content;
                                                                	var mode = type[k];
	                                                                var data ={'item_id':mode.item_id, 'point':mode.point, 'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'point': mode.point}
        	                                                        var a = new Aggregation(data);
                	                                                a.save(function (err, m0) {if (err) return console.error(err);});
                        	                                }
                                	                }
                                        	}else{
	                                                for(k=0; k < type.length; k++){
        	                                                var mode = type[k];
                	                                        var data ={'item_id':mode.item_id, 'point':mode.point, 'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'point': mode.point}
                        	                                var a = new Aggregation(data);
                                	                        a.save(function (err, m0) {if (err) return console.error(err);});
	                                                }
        	                                }
                	                }
                        	}
	                }
	                res.end();
        	}).sort({'point' : 1});
        }
}

module.exports.aggregation = aggregation;

