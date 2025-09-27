/**
 * A simple hello world function that returns a greeting message.
 * This function can be used by other components throughout the application.
 *
 * @returns {string} The greeting message "Hello, World!"
 * @example
 * const hello = require('./hello');
 * console.log(hello()); // "Hello, World!"
 */
function hello() {
  return 'Hello, World!';
}

module.exports = hello;