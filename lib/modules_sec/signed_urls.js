var fs = require('fs');
var pem = require('pem');
var path = require('path');

function main(req,res,next){
	rsa_sha1_sign({},ROOT_DIRECTORY +"/keys/pk-APKAJO2RNHZU3MGUHJHQ.pem");
	next();
}

function rsa_sha1_sign(policy, private_key_path){
	var signature = "";
	pem.readPkcs12(path.resolve(private_key_path),function(e,content){
		console.log(e);
		if(e)
			return e;
		
		console.log(e);
	});
	/*fs.readFile(private_key_path,function(e,content){
		if(e)
			return e;
		
		var private_key_id = openssl_get_privatekey(content);
		
		openssl_sign(policy, signature, pivate_key_id);
		
		openssl_free_key(pivate_key_id);
		
		return signature;
	}*/
}

function url_safe_base64_encode(value){
		var encoded = base64_encode(value);
		
		return encoded
			.replace(new RegExp("+", 'g'),"-")
			.replace(new RegExp("=", 'g'),"_")
			.replace(new RegExp("/", 'g'),"~");
}

module.exports = main;