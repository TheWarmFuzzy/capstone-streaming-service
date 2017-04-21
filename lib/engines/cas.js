var config = require("./cas.json");
var fs = require('fs');
var path = require("path");
var part = require("./prt.js");
var signed_urls = require('../signed_urls.js');

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function cas_engine(file_path, options, callback){
	
	var web_dir = this.root[0];
	var part_path = path.resolve(web_dir + config.part_location);
	var part_count = Object.keys(config.parts).length;
	var loaded_parts = 0;
	
	
	options = options || {};
	options.parts = {};
	options.web_directory = web_dir;
	
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
	if(options.user){
		page = page.replace("#header_user#",config.header.logged_in);
		page = page.replace("#header_user_videos#",config.header.my_videos);
	}else{
		page = page.replace('#header_user#',config.header.logged_out);
		page = page.replace("#header_user_videos#","");
	}
	return page;
}

cas_engine.pages.title = function(page, options){
	if(config.common.company_name)
		page = page.replace(/#title#/g,config.common.company_name);
	return page;
}

cas_engine.pages.username = function(page, options){
	if(options.user)
		page = page.replace(/#username#/g,options.user);
	return page;
}

cas_engine.pages.error = function(page, options){
	if(options.error_code)
		page = page.replace(/#error_code#/g,options.error_code);
	if(options.error_message)
		page = page.replace(/#error_message#/g,options.error_message);
	return page;
}


cas_engine.pages.google = function(page, options){
	if(config.common.google_api_client_id)
		page = page.replace(/#google_api_client_id#/,config.common.google_api_client_id);
	return page;
}

cas_engine.pages.upload = function(page, options){
	var csrf_token = options.csrf_token;
	
	var categories = "";
	config.upload.categories.map(function(value, index){
		categories += "<option value='" + (index + 1) + "'>" + value + "</option>" + "\n";
	});
	
	var languages = "";
	config.upload.languages.map(function(value){
		languages += "<option value='" + value.code + "'>" + value.txt + "</option>" + "\n";
	});
	
	var privacy = "";
	config.upload.privacy.map(function(value, index){
		privacy += "<option value='" + (index + 1) + "'>" + value + "</option>" + "\n";
	});
	
	var rating = "";
	config.upload.ratings.map(function(value, index){
		if(value=="Everyone")
			rating += "<option value='" + (index + 1) + "' selected='selected'>" + value + "</option>" + "\n";
		else
			rating += "<option value='" + (index + 1) + "'>" + value + "</option>" + "\n";
	});
	
	page = page
		.replace('#csrf_token#',csrf_token)
		.replace('#categories#',categories)
		.replace('#languages#',languages)
		.replace('#privacy#',privacy)
		.replace('#ratings#',rating);
	return page;
}


cas_engine.pages.my_videos = function(page, options){
	//Check if there are any videos
	if(options.my_videos){
		
		var video_list = "";
		var data = {
			"expiry":Date.now() + 86400000,
		};
			
		for (var i = 0; i < options.my_videos.length; i++){

			
			var item = options.my_videos[i];
			
			data.resource_id = item.video_id;
			data.content_path = path.resolve(options.web_directory + "/uploads/users/" + item.email + "/videos/" + item.video_id + "/video_preview_single.jpg");
			if(options.user)
				data.user = options.user;
			
			var signature = signed_urls.create_signature(data);
			
			var html_item = config.my_videos
				.replace(/#video_id#/g,item.video_id)
				.replace('#video_title#',item.title)
				.replace('#video_upload_date#',item.date_uploaded)
				.replace('#video_last_modified_date#',item.date_modified)
				.replace('#video_privacy#',config.upload.privacy[Math.max(0,item.privacy-1)])
				.replace('#video_category#',config.upload.categories[Math.max(0,item.category-1)])
				.replace('#video_path#',item.title)
				.replace('#image_signature#',signature)
				.replace('#video_description#',item.description);
			video_list += html_item + "\n";
		}
		page = page.replace('#my_videos#',video_list);
	}
	
	return page;
}

cas_engine.pages.watch = function(page, options){
	page = page.replace(/#watch_video_id#/g,options.video_id)
		.replace('#watch_video_signature#',options.video_signature)
		.replace('#watch_image_signature#',options.image_signature)
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

cas_engine.pages.search = function(page, options){
	var result_list = "";
	//Check if there are results
	if(options.search_results){
		//Loop though results
		for (var i = 0; i < options.search_results.length; i++){
			var item = options.search_results[i];
			result_list += item.title;
		}
	}
		
	page = page.replace('#search_results#',result_list);
	return page;
}

cas_engine.pages.recent_videos = function(page, options){
	var result_list = "";

	//Check if there are results
	if(options.recent_videos){
		
		var data = {
			"expiry":Date.now() + 86400000,
		};
		
		//Loop though results
		for (var i = 0; i < options.recent_videos.length; i++){
			var item = options.recent_videos[i];
			
			data.resource_id = item.video_id;
			data.content_path = path.resolve(options.web_directory + "/uploads/users/" + item.email + "/videos/" + item.video_id + "/video_preview_single.jpg");
			
			if(options.user)
				data.user = options.user;
			
			var signature = signed_urls.create_signature(data);
			
			var html_item = config.recent_videos
				.replace(/#video_id#/g,item.video_id)
				.replace('#video_title#',item.title)
				.replace('#image_signature#',signature);
				
			result_list += html_item + "\n";
		}
	}
		
	page = page.replace('#recent_videos#',result_list);
	return page;
}


module.exports = cas_engine;