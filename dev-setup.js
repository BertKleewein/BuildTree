// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
var project = require('../azure-iot-project.json');
var BuildTree = require('./build_tree.js');
var npm = require('npm');

// var node_root = process.env.node_root;
var node_root='f:/repos/node';
      /*
      var foo = npm.commands.link([dependency.name], function(err, data) {
        if (err) {
          console.dir(err);
          dependencyDone(err);
        } else {
          console.dir(data);
          dependencyDone(null, data);
        }
      });
      */

npm.load(function(err, npm) {
  if (err) throw err;
  BuildTree(project, true, function(library, libraryDone) {
    console.log('building ' + library.name);
    npm.prefix = node_root + '/' + library.path;
    library.forEachDependency(function(dependency, dependencyDone) {
      console.log('linking ' + dependency.name);
      dependencyDone();
    }, function(err) {
      console.log();
      libraryDone(err);
    });
  });
});



