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

var mysql = require('mysql);

function procedure(l_i, p_i, callback) {
	var connection = mysql.createConnection(l_i);
	var results = [];
	connection.connect(conn_test);
	
	connection.query(p_i.procedure, p_i.parameters, function(e, r, f){
		if(error)
			console.error("Error performing query:", error.stack);
		
		results = r;
	}
	connection.end();
	
	return results;
}

function conn_test(e){
	if(e){
		console.error("Error connecting to MySQL:",e.stack);
	}
	console.log("Connected to MySQL as:", conncetion.threatId);
	
}