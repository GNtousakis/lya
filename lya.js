#!/usr/bin/env node

const lya = require('./src/core.js');

const fs = require('fs');
const path = require('path');
const arg = require('arg');
const pkg = require('./package.json');
const { makePresetName, preset, inTermsOf, configureLya } = require('./src/config.js');

/* eslint-disable max-len */
const h = `Analyze JavaScript programs dynamically, to extract information or enforce invariants.

lya <fl> [hpVvvv] [a=<a.js>] [d=<n>] [{module, context, prop}-{include, exclude}=<m | c | p>]

  <fl>                        File to start analysis from (i.e., program entry point).

  -h,   --help:               Output (this) help
  -V    --version:            Output version information
  -v, vv, vvv, --verbosity:   Add (multiple) verbosity levels

  -d,   --depth <n>:          Object depth to analyze (default 3)
  -a,   --analysis <a.js>:    The program analysis to execute (see below)
  -f,   --file <b.json>:      File/path to save results; defaults to 'lya.json'
  -r,   --rules <b.json>:     File/path to enforcement file
  -p,   --print [<out, err>]: Stream to output results (defaults to file)
  -o,   --only-prologue:      Print only the config prologue
  -w,   --with:               Disable 'with' functionality

  --module-exclude <m>:       Comma-separated list of module IDs (absolute fs paths) to be excluded from the analysis
  --module-include <m>:       Comma-separated list of module IDs (absolute fs paths) to be included (assumes module-exclude='*')
  --context-exclude <c>:      Comma-separated context starting points to exclude from tracking (for contexts, see below)
  --context-include <c>:      Comma-separated context starting points to include in tracking  (assumes context-exclude='*')
  --prop-exclude <p>:         Comma-separated property names to exclude from analysis (e.g., 'Promise,toString,escape,setImmediate')
  --prop-include <p>:         Comma-separated property names to include in the  analysis (assumes prop-exclude='*')

  Contexts <c> are coarse groups of  program elements that are tracked, and fall
  under these categories (can be included in their long or short form):

  * module-locals, m:         Module-local names such as 'require'
  * node-globals, n:          All Node.js-related globals, such as 'console' and 'process'
  * es-globals, e:            All EcmaScript 6 globals names such Math.sin or
  * user-globals, g:          User-defined globals accessed with a 'global' prefix, e.g., 'global.y = 3'

  Analyses can be one of the build-in options below, or any absolute file-system path pointing to a user-defined analysis.
  Each analysis reads/writes invariants from/to a file, whose path defaults to "./lya.json" but can be overwritten via  '-f <f>'.

  Simple
  * imports:                  Extract dynamic dependency graph
  * global-only:              Extract accesses to global-only variables
  * sample                    No-op analysis used as a starting point
  * term-index:               Calculate TF-IDF metrics on source code
  * uncomment:                Uncomment code

  Access
  * on-off:                   Extracts an allow-deny access policy
  * on-off-enforce:           Enforces an allow-deny access policy

  Performance
  * call-time:                Extract call times for all functions called
  * call-freq:                Extract call frequencies for all functions and fields part of the analysis target

  Partial Specification
  * io                        Extract a base type signature every module field
  * io-effects                Extract a module type signature that includes effects

`;
// TODO: get analyses programmatically

/* eslint-enable max-len */

const help = () => {
  console.log(h);
};

const splitCsv = (a) => a.split(',').map((s) => s.trim());
const splitCsvPaths = (a) => splitCsv(a).map((s) => path.resolve(__dirname, s));

// const { fstat } = require('fs');
const template = {
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--verbosity': arg.COUNT,

  '--depth': Number,
  '--analysis': String,
  '--print': Boolean,
  '--file': String,
  '--rules': String,
  '--only-prologue': Boolean,
  '--enable-with': Boolean,

  '--module-exclude': String,
  '--module-include': String,
  '--context-exclude': String,
  '--context-include': String,
  '--prop-exclude': String,
  '--prop-include': String,

  // Aliases
  '-h': '--help',
  '-V': '--version',
  '-v': '--verbosity',

  '-d': '--depth',
  '-a': '--analysis',
  '-p': '--print',
  '-f': '--file',
  '-r': '--rules',
  '-o': '--only-prologue',
  '-w': '--with',
};


function main(conf) {
  const env = require(conf.analysis)(lya, conf);

  // Force options from CLI where applicable.
  env.config = inTermsOf(env.config)(conf);

  lya.callWithLya(env, () => require(conf.inputFile));
}

function collectArguments() {
  const conf = {
    context: {
      include: [],
      exclude: [],
    },
    modules: {
      include: [],
      exclude: [],
    },
    fields: {
      include: [],
      exclude: [],
    },
  };

  let args;
  try {
    args = arg(template);
  } catch (e) {
    console.log(e.message);
    process.exit();
  }

  if (args['--help']) {
    help();
    process.exit();
  }

  if (args['--version']) {
    console.log('v' + pkg.version); // + " (commit: 8799cd1)");
    process.exit();
  }

  if (args['--depth']) {
    conf.depth = args['--depth'];
  }

  if (args['--verbosity']) {
    conf.verbosity = args['--verbosity'];
  }

  if (args['--analysis']) {
    let p = makePresetName(args['--analysis']);
    if (Object.keys(preset).includes(p)) {
      conf.analysis = preset[p];
    } else {
      if (args['--analysis'].startsWith('/')) {
        conf.analysis = path.resolve(args['--analysis']);
        // console.log(conf.analysis)
      } else {
        conf.analysis = path.join(process.cwd(), args['--analysis']);
        // console.log(conf.analysis)
      }
    }
  }

  if (args['--print']) {
    conf.print = args['--print'];
  }

  if (args['--file']) {
    conf.saveResults = path.resolve(process.cwd(), args['--file']);
    // TODO this should be the same if loading results
  }

  if (args['--rules']) {
    conf.rules = path.resolve(process.cwd(), args['--rules']);
    // TODO this should be the same if loading results
  }

  if (args['--with']) {
    conf.enableWith = false;
  }

  if (args['--module-include']) {
    conf.modules.include = splitCsvPaths(args['--module-include']);
  }

  if (args['--module-exclude']) {
    conf.modules.exclude = splitCsvPaths(args['--module-exclude']);
  }

  if (args['--context-include']) {
    conf.context.include = splitCsv(args['--context-include']);
  }

  if (args['--context-exclude']) {
    conf.context.exclude = splitCsv(args['--context-exclude']);
  }

  if (args['--prop-exclude']) {
    conf.fields.exclude = splitCsv(args['--prop-exclude']);
  }

  if (args['--prop-include']) {
    conf.fields.include = splitCsv(args['--prop-include']);
  }

  let filePath;
  switch (args['_'].length) {
  case 0:
    console.log('You must specify a file name');
    process.exit(-1);
  case 1:
    filePath = path.resolve(process.cwd(), args['_'][0]);
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist');
      process.exit(-1);
    }
    break;
  default:
    console.log('Too many ``extra\'\' parameters: ' + args['_'].join(', '));
    process.exit(-1);
  }

  // print prologue
  if (args['--only-prologue']) {
    console.log(conf)
    process.exit(0);
  }

  conf.inputFile = filePath;

  return conf;
}


if (require.main === module) {
  main(collectArguments());
} else {
  return lya;
}
