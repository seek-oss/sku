const setSite = site => {
  fetch('/sku/app-config', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ site })
  });
};

window.sku = {
  setSite
};
