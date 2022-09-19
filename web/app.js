class SerialPortHandler {
  constructor(options) {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.options = options;
    this.port = null;
    this.writer = null;
    this.reader = null;
    this.isOpened = false;
  }

  async open() {
    if ('serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort();
        await port.open(this.options);

        this.port = port;
        this.writer = port.writable.getWriter();
        this.reader = port.readable.getReader();
        this.isOpened = true;

        return this.port.getInfo();
      } catch (error) {
        console.error(error);
        throw error;
      }
    } else {
      console.error('Web Serial API is not supported in your browser.');
    }
  }

  async close() {
    await this.port.close();
  }

  async write(data) {
    const encoded = this.encoder.encode(data);
    return await this.writer.write(encoded);
  }

  async read() {
    let data = '';
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) {
        this.reader.releaseLock();
        break;
      }
      data += this.decoder.decode(value);
      console.log(data);
    }
  }
}

const $connectButton = document.getElementById('connect');
const $disconnectButton = document.getElementById('disconnect');
const $terminalForm = document.getElementById('terminal_form');
const $serialLog = document.getElementById('serial_log');
const $status = document.getElementById('status');
const $vendorId = document.getElementById('vendorId');
const $productId = document.getElementById('productId');

const serialPortHandler = new SerialPortHandler({ baudRate: 9600 });

async function onConnect() {
  try {
    const info = await serialPortHandler.open();
    console.log('Device connected: ', info);
    console.log(serialPortHandler.port);
    $terminalForm.elements.input.removeAttribute('disabled');
    $vendorId.textContent = '0x' + info.usbVendorId.toString(16);
    $productId.textContent = '0x' + info.usbProductId.toString(16);
    $status.textContent = 'CONNECTED';
  } catch (error) {
    $status.textContent = 'ERROR';
  }
}

async function onDisconnect() {
  await serialPortHandler.close();
  $vendorId.textContent = '-';
  $productId.textContent = '-';
  $status.textContent = 'NOT CONNECTED';
}

async function onSend(e) {
  e.preventDefault();
  const $form = e.target;
  const data = $form.elements.input.value;
  $form.reset();
  if (serialPortHandler.isOpened) {
    await serialPortHandler.write(data + '\n');
    await serialPortHandler.read();
  }
}

$connectButton.addEventListener('click', onConnect);
$disconnectButton.addEventListener('click', onDisconnect);
$terminalForm.addEventListener('submit', onSend);

// const program1 = setInterval(async () => {
//   if (serialPortHandler.isOpened) {
//     await serialPortHandler.write('led_toggle' + '\n');
//   }
// }, 50);

// setInterval(() => {
//   clearInterval(program1);
// }, 5000);