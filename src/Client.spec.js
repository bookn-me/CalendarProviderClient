const expect = require('chai').expect;
const { Response } = require('node-fetch');

const Client = require('../');

const testFetchRequest = () => {
  return new Response('{"error":"EMPTY RESPONSE"}', { status: 200 });
};

describe('Client', () => {
  it('returns the response body as an Object Literal', async () => {
    const client = Client.using(testFetchRequest);
    const response = await client.follow('GET', '/');
    expect(response).to.haveOwnProperty('error', 'EMPTY RESPONSE');
  });
});
