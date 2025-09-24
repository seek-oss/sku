window.injected = () => {
  const p = document.createElement('p');
  p.textContent = "This node was injected by the 'injected' global function.";
  document.body.appendChild(p);
};
