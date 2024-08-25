import express from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
//import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = 3000
const publicPath = path.join(path.resolve(), 'public')
const router = express.Router()

// Add CORS headers to all responses
app.use(function (req, res, next) {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  next()
})

app.get('/images', (req, res) => {
  let fileList = []
  fs.readdirSync('./images', { withFileTypes: true }).forEach((file) => {
    if (file.name.endsWith('.bin')) {
      // Get the stats of the file
      const stats = fs.statSync(`./images/${file.name}`)
      // Create a listing object of the file name, size, and creation date/time in UTC
      let fileObj = {
        name: file.name,
        size: stats.size,
        created: stats.ctime
      }
      fileList.push(fileObj)
    }
  })
  // Sort the file list by creation time with newest first
  fileList.sort((a, b) => b.created - a.created)
  res.send(fileList)
})

app.get('/images/:imageName', (req, res) => {
  const imageName = req.params.imageName
  // See if a file with the given name exists in ./images and if it ends with .bin
  if (fs.existsSync(`./images/${imageName}`) && imageName.endsWith('.bin')) {
    // If it does, send the file
    // Open the file and encode it in base64
    const file = fs.readFileSync(`./images/${imageName}`)
    // eslint-disable-next-line no-undef
    const data = Buffer.from(file).toString('base64')
    const stats = fs.statSync(`./images/${imageName}`)
    // Compute checksum of data
    const checksum = crypto.createHash('SHA-1')
    checksum.update(data)

    // Send the file as a base64 encoded string
    let fullFileObject = {
      name: imageName,
      size: stats.size,
      created: stats.ctime,
      dataHash: checksum.digest('hex'),
      data: data
    }
    res.send(fullFileObject)
  } else {
    // If it does not, send a 404 error
    res.status(404).send('File not found')
  }
})

app.get('/__devtools__/', (req, res) => {
  res.redirect(303, 'http://localhost:5173//__devtools__/')
})

router.get('/*', (_req, res) => {
  res.render('index.html.ejs')
})

app.use('/', express.static(publicPath))
app.use(router)

// const options = {
//   key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem'))
// }

// // Create HTTPS server
// const server = https.createServer(options, app)
// server.listen(port, () => {
//   console.log(`FPGA Loader listening on port ${port}`)
// })

app.listen(port, () => {
  console.log(`FPGA Loader listening on port ${port}`)
})
