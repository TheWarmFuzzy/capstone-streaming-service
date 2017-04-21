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
var spawn = require('child_process').spawn;
var sql = require("../mysql.js");
var error = require('../common/errors.js');
var web_dir;

function www(views){
	//Grab the web directory 
	web_dir = views[0];
	
	//Set the view to the web directory
	app.set('views', views);
	
	//Set the upload destination for files
	
	
	
	var storage = multer.diskStorage({
		"destination": function(req, file, callback){
			callback(null, path.resolve(web_dir + "/uploads/tmp/"));
		},
		"filename": function(req, file, callback){
			var name = shortid.generate();
			var extension = "",
				user = "";
			
			if(req.authentication.user)
				user = req.authentication.user;
			
			if("video/mp4" == file.mimetype)
				extension = ".mp4";

			callback(null,name + user + extension);
		}
		
	});
	
	var upload = multer({"storage":storage});
	
	var uploads = upload.fields([
		{"name": "_csrf", "maxCount": 1},
		{"name": "title", "maxCount": 1},
		{"name": "description", "maxCount": 1},
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
	app.route('/').get(get_home).post(post_unsupported);
	app.route('/watch').get(get_watch).post(post_unsupported);
	app.route('/upload').get(csrf, get_upload).post(uploads, csrf, post_upload);
	app.route('/myvideos').get(get_myvideos).post(post_unsupported);
	app.route('/search').get(get_search).post(post_unsupported);
	app.route('/recent').get(get_recent).post(post_unsupported);
	
	return app;
}

//-----------------------------------------------------------------------------
//-Static-Routing--------------------------------------------------------------
//-----------------------------------------------------------------------------

//------------
//-Common-----
//------------

function get_unsupported(req, res, next){
	error({
		"res":res,
		"status":405,
		"engine":{
			"user":req.authentication.user
		}
	});
}

function post_unsupported(req, res, next){
	error({
		"res":res,
		"status":405,
		"engine":{
			"user":req.authentication.user
		}
	});
}

//------------
//-Home-------
//------------

function get_home(req, res, next){
	res.render('index',{"user":req.session.name});
}



//------------
//-Watch------
//------------

function get_watch(req, res, next){
	var video_id = input_validator.video_id(req.query.id);
	
	//Prepare the procedure information
	var procedure = {
		"procedure_name":"get_video_details",
		"values":[video_id] 
	};
	
	//Add the user if they do not currently exist in the database
	sql.procedure(procedure, function(e, r, f){
		if(e){
			res.render('watch',{"video_id":"Error", "video_signature":"Even-More-Error"});
		}else{
			
			var data = {
				"resource_id":video_id,
				"expiry":Date.now() + 86400000
			};
			var signature = signed_urls.create_signature(data);	
			
			var results = r[r.length-1][0];
			
			res.render('watch',{
				"user":req.session.name,
				"video_id":video_id, 
				"video_signature":signature,
				"video_username":results.username,
				"video_date_modified":results.date_modified,				
				"video_title":results.title,
				"video_description":results.description,
				"video_privacy":results.privacy,
				"video_category":results.category,
				"video_language":results.language,
				"video_rating":results.rating});
			
		}
	});
}

//------------
//-Upload-----
//------------



function get_upload(req, res, next){
	res.render("upload_video",{csrf_token: req.csrfToken(),"user":req.session.name});
}

function post_upload(req, res, next){
	
	var new_video_id = shortid.generate();
	var	file_path = req.files.video[0].path,
		dest_path = "/uploads/users/" + req.authentication.user + "/videos/" + new_video_id;
		
	//Input validation
	req.body.title = input_validator.video_title(req.body.title);
	req.body.description = input_validator.video_description(req.body.description);
	req.body.privacy = input_validator.integer(req.body.privacy,1,4);
	req.body.category = input_validator.integer(req.body.category,1,15);
	req.body.language = input_validator.static_string(req.body.language,["en","fr","es"]);
	req.body.rating = input_validator.integer(req.body.rating,1,6);

	if(!req.body.title || !req.body.description || !req.body.privacy || !req.body.category || !req.body.language || !req.body.rating){
		//Send the error
		error({
			"res":res,
			"status":412,
			"engine":{
				"error_message":"A video with invalid data was submitted, please abide by the limits set by the upload form and resubmit.",
				"user":req.authentication.user
			}
		});
		
		//Try to delete any uploaded files
		delete_file(file_path);
		return;
	}
	
	//Not actually an error
	error({
		"res":res,
		"status":200,
		"engine":{
			"error_code":"Upload Success",
			"error_message":"Your video has been uploaded. And will be available shortly (15-20 min) at the following link: <a href='watch?id=" + new_video_id + "'>Video</a>",
			"user":req.authentication.user
		}
	});
	
	//Create the user's new video directory
	dest_path = make_user_directory(dest_path);

	//Transcode the video
	var transcoder = spawn('transcoder.bat', [file_path,dest_path]);
	
	//Log it
	console.log("File Upload Started");
	console.log("\t","Upload path:", file_path);
	console.log("\t","Destination path:", dest_path);
	
	//Output
	transcoder.stdout.on('data',(data) => {

	});
	
	//Failure
	transcoder.stderr.on('data',(data) => {
		
		//Log the error
		//Do not uncomment, slows down due to garbage logs
		//console.error("Error transcoding video:",data);
	});
	
	//End
	transcoder.on('close',(data) => {
		
		//Try to delete any uploaded files
		delete_file(file_path);
		
		//Store the video in the database
		var procedure = {
			"procedure_name":"insert_video",
			"values":[
				new_video_id, 
				req.authentication.user, 
				req.body.title, 
				req.body.description,
				req.body.privacy,
				req.body.category,
				req.body.language,
				req.body.rating] 
		};
		
		//Store the video in the database
		sql.procedure(procedure, function(e, r, f){
			if(e){
				console.error("Error performing query:", e.stack);
				return;
			}
			console.log("Video stored in database");
			console.log("\tId:",new_video_id);
		});
		
	});
}

function make_user_directory(user_path){
	var path_segments = user_path.split("/");
	
	//Get root for directory
	var dir = path.resolve(web_dir);
	for(var i = 0; i < path_segments.length; i++){
		
		//Get next level
		dir = path.resolve(dir + "/" + path_segments[i]);
	
		//Make directory
		if(!fs.existsSync(dir))
			fs.mkdirSync(dir);
	}
	return dir;
}

function delete_file(file_path){
	file_path = path.resolve(file_path);
	console.log("Delete file - " + file_path);
	
	fs.stat(file_path, function(e, stats){
		if(e){
			console.log("\t", "Status: Failed - File does not exist");
			return;
		}
		
		fs.unlink(file_path, function(e){
			if(e){
				console.log("\t", "Status: Failed - " + e);
				return;
			}
			
			console.log("\t", "Status: Success");
		});
	});
}

//------------
//-My-Videos--
//------------

function get_myvideos(req, res, next){
	var procedure = {
		"procedure_name":"get_user_videos",
		"values":[req.authentication.user] 
	};
	
	//Store the video in the database
	sql.procedure(procedure, function(e, r, f){
		if(e){
			console.error("Error performing query:", e.stack);
			return;
		}
		
		var results = r[0];

		res.render("my_videos",{"user":req.session.name,"my_videos":results});
	});
	
}

//------------
//-Recent-----
//------------

function get_recent(req, res, next){
	var procedure = {
		"procedure_name":"get_recent_videos",
		"values":[] 
	};
	
	//Store the video in the database
	sql.procedure(procedure, function(e, r, f){
		if(e){
			console.error("Error performing query:", e.stack);
			return;
		}
		
		var results = r[0];

		res.render("recent_videos",{"recent_videos":results});
	});
	
}

//------------
//-Search-----
//------------


function get_search(req, res, next){
	var search_term = input_validator.video_title_part(req.query.term);
	if(search_term){
		var procedure = {
			"procedure_name":"get_search_results",
			"values":[search_term] 
		};
		
		//Store the video in the database
		sql.procedure(procedure, function(e, r, f){
			if(e){
				console.error("Error performing query:", e.stack);
				res.send("");
				return;
			}
			
			var results = r[0];

			res.render("search",{"search_results":results});
		});
	}else{
		res.send("");
	}
}