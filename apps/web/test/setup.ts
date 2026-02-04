import '@testing-library/jest-dom';
// add any global mocks or setup here

// JSDOM doesn't implement Element.scrollIntoView; provide a no-op for tests
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
   
  Element.prototype.scrollIntoView = function() {};
}
