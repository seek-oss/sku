export default Boolean(process.env.CI || process.env.BUILDKITE_BUILD_ID);
