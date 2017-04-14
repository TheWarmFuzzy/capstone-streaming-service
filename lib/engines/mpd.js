var config = require("./mpd.json");
var fs = require('fs');
var path = require("path");

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function mpd_engine(file_path, options, callback){
	
	console.log(this);
	//Open the file
	fs.readFile(path.resolve(file_path), function(e, content){
		//Display the error
		if(e)
			return callback(e);
		
		//Convert the file to a string
		var rendered = content.toString();
		
		//Run through the different replacement criteria
		Object.keys(mpd_engine.pages).map(function(key){
			rendered = mpd_engine.pages[key](rendered,options);
		});
		
		//Move on
		return callback(null, rendered)
		
	});
}

mpd_engine.pages = {};

//-----------------------------------------------------------------------------
//-Pages-----------------------------------------------------------------------
//-----------------------------------------------------------------------------


mpd_engine.pages.main = function(page, options){
	
	for(var key in options){
		page = page.replace(key,options[key]);
	};
	
	return page;
}

module.exports = mpd_engine;