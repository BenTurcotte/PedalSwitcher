const electron = require('electron');
const {ipcRenderer} = electron;

const pedalElems = [
  document.getElementById('pedal1'),
  document.getElementById('pedal2'),
  document.getElementById('pedal3'),
  document.getElementById('pedal4'),
  document.getElementById('pedal5'),
  document.getElementById('pedal6'),
  document.getElementById('pedal7'),
  document.getElementById('pedal8')
]
const connectBtn = document.getElementById('connectBtn');

let loopStates = [false, false, false, false, false, false, false, false];

// CONNECT/DISCONNECT ==============================================================================
connectBtn.addEventListener('click', (ev)=>{
  ev.preventDefault();

  // FIXME: Connect/Disconnect button stays looking like its pressed even after connect window popup closes

  if (connectBtn.textContent === "Disconnect"){
    ipcRenderer.send('box-disconnect');
  }
  else {
    ipcRenderer.send('req-box-connect');
  }
})

// BOX Connection Info Stuff
ipcRenderer.on('box-connection-established', function (sender, info){
  const bci = document.getElementById('boxConnectionInfo');
  bci.innerHTML = 'Connected to BOX at ' + info.address + ':' + info.port;

  pedalElems.forEach(element => {
    if (element.classList.contains('pedal-disabled'))
      element.classList.remove('pedal-disabled')
  })

  const connectBtn = document.getElementById('connectBtn');
  connectBtn.textContent = "Disconnect";
});

ipcRenderer.on('box-connection-ended', function (sender, info){
  const bci = document.getElementById('boxConnectionInfo');
  bci.textContent = 'Not connected to BOX.';

  pedalElems.forEach(element => {
    if (!element.classList.contains('pedal-disabled'))
      element.classList.add('pedal-disabled')
  })

  const connectBtn = document.getElementById('connectBtn');
  connectBtn.textContent = "Connect";
});

function updateLoopState(loopIndex) {
  if (pedalElems[loopIndex].classList.contains('pedal-disabled'))
    return;

  const removeMe = loopStates[loopIndex] ? 'pedal-on' : 'pedal-off';
  const addMe = loopStates[loopIndex] ? 'pedal-off' : 'pedal-on';

  loopStates[loopIndex] = !loopStates[loopIndex];
  pedalElems[loopIndex].classList.remove(removeMe);
  pedalElems[loopIndex].classList.add(addMe);
  
  console.log(`Turning loop ${loopIndex} ${loopStates[loopIndex] ? "ON" : "OFF" }`);
  ipcRenderer.send('send-box-cmd-audio-preset-change', loopStates);
}

pedalElems[0].addEventListener('click', () => { updateLoopState(0) });
pedalElems[1].addEventListener('click', () => { updateLoopState(1) });
pedalElems[2].addEventListener('click', () => { updateLoopState(2) });
pedalElems[3].addEventListener('click', () => { updateLoopState(3) });
pedalElems[4].addEventListener('click', () => { updateLoopState(4) });
pedalElems[5].addEventListener('click', () => { updateLoopState(5) });
pedalElems[6].addEventListener('click', () => { updateLoopState(6) });
pedalElems[7].addEventListener('click', () => { updateLoopState(7) });

// TODO: way of renaming the loops (via right click context menu???)

// =================================================================================================
const midiSendBtn = document.getElementById('midiSendBtn');
const midiChannel = document.getElementById('midiChannel');
const midiMsgType = document.getElementById('midiMsgType');
const midiByte1 = document.getElementById('midiByte1');
const midiByte2 = document.getElementById('midiByte2');

midiSendBtn.addEventListener('click', () => {
  console.log(`sending midi cmd: ${midiChannel.value}, ${midiMsgType.value}, ${midiByte1.value}, ${midiByte2.value}`);
  ipcRenderer.send('send-box-cmd-midi', {
    channel: midiChannel.value,
    type: midiMsgType.value,
    byte1: midiByte1.value,
    byte2: midiByte2.value,
  });
});


// =================================================================================================
ipcRenderer.on('server-data-received', (sender, data) => {
  // TODO: implement BOX state verification from response from server (waiting on HW implementation)
  console.log(`Received data from server: ${data}`);
});