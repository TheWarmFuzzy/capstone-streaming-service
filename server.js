//-----------------------------------------------------------------------------
//-Initialization--------------------------------------------------------------
//-----------------------------------------------------------------------------

//Server Constants
const PORT = 8080;
const PORT_SECURE = 8443;

//Environment Variables
var config = require("./configs/server.json");

//Replace console.log with a version that timestamps everything
var extra_logs = require("./lib/log.js");
console.log = extra_logs.date_time_log;

//File Reading
var path = require("path");
var fs = require('fs');

//Server Stuff
var http = require('http');
var https = require('https');
var express = require('express');
var session = require('express-session');
var app = express();
var redirection_app = express();
redirection_app.use(function(req,res,next){
	console.log(req.hostname);
	res.redirect(308, config.address[req.hostname]);
});

//Get the SSL Certificate
var key = fs.readFileSync(path.resolve("./ssl/key.pem"), "utf8");
var cert = fs.readFileSync(path.resolve("./ssl/cert.pem"), "utf8");
var pass = fs.readFileSync(path.resolve("./ssl/passphrase.key"), "utf8");
var credentials = {"key":key,"cert":cert, "passphrase": pass};

//-----------------------------------------------------------------------------
//-Application-----------------------------------------------------------------
//-----------------------------------------------------------------------------

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
		maxAge:864000000, //One day
		sameSite:false,
		secure:true
	}
}));

//Pre-load Security Controls
app.use(director.preload());

//Routing
app.use("/", director.www(app.get('views')));

//Post-load Security Controls
app.use(director.postload());

//Function that is run when the http server starts
function http_start()
{
	//Log the server address and port
	console.log("Starting redirection server", httpServer.address().address + PORT);
	
}

//Function that is run when the https server starts
function https_start(){
	
	//Log the server address and port
	console.log("Starting secure server", httpsServer.address().address + PORT_SECURE);
	
}

//Lets get these servers started!
var httpServer = http.createServer(redirection_app);
var httpsServer = https.createServer(credentials,app);

httpServer.listen(PORT, http_start);
httpsServer.listen(PORT_SECURE, https_start);
