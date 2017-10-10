// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var BuildTree = require('./build_tree.js');

var emptyBuildFunction = function(done) {
  done();
}

var emptyTree = {};

describe ('BuildTree', function () {
  describe ('DependencyFirst build', function() {
    it ('Doesn\'t crash with empty tree', function(done) {
      BuildTree(EmptyTree, true, emptyBuildFunction, done);
    });
  });
});
