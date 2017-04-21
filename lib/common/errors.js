module.exports = http_error;

var error_messages = {
	307:"Temporary Redirect",
	403:"Forbidden",
	404:"Not Found",
	405:"Method Not Allowed",
	498:"Token is invalid or has expired.",
	499:"Token not provided."
};

function http_error(input){
	input = input || {};
	input.engine = input.engine || {};
	 
	//Check if a response was provided
	if(!input.res){
		console.error("No response provided.");
		return false;
	}
	
	//Check if there is an error status
	if(!input.status){
		console.error("No status provided. Defaulting to forbidden.");
		input.status = 403;
	}
	
	//Set error properties
	input.engine.error_code = input.engine.error_code || "Error " + input.status;
	input.engine.error_message = input.engine.error_message || error_messages[input.status] || "Unknown error.";
	
	//Error response
	input.res
		.status(input.status)
		.render('error',input.engine);	
}