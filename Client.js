const logger = require('../observability/Logger')(process.env, process.stdout);

module.exports = {
  using: (request) => {
    let mapFieldToFieldWithValue = field => field;
    let retrieveFollowStrategy = () => {};
    let basicAuthHeaderValue = '';

    const api = {
      setFieldFillingStrategy: (callback) => {
        mapFieldToFieldWithValue = callback;
        return api;
      },
      setBasicAuth: (basicAuthPlainValue) => {
        const base64Encode = input => Buffer.from(input).toString('base64');
        basicAuthHeaderValue = `Basic ${base64Encode(basicAuthPlainValue)}`;
        return api;
      },
      setLinksFollowStrategy: (strategy) => {
        retrieveFollowStrategy = strategy;
        return api;
      },
      follow: async (method, href, headers = {}, hops = 0) => {
        if (hops > 10) {
          throw new Error('Client made too many hops, server is buggy');
        }
        const response = await request(href, {
          method: method.toLowerCase(),
          headers: {
            'Accept': 'application/prs.gcalendar+json',
            ...headers
          }
        });

        if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'Basic') {
          logger.debug(`Trying to authenticate using "Basic" schema: ${method} ${href}`);
          if (!basicAuthHeaderValue) {
            throw new Error(`Server responded with Basic Auth challenge but client does not support it`);
          }
          return api.follow(method, href, {
            ...headers,
            Authorization: basicAuthHeaderValue
          }, hops + 1);
        }

        const responseBody = await response.json();
        logger.debug('Response Body:', responseBody);

        if (responseBody.fields) {
          const onlyIncludeFieldsWithValue = field => !!field.value;
          const querystring = responseBody.fields
            .map(mapFieldToFieldWithValue)
            .filter(onlyIncludeFieldsWithValue)
            .map(field => `${field.name}=${encodeURIComponent(field.value)}`)
          .join('&');
          const uri = `${href}?${querystring}`;

          logger.debug(`Filling fields: ${method} ${uri}`);
          return api.follow(method, uri, headers, hops + 1);
        }

        if (responseBody.links) {
          const linkToFollow = retrieveFollowStrategy(responseBody.links);
          if (linkToFollow) {
            logger.debug(`Following link: ${linkToFollow.method} ${linkToFollow.href}`);
            return api.follow(linkToFollow.method, linkToFollow.href, headers, hops + 1);
          }
        }

        return responseBody;
      }
    };

    return api;
  }
}
