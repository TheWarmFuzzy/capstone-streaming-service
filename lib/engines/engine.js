module.exports = engine;

var fs = require('fs');
var path = require("path");

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

//USER CONTENT GOES LAST OR ELSE CONSEQUENCES

function engine(file_path, options, callback){
	
	console.log(this);
	//Open the file
	fs.readFile(path.resolve(file_path), function(e, content){
		//Display the error
		if(e)
			return callback(e);
		
		//Convert the file to a string
		var rendered = content.toString();
		
		//Run through the different replacement criteria
		Object.keys(engine.pages).map(function(key){
			rendered = engine.pages[key](rendered,options);
		});
		
		//Move on
		return callback(null, rendered)
		
	});
}

engine.pages = {};