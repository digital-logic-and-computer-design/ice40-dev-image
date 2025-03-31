import express from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import process from 'process'

// Add a command line argument to specify the directory to serve files from
const directory = process.argv[2] || '.'
console.log(`Serving files from ${directory}`)

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
  fs.readdirSync(directory, { withFileTypes: true }).forEach((file) => {
    if (file.name.endsWith('.bin')) {
      // Get the stats of the file
      const stats = fs.statSync(`${directory}/${file.name}`)
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

// Create a function to check if a file exists and if so encode and send it
const sendHTMLFile = (imageName, res) => {
  if (fs.existsSync(`${directory}/${imageName}`)) {
    fs.readFile(`${directory}/${imageName}`, (err, data) => {
      if (err) {
        console.error(err)
        return res.status(500).send('Error reading HTML file')
      }

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': data.length
      })
      res.end(data)
    })
  }
}

// Create a function to check if a file exists and if so encode and send it
const sendSVGFile = (imageName, res) => {
  if (fs.existsSync(`${directory}/${imageName}`)) {
    fs.readFile(`${directory}/${imageName}`, (err, data) => {
      if (err) {
        console.error(err)
        return res.status(500).send('Error reading SVG file')
      }

      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Content-Length': data.length
      })
      res.end(data)
    })
  }
}

// Create a function to check if a file exists and if so encode and send it
const sendFile = (imageName, res) => {
  if (fs.existsSync(`${directory}/${imageName}`)) {
    const file = fs.readFileSync(`${directory}/${imageName}`)
    // eslint-disable-next-line no-undef
    const data = Buffer.from(file).toString('base64')
    const stats = fs.statSync(`${directory}/${imageName}`)
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
}

app.get('/images/:imageName', (req, res) => {
  const imageName = req.params.imageName
  // See if a file with the given name exists in . and if it ends with .bin
  if (imageName.endsWith('.bin')) {
    sendFile(imageName, res)
  }
})

// Function to read and send a json file
const sendJsonFile = (imageName, res) => {
  if (fs.existsSync(`${directory}/${imageName}`)) {
    const file = fs.readFileSync(`${directory}/${imageName}`)
    var data = JSON.parse(file)
    res.send(data)
  } else {
    // If it does not, send a 404 error
    res.status(404).send('File not found')
  }
}

app.get('/debug/:imageName', (req, res) => {
  const imageName = req.params.imageName
  // See if a file with the given name exists in . and if it ends with .bin
  if (imageName.endsWith('.manta.json')) {
    sendJsonFile(imageName, res)
  }
})

// Fetch image metadata (same name as bin file but with .bin.json extension)
app.get('/metadata/:metadataName', (req, res) => {
  const imageName = req.params.metadataName
  if (imageName.endsWith('.bin.json')) {
    sendJsonFile(imageName, res)
  }
})

app.get('/svg/:imageName', (req, res) => {
  const imageName = req.params.imageName
  // See if a file with the given name exists in . and if it ends with .bin
  if (imageName.endsWith('.svg')) {
    sendSVGFile(imageName, res)
  }
})

app.get('/html/:imageName', (req, res) => {
  const imageName = req.params.imageName
  // See if a file with the given name exists in . and if it ends with .bin
  if (imageName.endsWith('.html')) {
    sendHTMLFile(imageName, res)
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

app.listen(port, () => {
  console.log(`FPGA Loader listening on port ${port}`)
})
