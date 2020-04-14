const electron = require('electron');
const {ipcRenderer} = electron;

const cb = document.getElementById('connectBtn');
cb.addEventListener('click', (ev)=>{
  ev.preventDefault();

  // FIXME: Connect/Disconnect button stays looking like its pressed even after connect window popup closes

  if (cb.textContent === "Disconnect"){
    ipcRenderer.send('box-disconnect');
  }
  else {
    ipcRenderer.send('req-box-connect');
  }
})

const loopForm = document.getElementById('loopForm');
loopForm.addEventListener('click', (e) =>{
  e.preventDefault();
  let boxes = Array.from(document.getElementsByName('loopCheckboxes'));
  let states = boxes.map(x => x.checked);

  console.log(states);

  ipcRenderer.send('send-box-cmd-preset-change', states);
});

// BOX Connection Info Stuff
ipcRenderer.on('box-connection-established', function (sender, info){
  const bci = document.getElementById('boxConnectionInfo');
  bci.innerHTML = 'Connected to BOX at ' + info.address + ':' + info.port;

  const connectBtn = document.getElementById('connectBtn');
  connectBtn.textContent = "Disconnect";
});

ipcRenderer.on('box-connection-ended', function (sender, info){
  const bci = document.getElementById('boxConnectionInfo');
  bci.textContent = 'Not connected to BOX.';

  const connectBtn = document.getElementById('connectBtn');
  connectBtn.textContent = "Connect";
});

ipcRenderer.on('server-data-received', (sender, data) => {
  // TODO: implement BOX state verification from response from server (waiting on HW implementation)
  console.log(`Received data from server: ${data}`);
});