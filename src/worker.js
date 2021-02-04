const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const { parentPort, workerData } = require('worker_threads');

const VideoProcessing = require('./video-processing');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const FULL_HD_WIDTH = 1920;
const FULL_HD_HEIGHT = 1080;
const HD_WIDTH = 1280;
const HD_HEIGHT = 720;
const STANDARD_WIDTH = 854;
const STANDARD_HEIGHT = 480;

const processing = async(inputPath, fileName) => {
  const streamInfo = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err || !metadata) {
        console.error(err);

        reject(new Error(err || 'No metadata'));
      } else if (metadata.streams) {
        resolve({
          video: metadata.streams.find(stream => stream.width && stream.height && stream.codec_type === 'video'),
          audio: metadata.streams.find(stream => stream.codec_type === 'audio'),
        });
      } else {
        reject(new Error('No Streams found'));
      }
    });
  });

  if (!streamInfo.video) {
    throw new Error('Video stream not found');
  }

  let size = null;

  if (
    streamInfo.video.width >= FULL_HD_WIDTH
    && streamInfo.video.height >= FULL_HD_HEIGHT
  ) {
    size = '1920x1080';
  } else if (
    streamInfo.video.width >= HD_WIDTH
    && streamInfo.video.width < FULL_HD_WIDTH
    && streamInfo.video.height >= HD_HEIGHT
    && streamInfo.video.height < FULL_HD_HEIGHT
  ) {
    size = '1280x720';
  } else if (
    streamInfo.video.width >= STANDARD_WIDTH
    && streamInfo.video.width < HD_WIDTH
    && streamInfo.video.height >= STANDARD_HEIGHT
    && streamInfo.video.height < HD_HEIGHT
  ) {
    size = '854x480';
  } else {
    size = '640x360';
  }

  const ffmpegInstance = new VideoProcessing(inputPath, size, fileName);

  let videoProcessingResult = null;
  let pathToFiles = null;
  let output = null;

  switch (size) {
    case '1920x1080':
      videoProcessingResult = await ffmpegInstance.generateVideoInDifferentBitrates(['4500k', '3000k']);
      pathToFiles = videoProcessingResult.map(el => `${el.dirName}/${el.name}`).join(' ');
      output = `${videoProcessingResult[0].dirName}/${videoProcessingResult[0].file}`;

      await VideoProcessing.generatePlaylist(pathToFiles, output);
      await VideoProcessing.generateManifest(pathToFiles, output);

      return videoProcessingResult.file;
    case '1280x720':
      videoProcessingResult = await ffmpegInstance.generateVideoInDifferentBitrates(['3000k', '1500k']);
      pathToFiles = videoProcessingResult.map(el => `${el.dirName}/${el.name}`).join(' ');
      output = `${videoProcessingResult[0].dirName}/${videoProcessingResult[0].file}`;

      await VideoProcessing.generatePlaylist(pathToFiles, output);
      await VideoProcessing.generateManifest(pathToFiles, output);

      return videoProcessingResult.file;
    case '854x480':
      videoProcessingResult = await ffmpegInstance.generateVideo('1000k');
      pathToFiles = `${videoProcessingResult.dirName}/${videoProcessingResult.name}`;
      output = `${videoProcessingResult.dirName}/${videoProcessingResult.file}`;

      await VideoProcessing.generatePlaylist(pathToFiles, output);
      await VideoProcessing.generateManifest(pathToFiles, output);

      return videoProcessingResult.file;
    default:
      videoProcessingResult = await ffmpegInstance.generateVideo('500k');
      pathToFiles = `${videoProcessingResult.dirName}/${videoProcessingResult.name}`;
      output = `${videoProcessingResult.dirName}/${videoProcessingResult.file}`;

      await VideoProcessing.generatePlaylist(pathToFiles, output);
      await VideoProcessing.generateManifest(pathToFiles, output);

      return videoProcessingResult.file;
  }
};

parentPort.on('message', async() => {
  const result = await processing(workerData.inputPath, workerData.fileName);

  parentPort.postMessage(result);
});
