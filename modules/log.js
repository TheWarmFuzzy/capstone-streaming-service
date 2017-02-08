module.exports = {
	log
};

function log()
{	
	//Get the current time in ISO format
	var timestamp = new Date().toISOString();
	
	//Add the timestamp to the beginning of the argument array
	Array.prototype.unshift.call(arguments, timestamp, "-");
	
	//Call console.log with the new argument list
	console.log.apply(console.log, arguments);
}

