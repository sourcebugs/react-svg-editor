'use strict';

var Reflux = require('reflux');

var ImageModel = require('./ImageModel');
var LayerActions = require('actions/LayerActions');
var ObjectActions = require('actions/ObjectActions');
var HistoryActions = require('actions/HistoryActions');
var EditorActions = require('actions/EditorActions');
var EditorStates = require('./EditorStates');
var Immutable = require('immutable');

var ImageStore = Reflux.createStore({
  /**
   * initial setup
   */
  init: function() {
      this.svgImage = ImageModel;
      HistoryActions.addToHistory(this.svgImage);

      // Register actions
      this.listenTo(LayerActions.changeLayerVisibility, this.onChangeLayerVisibility);
      this.listenTo(LayerActions.selectLayer, this.onSelectLayer);
      this.listenTo(LayerActions.preSelectLayer, this.onPreSelectLayer);
      this.listenTo(LayerActions.unPreSelectLayer, this.onUnPreSelectLayer);
      this.listenTo(LayerActions.deleteSelectedLayer, this.onDeleteSelectedLayer);
      this.listenTo(LayerActions.addNewLayer, this.onAddNewLayer);
      this.listenTo(LayerActions.moveUpSelectedLayer, this.onMoveUpSelectedLayer);
      this.listenTo(LayerActions.moveDownSelectedLayer, this.onMoveDownSelectedLayer);
      this.listenTo(LayerActions.createMaskFromSelectedLayer, this.onCreateMaskFromSelectedLayer);
      this.listenTo(LayerActions.applyMaskToLayer, this.onApplyMaskToLayer);
      this.listenTo(LayerActions.removeMaskFromSelectedLayer, this.removeMaskFromSelectedLayer);

      this.listenTo(ObjectActions.addNewObjectToLayer, this.addNewObjectToLayer);
      this.listenTo(ObjectActions.updateObjectAttributes, this.onUpdateObjectAttributes);
      this.listenTo(ObjectActions.moveObject, this.changePosition);
      this.listenTo(ObjectActions.scaleObject, this.changePosition);
      this.listenTo(ObjectActions.rotateObject, this.changePosition);
      this.listenTo(ObjectActions.selectObjectInSelectedLayer, this.selectObjectInSelectedLayer);
      this.listenTo(ObjectActions.removeSelectedObject, this.removeSelectedObject);


      this.listenTo(HistoryActions.setHistorySnapshotToSvgImage, this.setHistorySnapshotToSvgImage);

      // add rect
      this.listenTo(EditorActions.switchToAddRectEditMode, this.switchToAddRectEditMode);
      this.listenTo(EditorActions.startAddRect, this.startAddRect);
      this.listenTo(EditorActions.continueAddRect, this.continueAddRect);
      this.listenTo(EditorActions.finishAddRect, this.finishAddRect);

      // add text
      this.listenTo(EditorActions.switchToAddTextEditMode, this.switchToAddTextEditMode);
      this.listenTo(EditorActions.addNewTextToPosition, this.addNewTextToPosition);

      // select object
      this.listenTo(EditorActions.switchToSelectObjectEditMode, this.switchToSelectObjectEditMode);

      // add polygon
      this.listenTo(EditorActions.switchToAddPolygonEditMode, this.switchToAddPolygonEditMode);
      this.listenTo(EditorActions.startAddPolygon, this.startAddPolygon);
      this.listenTo(EditorActions.continueAddPolygon, this.continueAddPolygon);
      this.listenTo(EditorActions.changePositionForLastPolygonPoint, this.changePositionForLastPolygonPoint);
      this.listenTo(EditorActions.finishAddPolygon, this.finishAddPolygon);

      // edit polygon
      this.listenTo(EditorActions.switchToEditPolygonEditMode, this.switchToEditPolygonEditMode);
      this.listenTo(EditorActions.movePointPolygonEditMode, this.movePointPolygonEditMode);
      this.listenTo(EditorActions.finishEditPointPolygonEditMode, this.finishEditPointPolygonEditMode);

      // edit polygon curve point
      this.listenTo(EditorActions.switchToEditCurvePolygonEditMode, this.switchToEditCurvePolygonEditMode);
      this.listenTo(EditorActions.moveCurvePointPolygonEditMode, this.moveCurvePointPolygonEditMode);
      this.listenTo(EditorActions.finishEditCurvePointPolygonEditMode, this.finishEditCurvePointPolygonEditMode);

      // add polygon curve ( to selected polygon to selected point)
      this.listenTo(EditorActions.switchToAddCurvePolygonEditMode, this.switchToAddCurvePolygonEditMode);
      this.listenTo(EditorActions.addCurveToPolygon, this.addCurveToPolygon);

      this.listenTo(EditorActions.startSelectedObjectMove, this.startSelectedObjectMove);
      this.listenTo(EditorActions.continueSelectedObjectMove, this.continueSelectedObjectMove);
      this.listenTo(EditorActions.finishSelectedObjectMove, this.finishSelectedObjectMove);


  },

  /**
   * get svg image model
   */
  getImage: function() {
    return this.svgImage;
  },

  /**
   * set svg image model (form history snapshots)
   */
  setHistorySnapshotToSvgImage: function(svgImage) {
    this.svgImage = svgImage;

    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * get selected svg object
   */
  getSelectedObject: function() {
    return this.selectedSvgObject;
  },

  /**
   * get selected svg object
   */
  getObjectById: function(objectID) {
    return this.svgImage.get('svgObjects').find(function(svgObject) {
      return svgObject.get('id') === objectID;
    });
  },

  /**
   * change layer visible show/hide
   * @param  {string} layerID for manipulation
   */
  onChangeLayerVisibility: function(layerID) {
    // find layer and invert visible property
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    if (layer.get('visible')) {
      layer = layer.set('visible', false);
    } else {
      layer = layer.set('visible', true);
    }

    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    this.svgImage = this.clearSelectedObject(this.svgImage);

    HistoryActions.addToHistory(this.svgImage);
    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * helper function for clear selected object
   */
  clearSelectedObject: function(image) {
    image = image.set('selectedObjectId', null);
    return image;
  },

  /**
   * select layer (for editing)
   * @param  {string} layerID for manipulation
   */
  onSelectLayer: function(layerID) {
    // find layer and select it
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    // unselect previous layer
    var previousSelectedlayerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });

    if (previousSelectedlayerIndex !== -1) {
      var previousSelectedlayer = layers.get(previousSelectedlayerIndex);
      previousSelectedlayer = previousSelectedlayer.set('selected', false);
      layers = layers.set(previousSelectedlayerIndex, previousSelectedlayer);
      this.svgImage = this.svgImage.set('svgLayers', layers);
    }

    layer = layer.set('selected', true);
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    // remove object selection (due to in could be stay on other layer)
    this.svgImage = this.clearSelectedObject(this.svgImage);

    HistoryActions.addToHistory(this.svgImage);
    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * pre-select (i.e. when user do "mouse over" on layer name)
   * it is used for highlight objects which belong to level
   * @param  {string} layerID for manipulation
   */
  onPreSelectLayer: function(layerID) {
    // find layer and pre-select it
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    // unselect previous layer
    var previousSelectedlayerIndex = layers.findIndex(function(l) {
      return l.get('preSelected');
    });

    if (previousSelectedlayerIndex !== -1) {
      var previousSelectedlayer = layers.get(previousSelectedlayerIndex);
      previousSelectedlayer = previousSelectedlayer.set('preSelected', false);
      layers = layers.set(previousSelectedlayerIndex, previousSelectedlayer);
      this.svgImage = this.svgImage.set('preSelected', layers);
    }

    layer = layer.set('preSelected', true);
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * remove pre-selection
   * @param  {string} layerID for manipulation
   */
  onUnPreSelectLayer: function(layerID) {
    // find layer and un-pre-select it
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    layer = layer.set('preSelected', false);
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * remove selected layer
   */
  onDeleteSelectedLayer: function() {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    layers = layers.delete(layerIndex);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    // if it is mask we should remove references from other layers
    if (layer.get('mask')) {
      var svgImg = this.svgImage;
      layers.forEach(function(layerIt, i) {
        if (layerIt.get('maskAdded') === layer.get('name')) {
          var newLayer = layerIt.delete('maskAdded');
          layers = layers.set(i, newLayer);
          svgImg = svgImg.set('svgLayers', layers);
        }
      });

      this.svgImage = svgImg;
    }

    // remove object selection (due to in could be stay on other layer)
    this.svgImage = this.clearSelectedObject(this.svgImage);

    HistoryActions.addToHistory(this.svgImage);
    // Pass on to listeners
    this.trigger(this.svgImage);
  },

  /**
   * add new layer
   */
  onAddNewLayer: function() {
    // create new object with name
    var newLayerName = 'Layer' + (this.svgImage.get('svgLayers').size + 1);
    var newLayer = ImageModel.get('emptyLayer')(newLayerName);

    var newLayers = this.svgImage.get('svgLayers').push(newLayer);
    this.svgImage = this.svgImage.set('svgLayers', newLayers);

    HistoryActions.addToHistory(this.svgImage);
    this.trigger(this.svgImage);
  },

  /**
   * move layer up (exchange with previous level)
   */
  onMoveUpSelectedLayer: function() {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });
    if (layerIndex <= 0) {
      return;
    }

    if (layers.size < 2) {
      return;
    }
    // exchange
    var layer = layers.get(layerIndex);
    var layerPrev = layers.get(layerIndex - 1);
    layers = layers.set(layerIndex, layerPrev);
    layers = layers.set(layerIndex - 1, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    HistoryActions.addToHistory(this.svgImage);
    this.trigger(this.svgImage);
  },

  /**
   * move layer down (exchange with previous level)
   */
  onMoveDownSelectedLayer: function() {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });
    if ((layerIndex === -1) ||
        (layerIndex === layers.size - 1)) {
      return;
    }

    if (layers.size < 2) {
      return;
    }

    // exchange
    var layer = layers.get(layerIndex);
    var layerNext = layers.get(layerIndex + 1);
    layers = layers.set(layerIndex, layerNext);
    layers = layers.set(layerIndex + 1, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    HistoryActions.addToHistory(this.svgImage);
    this.trigger(this.svgImage);
  },

  /**
   * create mask from selected layer
   */
  onCreateMaskFromSelectedLayer: function() {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    var layer = layers.find(function(l) {
      return l.get('selected');
    });
    if (!layer) {
      // no any layer found
      return;
    }

    // create mask from layer
    var mask = ImageModel.get('createMask')(layer);

    // try to find if mask with same name exists already
    var theSameNameMaskIndex = layers.findIndex(function(l) {
      return l.get('name') === mask.get('name');
    });

    if (theSameNameMaskIndex === -1) {
      // push masks
      layers = layers.push(mask);
    } else {
      // update mask
      layers = layers.set(theSameNameMaskIndex, mask);
    }
    this.svgImage = this.svgImage.set('svgLayers', layers);

    HistoryActions.addToHistory(this.svgImage);
    this.trigger(this.svgImage);
  },

  /**
   * apply mask to specified layer
   */
  onApplyMaskToLayer: function(layerID) {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    var mask = layers.find(function(l) {
      return l.get('mask') && l.get('selected');
    });
    if (!mask) {
      // no any layer found
      return;
    }

    // find layer
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    layer = layer.set('maskAdded', mask.get('name'));
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    HistoryActions.addToHistory(this.svgImage);
    // push masks
    this.trigger(this.svgImage);
  },

  removeMaskFromSelectedLayer: function(layerID) {
    // find layer
    var layers = this.svgImage.get('svgLayers');
    // find layer
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      // no any layer found
      return;
    }
    var layer = layers.get(layerIndex);

    layer = layer.set('maskAdded', null);
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    HistoryActions.addToHistory(this.svgImage);
    // push masks
    this.trigger(this.svgImage);
  },

  /**
   * helper function: add object to selected layer
   * @param  {Object} existed svg object
   */
  addObjectToLayer: function(image, svgObject) {
    // find selected layer
    var layers = image.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });
    if (layerIndex === -1) {
      // can't add anything
      return image;
    }
    var layer = layers.get(layerIndex);

    // TODO: rewrite to generate uuid
    var svgObjects = image.get('svgObjects');
    var svgObjectId = svgObject.get('type') + svgObjects.size;
    svgObject = svgObject.set('id', svgObjectId);

    // add to layer
    svgObjects = svgObjects.push(svgObject);
    image = image.set('svgObjects', svgObjects);

    var svgObjectsIDs = layer.get('svgObjects').push(svgObjectId);

    layer = layer.set('svgObjects', svgObjectsIDs);
    layers = layers.set(layerIndex, layer);
    image = image.set('svgLayers', layers);

    return image;
  },

  /**
   * add new object to selected layer
   * @param  {string} objectType new object type (tect/rect)
   */
  addNewObjectToLayer: function(objectType, attrs) {
    // create new object
    var svgObject = ImageModel.get('emptyObjectOfType')(objectType, attrs);
    this.svgImage = this.addObjectToLayer(this.svgImage, svgObject);

    HistoryActions.addToHistory(this.svgImage);
    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * update some non-common attribute like text for text object
   * @param  {object} svgObject object
   * @param  {Array} attrs     list of attributes
   */
  onUpdateObjectAttributes: function(layerID, objectID, attrs) {
    // find selected layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      return;
    }

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    var svgObject = svgObjects.get(svgObjectIndex);

    svgObject = svgObject.merge(attrs);

    svgObjects = svgObjects.set(svgObjectIndex, svgObject);
    this.svgImage = this.svgImage.set('svgObjects', svgObjects);

    HistoryActions.addToHistory(this.svgImage);
    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * move object to new position
   * @param  {object} svgObject object
   */
  changePosition: function(layerID, objectID, newPosition) {
    // find selected layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('name') === layerID;
    });
    if (layerIndex === -1) {
      return;
    }

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    var svgObject = svgObjects.get(svgObjectIndex);
    var pos = svgObject.get('position');

    pos = pos.merge(newPosition);

    svgObject = svgObject.set('position', pos);
    svgObjects = svgObjects.set(svgObjectIndex, svgObject);
    this.svgImage = this.svgImage.set('svgObjects', svgObjects);

    HistoryActions.addToHistory(this.svgImage);
    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * show selection for specific object which belongs to selected layer
   * @param  {string} layerID - object's layer ID
   * @param  {string} objectID - object ID (in layer)
   */
  selectObjectInSelectedLayer: function(layerID, objectID) {
    // find selected layer
    var layers = this.svgImage.get('svgLayers');
    var layer = layers.find(function(l) {
      return l.get('selected');
    });
    if (!layer) {
      return;
    }

    if (layer.get('name') !== layerID) {
      // can't select object on the other layer
      return;
    }

    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);
    this.svgImage = this.svgImage.set('selectedObjectId', objectID);

    HistoryActions.addToHistory(this.svgImage);
    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * remove selected object from selected layer
   */
  removeSelectedObject: function() {
    // find selected layer
    var layers = this.svgImage.get('svgLayers');
    var layerIndex = layers.findIndex(function(l) {
      return l.get('selected');
    });
    if (layerIndex === -1) {
      return;
    }

    var selectedObjectId = this.svgImage.get('selectedObjectId');
    if (!selectedObjectId) {
      return;
    }

    var layer = layers.get(layerIndex);
    var svgObjects = layer.get('svgObjects');
    svgObjects = svgObjects.filter(function(svgObjectID) {
      return svgObjectID !== selectedObjectId;
    });

    layer = layer.set('svgObjects', svgObjects);
    layers = layers.set(layerIndex, layer);
    this.svgImage = this.svgImage.set('svgLayers', layers);

    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);
    this.svgImage = this.clearSelectedObject(this.svgImage);

    HistoryActions.addToHistory(this.svgImage);
    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to add rect mode
   */
  switchToAddRectEditMode: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_RECT);
    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.clearSelectedObject(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * start add rect, i.e. user click on svg edit area
   * and setup first point of rectangle
   * @param  {object} mousePosition - point (in svg coordinates) where user clicked
   */
  startAddRect: function(mousePosition) {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_RECT_FIRST_POINT_ADDED);
    var svgObject = ImageModel.get('emptyObjectOfType')('rect', {
      position: {
        scale: 1,
        r: 0,
        x: mousePosition.x,
        y: mousePosition.y,
        width: 0,
        height: 0
      }
    });
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * continue add rect, i.e. user resize rectangle, which he wants to add
   * @param  {object} mousePosition - point (in svg coordinates) where user moved
   */
  continueAddRect: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }
    var pos = svgObject.get('position');
    var x = pos.get('x');
    var y = pos.get('y');
    pos = pos.set('width', Math.abs(x - mousePosition.x));
    pos = pos.set('height', Math.abs(y - mousePosition.y));
    svgObject = svgObject.set('position', pos);

    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_RECT_SECOND_POINT_ADDED);
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * finish add rect, i.e. user chosen size of rectangle
   * @param  {object} mousePosition - point (in svg coordinates) where user finished editing
   */
  finishAddRect: function(mousePosition) {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_RECT);

    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var pos = svgObject.get('position');
    var x = pos.get('x');
    var y = pos.get('y');
    pos = pos.set('width', Math.abs(x - mousePosition.x));
    pos = pos.set('height', Math.abs(y - mousePosition.y));
    svgObject = svgObject.set('position', pos);

    this.svgImage = this.addObjectToLayer(this.svgImage, svgObject);
    this.svgImage = this.svgImage.set('editStateData', null);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to add text mode
   */
  switchToAddTextEditMode: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_TEXT);
    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.clearSelectedObject(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to add text mode
   */
  addNewTextToPosition: function(mousePosition) {
    var svgObject = ImageModel.get('emptyObjectOfType')('text', {
      position: {
        scale: 1,
        r: 0,
        x: mousePosition.x,
        y: mousePosition.y,
        width: 100,
        height: 50
      }
    });
    this.svgImage = this.addObjectToLayer(this.svgImage, svgObject);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to select object mode
   */
  switchToSelectObjectEditMode: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);
    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.clearSelectedObject(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to add polygon mode
   */
  switchToAddPolygonEditMode: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_POLYGON);
    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.clearSelectedObject(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },


  /**
   * start add polygon, i.e. user click on svg edit area
   * and setup first point of polygon
   * @param  {object} mousePosition - point (in svg coordinates) where user clicked
   */
  startAddPolygon: function(mousePosition) {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_POLYGON_FIRST_TWO_POINTS_ADDED);
    var svgObject = ImageModel.get('emptyObjectOfType')('polygon', {
      position: {
        scale: 1,
        r: 0,
        x: mousePosition.x,
        y: mousePosition.y,
        width: 0,
        height: 0
      },
      polygon: [
        {
          cmd: 'M',
          x: 0,
          y: 0
        },
        {
          cmd: 'L',
          x: 0,
          y: 0
        }
      ]
    });
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * continue add polygon, i.e. user add next point
   * @param  {object} mousePosition - point (in svg coordinates) where user clicked
   */
  continueAddPolygon: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var pos = svgObject.get('position');
    var x = pos.get('x');
    var y = pos.get('y');

    var fromStart = {
      x: mousePosition.x - x,
      y: mousePosition.y - y
    };

    if ((Math.abs(fromStart.x) + Math.abs(fromStart.y)) < 10) {
      // if user wants to finish path fire finish action instead edit
      EditorActions.finishAddPolygon();
      return;
    }

    var polygon = svgObject.get('polygon');
    polygon = polygon.push(Immutable.Map({cmd: 'L', x: fromStart.x, y: fromStart.y}));

    svgObject = svgObject.set('polygon', polygon);

    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_POLYGON_NEXT_POINT_ADDED);
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * continue add polygon, i.e. user add next point
   * @param  {object} mousePosition - point (in svg coordinates) where user clicked
   */
  changePositionForLastPolygonPoint: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');

    var pos = svgObject.get('position');
    var x = pos.get('x');
    var y = pos.get('y');

    polygon = polygon.set(polygon.size - 1, Immutable.Map({cmd: 'L', x: mousePosition.x - x, y: mousePosition.y - y}));
    svgObject = svgObject.set('polygon', polygon);

    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * normalize polygon points
   * i.e. recalculate center and move all points according new center (in respect by child coordinates),
   * but move center back (in respect by parent coordinates)
   */
  normalizePolygon: function(svgObject) {
    var polygon = svgObject.get('polygon');

    var comparerX = function(point) { return point.get('x'); };
    var comparerY = function(point) { return point.get('y'); };
    var rect = {
      minX: polygon.minBy(comparerX).get('x'),
      minY: polygon.minBy(comparerY).get('y'),
      maxX: polygon.maxBy(comparerX).get('x'),
      maxY: polygon.maxBy(comparerY).get('y')
    };

    var width = Math.abs(rect.maxX - rect.minX);
    var height = Math.abs(rect.maxY - rect.minY);
    var pos = svgObject.get('position');
    pos = pos.set('width', width);
    pos = pos.set('height', height);

    // virtual move center to actual center of path
    // i.e. move center of path to new center (parent.x, parent.y) => (child.0, child.0)
    // but move back all path points
    // so no actual moving just re-arrange coordinates
    // between parent group and child object

    // old center coordinates (in parent group)
    var x = pos.get('x');
    var y = pos.get('y');

    // vector which move center (against parent coordinate)
    var moveVector = {
      x: rect.minX + (width / 2),
      y: rect.minY + (height / 2)
    };
    pos = pos.set('x', x + moveVector.x);
    pos = pos.set('y', y + moveVector.y);
    svgObject = svgObject.set('position', pos);

    // move back all path points
    polygon = polygon.map(function(point) {
      point = point.set('x', point.get('x') - moveVector.x);
      point = point.set('y', point.get('y') - moveVector.y);
      if (point.get('cmd') === 'C') {
        // move curve points too
        point = point.set('x1', point.get('x1') - moveVector.x);
        point = point.set('y1', point.get('y1') - moveVector.y);
        point = point.set('x2', point.get('x2') - moveVector.x);
        point = point.set('y2', point.get('y2') - moveVector.y);
      }

      return point;
    });

    svgObject = svgObject.set('polygon', polygon);

    return svgObject;
  },

  /**
   * finish add polygon, i.e. user added all points (closed path)
   */
  finishAddPolygon: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_POLYGON);

    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');
    polygon = polygon.pop(); // remove selection point (the point is not added to path)
    svgObject = svgObject.set('polygon', polygon);

    svgObject = this.normalizePolygon(svgObject);

    this.svgImage = this.addObjectToLayer(this.svgImage, svgObject);
    this.svgImage = this.svgImage.set('editStateData', null);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * start to edit polygon (polygon existed and added to layer)
   * @param  {object} mousePosition - point (in screen coordinates) where user clicked
   * @param  {object} objectID - polygon for edit
   * @param  {Number} pointID - point for edit
   */
  switchToEditPolygonEditMode: function(mousePosition, objectID, pointID) {
    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    var svgObject = svgObjects.get(svgObjectIndex);
    svgObject = svgObject.setIn(['polygon', pointID, 'selected'], true);
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    this.svgImage = this.svgImage.set('editState', EditorStates.EDIT_POLYGON_POINT);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * move point during edit polygon
   * edit polygon means change some polygon's point position
   * @param  {object} mousePosition - screen mouse position of mouse (x, d)
   */
  movePointPolygonEditMode: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var mousePositionInital = svgObject.get('mousePositionLast');

    var polygon = svgObject.get('polygon');
    var pointIndex = polygon.findIndex(function(pointIt) {
      return pointIt.get('selected');
    });

    var point = polygon.get(pointIndex);
    point = point.set('x', point.get('x') + mousePosition.x - mousePositionInital.get('x'));
    point = point.set('y', point.get('y') + mousePosition.y - mousePositionInital.get('y'));
    polygon = polygon.set(pointIndex, point);
    svgObject = svgObject.set('polygon', polygon);
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));

    this.svgImage = this.svgImage.set('editStateData', svgObject);

    this.svgImage = this.svgImage.set('editState', EditorStates.EDIT_POLYGON_POINT);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * finish point moving during edit polygon
   */
  finishEditPointPolygonEditMode: function() {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');
    var pointIndex = polygon.findIndex(function(pointIt) {
      return pointIt.get('selected');
    });

    var point = polygon.get(pointIndex);
    point = point.delete('selected');
    polygon = polygon.set(pointIndex, point);
    svgObject = svgObject.set('polygon', polygon);
    svgObject = this.normalizePolygon(svgObject);
    svgObject = svgObject.delete('mousePositionLast');

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(obj) {
      return obj.get('id') === svgObject.get('id');
    });
    this.svgImage = this.svgImage.setIn(['svgObjects', svgObjectIndex], svgObject);

    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * start to edit curve point for polygon (polygon existed and added to layer)
   * @param  {object} mousePosition - screen position of mouse (x, y)
   * @param  {object} objectID - polygon for edit
   * @param  {Number} pointID - point (in polygon) for edit
   * @param  {Number} curvePointID - point (in curve definition) for edit
   */
  switchToEditCurvePolygonEditMode: function(mousePosition, objectID, pointID, curvePointID) {
    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    var svgObject = svgObjects.get(svgObjectIndex);
    svgObject = svgObject.setIn(['polygon', pointID, 'selected'], true);
    svgObject = svgObject.setIn(['polygon', pointID, 'curvePointID'], curvePointID);
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    this.svgImage = this.svgImage.set('editState', EditorStates.EDIT_POLYGON_CURVE_POINT);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * move curve point during edit polygon
   * edit polygon means change some polygon's curve point position
   * @param  {object} mousePosition - screen position of mouse (x, y)
   */
  moveCurvePointPolygonEditMode: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');
    var pointIndex = polygon.findIndex(function(pointIt) {
      return pointIt.get('selected');
    });

    var point = polygon.get(pointIndex);
    var curvePointID = point.get('curvePointID');
    var mousePositionInital = svgObject.get('mousePositionLast');
    point = point.set('x' + curvePointID, point.get('x' + curvePointID) + mousePosition.x - mousePositionInital.get('x'));
    point = point.set('y' + curvePointID, point.get('y' + curvePointID) + mousePosition.y - mousePositionInital.get('y'));
    polygon = polygon.set(pointIndex, point);
    svgObject = svgObject.set('polygon', polygon);
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));

    this.svgImage = this.svgImage.set('editStateData', svgObject);

    this.svgImage = this.svgImage.set('editState', EditorStates.EDIT_POLYGON_CURVE_POINT);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * finish curve point moving during edit polygon
   */
  finishEditCurvePointPolygonEditMode: function() {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');
    var pointIndex = polygon.findIndex(function(pointIt) {
      return pointIt.get('selected');
    });

    var point = polygon.get(pointIndex);
    point = point.delete('selected');
    point = point.delete('curvePointID');
    polygon = polygon.set(pointIndex, point);
    svgObject = svgObject.set('polygon', polygon);
    svgObject = this.normalizePolygon(svgObject);
    svgObject = svgObject.delete('mousePositionLast');

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(obj) {
      return obj.get('id') === svgObject.get('id');
    });
    this.svgImage = this.svgImage.setIn(['svgObjects', svgObjectIndex], svgObject);

    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * switch svg editor to add curve (to selected polygon) mode
   */
  switchToAddCurvePolygonEditMode: function() {
    this.svgImage = this.svgImage.set('editState', EditorStates.ADD_CURVE_TO_POLYGON);
    var objectID = this.svgImage.get('selectedObjectId');
    if (!objectID) {
      return;
    }

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObject = svgObjects.find(function(obj) {
      return obj.get('id') === objectID;
    });

    if (!svgObject) {
      return;
    }
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * add curve to polygon (polygon existed and added to layer)
   * @param  {object} objectID - polygon for add curve
   * @param  {Number} pointID - point (in polygon) for add curve
   */
  addCurveToPolygon: function(objectID, pointID) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }

    var polygon = svgObject.get('polygon');
    var point = polygon.get(pointID);

    var cmd = point.get('cmd');
    if (cmd === 'C') {
      return;
    }

    var pointPos = {
      x: point.get('x'),
      y: point.get('y')
    };

    var prevPoint;
    if (cmd === 'M') {
      // get last point
      var lastPoint = polygon.last();
      // check if last point already has been cloned
      if ((lastPoint.get('x') === pointPos.x) &&
          (lastPoint.get('y') === pointPos.y)) {
        return;
      }

      // clone and add new point with the same (x,y) as a first point
      polygon = polygon.push(point);
      pointID = polygon.size - 1;
    }

    prevPoint = polygon.get(pointID - 1);

    var prevPointPos = {
      x: prevPoint.get('x'),
      y: prevPoint.get('y')
    };

    //point = point.set('selected', true);
    point = point.set('cmd', 'C');
    point = point.set('x1', pointPos.x - (pointPos.x - prevPointPos.x) * (2.0 / 3.0));
    point = point.set('y1', pointPos.y - (pointPos.y - prevPointPos.y) * (2.0 / 3.0));
    point = point.set('x2', pointPos.x - (pointPos.x - prevPointPos.x) * (1.0 / 3.0));
    point = point.set('y2', pointPos.y - (pointPos.y - prevPointPos.y) * (1.0 / 3.0));

    polygon = polygon.set(pointID, point);
    svgObject = svgObject.set('polygon', polygon);

    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectID = svgObject.get('id');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === svgObjectID;
    });

    svgObjects = svgObjects.set(svgObjectIndex, svgObject);
    this.svgImage = this.svgImage.set('svgObjects', svgObjects);
    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * start to move for selected object
   * @param  {object} mousePosition - point (in screen coordinates) where user clicked
   */
  startSelectedObjectMove: function(mousePosition) {
    var svgObjects = this.svgImage.get('svgObjects');
    var objectID = this.svgImage.get('selectedObjectId');
    if (!objectID) {
      return;
    }
    var svgObject = svgObjects.find(function(objectIt) {
      return objectIt.get('id') === objectID;
    });
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));
    this.svgImage = this.svgImage.set('editStateData', svgObject);

    this.svgImage = this.svgImage.set('editState', EditorStates.SELECTED_OBJ_MOVE);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * continue to move for selected object
   * @param  {object} mousePosition - point (in screen coordinates) where user clicked
   */
  continueSelectedObjectMove: function(mousePosition) {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }
    var mousePositionInital = svgObject.get('mousePositionLast');
    var pos = svgObject.get('position');

    var newPos = {
      x: pos.get('x') + mousePosition.x - mousePositionInital.get('x'),
      y: pos.get('y') + mousePosition.y - mousePositionInital.get('y')
    };

    pos = pos.set('x', newPos.x);
    pos = pos.set('y', newPos.y);

    svgObject = svgObject.set('position', pos);
    svgObject = svgObject.set('mousePositionLast', Immutable.Map(mousePosition));
    this.svgImage = this.svgImage.set('editStateData', svgObject);
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECTED_OBJ_MOVE);

    // update object too (to support moving object to cursor)
    var objectID = svgObject.get('id');
    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    svgObjects = svgObjects.set(svgObjectIndex, svgObject);
    this.svgImage = this.svgImage.set('svgObjects', svgObjects);

    // fire update notification
    this.trigger(this.svgImage);
  },

  /**
   * finish to move for selected object
   */
  finishSelectedObjectMove: function() {
    var svgObject = this.svgImage.get('editStateData');
    if (!svgObject) {
      return;
    }
    svgObject = svgObject.delete('mousePositionLast');
    var objectID = svgObject.get('id');
    var svgObjects = this.svgImage.get('svgObjects');
    var svgObjectIndex = svgObjects.findIndex(function(svgObjectIt) {
      return svgObjectIt.get('id') === objectID;
    });
    if (svgObjectIndex === -1) {
      return;
    }
    svgObjects = svgObjects.set(svgObjectIndex, svgObject);
    this.svgImage = this.svgImage.set('svgObjects', svgObjects);

    this.svgImage = this.svgImage.set('editStateData', null);
    this.svgImage = this.svgImage.set('editState', EditorStates.SELECT_OBJ);

    HistoryActions.addToHistory(this.svgImage);

    // fire update notification
    this.trigger(this.svgImage);
  }

});

module.exports = ImageStore;
