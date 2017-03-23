module.exports = {
	preload,
	postload
};

var connect = require('connect');
var middlewares = {"preload":{},"postload":{}};

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
	next();
}

preload.authorize = function(req, res, next){
	res.authorized = false;
	var url_segments = req.originalUrl.split("/");
	if("uploads" === url_segments[1])
	{
		if("photos" === url_segments[3])
		{
			
		}
		
		if("videos" === url_segments[3])
		{
			res.authorized = video_authorization(req,res);
		}
	}
	next();
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
	console.log("post");
	res.status(404).send("Oops");
	next();
}

middlewares.postload = Object.keys(postload);

//-----------------------------------------------------------------------------
//-Authentication--------------------------------------------------------------
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
//-Authorization---------------------------------------------------------------
//-----------------------------------------------------------------------------

function video_authorization(req,res){
	//CHECK AUTHENTICATION
	return true;
}



