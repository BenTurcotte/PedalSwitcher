const electron = require('electron');
const net = require('net');

const {app, BrowserWindow, ipcMain} = electron;

let mainWindow;
let server;

app.whenReady().then(()=>{
  createMainWindow();
  createServer();
});

function createMainWindow(){
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    x:0,
    y:0,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.on('close', (e)=>{
    if (server)
      server.close()
    console.log('exiting... ')
  })
}

function createServer(){
  server = net.createServer();
  
  server.listen(8124, 'localhost', ()=>{
    console.log('attempting to open server at localhost:8124')
  })
  
  .on('listening', () => {
    console.log('server is listening...')
  })
  
  .on('connection', (socket) => {
    console.log('connection established.');
    const address = socket.address();
    mainWindow.webContents.send('client-connected', `${address.address}:${address.port} (${address.family})`);

    // socket.write('Hello Client! (from Server)\r\n');

    socket.on('data', (data) => {

      let bytesAsStr = data.join(', ');
      console.log(`Received data from client.`);
      console.log(`  # of bytes received: ${data.byteLength}`);
      console.log(`  Values of bytes: ${bytesAsStr}`);
      
      // TODO: interperet cmd from client and send something more meaningful to renderer process
      
      mainWindow.webContents.send('client-cmd-processed', `${bytesAsStr}`);
    })
    .on('end', () => {
      console.log('connection ending.');
      mainWindow.webContents.send('client-disconnected', `${socket.address}:${socket.port}`);
    })
    .on('error', (err) => {
      console.log('encountered error:');
      console.log(err);
    });
  })
  
  .on('error', (err) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Address in use, retrying...');
      setTimeout(() => {
        server.close();
        server.listen(PORT, HOST);
      }, 1000);
    }
    else {
      throw err;
    }
  })
}