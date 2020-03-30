const expect = require('chai').expect;
const MemoryStream = require('memorystream');

const Logger = require('./Logger');

const flushStreamToString = stream => {
  stream.end();
  return new Promise(resolve => {
    let data = '';
    stream.on('data', chunk => { data += chunk.toString(); });
    stream.on('end', () => { resolve(data); });
  });
};

describe('Logger', () => {
  describe('Console logging', () => {
    it('logs a DEBUG message to console', async () => {
      const stream = new MemoryStream();
      const processEnv = { LOG_LEVEL: 'debug' };
      const logger = Logger(processEnv, stream);

      logger.debug('any message');

      expect(await flushStreamToString(stream)).to.eql('Logger debug: any message\n');
    });

    it('DOES NOT log a DEBUG message to console if env var is not the correct one', async () => {
      const stream = new MemoryStream();
      const processEnv = { LOG_LEVEL: 'ANY VALUE HERE' };
      const logger = Logger(processEnv, stream);

      logger.debug('some message');

      expect(await flushStreamToString(stream)).to.eql('');
    });

    it('logs a ERROR message to console regardless of the environment config', async () => {
      const stream = new MemoryStream();
      const processEnv = {};
      const logger = Logger(processEnv, stream);

      logger.error('any message');

      expect(await flushStreamToString(stream)).to.eql('ERROR: any message\n');
    });
  });
});
