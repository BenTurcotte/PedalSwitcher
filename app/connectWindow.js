const electron = require('electron');
const {ipcRenderer} = electron;

// const form = document.querySelector('form');
// form.addEventListener('submit', function(e) {
//   e.preventDefault();
  
//   const info = {
//     "address" : document.querySelector('#address').value,
//     "port" : document.querySelector('#port').value
//   };
  
//   ipcRenderer.send('box-connect-new', info);
// });

const connectBtn = document.getElementById('connectBtn')
connectBtn.addEventListener('click', (sender) => {
  sender.preventDefault();
  
  const info = {
    "address" : document.querySelector('#address').value,
    "port" : document.querySelector('#port').value
  };
  
  ipcRenderer.send('box-connect-new', info);
})

const cancelBtn = document.getElementById('cancelBtn')
cancelBtn.addEventListener('click', (sender) => {
  sender.preventDefault();
  ipcRenderer.send('box-connect-cancelled')
})

ipcRenderer.on('box-connection-attempt-error', (sender, msg) => {
  document.getElementById('errMsg').innerText = msg
  document.querySelector('#address').value = null
  document.querySelector('#port').value = null
})