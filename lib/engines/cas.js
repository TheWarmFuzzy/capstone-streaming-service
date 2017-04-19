var config = require("./cas.json");
var fs = require('fs');
var path = require("path");
var part = require("./prt.js");

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function cas_engine(file_path, options, callback){
	
	var web_dir = this.root[0];
	var part_path = path.resolve(web_dir + config.part_location);
	var part_count = Object.keys(config.parts).length;
	var loaded_parts = 0;
	options.parts = {};
	for(var key in config.parts){
		
		//Async broke all the things
		var current_part_path = path.resolve(part_path + "/" + config.parts[key]);
		part(current_part_path,{"key":key},function(e,result){
			if(e)
				return callback(e);
			
			options.parts[result.key] = result.html;
			loaded_parts++;
			if(loaded_parts == part_count){
				cas_engine.start(file_path, options, callback);
			}
		});
	}
}

cas_engine.pages = {};


cas_engine.start = function(file_path, options, callback){
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

//-----------------------------------------------------------------------------
//-Pages-----------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Executes Sequentially

cas_engine.pages.parts = function(page, options){
	//Replace the applicable parts
	for(var key in options.parts){
		page = page.replace(key,options.parts[key]);
	}
	return page;
}

cas_engine.pages.header = function(page, options){
	if(options.user)
		page = page.replace("#header_user#",config.header.logged_in);
	else
		page = page.replace('#header_user#',config.header.logged_out);
	return page;
}

cas_engine.pages.username = function(page, options){
	if(options.user)
		page = page.replace(/#username#/,options.user);
	return page;
}

cas_engine.pages.google = function(page, options){
	if(config.common.google_api_client_id)
		page = page.replace(/#google-api-client_id#/,config.common.google_api_client_id);
	return page;
}

cas_engine.pages.upload = function(page, options){
	var csrf_token = options.csrf_token;
	
	var categories = "";
	config.upload.categories.map(function(value){
		categories += "<option value='" + value.replace(new RegExp(" ", 'g'),"&#32;") + "'>" + value + "</option>" + "\n";
	});
	
	var languages = "";
	config.upload.languages.map(function(value){
		languages += "<option value='" + value.replace(new RegExp(" ", 'g'),"&#32;") + "'>" + value + "</option>" + "\n";
	});
	
	var privacy = "";
	config.upload.privacy.map(function(value){
		privacy += "<option value='" + value.replace(new RegExp(" ", 'g'),"&#32;") + "'>" + value + "</option>" + "\n";
	});
	
	var rating = "";
	config.upload.ratings.map(function(value){
		if(value=="Everyone")
			rating += "<option value='" + value.replace(new RegExp(" ", 'g'),"&#32;") + "' selected='selected'>" + value + "</option>" + "\n";
		else
			rating += "<option value='" + value.replace(new RegExp(" ", 'g'),"&#32;") + "'>" + value + "</option>" + "\n";
	});
	
	page = page
		.replace('#csrf_token#',csrf_token)
		.replace('#categories#',categories)
		.replace('#languages#',languages)
		.replace('#privacy#',privacy)
		.replace('#ratings#',rating);
	return page;
}

cas_engine.pages.watch = function(page, options){
	page = page.replace('#watch_video_id#',options.video_id)
		.replace('#watch_video_signature#',options.video_signature)
		.replace(/#watch_video_title#/g,options.video_title)
		.replace('#watch_video_author#',options.video_username)
		.replace('#watch_video_date_modified#',options.video_date_modified)
		.replace('#watch_video_description#',options.video_description)
		.replace('#watch_video_privacy#',options.video_privacy)
		.replace('#watch_video_category#',options.video_category)
		.replace('#watch_video_language#',options.video_language)
		.replace('#watch_video_rating#',options.video_rating);
	return page;
}



module.exports = cas_engine;