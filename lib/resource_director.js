module.exports = {
	engine,
	www
};

const URL_HOME = "http://localhost:8080";
const WEB_DIRECTORY = ROOT_DIRECTORY + "/www";
var engine_config = require(ROOT_DIRECTORY + "/configs/engine.json");
var fs = require('fs');
var path = require("path");
var express = require("express");
var app = express();
var csrf = require("./middleware/csrf.js");


app.engine('cas', engine);
app.set('views', WEB_DIRECTORY);
app.set('view engine', 'cas');
	
//-----------------------------------------------------------------------------
//-Application-----------------------------------------------------------------
//-----------------------------------------------------------------------------

function www(){
	
	return app;
}

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function engine(path, options, callback){
	options.rep = options.rep || {"a":"a"};
	fs.readFile(path, function(e, content){
		if(e)
			return callback(e);
		var rendered = content.toString();
		
		rendered = engine_page_upload(rendered,options);
		rendered = engine_page_watch(rendered,options);
		return callback(null, rendered)
		
	});
}

function engine_page_upload(page, options){
	var csrf_token = options.csrf_token;
	
	var categories = "";
	engine_config.upload.categories.map(function(value){
		categories += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	var languages = "";
	engine_config.upload.languages.map(function(value){
		languages += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	var privacy = "";
	engine_config.upload.privacy.map(function(value){
		privacy += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	page = page
		.replace('#csrf_token#',csrf_token)
		.replace('#categories#',categories)
		.replace('#languages#',languages)
		.replace('#privacy#',privacy);
	return page;
}

function engine_page_watch(page, options){
	page = page.replace('#video_id#',options.video_id);
	return page;
}
//-----------------------------------------------------------------------------
//-Resource-Allocation---------------------------------------------------------
//-----------------------------------------------------------------------------

function redirect(res, status, location){
	console.log("Redirecting user: Video does not exist"); 
		
	res.writeHead(status,
	  {Location: location}
	);
	
	return res.end();
}

function get_video_path(id){
	var username = "maknoon",
		filename = "test.mp4";
	
	//QUERY DATABASE
	
	if("string" != typeof username || "string" != typeof filename)
		return undefined;
	
	var video_path = "/uploads/#user#/videos/#file#".replace("#user#",username).replace("#file#",filename);
	return video_path;
}

//-----------------------------------------------------------------------------
//-Routing---------------------------------------------------------------------
//-----------------------------------------------------------------------------

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
	var video_path = get_video_path(req.query.id);

	if(undefined === video_path)
		return redirect(res, 301, URL_HOME);
	
	res.render('video_watch',{video_id:video_path});	
})
.post(function(req,res,next)
{
	
});


//Upload Page
app.route('/upload')
.get(csrf,function(req, res)
{
	res.render("video_upload",{csrf_token: req.csrfToken()});
})
.post(csrf,function(req,res)
{
	//Display home page
	res.send("wooo");
	/*upload(req, res, function(e)
	{
		if(e)
		{
			return res.end("Error uploading file.");
		}
		res.end("File is uploaded!");
		
	});*/
	
});


//User Made Content
app.get('/uploads/:user/:type/:file', function(req, res){
	var options = {};
	if(res.authorized)
		res.sendFile(path.resolve(WEB_DIRECTORY + "/uploads/maknoon/videos/test.mp4"), options, function(e){
			if(e){}else{}
		});
	else
		res.status(403).send("Forbidden");
});

