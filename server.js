const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const uuid = require('uuid');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const { StaticPool } = require('node-worker-threads-pool');

const fsAsync = fs.promises;

const PORT = 1234;
const NUM_CPUS = 5; // We can't use os.countCpu inside docker container

app.use(express.static(path.join(__dirname, 'video')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(busboyBodyParser({ limit: '250mb' }));


app.post('/upload', async(req, res) => {
  const { files: { file } } = req;
  const { data, mimetype } = file;

  const extension = mime.extension(mimetype);
  const videoId = uuid.v4();

  const videoFilePath = path.resolve('uploads', videoId, `${videoId}.${extension}`);

  await fsAsync.mkdir(path.resolve('uploads', videoId));
  await fsAsync.writeFile(videoFilePath, data);

  const pool = new StaticPool({
    size: NUM_CPUS - 1,
    task: './src/worker.js',
    workerData: { inputPath: videoFilePath, fileName: videoId },
  });

  try {
    const result = await pool.exec();

    res.status(200).send(result);
  } catch (err) {
    console.log(err);

    process.exit(0);
  }
});


app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
