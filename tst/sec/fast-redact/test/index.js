'use strict'

const { test } = require('tap')
const fastRedact = require('..')

const censor = '[REDACTED]'

test('returns no-op when passed no paths [serialize: false]', ({end, doesNotThrow}) => {
  const redact = fastRedact({paths: [], serialize: false})
  doesNotThrow(() => redact({}))
  doesNotThrow(() => {
    const o = redact({})
    redact.restore(o)
  })
  end()
})

test('returns serializer when passed no paths [serialize: default]', ({end, is}) => {
  is(fastRedact({paths: []}), JSON.stringify)
  is(fastRedact(), JSON.stringify)
  end()
})

test('throws when passed non-object', ({end, throws}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  throws(() => redact(1))
  end()
})

test('throws if a path is not a string', ({end, is, throws}) => {
  const err = (s) => `fast-redact – Invalid path (${s})`
  throws((e) => {
    fastRedact({paths: [1]})
  })
  throws((e) => {
    fastRedact({paths: [null]})
  })
  throws((e) => {
    fastRedact({paths: [undefined]})
  })
  throws((e) => {
    fastRedact({paths: [{}]})
  })
  end()
})

test('throws when passed illegal paths', ({end, is, throws}) => {
  const err = (s) => Error(`fast-redact – Invalid path (${s})`)
  throws((e) => {
    fastRedact({paths: ['@']})
  }, err('@'))
  throws((e) => {
    fastRedact({paths: ['0']})
  }, err('0'))
  throws((e) => {
    fastRedact({paths: ['〇']})
  }, err('〇'))
  throws((e) => {
    fastRedact({paths: ['a.1.c']})
  }, err('a.1.c'))
  throws((e) => {
    fastRedact({paths: ['a..c']})
  }, err('a..c'))
  throws((e) => {
    fastRedact({paths: ['1..c']})
  }, err('1..c'))
  throws((e) => {
    fastRedact({paths: ['a = b']})
  }, err('a = b'))
  throws((e) => {
    fastRedact({paths: ['a(b)']})
  }, err('a(b)'))
  throws((e) => {
    fastRedact({paths: ['//a.b.c']})
  }, err('//a.b.c'))
  throws((e) => {
    fastRedact({paths: ['\\a.b.c']})
  }, err('\\a.b.c'))
  throws((e) => {
    fastRedact({paths: ['a.#.c']})
  }, err('a.#.c'))
  throws((e) => {
    fastRedact({paths: ['~~a.b.c']})
  }, err('~~a.b.c'))
  throws((e) => {
    fastRedact({paths: ['^a.b.c']})
  }, err('^a.b.c'))
  throws((e) => {
    fastRedact({paths: ['a + b']})
  }, err('a + b'))
  throws((e) => {
    fastRedact({paths: ['return a + b']})
  }, err('return a + b'))
  throws((e) => {
    fastRedact({paths: ['a / b']})
  }, err('a / b'))
  throws((e) => {
    fastRedact({paths: ['a * b']})
  }, err('a * b'))
  throws((e) => {
    fastRedact({paths: ['a - b']})
  }, err('a - b'))
  throws((e) => {
    fastRedact({paths: ['a ** b']})
  }, err('a ** b'))
  throws((e) => {
    fastRedact({paths: ['a % b']})
  }, err('a % b'))
  throws((e) => {
    fastRedact({paths: ['a.b*.c']})
  }, err('a.b*.c'))
  end()
})

test('throws if more than one wildcard in a path', ({end, throws}) => {
  throws(() => {
    fastRedact({paths: ['a.*.x.*'], serialize: false})
  }, Error('Only one wildcard per path is supported'))
  end()
})

test('masks according to supplied censor', ({end, is}) => {
  const censor = 'test'
  const redact = fastRedact({paths: ['a'], censor, serialize: false})
  is(redact({a: 'a'}).a, censor)
  end()
})

test('redact.restore function is available when serialize is false', ({end, is}) => {
  const censor = 'test'
  const redact = fastRedact({paths: ['a'], censor, serialize: false})
  is(typeof redact.restore, 'function')
  end()
})

test('redact.restore function places original values back in place', ({end, is}) => {
  const censor = 'test'
  const redact = fastRedact({paths: ['a'], censor, serialize: false})
  const o = {a: 'a'}
  redact(o)
  is(o.a, censor)
  redact.restore(o)
  is(o.a, 'a')
  end()
})

test('serializes with JSON.stringify by default', ({end, is}) => {
  const redact = fastRedact({paths: ['a']})
  const o = {a: 'a'}
  is(redact(o), `{"a":"${censor}"}`)
  is(o.a, 'a')
  end()
})

test('serializes with custom serializer if supplied', ({end, is}) => {
  const redact = fastRedact({paths: ['a'], serialize: (o) => JSON.stringify(o, 0, 2)})
  const o = {a: 'a'}
  is(redact(o), `{\n  "a": "${censor}"\n}`)
  is(o.a, 'a')
  end()
})

test('redacts nested keys', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  end()
})

test('supports paths with array indexes', ({end, same}) => {
  const redact = fastRedact({paths: ['insideArray.like[3].this'], serialize: false})
  same(redact({insideArray: {like: ['a', 'b', 'c', {this: {foo: 'meow'}}]}}), {insideArray: {like: ['a', 'b', 'c', {this: censor}]}})
  end()
})

test('censor may be any type, except function which will throw', ({end, same, throws}) => {
  const redactToString = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: 'censor', serialize: false})
  const redactToUndefined = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: undefined, serialize: false})
  const sym = Symbol()
  const redactToSymbol = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: sym, serialize: false})
  const redactToNumber = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: 0, serialize: false})
  const redactToBoolean = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: false, serialize: false})
  const redactToNull = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: null, serialize: false})
  const redactToObject = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: {redacted: true}, serialize: false})
  const redactToArray = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: ['redacted'], serialize: false})
  const redactToBuffer = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: Buffer.from('redacted'), serialize: false})
  const redactToError = fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: Error('redacted'), serialize: false})
  same(redactToString({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: 'censor', d: {x: 'censor', y: 'censor'}}}})
  same(redactToUndefined({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: undefined, d: {x: undefined, y: undefined}}}})
  same(redactToSymbol({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: sym, d: {x: sym, y: sym}}}})
  same(redactToNumber({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: 0, d: {x: 0, y: 0}}}})
  same(redactToBoolean({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: false, d: {x: false, y: false}}}})
  same(redactToNull({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: null, d: {x: null, y: null}}}})
  same(redactToObject({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: {redacted: true}, d: {x: {redacted: true}, y: {redacted: true}}}}})
  same(redactToArray({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: ['redacted'], d: {x: ['redacted'], y: ['redacted']}}}})
  same(redactToBuffer({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: Buffer.from('redacted'), d: {x: Buffer.from('redacted'), y: Buffer.from('redacted')}}}})
  same(redactToError({a: {b: {c: 's', d: {x: 's', y: 's'}}}}), {a: {b: {c: Error('redacted'), d: {x: Error('redacted'), y: Error('redacted')}}}})
  throws(() => fastRedact({paths: ['a.b.c', 'a.b.d.*'], censor: () => {}, serialize: false})) 
  end()
})

test('supports multiple paths from the same root', ({end, same}) => {
  const redact = fastRedact({paths: ['deep.bar.shoe', 'deep.baz.shoe', 'deep.foo', 'deep.not.there.sooo', 'deep.fum.shoe'], serialize: false})
  same(redact({deep: {bar: 'hmm', baz: {shoe: {k: 1}}, foo: {}, fum: {shoe: 'moo'}}}), {deep: {bar: 'hmm', baz: {shoe: censor}, foo: censor, fum: {shoe: censor}}})
  end()
})

test('supports strings in bracket notation paths (single quote)', ({end, is}) => {
  const redact = fastRedact({paths: [`a['@#!='].c`], serialize: false})
  const result  = redact({a: {'@#!=': {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a['@#!='].c, censor)
  end()
})

test('supports strings in bracket notation paths (double quote)', ({end, is}) => {
  const redact = fastRedact({paths: [`a["@#!="].c`], serialize: false})
  const result  = redact({a: {'@#!=': {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a['@#!='].c, censor)
  end()
})

test('supports strings in bracket notation paths (backtick quote)', ({end, is}) => {
  const redact = fastRedact({paths: ['a[`@#!=`].c'], serialize: false})
  const result  = redact({a: {'@#!=': {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a['@#!='].c, censor)
  end()
})

test('allows * within a bracket notation string', ({end, is}) => {
  const redact = fastRedact({paths: ['a["*"].c'], serialize: false})
  const result  = redact({a: {'*': {c: 's', x: 1}}})
  is(result.a['*'].c, censor)
  is(result.a['*'].x, 1)
  end()
})

test('redacts nested keys – restore', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  redact.restore(result)
  is(result.a.b.c, 's')
  end()
})

test('handles null proto objects', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  const result  = redact({__proto__: null, a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  end()
})

test('handles null proto objects – restore', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  const result  = redact({__proto__: null, a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  redact.restore(result, 's')
  is(result.a.b.c, 's')
  end()
})

test('handles paths that do not match object structure', ({end, same}) => {
  const redact = fastRedact({paths: ['x.y.z'], serialize: false})
  same(redact({a: {b: {c: 's'}}}), {a: {b: {c: 's'}}})
  end()
})

test('ignores missing paths in object', ({end, same}) => {
  const redact = fastRedact({paths: ['a.b.c', 'a.z', 'a.b.z'], serialize: false})
  same(redact({a: {b: {c: 's'}}}), {a: {b: {c: censor}}})
  end()
})

test('gracefully handles primitives that match intermediate keys in paths', ({end, same}) => {
  const redact = fastRedact({paths: ['a.b.c', 'a.b.c.d'], serialize: false})
  same(redact({a: {b: null}}), {a: {b: null}})
  same(redact({a: {b: 's'}}), {a: {b: 's'}})
  same(redact({a: {b: 1}}), {a: {b: 1}})
  same(redact({a: {b: undefined}}), {a: {b: undefined}})
  same(redact({a: {b: true}}), {a: {b: true}})
  const sym = Symbol()
  same(redact({a: {b: sym}}), {a: {b: sym}})
  end()
})

test('handles circulars', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.baz'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar}
  bar.baz = bar
  o.bar.baz = o.bar
  same(redact(o), {a: 1, bar: {b: 2, baz: censor}})
  end()
})

test('handles circulars – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.baz'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar}
  bar.baz = bar
  o.bar.baz = o.bar
  is(o.bar.baz, bar)
  redact(o)
  is(o.bar.baz, censor)
  redact.restore(o)
  is(o.bar.baz, bar)
  end()
})

test('handles circulars and cross references – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.baz', 'cf.bar'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar, cf: {bar}}
  bar.baz = bar
  o.bar.baz = o.bar
  is(o.bar.baz, bar)
  is(o.cf.bar, bar)
  redact(o)
  is(o.bar.baz, censor)
  is(o.cf.bar, censor)
  redact.restore(o)
  is(o.bar.baz, bar)
  is(o.cf.bar, bar)
  end()
})

test('ultimate wildcards – shallow', ({end, same}) => {
  const redact = fastRedact({paths: ['test.*'], serialize: false})
  same(redact({test: {baz: 1, bar: 'private'}}), {test: {baz: censor, bar: censor}})
  end()
})

test('ultimate wildcards – deep', ({end, same}) => {
  const redact = fastRedact({paths: ['deep.bar.baz.ding.*'], serialize: false})
  same(redact({deep: {a: 1, bar: {b: 2, baz: {c: 3, ding: {d: 4, e: 5, f: 'six'}}}}}), {deep: {a: 1, bar: {b: 2, baz: {c: 3, ding: {d: censor, e: censor, f: censor}}}}})
  end()
})

test('ultimate wildcards - array – shallow', ({end, same}) => {
  const redact = fastRedact({paths: ['array[*]'], serialize: false})
  same(redact({array: ['a', 'b', 'c', 'd']}), {array: [censor, censor, censor, censor]})
  end()
})

test('ultimate wildcards – array – deep', ({end, same}) => {
  const redact = fastRedact({paths: ['deepArray.down.here[*]'], serialize: false})
  same(redact({deepArray: {down: {here: ['a', 'b', 'c']}}}), {deepArray: {down: {here: [censor, censor, censor]}}})
  end()
})

test('ultimate wildcards – array – single index', ({end, same}) => {
  const redact = fastRedact({paths: ['insideArray.like[3].this.*'], serialize: false})
  same(redact({insideArray: {like: ['a', 'b', 'c', {this: {foo: 'meow'}}]}}), {insideArray: {like: ['a', 'b', 'c', {this: {foo: censor}}]}})
  end()
})

test('ultimate wildcards - handles null proto objects', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c'], serialize: false})
  const result  = redact({__proto__: null, a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  end()
})

test('ultimate wildcards - handles paths that do not match object structure', ({end, same}) => {
  const redact = fastRedact({paths: ['x.y.z'], serialize: false})
  same(redact({a: {b: {c: 's'}}}), {a: {b: {c: 's'}}})
  end()
})

test('ultimate wildcards - gracefully handles primitives that match intermediate keys in paths', ({end, same}) => {
  const redact = fastRedact({paths: ['a.b.c', 'a.b.c.d'], serialize: false})
  same(redact({a: {b: null}}), {a: {b: null}})
  same(redact({a: {b: 's'}}), {a: {b: 's'}})
  same(redact({a: {b: 1}}), {a: {b: 1}})
  same(redact({a: {b: undefined}}), {a: {b: undefined}})
  same(redact({a: {b: true}}), {a: {b: true}})
  const sym = Symbol()
  same(redact({a: {b: sym}}), {a: {b: sym}})
  end()
})

test('ultimate wildcards – handles circulars', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.*'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar}
  bar.baz = bar
  o.bar.baz = o.bar
  same(redact(o), {a: 1, bar: {b: censor, baz: censor}})
  end()
})

test('ultimate wildcards – handles circulars – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.*'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar}
  bar.baz = bar
  o.bar.baz = o.bar
  is(o.bar.baz, bar)
  redact(o)
  is(o.bar.baz, censor)
  redact.restore(o)
  is(o.bar.baz, bar)
  end()
})

test('ultimate wildcards – handles circulars and cross references – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['bar.baz.*', 'cf.*'], serialize: false})
  const bar = {b: 2}
  const o = {a: 1, bar, cf: {bar}}
  bar.baz = bar
  o.bar.baz = o.bar
  is(o.bar.baz, bar)
  is(o.cf.bar, bar)
  redact(o)
  is(o.bar.baz, censor)
  is(o.cf.bar, censor)
  redact.restore(o)
  is(o.bar.baz, bar)
  is(o.cf.bar, bar)
  end()
})

test('static + wildcards', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c', 'a.d.*', 'a.b.z.*'], serialize: false})
  const result  = redact({a: {b: {c: 's', z: {x: 's', y: 's'}}, d: {a: 's', b: 's', c: 's'}}})

  is(result.a.b.c, censor)
  is(result.a.d.a, censor)
  is(result.a.d.b, censor)
  is(result.a.d.c, censor)
  is(result.a.b.z.x, censor)
  is(result.a.b.z.y, censor)
  end()
})

test('static + wildcards reuse', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b.c', 'a.d.*'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})

  is(result.a.b.c, censor)
  is(result.a.d.a, censor)
  is(result.a.d.b, censor)
  is(result.a.d.c, censor)

  redact.restore(result)

  const result2  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result2.a.b.c, censor)
  is(result2.a.d.a, censor)
  is(result2.a.d.b, censor)
  is(result2.a.d.c, censor)

  redact.restore(result2)
  end()
})

test('nested wildcard – one level after', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.c'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  is(result.a.d.a, 's')
  is(result.a.d.b, 's')
  is(result.a.d.c, censor)
  end()
})

test('restore nested wildcard  – one level after', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.c'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  redact.restore(result)
  is(result.a.b.c, 's')
  is(result.a.d.a, 's')
  is(result.a.d.b, 's')
  is(result.a.d.c, 's')
  end()
})

test('nested wildcard – one level after – reuse', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.c'], serialize: false})
  const result  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  is(result.a.d.a, 's')
  is(result.a.d.b, 's')
  is(result.a.d.c, censor)
  const result2  = redact({a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result2.a.b.c, censor)
  is(result2.a.d.a, 's')
  is(result2.a.d.b, 's')
  is(result2.a.d.c, censor)
  redact.restore(result2)
  end()
})

test('nested wildcard – two levels after', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.x.c'], serialize: false})
  const result  = redact({a: {b: {x: {c: 's'}}, d: {x: {a: 's', b: 's', c: 's'}}}})
  is(result.a.b.x.c, censor)
  is(result.a.d.x.a, 's')
  is(result.a.d.x.b, 's')
  is(result.a.d.x.c, censor)
  end()
})

test('nested wildcard  – two levels after – reuse', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.x.c'], serialize: false})
  const result  = redact({a: {b: {x: {c: 's'}}, d: {x: {a: 's', b: 's', c: 's'}}}})
  is(result.a.b.x.c, censor)
  is(result.a.d.x.a, 's')
  is(result.a.d.x.b, 's')
  is(result.a.d.x.c, censor)
  redact.restore(result)
  const result2  = redact({a: {b: {x: {c: 's'}}, d: {x: {a: 's', b: 's', c: 's'}}}})
  is(result2.a.b.x.c, censor)
  is(result2.a.d.x.a, 's')
  is(result2.a.d.x.b, 's')
  is(result2.a.d.x.c, censor)
  end()
})

test('restore nested wildcard  – two levels after', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.x.c'], serialize: false})
  const result  = redact({a: {b: {x: {c: 's'}}, d: {x: {a: 's', b: 's', c: 's'}}}})
  redact.restore(result)
  is(result.a.b.x.c, 's')
  is(result.a.d.x.a, 's')
  is(result.a.d.x.b, 's')
  is(result.a.d.x.c, 's')
  end()
})

test('nested wildcard - array', ({end, is}) => {
  const redact = fastRedact({paths: ['a.b[*].x'], serialize: false})
  const result  = redact({a: {b: [{x:1}, {a: 2}], d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b[0].x, censor)
  is(result.a.b[1].a, 2)
  is(result.a.d.a, 's')
  is(result.a.d.b, 's')
  end()
})

test('nested wildcards – array – single index', ({end, same}) => {
  const redact = fastRedact({paths: ['insideArray.like[3].*.foo'], serialize: false})
  same(redact({insideArray: {like: ['a', 'b', 'c', {this: {foo: 'meow'}}]}}), {insideArray: {like: ['a', 'b', 'c', {this: {foo: censor}}]}})
  end()
})

test('nested wildcards - handles null proto objects', ({end, is}) => {
  const redact = fastRedact({paths: ['a.*.c'], serialize: false})
  const result  = redact({__proto__: null, a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}})
  is(result.a.b.c, censor)
  end()
})

test('nested wildcards - handles paths that do not match object structure', ({end, same}) => {
  const redact = fastRedact({paths: ['a.*.y.z'], serialize: false})
  same(redact({a: {b: {c: 's'}}}), {a: {b: {c: 's'}}})
  end()
})

test('nested wildcards - gracefully handles primitives that match intermediate keys in paths', ({end, same}) => {
  const redact = fastRedact({paths: ['a.*.c'], serialize: false})
  same(redact({a: {b: null}}), {a: {b: null}})
  same(redact({a: {b: 's'}}), {a: {b: 's'}})
  same(redact({a: {b: 1}}), {a: {b: 1}})
  same(redact({a: {b: undefined}}), {a: {b: undefined}})
  same(redact({a: {b: true}}), {a: {b: true}})
  const sym = Symbol()
  same(redact({a: {b: sym}}), {a: {b: sym}})
  end()
})

test('nested wildcards – handles circulars', ({end, is, same}) => {
  const redact = fastRedact({paths: ['x.*.baz'], serialize: false})
  const bar = {b: 2}
  const o = {x: {a: 1, bar}}
  bar.baz = bar
  o.x.bar.baz = o.x.bar
  same(redact(o), {x: {a: 1, bar: {b: 2, baz: censor}}})
  end()
})

test('nested wildcards – handles circulars – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['x.*.baz'], serialize: false})
  const bar = {b: 2}
  const o = {x: {a: 1, bar}}
  bar.baz = bar
  o.x.bar.baz = o.x.bar
  is(o.x.bar.baz, bar)
  redact(o)
  is(o.x.a, 1)
  is(o.x.bar.baz, censor)
  redact.restore(o)
  is(o.x.bar.baz, bar)
  end()
})

test('nested wildcards – handles circulars and cross references – restore', ({end, is, same}) => {
  const redact = fastRedact({paths: ['x.*.baz', 'x.*.cf.bar'], serialize: false})
  const bar = {b: 2}
  const o = {x: {a: 1, bar, y: {cf: {bar}}}}
  bar.baz = bar
  o.x.bar.baz = o.x.bar
  is(o.x.bar.baz, bar)
  is(o.x.y.cf.bar, bar)
  redact(o)
  is(o.x.bar.baz, censor)
  is(o.x.y.cf.bar, censor)
  redact.restore(o)
  is(o.x.bar.baz, bar)
  is(o.x.y.cf.bar, bar)
  end()
})

test('nested wildcards – handles missing paths', ({end, is, same}) => {
  const redact = fastRedact({paths: ['z.*.baz']})
  const bar = {b: 2}
  const o = {a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}}
  is(redact(o), JSON.stringify(o))
  end()
})

test('ultimate wildcards – handles missing paths', ({end, is, same}) => {
  const redact = fastRedact({paths: ['z.*']})
  const bar = {b: 2}
  const o = {a: {b: {c: 's'}, d: {a: 's', b: 's', c: 's'}}}
  is(redact(o), JSON.stringify(o))
  end()
})