const selfsigned = require('selfsigned');
const fs = require('fs');

const { hosts } = require('../context');
const { getPathFromCwd } = require('../lib/cwd');
const { promisify } = require('util');

const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const certificateTtl = 1000 * 60 * 60 * 24;

const createSelfSignedCertificate = async () => {
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

const generateCertificate = async (certificatePath, certificateDirPath) => {
  const pems = createSelfSignedCertificate();

  const certificateDirExists = await exists(certificateDirPath);

  if (!certificateDirExists) {
    await mkdir(certificateDirPath);
  }

  await writeFile(certificatePath, pems.private + pems.cert);

  return pems.private + pems.cert;
};

const getCertificate = async (certificateDirName) => {
  const certificateDirPath = getPathFromCwd(`./${certificateDirName}`);
  const certificatePath = getPathFromCwd(
    `./${certificateDirName}/self-signed.pem`,
  );

  const certificateExists = await exists(certificatePath);

  if (!certificateExists) {
    return generateCertificate(certificatePath, certificateDirPath);
  }

  const certificateStat = await stat(certificatePath);
  const now = new Date();

  // Older than 30 days
  if ((now - certificateStat.ctime) / certificateTtl > 30) {
    await unlink(certificatePath);

    return generateCertificate(certificatePath, certificateDirPath);
  }

  return readFile(certificatePath);
};

module.exports = getCertificate;
