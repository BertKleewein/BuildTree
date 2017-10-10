// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
var async = require('async');
const debug = require('debug')('build_tree')

var BuildTree = function (tree, dependencyFirst, builderFunction, treeDone) {

  /**
   * helper function to iterate over all libraries
   */
  var forEachLibrary = function(callback, allDone) {
    async.eachSeries(Object.keys(tree.libraries), function(libraryName, libraryDone) {
      callback(tree.libraries[libraryName], libraryDone);
    }, allDone);
  };

  var recursivelyBuildIfNecessary = function(library, done) {
    debug('build? ' + library.name + '=' + library.needToBuild);
    if (library.needToBuild) {
      if (dependencyFirst) {
        debug('building dependencies first for ' + library.name);
        library.buildAllDependencies(function(err) {
          if (err) {
            done(err);
          } else {
            debug('building ' + library.name);
            builderFunction(library, done);
          }
        });
      } else {
        debug('building consumers first for '+library.name);
        if (!library.beingConsumed) {
          debug(' library ' + library.name = ' not being consumed.  building');
          builderFunction(library, function(err) {
            if (err) {
              done(err);
            } else {
              debug('enumerating dependencies of ' + library.name + ' to look for consumerless libs');
              library.forEachDependency(function (dependency, done) {
                dependency.removeConsumer(library.name);
                recursivelyBuildIfNecessary(dependency, done);
              });
            }
          });
        }
      }
    }
  };

  // use a sync iterator to set library.name.
  Object.keys(tree.libraries).forEach(function(libraryName) {
    var library = tree.libraries[libraryName];
    library.name = libraryName;
    library.consumed = false;
    library.consumers = [];
    library.needToBuild = true;
  });

  // use a sync iterator to mark which libraries are depended upon
  Object.keys(tree.libraries).forEach(function(libraryName) {
    var library = tree.libraries[libraryName];

    library.dependencies.forEach(function(dependencyName) {
      if (!(dependencyName in tree.libraries)) {
        throw new Error('Error: Library ' + libraryName + ' has a dependency on ' + dependencyName + ' but ' + dependencyName + ' is not defined as a library');
      }
      tree.libraries[dependencyName].consumed = true;
      tree.libraries[dependencyName].consumers.push(library);
    });

    // Add a function to each library that can call a per-depency callback
    library.forEachDependency = function(perDependencyCallback, done) {
      if (library.dependencies && (library.dependencies.length > 0))
      {
        async.eachSeries(library.dependencies, function(dependencyName, done ) {
          perDependencyCallback(tree.libraries[dependencyName], done);
        }, done);
      } else {
        done();
      }
    };

    // Add a function to each library to (recursively) build all it's dependencies
    library.buildAllDependencies = function(done) {
      library.forEachDependency(recursivelyBuildIfNecessary, function(err) {
        if (err) {
          done(err);
        } else {
          library.needToBuild = false;
        }
      });
    };

    library.removeConsumer = function(consumer) {
      var i = library.consumers.indexOf(consumer);
      if(i !== -1) {
        library.consumers.splice(i, 1);
      }
      if (library.consumers.length === 0) {
        library.consumed = false;
      }
    };

  });

  // build all libraries that don't have anyone consuming them.
  // Recursion will take care of the rest.
  forEachLibrary(function(library, libraryDone) {
    if (!library.consumed) {
      recursivelyBuildIfNecessary(library, libraryDone);
    } else {
      libraryDone();
    }
  }, treeDone);

};

module.exports = BuildTree;
