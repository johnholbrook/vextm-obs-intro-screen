/**
 * @file server.js
 * HTTP and socket.io server, serves the intro screen page and sends updates to connected clients
 * @author John Holbrook
 */

var http = require('http');
var path = require('path');
var fs = require('fs');

module.exports = {
    startServer: startServer,
    emit : emit
}

// get the MIME tyle for a given file name
function getMimeType(filepath) {
    const types = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
    }
    let ext = path.extname(filepath).toLowerCase();
    return types[ext] || "text/plain";
}

// special cases for libraries that are installed via npm
var includePaths = {
    "/lib/socket.io.js" : path.join("node_modules", "socket.io", "client-dist", "socket.io.min.js"),
    "/lib/bootstrap.min.css" : path.join("node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"),
}

// create the HTTP server
var server = http.createServer(function(req, res) {
    // get the file path of the requested page
    let filePath = "";
    if (req.url === '/') {
        filePath = path.join("src", "display", "site", 'index.html');
    }
    else {
        filePath = path.join("src", "display", "site", req.url);
    }


    // if that file exists, send it
    if (fs.existsSync(filePath)){
        // console.log(`Serving ${filePath}`);
        res.writeHead(200, {'Content-Type': getMimeType(filePath)});
        res.write(fs.readFileSync(filePath));
    }
    // else, if appending ".html" to the file path results in a file that exists, send that
    else if (fs.existsSync(`${filePath}.html`)){
        res.writeHead(200, {'Content-Type': "text/html"});
        res.write(fs.readFileSync(`${filePath}.html`));
    }
    // if not, check to see if it's one of the special cases
    else if (includePaths.hasOwnProperty(req.url)) {
        // console.log(`Serving ${includePaths[req.url]}`);
        res.writeHead(200, {'Content-Type': getMimeType(req.url)});
        res.write(fs.readFileSync(includePaths[req.url]));
    }
    // if not, send a 404 error
    else {
        // console.log(`Sending 404 for ${req.url}`)
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write("Error: 404 Not Found");
    }
    
    res.end();
});

// initialize socket.io
const io = require('socket.io')(server);

/**
 * Start the server on the specified port
 * @param {Number} port 
 */
function startServer(port){
    console.log(`Starting server on port ${port}`);
    server.listen(port);
}

/**
 * Send some data to all connected clients
 * @param {Object} data
 */
function emit(message, data){
    io.emit(message, data);
}