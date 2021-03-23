const http  = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'public', 'error.html'), (err, data) => {
        if(err) {
          res.writeHead(500);
          res.end('Error');
        } else {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          });
          res.end(data);
        }
        
      })
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.end(data)
    }
  })
});

server.listen(3000, () => {
  console.log('server has been started')
})