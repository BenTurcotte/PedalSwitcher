const electron = require('electron');
const url = require('url');
const path = require('path');
const net = require('net');

const {app, BrowserWindow, Menu, ipcMain} = electron;


// process.env.NODE_ENV = 'production'; // comment out to enable devtools

let mainWindow;
let connectWindow;
let mainMenu;
let client;

function createMainWindow() {
  // create new window
  mainWindow = new BrowserWindow({
    webPreferences: {
      // expose node stuff to frontend...  many security risks...  whatever.
      // (for now) I'll be an asshole and I not give a shit about security
      nodeIntegration: true
    }
  });

  // load html file into window
  // mainWindow.loadURL(url.format({
  //   pathname: path.join(__dirname, 'mainWindow.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }));
  mainWindow.loadFile(path.join(__dirname, 'mainWindow.html'))

  // quit app when main win close
  mainWindow.on('closed', function(){
    if (client)
      client.destroy();
    app.quit()
  });

  // build menu from template
  mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

  // insert menu
  Menu.setApplicationMenu(mainMenu);
}

// Listen for app to be ready
app.on('ready', createMainWindow);

// handle create connectWindow
function createConnectWindow(){
  // create new window
  connectWindow = new BrowserWindow({
    width:300,
    height:200,
    title:'SwitchBox Connection Setup',
    webPreferences: {
      nodeIntegration: true // bc fk ur security
    }
  });

  // load html file into window
  connectWindow.loadFile(path.join(__dirname, 'connectWindow.html'));

  // handle garbage collection
  connectWindow.on('close', function(){
    connectWindow = null;
  });
}

// Catch data from connectWindow
ipcMain.on('box:connect', function(e, info){
  
  console.log(`Connecting to server at ${info} ...`);
  
  client = net.createConnection(info.port, info.address, ()=>{
    console.log('connected (' + info.address + ':' + info.port + ')');
    mainWindow.webContents.send('box:connect', info);
    connectWindow.close();
  });

  client.on('data', (data) => {
    console.log(`Received data from server: ${data}`);
    client.end();
  });

  client.on('end', () => {
    console.log('client end.');
  });
});

ipcMain.on('box:disconnect', (e)=>{
  console.log('Disconnecting from server...');
  client ?? client.destroy();
  console.log('Successfully disconnected from server.');
  mainWindow.webContents.send('box:disconnect');
});

ipcMain.on('mainWin:connect', (e)=>{
  createConnectWindow();
});

// create menu template
const mainMenuTemplate = [
  {
    label:'App',
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
      {
        role: 'reload'
      }
    ]
  })
}