module.exports = http_error;

var error_messages = {
	307:"Temporary Redirect",
	403:"Forbidden",
	404:"Not Found",
	498:"Token is invalid or has expired.",
	499:"Token not provided."
};

function http_error(input){
	input = input || {};
	
	if(!input.res){
		console.error("No response provided.");
		return false;
	}
	
	if(!input.status){
		console.error("No status provided.");
		input.status = 403;
	}
		
	input.res.status(input.status);
	
	//DELETE THIS 
	input.res.send(error_messages[input.status] || "You found an error we didn't make a page for, congrats!");
	
	var error_type = ~~(input.status / 100);
	
	//Redirections
	if(3 == error_type)
		return true;
	
	//Client Errors
	if(4 == error_type)
		return true;
		
	//Server Errors
	if(5 == error_type)
		return true;
		
	
}