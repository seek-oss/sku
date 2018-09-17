module.exports = css => {
  const classNames = [];

  const classNameRegEx = /\.([-_a-zA-Z0-9]+)(?=[\.:\[\s{]|$)/gm;
  let match = classNameRegEx.exec(css);
  while (match !== null) {
    classNames.push(match[1]);
    match = classNameRegEx.exec(css);
  }

  return classNames;
};
