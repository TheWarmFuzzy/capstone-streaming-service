var connect = require('connect');
var multer = require('multer');
var cookie_parser = require('cookie-parser');
var csrf = require('csurf');

function main(){
	var chain = connect();

	chain.use(cookie_parser());
	chain.use(multer().single('_csrf'));
	chain.use(csrf({ cookie: true }));
	chain.use(csrf_error);
	
	return chain;
}

function csrf_error(e, req, res, next){
	if(e.code !== "EBADCSRFTOKEN")
		return next(err);
	res.status(403).send("Invalid form submission");
}
module.exports = main();