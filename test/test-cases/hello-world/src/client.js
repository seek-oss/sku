import('./message').then(({ message }) => {
  document.getElementById('app').innerHTML = message;
});
