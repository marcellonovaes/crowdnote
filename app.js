// ---------------------- Requires, Includes and Globals ------------------------

var project = 'cscw_2018';
var qtd_target = 0;
var min_convergence = 0;
var activeTask = 4;
var kind = 'player';
var group = 'false';

var Task;

var Functions = require('./utils/functions.js');
Functions = new Functions.functions();

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
mongoose.connect('mongodb://localhost/crowdnote_'+project);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('openUri', function() {});
var ItemSchema, Item;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Timestamp = Schema.Timestamp;
itemSchema = Schema({
	// Global
	item_id: String,
        uri: String,
        start: String,
	end: String,   
	instant: String,
	convergence: String,


	// at Runtime
	item_index: String,

	// Tasks 1, 2 and 3
	point: String,
	type: String,
	image: String,

	// Tasks 2 and 3
	content: String,
	content_type: String,

	// Task 3
	x: String,
	y: String,

	// User Identification for contributions
	job_id: String,
	fingerprint: String,

	//Admin
    	task_id: String,
    	qtd_target: String,
    	kind: String,
    	group: String,
    	min_convergence: String,
    	state: String
	

});


var input = new Array();
var curInput = 0;

var Tasks;
var Input;
var Output;
var Aggregation;
var Video;
var Segments;
var Gold;
var Contributions;

init();


// ---------------------  Init Functions -----------------------------

function init(pars){

	Contributions = mongoose.model('contributions_'+activeTask, itemSchema);

	Tasks = mongoose.model('items_100', itemSchema);

	Video = mongoose.model('videos', itemSchema);

	Gold = mongoose.model('golds', itemSchema);

	Segments = mongoose.model('items_0', itemSchema);


        Tasks.find({},function (err, V) {
                if (err) return console.error(err);

                Task = V;



	if(pars){
		qtd_target = pars.qtd_target;
		min_convergence = pars.min_convergence;
		activeTask = pars.task;
		kind = pars.kind;//Tasks 1, 2 and 3: 'job' ; Task 4: 'player'
		group = pars.group;//Tasks 1, 3, 4: false; Task 2: true;
	}
	else{

        	for(i=0; i<Task.length; i++){
                	if(Task[i].state == 2){


                		qtd_target = Task[i].qtd_target;
                		min_convergence = Task[i].min_convergence;
                		kind = Task[i].kind;//Tasks 1, 2 and 3: 'job' ; Task 4: 'player'
                		group = Task[i].group;//Tasks 1, 3, 4: false; Task 2: true;

                        	activeTask = Task[i].task_id;
                        	break;
                	}
        	}
	}


        }).sort({'_id' : 1});






	Input = mongoose.model('items_'+parseInt(activeTask), itemSchema);
	Output = mongoose.model('contributions_'+parseInt(activeTask), itemSchema);
	Aggregation = mongoose.model('items_'+(parseInt(activeTask)+1), itemSchema);

	input = new Array();
	curInput = 0;

	if(kind == 'job'){
		var aggregation_method = require('./aggregation/'+project+'/task_'+activeTask+'.js');
	}	





	Input.find({convergence:0},function (err, V) {
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

app.post('/init', function(req, res) {
	init(req.body);
        res.render('ejs/'+project+'/task_100', null);
});

app.get('/init', function(req, res) {
	init(req.query);
	res.end();
});


app.get('/tasks', function(req, res) {
	res.json(Task);
});



app.get('/current', function(req, res) {
	for(i=0; i<Task.length; i++){
		if(Task[i].task_id == activeTask){
			res.json(Task[i]);
			break;
		}
	}
});



app.post('/aggregate', function(req, res) {
	var points = req.body.points;
	aggregate(points,0);

	var next = parseInt(activeTask) + 1;

        Tasks.findOne({task_id: next},function (err, V) {
                if (err) return console.error(err);
                V.state = '1';
                var c = new Tasks(V);
                c.save(function (err, m0) {if (err) return console.error(err);});
        });

	res.end();
});

function aggregate(points,count){  

console.log(activeTask);

        if(count == points.length)
                return 0;

	points[count].convergence = 0;

        var c = new Aggregation(points[count]);
        c.save(function (err, m0) {if (err) return console.error(err); aggregate(points,count+1) });

}

app.post('/updateConvergence', function(req, res) {
	var points = req.body.points;
	update(points,0);
	res.end();
});


function update(points,count){
	if(count == points.length)
		return 0;



        Input.findOne({_id: points[count].item_id},function (err, V) {
                if (err) return console.error(err);
		V.convergence = points[count].convergence;
		v = V;
        	var c = new Input(V);
        	c.save(function (err, m0) {if (err) return console.error(err); update(points,count+1) });
        });

	//return update(points, count+1);
}



app.get('/changeActiveTask', function(req, res) {
if(req.query.task_a != req.query.task_b){

	var V1;
	var V2;

        Tasks.findOne({task_id: req.query.task_a},function (err, V) {
                if (err) return console.error(err);
		V1 = V;
		V.state = '1';
        	var c = new Tasks(V);
        	c.save(function (err, m0) {if (err) return console.error(err);});
        });

        Tasks.findOne({task_id: req.query.task_b},function (err, V) {
                if (err) return console.error(err);
		V2 = V;
		V.state = '2';
        	var c = new Tasks(V);
        	c.save(function (err, m0) {
				activeTask = req.query.task_b;
				init();
				if (err) return console.error(err);
			});

        });

	res.json(V2);
}else{
	res.json({});
}

});

app.get('/panel', function(req, res) {


        res.render('ejs/'+project+'/panel_'+activeTask, null);
});


app.get('/video', function(req, res) {
        Video.findOne({},function (err, V) {
                if (err) return console.error(err);
                res.json(V);
        });     
});


app.get('/segments', function(req, res) {
        Segments.find({},function (err, V) {
                if (err) return console.error(err);
                res.json(V);
        }).sort({'start' : 1});     
});



app.get('/contributions', function(req, res) {
	Contributions = mongoose.model('contributions_'+activeTask, itemSchema);
        Contributions.find({},function (err, V) {
                if (err) return console.error(err);
                res.json(V);
        }).sort({'instant' : 1, 'point' : 1});     
});




app.get('/gold', function(req, res) {
        Gold.find({},function (err, V) {
                if (err) return console.error(err);
                res.json(V);
        }).sort({'instant' : 1});     
});




app.get('/admin', function(req, res) {
        res.render('ejs/'+project+'/task_100', null);
});

app.get('/', function(req, res) {
	res.render('ejs/'+project+'/task_'+activeTask, null);
});

app.get('/thanks', function(req, res) {
        //res.render('ejs/'+project+'/task_'+activeTask, null);
        res.render('ejs/thanks', null);
});

app.get('/wiki_image', function(req, res) {
var url = req.query.url;
var parts = url.split('/');
var id =parts[parts.length -1];


const request = require('request');

request('https://en.wikipedia.org/w/api.php?action=query&titles='+id+'&prop=pageimages&pithumbsize=600&format=json', { json: true }, (err, res2, body) => {

  if (err) { return console.log(err); }


for(var k in body.query.pages) {
	if(body.query.pages[k].thumbnail != null){

		var path = body.query.pages[k].thumbnail.source;
request.get(path, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
        res.end(data);
    }
});
	}else{
		res.send('');
	}
	break;
}
	

});
	
});

app.get('/player', function(req, res) {
	var contents = new Array()
        job_id = Functions.fingerprint(req,true);
        print = Functions.fingerprint(req,false);
	for(var i=0; i < input.length; i++){
		var obj = input[i];
		obj.job_id = job_id;
		obj.fingerprint = print;
		contents.push(obj);
	}
        res.json(contents);
});

app.get('/job', function(req, res) {
	if(input.length < 1){
		res.render('ejs/thanks', null);
	}

	if(!input[curInput]){
		curInput--;
	}

	var contribs = new Array()
        job_id = Functions.fingerprint(req,true);
        print = Functions.fingerprint(req,false);
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


app.post('/save_video', function(req, res) {
	var data = req.body;
	var c = new Video(data);
	c.save(function (err, m0) {if (err) return console.error(err);});
	res.end();
});


app.post('/save_gold', function(req, res) {
	var data = req.body;


	var marks = data.marks.split(',');

	for(var i=0; i<marks.length; i++){
		data.type = marks[i].split(':')[0];
		data.instant = marks[i].split(':')[1];
		data.point = marks[i].split(':')[2];



		var c = new Gold(data);
		c.save(function (err, m0) {if (err) return console.error(err);});
	}

	res.end();
});


app.post('/save_segments', function(req, res) {
	var data = req.body;


	var ranges = data.segment.split(',');

	for(var i=0; i<ranges.length; i++){
		data.item_id = i;
		data.start = ranges[i].split(':')[0];
		data.end = ranges[i].split(':')[1];
		var c = new Segments(data);
		c.save(function (err, m0) {if (err) return console.error(err);});
	}

        Tasks.findOne({task_id: '0'},function (err, V) {
                if (err) return console.error(err);
                V1 = V;
                V.state = '1';
                var c = new Tasks(V);
                c.save(function (err, m0) {if (err) return console.error(err);});
        });


	res.end();
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

app.get('/aggregate', function(req, res) {
	var agg = new aggregation_method.aggregation(req, res, Output, Aggregation, Functions);
	agg.aggregate();
});

// ------------- Server Functions ------------------------------

app.get('/tools', function(req, res) {
        var task = req.query.task;
        var path = 'views/ejs/task_'+task+'.ejs';
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

app.get('/images', function(req, res) {
	var name = req.query.name;
	var mime = req.query.mime;
	var path = 'views/img/'+name+'.'+mime;
	fs.readFile(path, function (err, data){
		res.writeHead(200, {"Content-Type":"video/"+mime});
       		res.end(data);
   	});
});

// ------------- Create Server ------------------------------

//http.createServer(app).listen(80);

https.createServer({
  	ca: fs.readFileSync("../../ssl/intermediate.crt"),
	key: fs.readFileSync('../../ssl/novaes.tech.key'),
	cert: fs.readFileSync('../../ssl/novaes.tech.crt')
},app).listen(443);



