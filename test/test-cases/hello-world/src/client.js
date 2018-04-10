(async () => {
  const fileName = 'message';

  const { message } = await import(`./message/${fileName}`);
  document.getElementById('app').innerHTML = message;
})();
