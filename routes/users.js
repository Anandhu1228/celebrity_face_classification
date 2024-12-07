var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var { spawn } = require('child_process');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({ storage: storage });

router.get('/', function(req, res, next) {
  res.render("user/testpage")
  return
});

router.post('/find_face', upload.single('image'), async (req, res) => {
  try {
    const filePath = req.file.path;

    const python = spawn('python', ['classifier/classifier_file.py', filePath]);

    let result = '';

    python.stdout.on('data', function (data) {
      result += data.toString();
    });

    python.stderr.on('data', function (data) {
      console.error(`stderr: ${data}`);
    });

    python.on('exit', function (code) {
      if (code === 0) {
        res.send({ prediction: result.trim() });
      } else {
        console.error('Error in Python script execution');
        res.status(500).send('Error processing the image');
      }

      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error("Error in classifying face", err);
    res.status(500).send('Something went wrong');
  }
});

module.exports = router;
