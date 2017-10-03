// ---------------------- Includes and Globals ------------------------

var activeTask = 3;
var group = false;
var qtd_target = 4;

var host = 'localhost';
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');

var express = require('express');

var app = express();
app.set('view engine', 'ejs');

app.use(express.static(__dirname+'/'));

var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));

var cors = require('cors');
app.use(cors({origin: 'null'}));
app.use(cors({origin: 'https://youtube.com'}));
app.use(cors({origin: 'https://ttv.microworkers.com'}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//---------------- Database - MongoDb ---------
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/crowdnote_exp002');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('openUri', function() {});
var ItemSchema, Item;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Timestamp = Schema.Timestamp;
itemSchema = Schema({
	qtd: String,
	//--------Sync------
	v1: String,
	v2: String,
	delta: String,
	start_time: String,
	stop_time: String,
	plays_1: String,
	plays_2: String,

	//----Enrichment----
	item_index: String,
	item_id: String,
	job_id: String,
	fingerprint: String,
        uri: String,
        start: String,
	end: String,   
	instant: String,
	point: String,
	content: String,
	content_type: String,
	x: String,
	y: String
});
Input = mongoose.model('items_'+activeTask, itemSchema);
Output = mongoose.model('contributions_'+activeTask, itemSchema);
Aggregation = mongoose.model('items_'+(activeTask+1), itemSchema);

var input = new Array();
var curInput = 0;

init();

// ---------------------  Init Functions -----------------------------

function init(){
	Input.find({},function (err, V) {
		if (err) return console.error(err);
		if(group){
			V = groupInput(V);
		}
		for(var i=0; i < V.length; i++){
			input[i] = V[i];
			input[i].qtd = 0;
		}
	}).sort({'_id' : 1});
}

function groupInput(items){
	var groups = new Array();
	var indexes = new Array();
        for(var i=0; i < items.length; i++){

		if(!groups[items[i].item_id]){
			groups[items[i].item_id] = new Array();
			indexes.push(items[i].item_id);
		}

		groups[items[i].item_id].push(items[i]);

	}
	V = new Array();
	for(var i=0; i < indexes.length; i++){
		V.push(groups[indexes[i]]);
	}
	return V;
}

//-----------------------  Endpoints   -------------------------------

app.get('/', function(req, res) {
	res.render('ejs/task_'+activeTask, null);
});

app.get('/thanks', function(req, res) {
	res.render('ejs/task_'+activeTask, null);
	//res.render('ejs/thanks', null);
});

app.get('/job', function(req, res) {
	if(input.length < 1){
		res.render('ejs/thanks', null);
	}

	if(!input[curInput]){
		curInput--;
	}

	var contribs = new Array()
        job_id = fingerprint(req,true);
        print = fingerprint(req,false);
	if(group){
		var inp = input[curInput];
                if(curInput < input.length-1){
                	curInput++;
                }else{
                        curInput = 0;
                }
		var qtd = inp.qtd;
		delete inp.qtd;
		var more = new Object();
                more.item_index = curInput;
		more.qtd = qtd;
		more.job_id = job_id;
		more.fingerprint = print;
		var obj = new Object();
		obj.data = inp;
		obj.info = more;
	}else{
	        var obj = input[curInput];
		obj.item_index = curInput;
	        if(curInput < input.length-1){
	        	curInput++;
	        }else{
	         	curInput = 0;
	 	}
		obj.job_id = job_id;
		obj.fingerprint = print;
	}
        res.json(obj);
});

app.post('/store', function(req, res) {
	var data = req.body;
	input[data.item_index].qtd++;
	if(input[data.item_index].qtd >= qtd_target){
		input.splice( data.item_index, 1 );
	}
	delete data.item_index;
	var c = new Output(data);
	c.save(function (err, m0) {if (err) return console.error(err);});
	res.end();
});

//Group by item ID
//Aggregate by coordinate
app.get('/aggregate_i_c', function(req, res) {
	var cur= '';
	var it=-1;
	var items = new Array();
        Output.find({},function (err, C) {
                if (err) return console.error(err);
                for(var i=0; i < C.length; i++){
			if( levenshtein(C[i].item_id,cur) != 0 ){
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
                        var data ={'x':x+'px', 'y':y+'px', 'item_id':mode.item_id, 'point':mode.point, 'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'point': mode.point}
                        var a = new Aggregation(data);
                        a.save(function (err, m0) {if (err) return console.error(err);});
		}
		
		res.end();
        }).sort({'item_id' : 1});
});

//Group by point
//Aggregate Duplicated
app.get('/aggregate_p_d', function(req, res) {
	var cur= '';
	var grp=0;
	var groups = new Array();
        Output.find({},function (err, C) {
                if (err) return console.error(err);
                for(var i=0; i < C.length; i++){
			if( levenshtein(C[i].point,cur) != 0 ){
				grp++;
				cur = C[i].point;
				groups[grp] = new Array();
			}
			if(groups[grp]) groups[grp].push(C[i]);
                }
		for(var i=1; i<groups.length; i++){
			var group = groups[i];
			group.sort(function(a, b){ return levenshtein(a.content_type,b.content_type); });
			var types = new Array();
			var cur_type = '';
			var type_grp = 0;
	                for(var j=0; j < group.length; j++){
				var l = levenshtein(group[j].content_type,cur_type);
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
						type.sort(function(a, b){ return levenshtein(a.content,b.content) });
						var cur_content = '';
						for(k=0; k < type.length; k++){
							var duplicated = true;
							var l = levenshtein(cur_content,type[k].content);
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
});


//Group by item Point
//Aggregate by ranking
app.get('/aggregate_p_r', function(req, res) {
	var cur= '';
	var pt=0;
	var points = new Array();
        Output.find({},function (err, C) {
                if (err) return console.error(err);
                for(var i=0; i < C.length; i++){
			if( levenshtein(C[i].point,cur) != 0 ){
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
                        point.sort(function(a, b){ return levenshtein(a.item_id,b.item_id) });
			for(j=0; j<point.length; j++){
				if(levenshtein(content,point[j].item_id) < 1){
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
                        var data ={'item_id':mode.item_id, 'point':mode.point, 'content_type':mode.content_type, 'content':mode.content,'uri': mode.uri,'start': mode.start,'end': mode.end,'instant': mode.instant,'point': mode.point}
             		var a = new Aggregation(data);
             		a.save(function (err, m0) {if (err) return console.error(err);});
		}
		res.end();
        }).sort({'point' : 1});
});



//Group by time
//Aggregate by string similarity
app.get('/aggregate_t_s', function(req, res) {
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
						var delta = levenshtein(group[j].point,group[k].point);
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
});


// ------------- Server Functions ------------------------------

app.get('/html', function(req, res) {
        var name = req.query.name;
        var mime = req.query.mime;
        var path = 'views/html/'+name;
        fs.readFile(path, function (err, data){
                res.setHeader('content-type', 'text/javascript');
                res.end(data);
        });
});

app.get('/include', function(req, res) {
	var name = req.query.name;
	var mime = req.query.mime;
	var path = 'views/'+mime+'/'+name+'.'+mime; 
	fs.readFile(path, function (err, data){
		res.setHeader('content-type', 'text/javascript');
		res.end(data);
   	});
});

app.get('/dataset', function(req, res) {
	var name = req.query.name;
	var mime = req.query.mime;
	var path = 'dataset/'+name+'.'+mime;
	fs.readFile(path, function (err, data){
		res.writeHead(200, {"Content-Type":"video/"+mime});
       		res.end(data);
   	});
});

// ------------- Functions ------------------------------

function levenshtein(a, b){
	var tmp;
	if (a.length === 0) { return b.length; }
	if (b.length === 0) { return a.length; }
	if (a.length > b.length) { tmp = a; a = b; b = tmp; }

	var i, j, res, alen = a.length, blen = b.length, row = Array(alen);
	for (i = 0; i <= alen; i++) { row[i] = i; }

	for (i = 1; i <= blen; i++) {
		res = i;
		for (j = 1; j <= alen; j++) {
			tmp = row[j - 1];
			row[j - 1] = res;
			res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1));
		}
	}
	return res;
}

function fingerprint(req,mode){
        var fingerprint = require('ip').address();
        fingerprint += req.headers['user-agent'];
	if(mode){
        	fingerprint += Date.now();
	}
        fingerprint = require('crypto').createHash('md5').update(fingerprint).digest("hex");
        return fingerprint;
}

// ------------- Create Server ------------------------------

https.createServer({
  	ca: fs.readFileSync("../../ssl/intermediate.crt"),
	key: fs.readFileSync('../../ssl/novaes.tech.key'),
	cert: fs.readFileSync('../../ssl/novaes.tech.crt')
},app).listen(443);


//http.createServer().listen(80);







