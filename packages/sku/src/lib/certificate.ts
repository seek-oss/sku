import { generate } from 'selfsigned';
import chalk from 'chalk';
import exists from './exists.js';
import { mkdir, unlink, writeFile, stat, readFile } from 'node:fs/promises';

import { getPathFromCwd } from './cwd.js';
import { hosts } from '../context/index.js';
import { performance } from 'node:perf_hooks';
import provider from '../telemetry/index.js';
import type { PathLike } from 'node:fs';

const certificateTtl = 1000 * 60 * 60 * 24;

const createSelfSignedCertificate = () => {
  console.log(chalk.blue`Generating self-signed certificate`);
  const attributes = [
    {
      name: 'commonName',
      value: hosts[0],
    },
  ];

  type AltName = {
    type: number;
    value?: string;
    ip?: string;
  };

  const altNames: AltName[] = hosts.map((host) => ({
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

  return generate(attributes, {
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

const generateCertificate = async (
  certificatePath: PathLike,
  certificateDirPath: PathLike,
) => {
  const startTime = performance.now();

  const pems = createSelfSignedCertificate();

  const certificateDirExists = await exists(certificateDirPath);

  if (!certificateDirExists) {
    await mkdir(certificateDirPath, { recursive: true });
  }

  await writeFile(certificatePath, `${pems.private}${pems.cert}`);

  provider.timing('certificate.generate', performance.now() - startTime);

  return pems.private + pems.cert;
};

const getCertificate = async (certificateDirName = '.ssl') => {
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
  if ((now.valueOf() - certificateStat.ctime.valueOf()) / certificateTtl > 30) {
    await unlink(certificatePath);

    return generateCertificate(certificatePath, certificateDirPath);
  }

  return readFile(certificatePath, { encoding: 'utf8' });
};

export default getCertificate;
