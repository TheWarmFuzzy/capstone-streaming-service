const PORT=8080;

var config = require("./configs/server.json");
var modules = [];

var http = require('http');
var express = require('express');
var app = express();
var server = app.listen(PORT,start);

load_modules();

//Function that is run when the server starts
function start()
{
	//Log the server address and port
	server.log("Starting server",server.address().address + server.address().port);
}


//Loads modules specified by the server.json file
function load_modules()
{
	//Load all module code into the modules array
	//Ensures the module path doesn't leave the modules folder
	//No directory traversal for you!
	config.modules.map(mod => modules[mod.name] = require("./modules/" + mod.path.replace(/\\/g, '')));
	
	//Adds the log function from the log module to the server object
	server.log = modules["log"].log;
}