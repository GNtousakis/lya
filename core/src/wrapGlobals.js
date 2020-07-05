const RW = {
  apply: function(target, thisArg, argumentsList) {
    console.log('apply', target, thisArg, argumentsList);
    Reflect.apply(...arguments);
  },
  construct: function(target, argumentsList, newTarget) {
    console.log('construct', target, argumentsList);
    Reflect.construct(...arguments);
  },
  defineProperty: function(target, property, descriptor) {
    console.log('defineProperty', target, property, descriptor);
    Reflect.defineProperty(...arguments);
  },
  getOwnPropertyDescriptor: function(target, prop) {
    console.log('getOwnPropertyDescriptor', target, prop);
    Reflect.getOwnPropertyDescriptor(...arguments);
  },
  deleteProperty: function(target, property) {
    console.log('deleteProperty', target, property);
    Reflect.deleteProperty(...arguments);
  },
  getPrototypeOf: function(target) {
    console.log('getPrototypeOf', target);
    Reflect.getPrototypeOf(...arguments);
  },
  setPrototypeOf: function(target, prototype) {
    console.log('setPrototypeOf', target, prototype);
    Reflect.setPrototypeOf(...arguments);
  },
  isExtensible: function() {
    console.log('isExtensible', ...arguments);
    Reflect.isExtensible(...arguments);
  },
  preventExtensions: function(target) {
    console.log('preventExtensions', ...arguments);
    Reflect.preventExtensions(...arguments);
  },
  get: function(target, prop, receiver) {
    console.log('get', target, prop);
    Reflect.get(...arguments);
  },
  set: function(target, prop, value, receiver) {
    console.log('set', target, prop, value);
    Reflect.set(...arguments);
  },
  has: function(target, prop) {
    console.log('has', target, prop);
    Reflect.has(...arguments);
  },
  ownKeys: function(target) {
    console.log('ownKeys', target);
    Reflect.ownKeys(...arguments);
  },
};

function sandboxJS(js) {
  const whitelist = ['alert', 'console', 'navigator', 'location'];
  const handlers = {
    get(target, propKey, receiver) {
      console.log('get');
      return Reflect.get(target, propKey, receiver);
    },
    set(target, propKey, value, receiver) {
      console.log('set');
      return Reflect.set(target, propKey, value, receiver);
    },
    has(target, propKey, context) {
      console.log('has');
      return Reflect.has(target, propKey, context);
    },
  };
  const proxy = new Proxy(global, RW);
  const proxyName = `proxy${Math.floor(Math.random() * 1E9)}`;
  const fn = new Function(proxyName, `with(${proxyName}){${js}}`);
  return fn.call(this, proxy);
}

// sandboxJS("console.log(2)");        // 2
// sandboxJS("console.log(history)");  // Error, Not allowed: history
console.log('x = 3');
sandboxJS('x = 3');
//
// console.log("x = 4");
// sandboxJS('x = 4');
//
// console.log('console.log(x)');
// sandboxJS('console.log(x)');

// console.log('Infinity');
// sandboxJS('Infinity');
//
// console.log('process');
// sandboxJS('process');

/*
Examples of closures etc
env.global = new Proxy(global, createHandler(["user-global"], ...));

createHandler(root, ..){

  return {
    get: ...
    ...
    ... new Proxy(target[name], createHandler(root.push("target"))]))


}
}

add1 = createAdd();
add1(3) // 0 + 3
add1(3) // 6

add2 = createAdd(100)
add2(3) // 103

add1(3) // 9


createAdd = (init) => {

  let sum = init || 0;

  return (n) => {
    sum += n
    return sum;
  }
};
*/

