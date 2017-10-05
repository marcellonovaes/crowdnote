// ---------------------- Requires, Includes and Globals ------------------------

var project = 'exp003';
var qtd_target = 10;
var activeTask = 0;
var kind = 'job';//Tasks 1, 2 and 3: 'job' ; Task 4: 'player'
var group = false;//Tasks 1, 3, 4: false; Task 2: true;

if(kind == 'job'){
	var aggregation_method = require('./aggregation/'+project+'/task_'+activeTask+'.js');
}	

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

	// at Runtime
	item_index: String,

	// Tasks 1, 2 and 3
	point: String,

	// Tasks 2 and 3
	content: String,
	content_type: String,

	// Task 3
	x: String,
	y: String,

	// User Identification for contributions
	job_id: String,
	fingerprint: String
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
	}).sort({'instant' : 1});
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
	res.render('ejs/'+project+'/task_'+activeTask, null);
});

app.get('/thanks', function(req, res) {
	res.render('ejs/'+project+'/task_'+activeTask, null);
	//res.render('ejs/thanks', null);
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

https.createServer({
  	ca: fs.readFileSync("../../ssl/intermediate.crt"),
	key: fs.readFileSync('../../ssl/novaes.tech.key'),
	cert: fs.readFileSync('../../ssl/novaes.tech.crt')
},app).listen(443);

