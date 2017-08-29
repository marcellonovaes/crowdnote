// ---------------------- Includes and Globals ------------------------

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
mongoose.connect('mongodb://localhost/livesync_obama');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('openUri', function() {});
var ContributionSchema, Constribution;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Timestamp = Schema.Timestamp;
contributionSchema = Schema({
        start: String,
        stop: String,
        fingerprint: String,
	video_1: String,
	video_2: String,
	plays_1: String,
	plays_2: String,
	delta: String
});
Contribution = mongoose.model('Contribution', contributionSchema);

var relations = new Array();
var curRelation = 0;


init();

// ---------------------  Init Functions -----------------------------


function init(){

//	dal.addAsset(new d.Asset('Ul90OXkOhpM','Ul90OXkOhpM',53));
//	dal.addAsset(new d.Asset('Leuh8lqvKyc','Leuh8lqvKyc',34));
//	dal.addAsset(new d.Asset('6fuGNMc7ok4','6fuGNMc7ok4',118))
var A = {'uri': 'Q6RjxZRd4Qo', 'label':'Q6RjxZRd4Qo', 'dur':'548'};
var B = {'uri': 'un2fzaywqEk', 'label':'un2fzaywqEk', 'dur':'39'};
var C = {'uri': 'jJfGx4G8tjo', 'label':'jJfGx4G8tjo', 'dur':'1710'};
var D = {'uri': '1rZnG0U2g2s', 'label':'1rZnG0U2g2s', 'dur':'190'};

//relations[0] = {'fingerprint':'','from':A , 'to':B};//q u 7 0 93 
//relations[0] = {'fingerprint':'','from':A , 'to':C};//q j 5 0 -27
//relations[0] = {'fingerprint':'','from':A , 'to':D};//q 1 4 0 91
//relations[3] = {'fingerprint':'','from':B , 'to':C};//u j 11 3 -120
relations[0] = {'fingerprint':'','from':B , 'to':D};//u 1 0 0 2
//relations[5] = {'fingerprint':'','from':C , 'to':D};//j 1 6 0 117


}

//-----------------------  Endpoints   -------------------------------

app.get('/', function(req, res) {

});

app.get('/tasks/0/job', function(req, res) {
        var obj = relations[curRelation];
        if(curRelation < relations.length-1){
                curRelation++;
        }else{
                curRelation = 0;
        }

	obj.fingerprint = fingerprint(req);

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

function fingerprint(req){
        var fingerprint = require('ip').address();
        fingerprint += req.headers['user-agent'];
        fingerprint += Date.now();
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




