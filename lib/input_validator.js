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

module.exports = new validator();