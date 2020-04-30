
// process.env.NODE_ENV = 'production'; // comment out to enable devtools

const electron = require('electron');
const path = require('path');
const net = require('net');
const os = require('os');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let connectWin;
let mainMenu;
let client; // : net.Socket; // this isn't typescript so can't annotate Type

// Ensure Cleanup --------------------------------------------------------------
function ensureCleanup() {
  if (connectWin != null) {
    connectWin.close();
    connectWin = null;
  }
  if (client != null) {
    client.end();
    client.destroy();
    client = null;
  }
  if (mainWindow != null) {
    mainWindow.close();
    mainWindow = null;
  }
}

// create MainWindow -----------------------------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'assets/icons/png/icon.png'),
    x:410,
    y:0,
    // center:true,
    webPreferences: {
      // expose node stuff to frontend...  many security risks...  whatever.
      // (for now) I'll be an asshole and not give a shit about security
      nodeIntegration: true
    }
  })

  mainWindow.maximize()

  mainWindow.loadFile(path.join(__dirname, 'mainWindow.html'))

  mainWindow.on('closed', function(){
    if (client) {
      client.destroy();
      client = null;
    }
    app.quit()
  })

  // build menu from template
  mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.show()
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

// IPC Event Handling ----------------------------------------------------------
ipcMain.on('box-connect-new', function(e, info){
  
  if (client == null || typeof(client) != typeof(net.Socket)) {
    
    client = new net.Socket();
    
    client.setEncoding('utf-8')
    
    // callbacks must be set only once per instantiation of client otherwise a
    // copy of the callback function will be added every time a connection is
    // established
    client.on('error', (err) => {
      console.error(err)
      connectWin.webContents.send('box-connection-attempt-error', err.message)
    })
    
    client.on('data', (data) => {
      console.log(`Received data from server: ${data}`);
      mainWindow.webContents.send('server-data-received', data)
    })
    
    client.on('connect', () => {
      // FIXME: connect occurs twice if try to reconnect after disconnect
      // repro: connect, disconnect, try connect again (same address) will cause error
      console.log(`Connected to server at ${info.address}:${info.port}`);
      mainWindow.webContents.send('box-connection-established', info);
      connectWin.close()
    })
    
    client.on('end', () => {
      console.log('Box connection ended.');
      mainWindow.webContents.send('box-connection-ended');
    })
  }
  
  client.connect({port:info.port, host:info.address})
})

ipcMain.on('box-connect-cancelled', () => {
  console.log('Cancelling connection request.')
  connectWin.close();
})

ipcMain.on('box-disconnect', (e)=>{
  console.log('Disconnecting from server...');
  if (client != null) {
    client.end(() => {
      client.destroy()
      client = null
      console.log('Successfully disconnected from server.');
      mainWindow.webContents.send('box-connection-ended');
    })
  }
  else {
    const msg = 'Client was null...  cannot disconnect.';
    console.log(msg)
    mainWindow.webContents.send('box-connection-error', msg);
  }
})

ipcMain.on('req-box-connect', (e)=>{
  createConnectWindow();
})

ipcMain.on('send-box-cmd-audio-preset-change', (e, args)=>{
  let oneHot = 0x00;
  for (let i = 0; i < args.length; i++) {
    if (args[i] == true){
      oneHot += (1 << i);
    }
  }
  
  // Msg bytes:
  // [
  //   A (65),
  //   binary one-hot rep of loop states,
  //   line feed (13),
  //   new-line (10)
  // ]
  let boxCmd = Buffer.from([0x41, oneHot, 0x0D, 0x0A])
  
  console.log(`Sending loop states to BOX.`);
  console.log(`  Loop States: ${args}`);
  console.log(`  Bytes: ${boxCmd.readUInt8(0)}, ${boxCmd.readUInt8(1)}, ${boxCmd.readUInt8(2)}, ${boxCmd.readUInt8(3)}`)
  
  if (client && client.writable)
    client.write(boxCmd);
  else
    console.log('cannot send cmd...  must establish connection to BOX first.')
});

ipcMain.on('send-box-cmd-midi', (elem, msgObj) => {
  // TODO: implement midi cmd send to BOX
  console.log('midi cmd send not fully implemented yet. Here\'s the data that we still need to interpret:')
  console.log(msgObj)

  const cmdId = msgObj.type == 'PC' ? 0x50 : 0x43;
  const chan = parseInt(msgObj.channel);
  const b1 = parseInt(msgObj.byte1);
  const b2 = parseInt(msgObj.byte2);

  let boxCmd;
  if (msgObj.type == 'PC') {
    boxCmd = Buffer.from([cmdId, chan, b1, 0x0D, 0x0A]);
    console.log(`Sending midi PC command to BOX.`);
    console.log(`  cmd id, midi channel, pc value`);
    console.log(`  Bytes: ${boxCmd.readUInt8(0)}, ${boxCmd.readUInt8(1)}, ${boxCmd.readUInt8(2)}`);
  }
  else {
    boxCmd = Buffer.from([cmdId, chan, b1, b2, 0x0D, 0x0A]);
    console.log(`Sending midi CC command to BOX.`);
    console.log(`cmd id, midi channel, cc param, cc value`)
    console.log(`  Bytes: ${boxCmd.readUInt8(0)}, ${boxCmd.readUInt8(1)}, ${boxCmd.readUInt8(2)}, ${boxCmd.readUInt8(3)}`)
  }


  // TODO: convert the four lines below into a reusable function
  if (client && client.writable)
    client.write(boxCmd);
  else
    console.log('cannot send cmd...  must establish connection to BOX first.');
});



// MENU TEMPLATE --------------------------------------------------------
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
          ensureCleanup();
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
      },
      {
        label: 'Show Experiment Window',
        accelerator: process.platform == 'darwin'
        ? 'Command+X'
        : 'Ctrl+X',
        click(item, focusedWindow) {
          const xwin = new BrowserWindow({
            frame:true,
            title:'Experiment Window',
            webPreferences: {
              nodeIntegration: true // bc fk ur security
            }
          })
          xwin.loadFile(path.join(__dirname, 'experimentWindow.html'))
        }
      }
    ]
  })
}

// APP STARTUP =====================================================================================
if (os.platform === 'darwin') {
  // show proper icon in dock if on mac
  const image = electron.nativeImage.createFromPath(
    app.getAppPath() + "/assets/icons/mac/icon.icns"
  );
  console.log(`Retrieving icon image from: ${app.getAppPath() + iconPath}`);
  app.dock.setIcon(image);
}
app.on('ready', createMainWindow);
