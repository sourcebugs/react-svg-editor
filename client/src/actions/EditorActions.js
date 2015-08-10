'use strict';

var Reflux = require('reflux');

var EditorActions = Reflux.createActions([
  'switchToSelectObjectEditMode',
  'switchToAddRectEditMode',
  'startAddRect',
  'continueAddRect',
  'finishAddRect',
  'switchToAddTextEditMode',
  'addNewTextToPosition'
]);
module.exports = EditorActions;
