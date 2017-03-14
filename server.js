//Server Constants
const PORT = 8080;
const ROOT_DIRECTORY = __dirname;
global.ROOT_DIRECTORY = ROOT_DIRECTORY;

//Environment Variables
var config = require("./configs/server.json");
var extra_logs = require("./modules/log.js");
console.log = extra_logs.date_time_log;

//Server Variables
var http = require('http');
var express = require('express');
var app = express();
var server = app.listen(PORT,start);

//Directors
var resource_director = require("./lib/resource_director.js");
var security_director = require("./lib/security_director.js");

//Pre-load Security Controls
app.use(security_director.preload());

//Resource Routing
app.use("/", resource_director.www());

//Post-load Security Controls
app.use(security_director.postload());

//Function that is run when the server starts
function start()
{
	//Log the server address and port
	console.log("Starting server",server.address().address + server.address().port);
}