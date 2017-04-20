var config = require("./prt.json");
var fs = require('fs');
var path = require("path");
var cached = {};

//-----------------------------------------------------------------------------
//-Engine----------------------------------------------------------------------
//-----------------------------------------------------------------------------

function prt_engine(file_path, options, callback){
	var rendered;
	
	//Prevent reloading the same part over and over again
	if(cached[file_path]){
		var now = Date.now();
		if(now < cached[file_path].expiry){
			console.log("Reusing cached data");
			console.log("\t" + file_path);
			return callback(null,{"key":options.key, "html":cached[file_path].html});
		}
	}
	
	//Open the file
	fs.readFile(path.resolve(file_path), function(e, content){
		
		//Return the error if there is one
		if(e)
			return callback(e);
		
		//Convert the file to a string
		rendered = content.toString();
		
		//Cache the file
		console.log("Caching data");
		console.log("\t" + file_path);
		cached[file_path] = {
			"expiry":Date.now() + 3600000, //1 hour cache time
			"html":rendered
		};
		
		//Return the file
		return callback(null,{"key":options.key, "html":rendered});
		
	});
}

module.exports = prt_engine;