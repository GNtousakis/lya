#!/bin/bash

GT="static" # ground truth can be: static, dynamic, correct

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confused
  t="$(echo $1 | sed 's;/;:;')"
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  cat ../prologue-check.lya ../epilogue.lya | sed "s/GROUND_TRUTH/$GT/" > generated.test
  # Replace node with cat to see the generated script
  node generated.test 2>&1 > /dev/null | sed "s;^;$t  ;"
  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis $1
  cd ..
else
  for d in t*/; do
    cd $d;
    analysis $d
    cd ..
  done
fi

