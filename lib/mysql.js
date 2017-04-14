module.exports = {
	procedure
};

/*-----------
login_info =
{
	host:
	user:
	password:
	database:
}
-----------*/

var mysql = require('mysql');

function procedure(login_info, proc_info, callback) {
	var connection = mysql.createConnection(login_info);
	var results = [];
	connection.connect(function(e){
		if(e){
			console.error("Error connecting to MySQL:",e.stack);
		}
		console.log("Connected to MySQL as:", connection.threadId);
	});
	
	connection.query(proc_info, function(e, r, f){
		if(e)
			console.error("Error performing query:", e.stack);
		
		results = r;
	});
	connection.end();
	
	return results;
}