const validUrl = require('../../lib/validUrl');
var expect = require('chai').expect;

describe('validUrl', function () {
  it('should return false when no protocol is specified', function () {
    const isValid = validUrl('blah');
    expect(isValid).to.be.false;
  });

  it('should return true when a valid url is specified', function () {
    const isValid = validUrl('https://visualify.io/api/cool-post');
    expect(isValid).to.be.true;
  });
});
