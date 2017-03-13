//Server Constants
const PORT = 8080;
const URL_HOME = "http://localhost:8080";
const WEB_DIRECTORY = __dirname + "/www";
global.WEB_DIRECTORY = WEB_DIRECTORY;
const PAGE_HOME = WEB_DIRECTORY + '/index.html';
const PAGE_WATCH = WEB_DIRECTORY + '/video_watch.html';
const PAGE_UPLOAD = WEB_DIRECTORY + '/video_upload.html';

//Environment Variables
var config = require("./configs/server.json");
var extra_logs = require("./modules/log.js");
console.log = extra_logs.date_time_log;

//Server Variables
var http = require('http');
var express = require('express');

var app = express();
var server = app.listen(PORT,start);
var resource_director = require("./lib/resource_director.js");
var security_director = require("./lib/security_director.js");
var path = require("path");

app.engine('cas', resource_director.engine);
app.set('views', WEB_DIRECTORY);
app.set('view engine', 'cas');

app.use(security_director.preload());

//Home Page
app.route('/')
.get(function(req, res, next)
{
	//res.sendFile(PAGE_HOME);
	res.render('index');
})
.post(function(req,res,next)
{
	
});

//Watch Page
app.route('/watch')
.get(function(req, res, next)
{
	//Load video page
	serve_video_page(req.query.id, res);
	
})
.post(function(req,res,next)
{
	
});

//Upload Page
app.route('/upload')
.get(function(req, res, next)
{
	res.sendFile(PAGE_UPLOAD);
})
.post(function(req,res,next)
{
	//Display home page
	upload(req, res, function(e)
	{
		if(e)
		{
			return res.end("Error uploading file.");
		}
		res.end("File is uploaded!");
		
	});
});

//User Content
app.use("/uploads", resource_director.uploads());

//Function that is run when the server starts
function start()
{
	//Log the server address and port
	console.log("Starting server",server.address().address + server.address().port);
}

function serve_video_page(id, res)
{
	var video_exists = false;
	
	//QUERY DATABASE
	if(5 == Number(id))
	{
		video_exists = true;
	}
	
	//If video doesn't exist go to homepage
	if(!video_exists)
	{
		console.log("Redirecting user: Video does not exist - " + id); 
		
		res.writeHead(301,
		  {Location: URL_HOME}
		);
		return res.end();
	}
	
	var path = "/uploads/maknoon/videos/test.mp4";
	res.render('video_watch',{video_id:path});
	
}