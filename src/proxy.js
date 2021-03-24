// Responsible for creating proxy handlers and functions that monitor
// each possible iteration for a JS object.


module.exports = {
  createProxyApplyHandler,
  createProxyConstructHandler,
  createProxyGetHandler,
  createProxyHandlerObject,
  createProxyHasHandler,
  createProxySetHandler,
  maybeAddProxy,
};

const {elementOf} = require('./container-type.js');
const {withCatch} = require('./control.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {
  createReferenceMetadataStore,
  getDeclaringModule,
  getOPath,
} = require('./metadata.js');


// Like new Proxy(), except construction is conditional, and any
// created instances are tracked.
function maybeAddProxy(env, obj, handler) {
  let { proxy, name } = env.metadata.get(obj);

  if (!proxy) {
    try {
      proxy = new Proxy(obj, handler);
    } catch (e) {
      // Proxy() already knows what it wants, so we can use an
      // exception to avoid writing a bunch of defensive checks.
      // Since the same TypeError is raised for either argument, we at
      // least need to be sure that the handler wasn't the issue.
      if (e instanceof TypeError && handler !== null && typeof handler === 'object') {
        return undefined;
      }

      throw e;
    }

    env.metadata.set(obj, { proxy });

    // Unless we can afford it, do not track the object referenced by
    // the proxy here.  It would prevent the garbage collector from
    // collecting the underlying WeakMap key.
    env.metadata.set(proxy, {
      // Convention: '*' means 'Proxy'
      name: name ? name + '*' : name,
    });
  }

  return proxy;
}


function createProxyHandlerObject(env, typeClass) {
  return {
    get: createProxyGetHandler(env, typeClass),
    has: createProxyHasHandler(env, typeClass),
    set: createProxySetHandler(env, typeClass),
    apply: createProxyApplyHandler(env, typeClass),
    construct: createProxyConstructHandler(env, typeClass),
  };
}


function createProxyGetHandler(env, typeClass) {
  return function get(target, name) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onRead,
        },
      },
    } = env;

    const maybeMetadata = metadata.get(target[name]);
    const currentValue = Reflect.get(...arguments);

    // Lazily create proxies to extend scope of monitoring.
    if (!maybeMetadata) {
      metadata.set(currentValue, {
        parent: target,
        name,
      });

      // TODO: Select typeclass dynamically
      const handler = createProxyHandlerObject('lazy');
      maybeAddProxy(env, currentValue, handler);
    }

    const { proxy } = metadata.get(target[name]);

    onRead({
      target,
      name,
      nameToStore: getOPath(metadata, target[name]),
      currentModule: metadata.get(currentModule).name,
      typeClass,
    });

    // As implied, the proxy might not have been created.
    return proxy || currentValue;
  };
}


function createProxySetHandler(env, typeClass) {
  return function set(target, name, value) {
    const {
      metadata,
      config: {
        hooks: {
          onWrite,
        },
      },
    } = env;

    const { parent, module } = metadata.get(target);
    const { name: parentName } = metadata.get(parent);

    if (name) {
      onWrite({
        target,
        name,
        value,
        currentModule,
        parentName,
        nameToStore,
      });

      if (parentName === 'global' || typeof value === 'number') {
        const {declaredNames = []} = metadata.get(global);
        metadata.set(global, {
          declaredNames: declaredNames.concat([nameToStore])
        });
      }
    }

    return Reflect.set(...arguments);
  };
}


function createProxyHasHandler(env, typeClass) {
  return function has(target, prop) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onHas,
        },
      },
    } = env;

    const { name: currentName } = metadata.get(currentModule);
    const { parent } = metadata.get(target);
    const result = Reflect.has(...arguments);
    const nameToStore = getOPath(metadata, parent) + '.' + prop.toString();

    if (parentObject === global && !result) {
      onHas({
        target,
        prop,
        currentName,
        nameToStore,
      });
    }

    return result;
  };
}


function createProxyConstructHandler(env, typeClass) {
  return function construct(target, args) {
    const {
      currentModule,
      config: {
        hooks: {
          onConstruct,
        },
      },
    } = env;

    if (target !== Proxy) {
      onConstruct({
        target,
        args,
        currentName: metadata.get(currentModule).name,
        nameToStore: target.name,
      });
    }

    // eslint-disable-next-line new-cap
    return new target(...args);
  };
}


function createProxyApplyHandler(env, typeClass) {
  return function apply(target, thisArg, argumentsList) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onCallPre,
          onCallPost,
        },
      },
    } = env;

    const nameToStore = getOPath(metadata, target);

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore,
      currentModule: metadata.get(currentModule).name,
      declareModule: getOPath(metadata, getDeclaringModule(metadata, target)),
      typeClass,
    };

    const newTarget = onCallPre(info);

    if (newTarget) {
      info.target = target = newTarget;
    }

    // In case the target is not a pure function Reflect doesnt work
    // for example: in native modules
    info.result = withCatch(() => target(...argumentsList),
        () => Reflect.apply(...arguments));

    onCallPost(info);

    return info.result;
  };
}

test(() => {
  let preCalled, postCalled;
  const junkThis = {};

  function proxyTarget(a, b, c) {
    return a * b * c;
  }

  const onCallPre = ({
    target,
    thisArg,
    argumentsList,
    name,
    nameToStore,
    currentModule,
    declareModule,
    typeClass,
  }) => {
    preCalled = true;
    assert(target === proxyTarget,
           'Apply the right function');
    assert(thisArg === junkThis,
           'Capture the right value of `this`');
    assertDeepEqual(Array.from(argumentsList), [6, 7, 8],
                    'Capture the right arguments');
    assert(name === 'proxyTarget',
           'Capture the function name')
    assert(nameToStore === 'M.alias',
           'Capture the analysis-specific alias of the function');
    assert(currentModule === 'bar',
           'Capture the module ID');
    assert(declareModule === 'M',
           'Capture the declaring module');
    assert(typeClass === 'T',
           'Forward typeClass');
  }

  const onCallPost = ({
    result,
  }) => {
    postCalled = true;

    assert(result === (6 * 7 * 8),
           'Report the functions result');
  }

  const metadata = createReferenceMetadataStore();

  metadata.set(module, {
    name: 'M',
  });

  metadata.set(proxyTarget, {
    parent: module,
    name: 'alias',
  });

  const env = {
    currentModule: module,
    metadata,
    config: {
      hooks: {
        onCallPre,
        onCallPost,
      },
    },
  };

  const apply = createProxyApplyHandler(env, 'T');
  const proxy = new Proxy(proxyTarget, { apply });
  const returned = proxy.apply(junkThis, [6, 7, 8]);

  assert(preCalled && postCalled,
        'Call onCallPre and onCallPost hooks');

  assert(returned === (6 * 7 * 8),
         'Forward the functions result');
});
