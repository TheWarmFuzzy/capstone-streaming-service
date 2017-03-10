var helmet = require('helmet');

module.exports = helmet({
	contentSecurityPolicy:{
		directives:{
			defaultSrc:["'self'"],
			styleSrc:["'self'"]
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


 


