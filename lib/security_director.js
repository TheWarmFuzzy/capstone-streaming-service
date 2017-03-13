module.exports = {
	preload,
	postload,
	root
};

var connect = require('connect');
var helmet = require('helmet');
var middlewares = {"preload":{},"postload":{}};


var root;

function preload(){
	var chain = connect();
	
	middlewares.preload.map(function(value,key){
		var middleware = preload[value];
		chain.use(middleware);
	});
	
	return chain;
}

function postload(){
	var chain = connect();
	
	middlewares.postload.map(function(value,key){
		var middleware = postload[value];
		chain.use(middleware);
	});
	
	return chain;
}

preload.helmet = require("./modules_sec/helmet.js");
preload.authenticate = function(req, res, next){
	next();
}

preload.authorize = function(req, res, next){
	req.authorized = false;
	var url_segments = req.originalUrl.split("/");
	if("uploads" === url_segments[1])
	{
		if("photos" === url_segments[3])
		{
			
		}
		
		if("videos" === url_segments[3])
		{
			req.authorized = video_authorization(req,res);
		}
	}
	next();
}

preload.account = function(req, res, next){
	
	next();
}


postload.hide_errors = function(req, res, next){
	next();
}
middlewares.preload = Object.keys(preload);
middlewares.postload = Object.keys(postload);


function video_authorization(req,res){
	//CHECK AUTHENTICATION
	return false;
}