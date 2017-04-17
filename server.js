//Server Constants
const PORT = 8080;

//Environment Variables
var config = require("./configs/server.json");
var extra_logs = require("./lib/log.js");
console.log = extra_logs.date_time_log;

//Server Variables
var http = require('http');
var https = require('https');
var express = require('express');
var session = require('express-session');
var app = express();
var server = app.listen(PORT,start);
var path = require("path");

//Director
var director = require("./lib/director.js");

//Engines
var cas_engine = require("./lib/engines/cas.js");
app.engine('cas', cas_engine);

//Views
const VIEW_WEB_DIRECTORY = path.resolve(__dirname + "/www");
const VIEW_ERROR_DIRECTORY = path.resolve(__dirname + "/www/errors");
const VIEW_VIDEO_DIRECTORY = path.resolve(__dirname + "/www/uploads/videos");

app.set('views', [VIEW_WEB_DIRECTORY,VIEW_VIDEO_DIRECTORY,VIEW_ERROR_DIRECTORY]);
app.set('view engine', 'cas');


//Pre-load Session Controls
app.use(session({
	secret:config.session_secret,
	resave:false,
	saveUninitialized:false,
	cookie:{
		httpOnly:true,
		maxAge:864000000,
		sameSite:false,
		secure:false
	}
}));

//Pre-load Security Controls
app.use(director.preload());

//Routing
app.use("/", director.www(app.get('views')));

//Post-load Security Controls
app.use(director.postload());

//Function that is run when the server starts
function start()
{
	//Log the server address and port
	console.log("Starting server",server.address().address + server.address().port);
}
/*
var sql = require("./lib/mysql.js");
var procedure = {
	"sql":"CALL cas_insert_user(@id,?,?)",
	"values":["me@me.com","Myself"]
};

var procedure = {
	"sql":"CALL cas_insert_video(@id,?,?,?,?,?,?,?)",
	"values":["me@me.com","My Video","The greatest video in existance",0,0,"en",0]
};
console.log(sql.procedure(server_credentials.user_create,procedure,null));
*/