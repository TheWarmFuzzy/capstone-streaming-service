var helmet = require('helmet');

module.exports = helmet({
	contentSecurityPolicy:{
		directives:{
			defaultSrc:["'self'", "https://*.google.com", "http://localhost:8080/*", "blob:"],
			scriptSrc:["'self'", "'unsafe-inline'", "https://*.google.com"],
			styleSrc:["'self'", "'unsafe-inline'", "https://*.google.com"]
		}
	},
	frameguard:{
		action:'deny'
	},
	hidePoweredBy:{ 
		setTo: 'PHP 7.1.2' 
	},
	hsts:{
		force:true,
		maxAge:5184000
	},
	nSniff:true,
	xssFilter:{
		setOnOldIE: true
	}
}); 


 


