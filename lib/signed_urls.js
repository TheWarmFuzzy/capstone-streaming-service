//You may want to replace aes-256-ctr with aes-256-gcm for authenticate encryption
var crypto = require('crypto'),
	algorithm = 'aes-256-ctr',
	key = load_key();
var fs = require('fs');
var path = require('path');

//Loads the key in a location
function create_key(key_path){
	
}

//Loads the key from a file
function load_key(key_path){
	key_path = key_path || "../keys/signature_key.json";
	return require(key_path);
}

//Encrypts data using the loaded key
function encrypt(data){
	key = key || {"password":"default"};
	var cipher = crypto.createCipher(algorithm, key.password);
	var crypted = cipher.update(data,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
}

//Encrypts data using the loaded key
function decrypt(data){
	key = key || {"password":"default"};
	var decipher = crypto.createDecipher(algorithm,key.password)
	var dec = decipher.update(data,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}

//Creates a signature using the resource id, and expiry date
function create_signature(data){
	var data_string = JSON.stringify(data);
	return encrypt(data_string);
}

//Reads a signature  the resource id and 
function read_signature(signature){
	var decrypted_data = decrypt(signature);
	var data_json;
	try{
		data_json = JSON.parse(decrypted_data);
	}catch(e){
		return;
	}
	return data_json;
}

//Checks if the signature is valid
function authenticate_signature(resource_id, signature)
{
	
	var signature_contents;
	
	//Try to decrypt the signature
	try{
		signature_contents = read_signature(signature);
	}catch(e){
		return false;
	}
	
	var now = Date.now();
	
	//Checks if signature could be read
	if(!signature_contents)
		return false;
	
	//Checks if signature has an expiry date
	if(!signature_contents.expiry)
		return false;
	
	//Checks if signature has a resource id
	if(!signature_contents.resource_id)
		return false;
	
	//Checks if the signature has expired
	if(now > signature_contents.expiry)
		return false;
	
	//Check if the resource ids match
	if(signature_contents.resource_id !== resource_id)
		return false;
	
	//Returns as authenticated
	return signature_contents;
}

module.exports = {
	create_signature,
	authenticate_signature
};