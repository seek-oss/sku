module.exports = ({ sites, fs, rootDirectory }) => (req, res, next) => {
  const tryServeSite = siteName =>
    new Promise(resolve => {
      const siteFilePath = `${rootDirectory}/${siteName}${req.path}/index.html`;

      fs.readFile(siteFilePath, 'utf8', (err, data) => {
        if (err) {
          resolve(false);
        }

        res.send(data);
        resolve(true);
      });
    });

  Promise.all(
    sites.map(site => {
      if (site.host === req.hostname) {
        return tryServeSite(site.name);
      }

      return Promise.resolve(false);
    })
  )
    .then(attempts => {
      if (!attempts.includes(true)) {
        // Try serving default site if no matching host
        return tryServeSite(sites[0].name);
      }

      return false;
    })
    .then(served => {
      if (!served) {
        next();
      }
    });
};
