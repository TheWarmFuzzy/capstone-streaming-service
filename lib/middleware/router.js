module.exports = www;

var path = require("path");
var express = require("express");
var app = express();
var multer = require('multer');

var bodyParser = require('body-parser')
var csrf = require("./csrf.js");
var signed_urls = require('../signed_urls.js');
var input_validator = require('../input_validator.js');
var shortid = require('shortid');
var fs = require('fs');
var path = require("path");
var web_dir;
var upload;

function www(views){
	//Grab the web directory 
	web_dir = views[0];
	
	//Set the view to the web directory
	app.set('views', views);
	
	//Set the upload destination for files
	var upload_dest = path.resolve(web_dir + "/uploads/tmp/") + "\\";
	upload = multer({"dest":upload_dest});

	var uploads = upload.fields([
		{"name": "_csrf", "maxCount": 1},
		{"name": "privacy", "maxCount": 1},
		{"name": "category", "maxCount": 1},
		{"name": "language", "maxCount": 1},
		{"name": "video", "maxCount": 1}
	]);
	
	//Use the libraries
	app.use("/css",express.static(path.resolve(web_dir + "/css/")));
	app.use("/fonts",express.static(path.resolve(web_dir + "/fonts/")));
	app.use("/js",express.static(path.resolve(web_dir + "/js/")));
	app.use("/img",express.static(path.resolve(web_dir + "/img/")));
	
	//Route the pages
	app.route('/').get(get_home).post(post_home);
	app.route('/watch').get(get_watch).post(post_watch);
	app.route('/upload').get(csrf, get_upload).post(uploads, csrf, post_upload);
	
	return app;
}

//-----------------------------------------------------------------------------
//-Static-Routing--------------------------------------------------------------
//-----------------------------------------------------------------------------


//------------
//-Home-------
//------------

function get_home(req, res, next){
	res.render('index',{"user":req.session.user});
}

function post_home(req, res, next){
	
}

//------------
//-Watch------
//------------

function get_watch(req, res, next){
	var video_id = input_validator.video_id(req.query.id);

	if(!video_id)
		res.send("You fucked up");
	
	var data = {
		"resource_id":video_id,
		"expiry":Date.now() + 86400000
	};
	
	var signature = signed_urls.create_signature(data);	
	
	res.render('video_watch',{"video_id":video_id, "video_signature":signature});	
}

function post_watch(req, res, next){
	
}

//------------
//-Upload-----
//------------

function get_upload(req, res, next){
	res.render("video_upload",{csrf_token: req.csrfToken(),"user":req.session.user});
}

function post_upload(req, res, next){
	//Display home page
	res.send("Your video has been uploaded. And will be available shortly.");
	var new_video_id = shortid.generate();
	console.log(req.files);
	/*
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(dest);
	src.on('end',function(){});
	src.on('error',function(e){});
	*/
}

//-----------------------------------------------------------------------------
//-Dynamic-Routing-------------------------------------------------------------
//-----------------------------------------------------------------------------

function get_video_path(id){
	var username = "maknoon",
		filename = "test.mp4";
	
	//QUERY DATABASE
	
	if("string" != typeof username || "string" != typeof filename)
		return undefined;
	
	var video_path = "/uploads/#user#/videos/#file#".replace("#user#",username).replace("#file#",filename);
	return video_path;
}