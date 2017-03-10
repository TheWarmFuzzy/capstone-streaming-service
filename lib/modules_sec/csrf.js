module.exports = main;

var body_parser = require('body-parser');
var cookie_parser = require('cookie-parser');
var csrf = require('csurf');

function main(res, req, next){
	app.use(body_parser.urlencoded({extended:false}));
	app.use(cookie_parser());
	app.use(csrf({ cookie: true }));
	
}