const electron = require('electron');
const net = require('net');

const {app, BrowserWindow} = electron;

let mainWin;
let server;

app.whenReady().then(()=>{
  // Create the browser window.
  mainWin = new BrowserWindow({
    width: 400,
    height: 400,
    x:0,
    y:0,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWin.loadFile('index.html')

  server = net.createServer((connection) => {
    console.log('client connected');
   
    connection.on('end', function() {
        console.log('client disconnected');
    });
    
    connection.write('Hello World!\r\n');
    connection.pipe(connection);

    cconnection.on('data', (data)=>{
      console.log('received data from client: ' + data);
      mainWin.webContents.send('data', data);
    });

    // c.write('hello from server!\r\n');
    // c.pipe(c);
  });

  server.on('error', (err) => {
    throw err;
  });

  server.listen(8124, 'localhost', () => {
    console.log('Listening at localhost:8124');
    mainWin.webContents.send('server:listening', 'localhost:8124');
  });

  mainWin.on('close', (e)=>{
    console.log('exiting... ')
    server.close()
  })
});