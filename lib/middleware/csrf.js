var connect = require('connect');
var cookie_parser = require('cookie-parser');
var csrf = require('csurf');
var fs = require('fs');

function main(){
	var chain = connect();

	chain.use(cookie_parser());
	chain.use(csrf({ cookie: true }));
	chain.use(csrf_error);
	
	return chain;
}

function csrf_error(e, req, res, next){
	//Check if there's no error
	if(e.code !== "EBADCSRFTOKEN"){
		return next(e);
	}
	
	//There's an error
	//Try to delete any uploaded files
	for(var key in req.files){
		var files = req.files[key];
		for(var i = 0; i < files.length; i++){
			var file_path = files[i].path;
			fs.stat(file_path, function(e, stats){
				if(e){
					console.log("CSRF - Token Invalid: No file uploaded");
					return;
				}
				
				fs.unlink(file_path, function(e){
					if(e){
						console.log("CSRF - Token Invalid: Failed to delete temp file at '" + file_path + "'");
						return;
					}
					
					console.log("CSRF - Token Invalid: Deleted temp file at '" + file_path + "'");
				});
			});
		}
	}
	res.status(403).send("Invalid form submission");
}
module.exports = main();