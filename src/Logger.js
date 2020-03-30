/* eslint-disable no-console */
module.exports = (processEnv, stream) => {
  return {
    debug: (message) => {
      if (processEnv.LOG_LEVEL === 'debug') {
        stream.write(`Logger debug: ${message}\n`);
      }
    },
    error: message => {
      stream.write(`ERROR: ${message}\n`);
    }
  };
}
