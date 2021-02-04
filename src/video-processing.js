const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const fsAsync = fs.promises;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class VideoProcessing {
  ffmpegInstance;

  size;

  fileName;

  constructor(inputPath, size, fileName) {
    this.ffmpegInstance = ffmpeg(inputPath);
    this.size = size;
    this.fileName = fileName;
  }

  async generateOutputPath(bitrate) {
    const dirName = path.resolve('..', 'video-processing', 'video', `${this.fileName}`);
    const name = `${this.fileName}_${this.size}_${bitrate}`;

    await fsAsync.mkdir(dirName, { recursive: true });

    return { dirName, name: `${name}.mp4`, file: name };
  }

  async generateVideo(bitrate) {
    const outputVideoPath = await this.generateOutputPath(bitrate);

    /*
     * This is old options
     *
     *.outputOptions(['-preset veryfast'])
     *.audioCodec('aac')
     *.videoCodec('libx264')
     *.audioBitrate(256)
     *.format('mp4')
     *.fps(30)
     *.autopad()
     *.videoBitrate(bitrate, true)
     *.size(this.size)
     *.addOption('-benchmark_all')
     *.addOption('-benchmark')
     */

    /*
     * For output options I prefer string format 'cause it's look like ffmpeg command in command line
     * so you can just copy this to terminal and check how it works
     */
    return new Promise((res, rej) => this.ffmpegInstance
      .output(`${outputVideoPath.dirName}/${outputVideoPath.name}`)
      .outputOptions([
        '-preset veryfast',
        '-tune film',
        '-vsync passthrough',
        '-an',
        '-c:v libx264',
        '-x264opts keyint=25:min-keyint=25:no-scenecut',
        '-crf 23',
        '-maxrate 2000k',
        '-bufsize 4000k',
        '-pix_fmt yuv420p',
        '-f mp4',
      ])
      .on('progress', progress => {
        console.log(`[ffmpeg] ${JSON.stringify(progress)}`);
      })
      .on('error', err => {
        console.log(`[ffmpeg] error: ${err.message}`);

        return rej(new Error({ error: err.message }));
      })
      .on('end', () => {
        console.log('[ffmpeg] finished');


        return res({
          file: outputVideoPath.file,
          dirName: outputVideoPath.dirName,
          name: outputVideoPath.name,
        });
      })
      .run());
  }

  async generateVideoInDifferentBitrates(bitrates) {
    const result = await Promise.all(bitrates.map(videoBitrate => this.generateVideo(videoBitrate)));

    /*
     *     For await (const videoBitrate of bitrates) {
     *     console.log(videoBitrate);
     *
     *     await this.generateVideo(videoBitrate);
     *     }
     */

    return result;
  }

  static generatePlaylist(files, output) {
    return new Promise((res, rej) => {
      // Using a shell script gives us more speed because we get rid of the extra layer of abstraction
      const generateM3u8 = spawn('bash', [
        'src/generate-m3u8.sh',
        files,
        output,
      ]);

      generateM3u8.stdout.on('data', data => console.log(`stdout info: ${data}`));
      generateM3u8.stderr.on('data', data => console.log(`stderr error: ${data}`));
      generateM3u8.on('error', data => rej(new Error(`error: ${data}`)));
      generateM3u8.on('close', code => {
        console.log(`child process ended with code ${code}`);

        res('generate m3u8');
      });
    });
  }

  static generateManifest(files, output) {
    return new Promise((res, rej) => {
      // Using a shell script gives us more speed because we get rid of the extra layer of abstraction
      const generateM3u8 = spawn('bash', [
        'src/generate-mpd.sh',
        files,
        output,
      ]);

      generateM3u8.stdout.on('data', data => console.log(`stdout info: ${data}`));
      generateM3u8.stderr.on('data', data => console.log(`stderr error: ${data}`));
      generateM3u8.on('error', data => rej(new Error(`error: ${data}`)));
      generateM3u8.on('close', code => {
        console.log(`child process ended with code ${code}`);

        res('generate mpd');
      });
    });
  }
}

module.exports = VideoProcessing;
