// Increase timeout for all tests
jest.setTimeout(30000);

// Silence console logs during tests unless explicitly enabled
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  // Keep error and warn for debugging
  // global.console.error = jest.fn();
  // global.console.warn = jest.fn();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION IN TESTS:', reason);
});
