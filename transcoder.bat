@echo off

REM Current directory and video within
SET vm1="%1"
echo %vm1%

REM Directory to save the dash files in
SET d1="audio_96k"
SET a1="audio_96k.aac"
SET vq1="video_160x90_200k.mp4"
SET vq2="video_320x180_400k.mp4"
SET vq3="video_640x360_800k.mp4"
SET vq4="video_960x540_1200k.mp4"
SET vq5="video_1280x720_2400k.mp4"
SET vq6="video_1920x1080_4800k.mp4"

REM Directory to save the dash files in
cd "%2"

REM Preview image specs
SET col=8
SET row=8
SET width=128
SET width2=256
REM Get a preview image of the video
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nokey=1:noprint_wrappers=1 %vm1% >  temp.txt
set /p frames=<temp.txt
set /a frames = %frames%/(%col%*%row%)
ffmpeg -loglevel panic -y -i %vm1% -frames 1 -q:v 1 -vf "select=not(mod(n\,%frames%)),scale=%width%:-1,tile=%col%x%row%" video_preview.jpg
REM ffmpeg -loglevel panic -y -i %vm1% -frames 1 -q:v 1 -vf "select=%frames%),scale=%width2%:-1" video_preview_single.jpg
ffmpeg -ss 0.5 -i %vm1% -t 1 -s 320x180 -f image2 video_preview_single.jpg

REM Convert to various qualities of videos
ffmpeg -i %vm1% -vn -c:a aac -strict experimental -b:a 96k -ar 32000 -f mp4 -y "%a1%" 
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 30 -s 160x90 -b:v 200k -f mp4 -y "%vq1%"
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 30 -s 320x180 -b:v 400k -f mp4 -y "%vq2%"
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 30 -s 640x360 -b:v 800k -f mp4 -y "%vq3%"
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 30 -s 960x540 -b:v 1200k -f mp4 -y "%vq4%"
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 60 -s 1280x720 -b:v 2400k -f mp4 -y "%vq5%"
ffmpeg -threads 4 -i %vm1% -an -vcodec libx264 -r 60 -s 1920x1080 -b:v 4800k -f mp4 -y "%vq6%"

REM Check which files exist and make a dash file accordingly
if exist "%a1%" (
	if exist "%vq1%" (
		if exist "%vq2%" (
			if exist "%vq3%" (
				if exist "%vq4%" (
					if exist "%vq5%" (
						if exist "%vq6%" (
						
							MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%" "%vq2%" "%vq3%" "%vq4%" "%vq5%" "%vq6%" 
							del "%vq6%"
							
						) else (
						
							MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%" "%vq2%" "%vq3%" "%vq4%" "%vq5%" 
							
						)
						
						del "%vq5%"
						
					) else (
					
						MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%" "%vq2%" "%vq3%" "%vq4%" 
						
					)
					
					del "%vq4%"
					
				) else (
				
					MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%" "%vq2%" "%vq3%"
					
				)
				
				del "%vq3%"
				
				
			) else (
			
				MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%" "%vq2%"
				
			)
			
			del "%vq2%"
			
		) else (
		
			MP4Box -dash 10000 -frag 1000 -profile dashavc264:onDemand -rap "%a1%" "%vq1%"
			
		)
		
		del "%vq1%"
		
	) else (
	
		echo Transcoding Failed - Video file is missing
		
	)
	
	del "%a1%"
	
) else (

	echo Transcoding Failed - Audio file is missing
	
)

REM Rename the dash file to video.mpd
if exist "%d1%_dash.mpd" (
	ren "%d1%_dash.mpd" "video.mpd"
) else (
	echo We lost the dash file...
)

REM Delete the temp file for calculating the size of the video
if exist "temp.txt" (
	del "temp.txt"
) else (
	echo We lost the temp file...
)

REM "%vq1%" "%vq2%" "%vq3%" "%vq4%" "%vq5%" "%vq6%"
REM AUDIO -acodec libvorbis -ar 44100 -ab 128k -ac 2 