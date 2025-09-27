/**
 * Greeting application that uses the hello function
 */

const { hello } = require('./hello');

/**
 * Main application function that creates a greeting
 * @returns {string} A greeting message
 */
function createGreeting() {
    return hello();
}

/**
 * Runs the greeting application
 */
function runApp() {
    console.log(createGreeting());
}

module.exports = {
    createGreeting,
    runApp
};