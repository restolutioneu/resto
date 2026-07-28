const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadSoftPosApi() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8')
    .replace('export default softPos;', 'module.exports = softPos;');

  const context = {
    console,
    navigator: { userAgent: 'SoftPos/1.0' },
    window: {},
    module: { exports: {} },
    exports: {},
  };

  context.global = context;
  context.window.softPos = {
    placeOrder: () => {},
    evalLisp: () => {},
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'index.js' });

  return { api: context.module.exports, context };
}

test('setSscLoyalty escapes loyalty JSON before sending it to SoftPos', () => {
  const { api, context } = loadSoftPosApi();
  const capturedCommands = [];
  const expectedResponse = { success: true, message: 'ok' };

  context.window.softPos.evalLisp = (cmd) => {
    capturedCommands.push(cmd);
    return JSON.stringify(expectedResponse);
  };

  let successCalled = false;
  api.payments.setSscLoyalty('{"customer":"A"}', (response) => {
    successCalled = true;
    assert.strictEqual(response.success, expectedResponse.success);
    assert.strictEqual(response.message, expectedResponse.message);
  }, (error) => {
    throw error;
  });

  assert.strictEqual(capturedCommands.length, 1);
  assert.strictEqual(capturedCommands[0], '(sok-ssc-set-transaction-loyalty {\\"customer\\":\\"A\\"})');
  assert.strictEqual(successCalled, true);
});
