window.someRandomApi = () => {
  const p = document.createElement('p');
  p.textContent =
    "This node was injected by the '3rd-party-polyfill' dependency.";
  document.body.appendChild(p);
};
