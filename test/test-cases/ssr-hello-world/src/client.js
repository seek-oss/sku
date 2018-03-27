const fileName = 'message';

import(`./message/${fileName}`).then(({ message }) => {
  document.getElementById('app').innerHTML = message;
});
