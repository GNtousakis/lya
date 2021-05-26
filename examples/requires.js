// Show modules with their `requires`
module.exports = function importAnalysis(argv, lya) {
  const results = {};

  return {
    // Extend the CLI to handle one more argument.
    onReady: function onReady () {
      return require(lya.findEntryModule(require, argv[0]));
    },

    // Fires during runtime on user code, where a CallExpression was
    // found at instrumentation-time.
    onCallExpression: function onCallExpression(original, info) {
      var result = original();
      var I = info.I;

      // "Did a module call its own require function?"
      if (I.require === info.target) {
        results[I.module.id] = results[I.module.id] || [];
        results[I.module.id].push(info.required);
      }
      
      return result;
    },

    // Equip a CallExpression with the function being called and the
    // first argument, but only if it looks like a vanilla require.
    refactorCallExpression: function refactorCallExpression(R) {
      var wrap = R.wrap;
      var node = R.node;
      var callee = R.node.callee;
      var args = R.node.arguments;
      var render = R.render;
      
      return wrap(render(node), {
        injectProperties: (
          callee.type === 'Identifier' && callee.name === 'require'
            ? { required: render(args[0]), target: render(callee) }
            : {}),
      });
    },

    afterAnalysis: function afterAnalysis() {
      console.log(JSON.stringify(results, null, 2));
    },
  };
};
