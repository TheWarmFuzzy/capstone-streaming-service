function validator(){
	
}

validator.prototype.video_id = function(video_id){
	//Check Type
	if("string" != typeof video_id)
		return;
	
	//Check Length
	if(14 < video_id.length || 7 > video_id.length)
		return;
	
	//Check Characters
	if(video_id.replace(/([A-Za-z0-9_-])+/,''))
		return;
	
	return video_id;
}

validator.prototype.video_title = function(title){
	//Check Type
	if("string" != typeof title)
		return;
	
	//Check Length
	if(64 < title.length || 3 > title.length)
		return;
	
	//Check Characters
	if(title.replace(/([A-Za-z0-9 _:!.?&$#+*()%,-])+/,''))
		return;
	
	//Replace Characters
	//Just in case
	title = title
		.replace(/\<+/,'&#60;')
		.replace(/\>+/,'&#62;')
		.replace(/\'+/,'&#39;')
		.replace(/\"+/,'&#34;')
		.replace(/\=+/,'&#61;')
		.replace(/\;+/,'&#59;')
		.replace(/\/+/,'&#47;')
		.replace(/\\+/,'&#92;')
		.replace(/\#+/,'&#35;');
		
	return title;
}

validator.prototype.video_description = function(description){
	//Check Type
	if("string" != typeof description)
		return;
	
	//Check Length
	if(512 < description.length || 3 > description.length)
		return;
	
	//Replace Characters
	description = description
		.replace(/\<+/,'&#60;')
		.replace(/\>+/,'&#62;')
		.replace(/\'+/,'&#39;')
		.replace(/\"+/,'&#34;')
		.replace(/\=+/,'&#61;')
		.replace(/\;+/,'&#59;')
		.replace(/\/+/,'&#47;')
		.replace(/\\+/,'&#92;')
		.replace(/\#+/,'&#35;');
	
	return description;
}

validator.prototype.static_string = function(input, acceptable_values){
	//Check Type
	if("string" != typeof input)
		return;
	
	var match = false;
	
	//Loop through acceptable values
	for(var i = 0; i < acceptable_values.length; i++){
		
		//Check value
		if(input == acceptable_values[i]){
			match = true;
			break;
		}
		
	}
	
	//Check if it matched an acceptable value
	if(!match)
		return;
	
	return input;
}

validator.prototype.integer = function(input, min, max){
	min = min || Infinity;
	max = max || -Infinity;
	
	//Check Type
	if(isNaN(input))
		return;
	
	//Check size
	if(max < input || min > input)
		return;
	
	//Make it into an integer
	return ~~input;
}

module.exports = new validator();