const validUrl = require('../../lib/validUrl');
var expect = require('chai').expect;

describe('validUrl', function () {
  it('should return false when no protocol is specified', function () {
    const isValid = validUrl('blah.com');
    expect(isValid).to.be.false;
  });

  it('should return true when a valid url is specified', function () {
    const isValid = validUrl('https://visualify.io/api/cool-post');
    expect(isValid).to.be.true;
  });

  it('should pass with local urls', function () {
    const isValid = validUrl('http://localhost:3000/api/v1/test-endpoint');
    expect(isValid).to.be.true;
  });

  it('should pass with subdomains', function () {
    const isValid = validUrl('https://api.spinneret.co/scrape');
    expect(isValid).to.be.true;
  });
});
