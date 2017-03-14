var fs = require('fs');

function main(req,res,next){
	
	next();
}

function rsa_sha1_sign(policy, private_key_path){
	var signature = "";
	fs.readFile(private_key_path,function(e,content){
		if(e)
			return e;
		
		var private_key_id = openssl_get_privatekey(content);
		
		openssl_sign(policy, signature, pivate_key_id);
		
		openssl_free_key(pivate_key_id);
		
		return signature;
	}
}

function url_safe_base64_encode(value){
		var encoded = base64_encode(value);
		
		return encoded
			.replace(new RegExp("+", 'g'),"-")
			.replace(new RegExp("=", 'g'),"_")
			.replace(new RegExp("/", 'g'),"~");
}

module.exports = main();