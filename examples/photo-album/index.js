require('@std/esm');

import MemServer from '../../index.js';

MemServer.start();

window.$.getJSON('/photos');
