module.exports = {
	procedure
};

const BUILD_CREDENTIAL = "dev";
var mysql = require('mysql');
var server_credentials = require("../configs/server_credentials.json");
var sql_commands = require("../configs/server_sql_statements.json");

function procedure(procedure_data, callback, login_cred) {
	
	//Get the default build credential
	login_cred = login_cred || BUILD_CREDENTIAL;
	
	//Log into the server using pre-determined login info
	var connection = mysql.createConnection(server_credentials[login_cred]);
	
	//Callbacks
	connection.connect(function(e){
		if(e){
			console.error("Error connecting to MySQL:",e.stack);
		}
		console.log("Connected to MySQL as:", connection.threadId);
	});
	
	//Load a procedure if the name is provided instead of an sql statement
	if(!procedure_data.sql && procedure_data.procedure_name)
		procedure_data.sql = sql_commands[procedure_data.procedure_name];
	
	var results = [];
	
	//Run the query
	connection.query(procedure_data, callback);
	connection.end();
}