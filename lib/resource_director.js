module.exports = {
	engine,
	uploads
};

var fs = require('fs');
var path = require("path");
var express = require("express");
var app = express();

function engine(path, options, callback){
	options.rep = options.rep || {"a":"a"};
	fs.readFile(path, function(e, content){
		if(e)
			return callback(e);
		var rendered = content.toString()
		.replace('#video_id#',options.video_id);;
		/*options.rep.map(function(value,key){
			content.replace(key,value.join(" "));
		});*/
		return callback(null, rendered)
		
	});
}

function load_user_content(req, res, next){
	//console.log(path.resolve(WEB_DIRECTORY + "/uploads/maknoon/videos/test.mp4"));
	
	var options = {
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	}
	//res.sendFile(path.resolve(WEB_DIRECTORY + "/uploads/maknoon/videos/test.mp4"));
	//res.render('index');
	/*
	res.sendFile(path.resolve(WEB_DIRECTORY + "/index.html"), options, function(e){
		if(e){
			console.log(e);
		}else{
			console.log("sent");
		}
	});
	*/
	//res.send("Derp");
	res.sendFile(path.resolve(WEB_DIRECTORY + "/index.html"));
	next();
}

function uploads(){
	return app;
}

app.get('/:user/:type/:file', function(req, res){
	var options = {};
	if(req.authorized)
		res.sendFile(path.resolve(WEB_DIRECTORY + "/uploads/maknoon/videos/test.mp4"), options, function(e){
			if(e){}else{}
		});
	else
		res.status(403).send("Forbidden");
});
