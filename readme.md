# Video Processing Demo
This demo is an example of video processing to create mp4, m3u8, mpd files for streaming.

## Structure
--video-processing  
‌‌‍‍   |\_\_uploads/  
‌‌‍‍   |\_\_video/  
‌‌‍‍   |\_\_server.js  
‌‌‍‍   |\_\_package.json  
‌‌‍‍   |\_\_src/  
      |\_\_generate-m3u8.sh  
      |\_\_generate-mpd.sh  
      |\_\_video-processing.js  
      |\_\_worker.js  

* uploads/ - dir for uploaded videos;
* video/ - dir for files after video processing;
* src/ - dir for basic scripts;
* server.js - a server file that creates a pool and passes the task of processing the video to the workers;
* video-processing.js - file containing a video processing handler class;
* worker.js - the worker file containing the main processing function that interacts with the handler class;
* generate-m3u8.sh - shell script to generate m3u8 playlist;
* generate-mpd.sh - shell script to generate mpd manifest file.

## Installing
```bash
$ npm install
```

## Running the app
Default app port: 1234
```bash
$ npm run start
```
