
// process.env.NODE_ENV = 'production'; // comment out to enable devtools

const electron = require('electron');
const path = require('path');
const net = require('net');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let connectWin;
let mainMenu;

const client = new net.Socket();

// create MainWindow -----------------------------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    x:410,
    y:0,
    width:500,
    height:400,
    webPreferences: {
      // expose node stuff to frontend...  many security risks...  whatever.
      // (for now) I'll be an asshole and I not give a shit about security
      nodeIntegration: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'mainWindow.html'))

  mainWindow.on('closed', function(){
    if (client)
      client.destroy();
    app.quit()
  });

  // build menu from template
  mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
}

// handle create connectWindow -------------------------------------------------
function createConnectWindow(){
  connectWin = new BrowserWindow({
    frame:false,
    alwaysOnTop:true,
    width:300,
    height:200,
    title:'Box Connection Setup',
    webPreferences: {
      nodeIntegration: true // bc fk ur security
    }
  })
  connectWin.on('close', function(){
    connectWin = null;
  })
  connectWin.loadFile(path.join(__dirname, 'connectWindow.html'))
}

// Listen for app to be ready
app.on('ready', createMainWindow);

// IPC Event Handling ----------------------------------------------------------
ipcMain.on('box-connect-new', function(e, info){
  
  client.connect({port:info.port, host:info.address})
  client.setEncoding('utf-8')
  client.on('error', (err) => {
    console.error(err)
    connectWin.webContents.send('box-connection-attempt-error', err.message)
  })
  client.on('data', (data) => {
    console.log(`Received data from server: ${data}`);
    mainWindow.webContents.send('server-data-received', data)
  })
  client.on('connect', () => {
    console.log(`Connected to server at ${info.address}:${info.port}`);
    mainWindow.webContents.send('box-connection-established', info);
    connectWin.close()
  })
  client.on('end', () => {
    console.log('Box connection ended.');
    mainWindow.webContents.send('box-connection-ended');
  })
})

ipcMain.on('box-connect-cancelled', () => {
  console.log('Cancelling connection request.')
  connectWin.close();
})

ipcMain.on('box-disconnect', (e)=>{
  console.log('Disconnecting from server...');
  client ?? client.destroy();
  console.log('Successfully disconnected from server.');
  mainWindow.webContents.send('box-connection-ended');
})

ipcMain.on('req-box-connect', (e)=>{
  createConnectWindow();
})

ipcMain.on('send-box-cmd-preset-change', (e, args)=>{
  let oneHot = 0x00;
  for (let i = 0; i < args.length; i++) {
    if (args[i] == true){
      oneHot += (1 << i);
    }
  }
  
  // Msg bytes:
  // [
  //   P (8),
  //   binary one-hot rep of loop states,
  //   line feed (13),
  //   new-line (10)
  // ]
  let boxCmd = Buffer.from([0x50, oneHot, 0x0D, 0x0A])
  
  console.log(`Sending loop states to BOX.`);
  console.log(`  Loop States: ${args}`);
  console.log(`  Bytes: ${boxCmd.readUInt8(0)}, ${boxCmd.readUInt8(1)}, ${boxCmd.readUInt8(2)}, ${boxCmd.readUInt8(3)}`)
  
  if (client && client.writable)
    client.write(boxCmd);
  else
    console.log('cannot send cmd...  must establish connection to BOX first.')
});

// create menu template --------------------------------------------------------
const mainMenuTemplate = [
  {
    label:'APP',
    submenu:[
      {
        label:'Quit',
        accelerator: process.platform == 'darwin'
          ? 'Command+Q'
          : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Options',
    submenu:[
      {
        label: 'Connect...',
        click(){
          createConnectWindow();
        }
      }
    ]
  }
];

// add devtools if not in production
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'DevTools',
    submenu:[
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin'
          ? 'Command+I'
          : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {type: 'separator'},
      {
        role: 'reload'
      }
    ]
  })
}