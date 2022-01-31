const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require("sharp");
const { encode } = require("blurhash");


const kSiteUrl = 'http://localhost:3000'

////////////////////////Blur hash image code /////////////////////////////////
const encodeImageToBlurhash = path =>
    new Promise((resolve, reject) => {
        sharp(path)
            .raw()
            .ensureAlpha()
            .resize(32, 32, { fit: "inside" })
            .toBuffer((err, buffer, { width, height }) => {
                if (err) return reject(err);
                resolve(encode(new Uint8ClampedArray(buffer), width, height, 5, 5));
            });
    });
////////////////////////Blur hash image code /////////////////////////////////


////////////////////////Resize Image Code /////////////////////////////////
async function getResizedFilePath(imgName) {
    let outputUrl;
    let inputFile = './images/' + imgName;
    let outputFile = './images/thumb' + imgName;

    await sharp(inputFile).rotate(-90)
        .resize({ width: 250, height: 250, fit: sharp.fit.fill })
        .toFile(outputFile)
        .then(function (newFileInfo) {
            // newFileInfo holds the output file properties
            let url = kSiteUrl + '/images/thumb' + imgName
            console.log(url)
            outputUrl = url;
        })
        .catch(function (err) {
            console.log(err);
        });
    return outputUrl;
}
////////////////////////Resize Image Code /////////////////////////////////

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images')

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname).toLowerCase())
    }

})
const fileFilter = (req, file, cb) => {
    // if (file.mimetype === "image/jpeg" || file.mimetype === "image/png")
    cb(null, true);
    // cb(null, false);
}
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    //   fileFilter 
})

// const upload = multer({dest:'images/'})



const port = process.env.port || 3000
const app = express();


app.use(express.json())


app.post('/service/images', upload.single("categoryImage"), async (req, res) => {
    let imgURL = kSiteUrl + "/images/" + req.file.filename;

    let blurHashString = await encodeImageToBlurhash("./images/" + req.file.filename)

    if (req.body.categoryType === "category") {

        res.send({
            imageURL: imgURL,
            blurhash: blurHashString
        })
    } else if (req.body.categoryType === "subCategory") {

        let resizedImageUrl = await getResizedFilePath(req.file.filename);
        res.send({
            imageURL: imgURL,
            thumbnailURL: resizedImageUrl,
            blurhash: blurHashString

        })
    }
})


app.get('/service/images', (req, res) => {

    res.send('listening bro')
})
app.get('/images/:name', (req, res) => {

    res.sendFile(path.join(__dirname, '/images/') + req.params.name)

})
app.delete('/images/:name', (req, res) => {

    if (req.body.categoryType === "category") {
        let filePath = './images/' + req.params.name
        console.log("file path is : " + filePath)
        let result = fs.unlink(filePath, function (err) {
            if (err) return console.log(err);
            console.log('file deleted successfully');
            res.send("Deleted successfully")
        })
    } else if (req.body.categoryType === "subCategory") {

    }
    // let filePath = './images/' + req.params.name
    // let result = fs.unlink(filePath, function (err) {
    //     if (err) return console.log(err);
    //     console.log('file deleted successfully');
    // })
    console.log(result)
    res.send(result)

})



/////////////////////////////////////////
app.listen(port, () => {
    console.log(`Image server Running at http://localhost:${port}`)
})