// ---------------------- Includes and Globals ------------------------

var activeTask = 0;

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

//Database - MongoDb
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/crowdnote_exp001');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('openUri', function() {});
var ItemSchema, Item;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Timestamp = Schema.Timestamp;
itemSchema = Schema({
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

var input = new Array();
var curInput = 0;


init();

// ---------------------  Init Functions -----------------------------


function init(){
/*
//Creating bootstrap;

input[0] = {'uri': 'UTg6fdKi9TI', 'start':'10', 'end':'18'};
input[1] = {'uri': 'UTg6fdKi9TI', 'start':'18', 'end':'28'};
input[2] = {'uri': 'UTg6fdKi9TI', 'start':'28', 'end':'40'};
input[3] = {'uri': 'UTg6fdKi9TI', 'start':'40', 'end':'47'};

var c;

for(var i=0; i<4; i++){
	c = new Input({'start':input[i].start , 'end':input[i].end , 'uri':input[i].uri});
        c.save(function (err, m0) {if (err) return console.error(err);});
}
*/

}

//-----------------------  Endpoints   -------------------------------



app.get('/', function(req, res) {
	res.render('task0', null);
});

app.get('/tasks/0/job', function(req, res) {
        var obj = input[curInput];
        if(curInput < input.length-1){
                curInput++;
        }else{
                curInput = 0;
        }

	obj.job_id = fingerprint(req,true);
	obj.fingerprint = fingerprint(req,false);

        res.json(obj);
});

app.post('/tasks/0/store', function(req, res) {
	var data = req.body;
	var contrib = JSON.parse(data.contrib);
        var fingerprint = data.fingerprint;
	var start = JSON.parse(req.body.start);
	var stop = JSON.parse(req.body.stop);
        var plays_1 = JSON.parse(req.body.plays_1);
        var plays_2 = JSON.parse(req.body.plays_2);

	var c = new Contribution({'start':start , 'stop':stop , 'video_1':contrib.ec1, 'video_2': contrib.ec2, 'delta':contrib.delta, 'plays_1':plays_1, 'plays_2':plays_2, 'fingerprint':fingerprint });
	
	c.save(function (err, m0) {if (err) return console.error(err);});

});




// ------------- Functions ------------------------------


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




