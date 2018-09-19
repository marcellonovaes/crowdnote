
//Group by Point of Interest
//Aggregate by Ranking
function aggregation(req, res, Output, Aggretation, Functions) {

        this.aggregate = aggregate;

        function aggregate(){
	        var cur= '';
        	var pt=0;
	        var points = new Array();
        	Output.find({},function (err, C) {
                	if (err) return console.error(err);
	                for(var i=0; i < C.length; i++){
        	                if( Functions.levenshtein(C[i].point,cur) != 0 ){
                	                pt++;
                        	        cur = C[i].point;
                                	points[pt] = new Array();
	                        }
        	                if(points[pt]) points[pt].push(C[i]);
                	}
	                for(var i=1; i<points.length; i++){
        	                var point = points[i];
                	        var contents = new Array();
                        	var cur_content = -1;
	                        var content = '';
        	                point.sort(function(a, b){ return Functions.levenshtein(a.item_id,b.item_id) });
                	        for(j=0; j<point.length; j++){
                        	        if(Functions.levenshtein(content,point[j].item_id) < 1){
                                	        contents[cur_content].qtd++;
	                                }else{
        	                                content = point[j].item_id;
                	                        cur_content++;
                        	                contents.push({'id':content,'qtd':1,'index':j});
                                	}
	                        }
        	                var mode = 0;
                	        for(j=0; j<contents.length; j++){
                        	        if(contents[mode].qtd < contents[j].qtd){
                                	        mode = j;
	                                }
        	                }
                	        mode = point[contents[mode].index];
				var image = '';
				switch(mode.content_type){	
					case 'youtube':  
							var content = mode.content.split('https://www.youtube.com/watch?v=');
							image ='http://i1.ytimg.com/vi/'+content[1]+'/hqdefault.jpg';
							break;

					case 'wikipedia':  
    							image = 'https://novaes.tech/wiki_image?url='+mode.content; 
							break;

					default:
		                        
				}
				var data ={'item_id':mode.item_id, 'point':mode.point,'type':mode.type,  'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'image': image}
	        		var a = new Aggregation(data);
        	                a.save(function (err, m0) {if (err) return console.error(err);});
 

               	}
	                res.end();
        	}).sort({'point' : 1});
        }
}

module.exports.aggregation = aggregation;

