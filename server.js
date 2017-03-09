//Server Constants
const PORT = 8080;
const URL_HOME = "http://localhost:8080";
const WEB_DIRECTORY = __dirname + "/www";
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



var fs = require('fs');
var res_dir_module = require("./lib/resource_director.js");
var r_director = new res_dir_module.ResourceDirector(express,WEB_DIRECTORY);



app.use("/videos", r_director.app);

//Home Page
app.route('/')
.get(function(req, res, next)
{
	res.sendFile(PAGE_HOME);
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
	
	r_director.load();
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
	upload(request, response, function(e)
	{
		if(e)
		{
			return response.end("Error uploading file.");
		}
		response.end("File is uploaded!");
		
	});
});

//Function that is run when the server starts
function start()
{
	//Log the server address and port
	console.log("Starting server",server.address().address + server.address().port);
}

function serve_video_page(id, response)
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
		
		response.writeHead(301,
		  {Location: URL_HOME}
		);
		return response.end();
	}

	var path = "/videos/test.mp4";

	//REPLACE STRING IN VIDEO PAGE
	//Load page
	fs.readFile(PAGE_WATCH, 'utf8', function (err, data)
	{
		//If error
		if(err){
			console.log("Redirecting user: Page failed to load - " + PAGE_WATCH); 
			response.writeHead(301,
			  {Location: URL_HOME}
			);
			return response.end();
		}
		
		//Replace with the video path
		var result = data.replace(/VIDEO_STRING/g,path);
		
		//Send the new page
		return response.send(result);
	});
	
}