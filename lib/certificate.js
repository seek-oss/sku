const selfsigned = require('selfsigned');

const { hosts } = require('../context');

module.exports = createCertificate;

// eslint-disable-next-line no-unused-vars
const generateCertificate = async () => {
  const attributes = [
    {
      name: 'commonName',
      value: hosts[0],
    },
  ];

  const altNames = hosts.map((host) => ({
    type: 2, // DNS
    value: host,
  }));

  // V4
  altNames.push({
    type: 7, // IP
    ip: '127.0.0.1',
  });

  // V6
  altNames.push({
    type: 7, // IP
    ip: 'fe80::1',
  });

  return selfsigned.generate(attributes, {
    algorithm: 'sha256',
    days: 30,
    keySize: 2048,
    extensions: [
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'subjectAltName',
        altNames,
      },
    ],
  });
};

const getCertificate = async () => {};

module.exports = getCertificate;
