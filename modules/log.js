module.exports = {
	date_time_log
};

console.old_log = console.log;

function date_time_log()
{	
	//Get the current time in ISO format
	var timestamp = new Date().toISOString();
	
	//Add the timestamp to the beginning of the argument array
	Array.prototype.unshift.call(arguments, timestamp, "-");
	
	//Call console.log with the new argument list
	console.old_log.apply(console.old_log, arguments);
}

