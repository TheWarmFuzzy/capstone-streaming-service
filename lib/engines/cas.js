var config = require("./cas.json");
var fs = require('fs');
var path = require("path");

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function cas_engine(file_path, options, callback){
	//Open the file
	fs.readFile(path.resolve(file_path), function(e, content){
		//Display the error
		if(e)
			return callback(e);
		
		//Convert the file to a string
		var rendered = content.toString();
		
		//Run through the different replacement criteria
		Object.keys(cas_engine.pages).map(function(key){
			rendered = cas_engine.pages[key](rendered,options);
		});
		
		//Move on
		return callback(null, rendered)
		
	});
}

cas_engine.pages = {};

//-----------------------------------------------------------------------------
//-Pages-----------------------------------------------------------------------
//-----------------------------------------------------------------------------

cas_engine.pages.google = function(page, options){
	page = page
		.replace('#google-api-client_id#',config.global["google-api-client_id"]);
	return page;
}

cas_engine.pages.upload = function(page, options){
	var csrf_token = options.csrf_token;
	
	var categories = "";
	config.upload.categories.map(function(value){
		categories += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	var languages = "";
	config.upload.languages.map(function(value){
		languages += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	var privacy = "";
	config.upload.privacy.map(function(value){
		privacy += "<option value='" + value.replace(new RegExp(" ", 'g'),"") + "'>" + value + "</option>" + "\n";
	});
	
	page = page
		.replace('#csrf_token#',csrf_token)
		.replace('#categories#',categories)
		.replace('#languages#',languages)
		.replace('#privacy#',privacy);
	return page;
}

cas_engine.pages.watch = function(page, options){
	page = page.replace('#watch_video_id#',options.video_id);
	page = page.replace('#watch_video_signature#',options.video_signature);
	return page;
}

cas_engine.pages.header = function(page, options){
	if(options.user)
		page = page.replace('#nav_options#',"<a class='btn btn-primary' href='/upload'>Upload</a> <a class='btn btn-danger' href='/login'>Sign out</a>");
	else
		page = page.replace('#nav_options#',"<a class='btn btn-success' href='/login'>Sign in</a>");
	return page;
}

module.exports = cas_engine;