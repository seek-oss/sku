const isProductionBuild = process.env.NODE_ENV === 'production';
const isCI = process.env.CI === 'true';

module.exports = { isProductionBuild, isCI };
