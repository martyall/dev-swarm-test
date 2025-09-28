const { hello } = require('./hello');

/**
 * Main application entry point
 * Uses the hello function to demonstrate basic functionality
 */
function main() {
  const greeting = hello();
  console.log(greeting);
  return greeting;
}

module.exports = { main };