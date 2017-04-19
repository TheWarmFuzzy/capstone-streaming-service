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
var execFile = require('child_process').execFile;
var sql = require("../mysql.js");

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
	
	//Prepare the procedure information
	var procedure = {
		"procedure_name":"get_video_details",
		"values":[video_id] 
	};
	
	//Add the user if they do not currently exist in the database
	sql.procedure("user_create", procedure, function(e, r, f){
		if(e){
			res.render('watch',{"video_id":"Error", "video_signature":"Even-More-Error"});
		}else{
			
			console.log(r);
			
			
			var data = {
				"resource_id":video_id,
				"expiry":Date.now() + 86400000
			};
			var signature = signed_urls.create_signature(data);	
			
			var results = r[r.length-1][0];
			
			res.render('watch',{
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

function post_watch(req, res, next){
	
}

//------------
//-Upload-----
//------------



function get_upload(req, res, next){
	res.render("upload_video",{csrf_token: req.csrfToken(),"user":req.session.user});
}

function post_upload(req, res, next){
	
	var new_video_id = shortid.generate();
	var	file_path = req.files.video[0].path,
		dest_path = "/uploads/users/" + req.authentication.user + "/videos/" + new_video_id;
		
	//Input validation
	req.body.title = input_validator.video_title(req.body.title);
	req.body.description = input_validator.video_description(req.body.description);
	req.body.privacy = input_validator.string(req.body.privacy);
	req.body.category = input_validator.string(req.body.category);
	req.body.language = input_validator.string(req.body.language);
	
	if(!req.body.title || !req.body.description || !req.body.privacy || !req.body.category || !req.body.language){
		//Send the error
		res.send("A video with invalid data was submitted, please abide by the limits set by the upload form and resubmit.");
		
		//Try to delete any uploaded files
		delete_file(file_path);
		return;
	}
	
	//Display home page
	res.send("Your video has been uploaded. And will be available at the following URL shortly (15-20 min):<br/>"+new_video_id);
	
	console.log("File Upload Started");
	
	dest_path = make_user_directory(dest_path);
	
	console.log("\t","Upload path:", file_path);
	console.log("\t","Destination path:", dest_path);
		
	//Transcode the video
	var child = execFile('transcoder.bat', [file_path,dest_path], (error, stdout, stderr) => {
		if (error) {
			console.error(stdout);
		}
		
		//Log the transcoder output
		console.log(stdout);
		
		//Try to delete any uploaded files
		delete_file(file_path);
				
		//Store the video in the database
		//Prepare the procedure information
		var procedure = {
			"procedure_name":"insert_video",
			//Id, email, title, description, privacy, category, language, rating
			//ATTENTION - Fix this
			"values":[new_video_id, req.authentication.user, req.body.title, req.body.description,0,0,"en",0] 
		};
		
		//Add the user if they do not currently exist in the database
		sql.procedure("user_create", procedure, function(e, r, f){
			if(e){
				console.error("Error performing query:", e.stack);
				error({"status":403,"res":res});
				return;
			}
		});

	});

	/*
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(dest);
	src.on('end',function(){});
	src.on('error',function(e){});
	*/
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