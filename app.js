// ---------------------- Includes and Globals ------------------------

var activeTask = 0;
var qtd_target = 3;



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
	qtd: String,
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

var input = new Array();
var curInput = 0;

init();

// ---------------------  Init Functions -----------------------------

function init(){
	Input.find({},function (err, V) {
		if (err) return console.error(err);
		for(var i=0; i < V.length; i++){
			input[i] = V[i];
			input[i].qtd = 0;
		}
	}).sort({'_id' : 1});
}


//-----------------------  Endpoints   -------------------------------



app.get('/', function(req, res) {
	res.render('ejs/task_'+activeTask, null);
});

app.get('/thanks', function(req, res) {
	res.render('ejs/thanks', null);
});


app.get('/job', function(req, res) {
	var contribs = new Array()
        job_id = fingerprint(req,true);
        print = fingerprint(req,false);

        Output.find({fingerprint: print},function (err, C) {
                if (err) return console.error(err);
                for(var i=0; i < C.length; i++){
                        contribs[i] = C[i];
                }
	

		if(contribs.length == input.length){
			res.redirect('https://novaes.tech/thanks');
		}else{
			curInput = findNext(contribs,input,curInput);
		        var obj = input[curInput];
			obj.item_index = curInput;
		        if(curInput < input.length-1){
       	 	        curInput++;
		        }else{
       		         	curInput = 0;
       		 	}

			obj.job_id = job_id;
			obj.fingerprint = print;

		        res.json(obj);
		}
        }).sort({'item_id' : 1});

});

function findNext(contribs,input,ini){
	var item;
	var found=false;

	while(found == false){
		found = true;
		item = input[ini];
		for(var i=0; i<contribs.length; i++){
			if(new String(item._id).valueOf() == new String(contribs[i].item_id).valueOf()){
				ini++;
				if(ini >= input.length){
					ini = 0;
				}
				found = false;
				break;
			}
		}
	}

	return ini;
}





app.post('/store', function(req, res) {
	var data = req.body;
	input[data.item_index].qtd++;
	data.item_id = input[data.item_index]._id;
	delete data.item_index;
	var c = new Output(data);
	c.save(function (err, m0) {if (err) return console.error(err);});
	res.end();
});




// ------------- Functions ------------------------------

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




