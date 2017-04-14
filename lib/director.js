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
		
		//Check if there is a signature
		if(req.query.signature){
			
			//Finds if the signature is valid
			var signed = signed_urls.authenticate_signature(req.params.contentId,req.query.signature);
			if(signed){
				
				if("video" == req.params.type){
					
					if(signed.content && signed.content_path){
						
						//The content file
						var content_path = path.resolve(signed.content_path + "/" + signed.content);
						res.sendFile(content_path);
						
					}else{					
						//SQL GET PATH
						var content_path = path.resolve(web_dir + "/uploads/users/thewarmestfuzzy@gmail.com/videos/p13");
					
						//The manifest file
						var manifest_path = path.resolve(content_path + "/video.mpd");

						//Initialize the signature
						var data = {
							"resource_id":signed.resource_id,
							"expiry":Date.now() + 86400000,
							"content_path":content_path
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
	
	
	var data = {
		"resource_id":"1",
		"expiry":Date.now() + 86400000
	};
	
	var signature = signed_urls.create_signature(data);
	console.log(signature);
	
	
	
	
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
		req.session.user = email;
		
		//GET USER ROLE
		var user_role = "user";
		if(roles[user_role].store_auth)
			req.session.role = user_role;
		
		console.log(req.session.role);
		res.send("Authenticated");
	});
}

//-----------------------------------------------------------------------------
//-Authorization---------------------------------------------------------------
//-----------------------------------------------------------------------------

function authorize_content(req,res){
	//CHECK AUTHENTICATION
	return true;
}





