module.exports = {
	preload,
	postload,
	www
};

var connect = require('connect');
var middlewares = {"preload":{},"postload":{}};
var path = require("path");
var app;
var error = require('./common/errors.js');
var roles = require('../configs/server_roles.json');
var signed_urls = require('./signed_urls.js');
var mpd_engine = require("./engines/mpd.js");
var bodyParser = require('body-parser');
var sql = require("./mysql.js");
var input_validator = require('./input_validator.js');
var shortid = require('shortid');
var web_dir;
//-----------------------------------------------------------------------------
//-Application-----------------------------------------------------------------
//-----------------------------------------------------------------------------

function www(views, web_directory){
	app = require('./middleware/router.js')(views)
	web_dir = views[0];
	
	//Any routing that requires specialized authentication
	
	//Login page
	app.route('/login')
	.get(function(req,res,next){
		res.render('login');
	})
	.post(bodyParser.urlencoded({ extended: false }), authenticate_google);
	
	//User Content
	app.route('/content/:type/:contentId')
	.get(function(req,res,next){
		//Input validation time
		req.params.contentId = input_validator.video_id(req.params.contentId);
		
		//Exit if there's an issue
		if(!req.params.contentId){
			error({"status":403,"res":res});
			return;
		}
		
		//Check if there is a signature
		if(req.query.signature){
			
			//Finds if the signature is valid
			var signed = signed_urls.authenticate_signature(req.params.contentId,req.query.signature);
			if(signed){
				
				//Video content
				if("video" == req.params.type){
					//Check what's in the signature
					if(signed.content && signed.content_path){ //The content file
						
						//Check if the current user matches the requester of the signed url
						if(req.authentication.user == signed.user || "undefined" == typeof signed.user){
							var content_path = path.resolve(signed.content_path + "/" + signed.content);
							res.sendFile(content_path);
						}else{
							//ATTENTION
							//If you hit this location the user has tried very hard to circumvent the privacy settings
							//Or logged out elsewhere...
							res.sendFile(content_path);
							console.error("Privacy circumvention attempted:");
							console.error("\tUser 1:", signed.user);
							console.error("\tUser 2:", req.authentication.user);
							error({"status":403,"res":res});
						}
						
					}else{ //The manifest file
						
						//Prepare the procedure information
						var procedure = {
							"procedure_name":"get_video_owner",
							"values":[req.params.contentId] 
						};
						
						//Get the owner of the video
						sql.procedure(procedure, function(e, r, f){
							if(e){
								console.error("Error performing query:", e.stack);
								error({"status":403,"res":res});
								return;
							}
							
							var results = r[r.length-1][0];
							
							if(!results.user_email || !results.privacy){
								console.error("Invalid video id:",req.params.contentId);
								error({"status":403,"res":res});
								return;
							}
							
							//Checks if the video is private
							if(results.privacy >= 3 && req.authentication.user != results.user_email){
								error({"status":403,"res":res});
								return;
							}
							
							//Path to the video directory
							var content_path = path.resolve(web_dir + "/uploads/users/" + results.user_email + "/videos/" + req.params.contentId);
						
							//The manifest file
							var manifest_path = path.resolve(content_path + "/video.mpd");

							//Initialize the signature
							var data = {
								"resource_id":signed.resource_id,
								"expiry":Date.now() + 86400000,
								"content_path":content_path,
								"user":req.authentication.user
							};
							
							//Create the signatures for the content
							var signatures = {};
							
							//Audio 1
							data.content = "audio_96k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Video 1
							data.content = "video_160x90_200k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Video 2
							data.content = "video_320x180_400k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Video 3
							data.content = "video_640x360_800k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Video 4
							data.content = "video_960x540_1200k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Video 5
							data.content = "video_1280x720_2400k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							data.content = "video_1920x1080_4800k_dashinit.mp4";
							signatures[data.content] = signed.resource_id + "?signature=" + signed_urls.create_signature(data);
							
							//Return the manifest
							var results = mpd_engine(manifest_path,signatures,function(test,rendered){
								res.send(rendered);
							});
						});
					}
				}
					
				if("image" == req.params.type){
					//SQL GET PATH
				}

			}else{
				
				//There is no signature
				error({"res":res,"status":498})
				
			}
			
		}else{
			
			//There is no signature
			error({"res":res,"status":499})
		
		}
	})
	.post(function(req,res,next){
		error({"res":res,"status":403});
	});
		
	return app;
}

//-----------------------------------------------------------------------------
//-Pre-Load--------------------------------------------------------------------
//-----------------------------------------------------------------------------

function preload(){
	var chain = connect();
	
	middlewares.preload.map(function(value,key){
		var middleware = preload[value];
		chain.use(middleware);
	});
	
	return chain;
}

//------------
//-Middleware-
//------------

preload.helmet = require("./middleware/helmet.js");

preload.enforce_ssl = function(req, res, next){
	if(!req.secure)
		res.send("Your session is insecure, please use a secure connection");
	
	return next();
}
preload.authenticate = function(req, res, next){
	console.log();
	console.log("Authentication");
	
	//Initialize authentication object
	req.authentication = {};

	//Check if there is session data
	if(req.session){
		
		//Check if the user is stored
		if(req.session.user){
			req.authentication.user = req.session.user;
			if(req.session.name)
				req.authentication.name = req.session.name;
			console.log("\t", "User:", req.authentication.user);
		}else{
			console.log("\t", "User:", "None");
		}
		
		
		//Check if the role is stored
		if(req.session.role)
			
			//Check if the role exists
			if(roles[req.session.role]){
				
				//Check if the role is allowed to be stored
				if(roles[req.session.role].store_auth){
					
					//Found proper role
					req.authentication.permissions = roles[req.session.role];
					console.log("\t", "Role:", req.session.role);
					
				}else{
					//MAJOR RED FLAG HERE
					//Session data should not be modified by anything but the server_roles
					//The server will never store high level roles in session data
					console.error("THERE HAS BEEN A SECURITY BREAK: SESSION DATA HAS BEEN COMPROMISED");
					throw "Session data has been compromised.";
				}
				
			}
			
			
		else{
			//Check for higher permissions
			//FIX THIS
			req.authentication.permissions = roles.default;
		}
		
		//Check if logged in
		
		//Check for higher role
		
	}
	
	//If no permissions found give default permissions
	if(!req.authentication.permissions){
		req.authentication.permissions = roles.default;
		console.log("\t", "Role:", "Default");
	}
	
	next();
}

preload.authorize = function(req, res, next){
	console.log("Authorization");
	console.log("\t", "Attempting to access:", req.originalUrl);
	//Sets authorized to false, will cause an error to be returned if not authorized
	res.authorized = false;
	
	//Uses data created in authentication
	
	//Parse the URL
	var url_segments = req.originalUrl.split("/");
	url_segments = url_segments.map(function(i){
		return i.split("?");
	});
	
	//Role-based authorization
	res.authorized = req.authentication.permissions.auth.dir.read.includes(url_segments[1][0]);
	
	//Checks if authorized
	if(!res.authorized)
	{
		console.log("\t","Status: Denied");
		//Returns with an error (Try to move to post load so other security features can occur)
		error({
			"status":403,
			"res":res
		});
	}else
	{
		console.log("\t","Status: Allowed");
		//Moves to next middleware
		next();
	}
}

preload.account = function(req, res, next){
	next();
}

middlewares.preload = Object.keys(preload);

//-----------------------------------------------------------------------------
//-Post-Load-------------------------------------------------------------------
//-----------------------------------------------------------------------------

function postload(){
	var chain = connect();
	
	middlewares.postload.map(function(value,key){
		var middleware = postload[value];
		chain.use(middleware);
	});
	
	return chain;
}

//------------
//-Middleware-
//------------

postload.hide_errors = function(req, res, next){
	error({
		"status":404,
		"res":res
	});
	next();
}

middlewares.postload = Object.keys(postload);

//-----------------------------------------------------------------------------
//-Authentication--------------------------------------------------------------
//-----------------------------------------------------------------------------

//ATTENTION - Remove this
var client_id = "117317995166-iluas591aetn02koodm57iuf2dcljdo4.apps.googleusercontent.com";
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2(client_id, '', '');

function authenticate_google(req,res,next){
	//Check if data was submitted
	if(!req.body){
		next();
		return false;
	}
	
	var logout = req.body.logout;
	
	//Check if the token is a string
	if(logout){
		delete req.session.user;
		delete req.session.name;
		delete req.session.role;
		res.send(true);
		return false;
	}
	
	var token = req.body.idtoken;
	//Check if the token is a string
	if("string" != typeof token){
		next();
		return false;
	}
	
	client.verifyIdToken(token,client_id, function(e, login){
		var payload = login.getPayload();
		var userid = payload['sub'];
		var email = payload['email'];
		var name = "User_"+shortid.generate();

		//Prepare the procedure information
		var procedure = {
			"procedure_name":"get_username",
			"values":[email]
		};
		
		//Add the user if they do not currently exist in the database
		sql.procedure(procedure, function(e, r, f){
			if(e){
				console.error("Error performing query:", e.stack);
				return;
			}
			
			var results = r[r.length - 1][0];
			
			//Check if the user is currently stored
			if(!results.name){
				name = "User_"+shortid.generate()
				
				//Create new user
				procedure = {
					"procedure_name":"insert_user",
					"values":[email,name]
				};
				
				sql.procedure(procedure, function(e, r, f){
					if(e){
						console.error("Error performing query:", e.stack);
						return;
					}
					var results = r[2][0];
					
					//Log results
					console.log("New User");
					console.log("\tId:",results.user_id);
					console.log("\tName:",email);
					
					//Create the session
					req.session.user = email;
					req.session.name = name;
					
					//ATTENTION - GET USER ROLE
					var user_role = "user";
					if(roles[user_role].store_auth)
						req.session.role = user_role;
				
					res.send("Authenticated as new user.");
				});
				
			}else{
				
				//Log returning user
				name = results.name;
				console.log("Confirmed returning user");
				console.log("\tName:" + name);
				
				//Create the session
				req.session.user = email;
				req.session.name = name;
				
				//ATTENTION - GET USER ROLE
				var user_role = "user";
				if(roles[user_role].store_auth)
					req.session.role = user_role;
				
				res.send("Authenticated as returning user.");
			}
			
		});
		
		
		
		
		
	});
}

//-----------------------------------------------------------------------------
//-Authorization---------------------------------------------------------------
//-----------------------------------------------------------------------------




