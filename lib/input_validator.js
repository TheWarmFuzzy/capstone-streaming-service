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
		.replace(/\<+/,'&#60')
		.replace(/\>+/,'&#62')
		.replace(/\'+/,'&#39')
		.replace(/\"+/,'&#34')
		.replace(/\=+/,'&#61')
		.replace(/\;+/,'&#59')
		.replace(/\/+/,'&#47')
		.replace(/\\+/,'&#92');
		
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
		.replace(/\<+/,'&#60')
		.replace(/\>+/,'&#62')
		.replace(/\'+/,'&#39')
		.replace(/\"+/,'&#34')
		.replace(/\=+/,'&#61')
		.replace(/\;+/,'&#59')
		.replace(/\/+/,'&#47')
		.replace(/\\+/,'&#92');
	
	return description;
}

validator.prototype.string = function(extra, min, max){
	//Default values
	min = min || 2;
	max = max || 64;
	
	//Check Type
	if("string" != typeof extra)
		return;
	
	//Check Length
	if(max < extra.length || min > extra.length)
		return;
	
	//Check Characters
	if(extra.replace(/([A-Za-z0-9_-])+/,''))
		return;
	
	return extra;
}

module.exports = new validator();