module.exports = main;

var connect = require('connect');
var helmet = require('helmet');

var middlewares ;
function main (options) {
	
	
	var chain = connect();
	
	middlewares.map(function(value, key){
		var middleware = main[value];
		chain.use(middleware);
	});
	
	
	return chain;
}

main.helmet = require("./modules_sec/helmet.js");

main.test = function(req, res, next){
	next();
}

middlewares = Object.keys(main);