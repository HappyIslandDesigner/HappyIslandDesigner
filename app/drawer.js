var backgroundLayer = project.activeLayer;
var mapLayer = new Layer();
var mapIconLayer = new Layer();
var mapOverlayLayer = new Layer();
var uiLayer = new Layer();
var fixedLayer = new Layer();
backgroundLayer.applyMatrix = false;
fixedLayer.applyMatrix = false;

mapLayer.applyMatrix = false;
mapLayer.pivot = new Point(0, 0);
mapIconLayer.applyMatrix = false;
mapIconLayer.pivot = new Point(0, 0);
mapOverlayLayer.applyMatrix = false;
mapOverlayLayer.pivot = new Point(0, 0);

var colors = {
  water: '#7cd5c4',
  sand: '#f0e5a6',
  level1: '#42753e',
  level2: '#4ca14e',
  level3: '#62c360',
  rock: '#717488',
  human: '#F078B0',
  npc: '#FABD25',
  selected: '#EA822F',
  pin: '#E85A31',
  paper: '#fefae4',
}

// load assets
var svgPath = 'svg/'
var imgPath = 'img/'
var treePrefix = 'tree-';
var toolPrefix = 'tool-';
var numSvgToLoad = 0;
var numSvgLoaded = 0;
function OnLoaded() {
  numSvgLoaded++;
  if (numSvgToLoad == numSvgLoaded) {
    // all done loading
    initializeSvg();
  }
}

var domParser = new DOMParser;
var loadSvg = function(filename, itemCallback) {
  numSvgToLoad++;
  project.importSVG(svgPath + filename + '.svg', 
    {
      onLoad: function(item, svg) {
        item.remove();
        item.position = new Point(0, 0);
        itemCallback(item);
        OnLoaded();
      }
    });
};

function createMapSprite(iconData) {
  mapIconLayer.activate();
  var item = iconData.icon.clone();
  item.scaling = new Point(.03, .03);
  item.pivot = item.bounds.bottomCenter;
  return createObject(item, 'structure', iconData.name, iconData.size, iconData.offset);
}

function createMenuSprite(def) {
  var item = def.icon.clone();
  item.scaling = new Point(.3, .3);
  return createButton(def, item, 20, function(button) {
    toolState.switchTool(toolState.toolMapValue(toolDefinition.structures, def.type, {}));
  });
}

function createIconMenu(definitions) {
  fixedLayer.activate();
  var i = 0;
  var iconMenu = new Group();
  Object.keys(definitions).forEach(function(name) {
    var def = definitions[name];
    var item = createMenuSprite(def);
    item.position = new Point(80, 20 + 50 * i);
    iconMenu.addChild(item);
    i++;
  });
  return iconMenu;
}

var structure = {
  tentRound: {},
  tentTriangle: {},
  tentTrapezoid: {},
  hut: {},
  house: {},
  building: {},
  lighthouse: {},
};
Object.keys(structure).forEach(function(name) {
  var structureDefinition = structure[name];
  structureDefinition.name = name;
  structureDefinition.icon = name; // for now these are the same
  structureDefinition.size = new Point(4, 4);
  structureDefinition.offset = new Point(-2, -3.6);

  loadSvg('structure-' + name, function(item) {
    //item.pivot += new Point(-2, -3.6);
    structureDefinition.icon = item;
  });
})

//var tree = {
//  bush: null,
//  fruit: null,
//  palm: null,
//  pine: null,
//};
//Object.keys(tree).forEach(function(name) {
//  loadSvg(treePrefix + name, function(item) {
//    var isBush = name == 'bush';
//    var size = [isBush ? 1 : 2, 1];
//    var offset = isBush ? new Point( -0.5, -1) : new Point(-1, -.75);
//    var obj = createObject(item, 'tree', name, size, offset);
//    tree[name] = obj;
//  });
//});

function createObject(item, type, name, size, offset) {
  item.data = {
    type: type,
    name: name,
    size: new Size(size),
  };
  var group = new Group();
  item.pivot += offset;
  item.position = new Point(0, 0);
  var bound = new Path.Rectangle(new Rectangle(item.position, item.data.size), .15);
  bound.strokeColor = colors.selected;
  bound.strokeColor.alpha = 0;
  bound.strokeWidth = 0.3;
  bound.fillColor = colors.selected;
  bound.fillColor.alpha = 0.0001;
  group.addChildren([item, bound]);
  group.pivot = bound.bounds.topLeft;

  group.onMouseEnter = function(event) {
    bound.strokeColor.alpha = 1;
  }
  group.onMouseLeave = function(event) {
    bound.strokeColor.alpha = 0;
  }
  group.onMouseDown = function(event) {
    var coordinate = mapOverlayLayer.globalToLocal(event.point);
    group.data.clickPivot = coordinate - group.pivot;
  }
  group.onMouseDrag = function(event) {
    var coordinate = mapOverlayLayer.globalToLocal(event.point);
    group.position = (coordinate - group.data.clickPivot).round();
  }
  group.onMouseUp = function(event) {
    var coordinate = mapOverlayLayer.globalToLocal(event.point);
    delete group.data.clickPivot;
  }

  return group;
}


function initializeSvg() {
  var i = 0;
  Object.keys(structure).forEach(function(name) {
    var s = structure[name];
    var mapIcon = createMapSprite(s);
    mapIcon.position = new Point(5, 5 + 5 * i);
    i++;
  });

//  Object.keys(tree).forEach(function(name) {
//    var s = tree[name];
//    s.position = new Point(5, 20 + 5 * i);
//    i++;
//  });
}

mapLayer.activate();

// ===============================================
// GLOBAL FUNCTIONS

function onResize(event) {
  // Whenever the window is resized, recenter the path:
  resizeCoordinates();
  drawBackground();
  updateColorTools();
}

tool.minDistance = 1;

var prevViewMatrix = view.matrix.clone();
fixedLayer.activate();
function onFrame() {
  if (!view.matrix.equals(prevViewMatrix)) {
    var inverted = view.matrix.inverted();
    backgroundLayer.matrix = inverted;
    fixedLayer.matrix = inverted;
    prevViewMatrix = view.matrix.clone();
  }
  //fixedLayer.pivot = new Point(0, 0);
 // fixedLayer.position = view.viewSize.topLeft;
  //var inverseZoom = 1 / view.zoom;
  
  //fixedLayer.scaling = new Point(inverseZoom, inverseZoom);
}
mapLayer.activate();

// ===============================================
// BACKGROUND

 backgroundLayer.activate();
var backgroundRect = new Path();
backgroundRect.fillColor = colors.water;
backgroundRect.onMouseDown = function onMouseDown(event) {
  toolState.activeTool.definition.onMouseDown(event);
}
backgroundRect.onMouseMove = function onMouseMove(event) {
  toolState.activeTool.definition.onMouseMove(event);
}
backgroundRect.onMouseDrag = function onMouseDrag(event) {
  toolState.activeTool.definition.onMouseDrag(event);
}
backgroundRect.onMouseUp = function onMouseUp(event) {
  toolState.activeTool.definition.onMouseUp(event);
}

function drawBackground() {
  backgroundRect.segments = [
    new Point(0, 0),
    new Point(view.size.width, 0),
    new Point(view.size.width, view.size.height),
    new Point(0, view.size.height),
  ];
  mapLayer.activate();
}

// ===============================================
// MAIN UI

function downloadText(filename, text) {
  downloadDataURL(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
}

function downloadDataURL(filename, data) {
  var element = document.createElement('a');
  element.setAttribute('href', data);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function saveMapToFile() {
  var mapJson = encodeMap();

  var saveMargins = new Point(8, 8);

  uiLayer.activate();
  var mapRaster = mapLayer.rasterize();
  var mapPositionDelta = mapLayer.globalToLocal(mapLayer.bounds.topLeft);

  var gridClone = gridRaster.clone();

  var mapBounds = gridRaster.bounds.clone();
  mapBounds.size += saveMargins;
  mapBounds.point -= saveMargins / 2;
  var mapBoundsClippingMask = new Path.Rectangle(mapBounds);

  var background = mapBoundsClippingMask.clone();
  background.fillColor = colors.water;

  mapBoundsClippingMask.clipMask = true;

  var text = new PointText(mapBounds.bottomRight - new Point(2, 2));
  text.justification = 'right';
  text.content = "made at eugeneration.github.io/HappyIslandDesigner";
  text.fontFamily = 'Fredoka One';
  text.fillColor = '#c3f6fb'
  text.strokeWidth = 0;
  text.fontSize = 2;
  text.selected = true;

  var group = new Group();
  group.clipped = true;

  group.addChildren([mapBoundsClippingMask, background, mapRaster, gridClone, text]);

  // the raster doesn't scale for some reason, so manually scale it;
  mapRaster.scaling /= mapLayer.scaling;
  mapRaster.bounds.topLeft = mapPositionDelta;

  var combinedImage = group.rasterize(708.5);
  combinedImage.position.x += 200;
  combinedImage.remove();
  group.remove();

  var mapRasterSize = combinedImage.size;
  var mapRasterData = combinedImage.toDataURL();

  var shadowCanvas = document.createElement('canvas'),
    shadowCtx = shadowCanvas.getContext('2d');
  shadowCanvas.style.display = 'none';
  var image = new Image();
  image.src = mapRasterData;
  image.addEventListener('load',
    function() {
      mapRasterData = steg.encode(mapJson, mapRasterData, {
        height: mapRasterSize.height,
        width: mapRasterSize.width,
      });

      var filename = "HappyIslandDesigner_" + Date.now() + ".png";
      downloadDataURL(filename, mapRasterData);
    }
    , false);
  return;
}

function loadMapFromFile() {
  readFile = function(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var dataURL = e.target.result;

      var image = new Image();
      image.src = dataURL;
      image.addEventListener('load',
        function() {
          var mapJSONString = steg.decode(dataURL, {
            height: image.height,
            width: image.width,
          });
          var map = decodeMap(JSON.parse(mapJSONString));
          setNewMapData(map);
        }, false);
    }
    reader.readAsDataURL(file);
  }
  fileInput = document.createElement("input");
  fileInput.type='file';
  fileInput.style.display='none';
  fileInput.onchange=readFile;
  clickElem(fileInput);
}

function clickElem(elem) {
  // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
  var eventMouse = document.createEvent("MouseEvents")
  eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  elem.dispatchEvent(eventMouse)
}

// ===============================================
// UI ELEMENTS

function createButton(def, item, buttonSize, onClick) {
  var group = new Group();

  var button = new Path.Circle(0, 0, buttonSize);
  button.fillColor = colors.sand;
  button.fillColor.alpha = 0.0001;

  group.applyMatrix = false;
  group.addChildren([button, item]);

  group.data = {
    definition: def,
    selected: false,
    hovered: false,
    select: function(isSelected) {
      group.data.selected = isSelected;
      button.fillColor = isSelected ? colors.npc : colors.sand;
      button.fillColor.alpha = isSelected ? 1 : 0.0001;
    },
    hover: function(isHover) {
      group.data.hovered = isHover;
      button.fillColor.alpha = isHover || group.data.selected ? 1 : 0.0001;
    }
  }
  group.onMouseEnter = function(event) {
    group.data.hover(true);
  }
  group.onMouseLeave = function(event) {
    group.data.hover(false);
  }
  group.onMouseDown = function(event) {
    onClick(group);
  }
  return group;
}


// ===============================================
// TOOLS

fixedLayer.activate();

//var menuButton = new Path();
//menuButton.strokeColor = colors.selected;
////menuButton.strokeColor *= 0.9;
//menuButton.strokeWidth = 120;
//menuButton.strokeCap = 'round';
//menuButton.segments = [
//  new Point(-20, 0),
//  new Point(0, 0),
//];

var leftToolMenu = new Path();
leftToolMenu.strokeColor = colors.paper;
leftToolMenu.strokeWidth = 120;
leftToolMenu.strokeCap = 'round';
leftToolMenu.segments = [
  new Point(0, 120),
  new Point(0, 400),
];

var leftToolMenuPosition = new Point(30, 120);
var leftToolMenuIconHeight = 50;

function addToLeftToolMenu(icon) {
  icon.position = leftToolMenuPosition;
  leftToolMenuPosition.y += leftToolMenuIconHeight;
}


// =======================================
// STRUCTURE TOOL
var baseStructureDefinition = {
  onSelect: function(subclass, isSelected) {
    subclass.icon.data.select(isSelected);
  },
};
var asyncStructureDefinition = {
  loadedCount: 0,
  targetCount: function() {return Object.keys(this.value).length;},
  onLoad: function() {
    this.loadedCount++;
    if (this.loadedCount == this.targetCount()) {
      this.loadingCallbacks.forEach(
        function(callback) { callback(this.value); }.bind(this));
      this.loadingCallbacks = [];
    }
  },
  loadingCallbacks: [],
  getAsyncValue: function(callback) {
    if (this.loadedCount == this.targetCount()) {
      callback(this.value);
      return true; // returns whether the value was returned immediately
    } else {
      this.loadingCallbacks.push(callback);
      return false;
    }
  },
  value: {
    tentRound: {},
    tentTriangle: {},
    tentTrapezoid: {},
    hut: {},
    house: {},
    building: {},
    lighthouse: {},
  }
};
// set up the definitions programatically because they are all the same
Object.keys(asyncStructureDefinition.value).forEach(function(structureType) {
  var def = asyncStructureDefinition.value[structureType];
  def.type = structureType;
  def.size = new Point(4, 4);
  def.offset = new Point(-2, -3.6);
  def.onSelect = function(isSelected) {
    baseStructureDefinition.onSelect(def, isSelected);
  };
  // imnmediately load the assets
  loadSvg('structure-' + structureType, function(item) {
    //item.pivot += new Point(-2, -3.6);
    def.icon = item;
    asyncStructureDefinition.onLoad();
  });
})

// =======================================
// BASE LEVEL TOOLS

var baseToolDefinition = {
  onSelect: function(subclass, isSelected) {
    subclass.icon.data.select(isSelected);
    this.openMenu(subclass, isSelected);
  },
  onMouseMove: function(subclass, event) {
    updateCoordinateLabel(event);
  },
  onMouseDown: function(subclass, event) {
    updateCoordinateLabel(event);
  },
  onMouseDrag: function(subclass, event) {
    updateCoordinateLabel(event);
  },
  onMouseUp: function(subclass, event) {
  },
  onKeyDown: function(subclass, event) {
    console.log('base onKeyDown');
  },
  openMenu: function(subclass, isSelected) {
    if (subclass.openMenu) {
      subclass.openMenu(isSelected);
    }
  },
  updateTool: function(prevToolData, nextToolData) {
    console.log('updateTool', prevToolData, nextToolData);
    var sameToolType = prevToolData && (prevToolData.definition.type === nextToolData.definition.type);
    if (!sameToolType) {
      if (prevToolData) {
        prevToolData.definition.onSelect(false);
      }
      nextToolData.definition.onSelect(true);
    } else {
      var prevTool = (prevToolData && prevToolData.tool) ? prevToolData.tool.type : null;
      var nextTool = (nextToolData && nextToolData.tool) ? nextToolData.tool.type : null;
      var sameTool = prevTool == nextTool;
      if (!sameTool) {
        console.log('new tool');
      }
    }
  },
}
var toolDefinition = {
  pointer: {
    base: baseToolDefinition,
    type: 'pointer',
    layer: mapIconLayer,
    icon: "pointer",
    tools: {},
    defaultTool: null,
    modifiers: {},
    defaultModifiers: {

    },
    onSelect: function(isSelected) {
      this.base.onSelect(this, isSelected);
    },
    onMouseMove: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDown: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDrag: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseUp: function(event) {
      this.base.onMouseMove(this, event);
    },
    onKeyDown: function(event) {console.log('pointer onKeyDown')},
  },
  terrain: {
    base: baseToolDefinition,
    type: 'terrain',
    layer: mapLayer,
    icon: "color",
    tools: {},
    defaultTool: null,
    modifiers: {},
    defaultModifiers: {

    },
    onSelect: function(isSelected) {
      this.base.onSelect(this, isSelected);
    },
    onMouseMove: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDown: function(event) {
      this.base.onMouseMove(this, event);
      startDraw(event);
    },
    onMouseDrag: function(event) {
      this.base.onMouseMove(this, event);
      draw(event);
    },
    onMouseUp: function(event) {
      this.base.onMouseMove(this, event);
      endDraw(event);
    },
    onKeyDown: function(event) {console.log('terrain onKeyDown')},
  },
  structures: {
    base: baseToolDefinition,
    type: 'structures',
    layer: mapIconLayer,
    icon: "structure",
    tools: asyncStructureDefinition,
    defaultTool: null,
    modifiers: {},
    defaultModifiers: {

    },
    onSelect: function(isSelected) {
      this.base.onSelect(this, isSelected);
    },
    onMouseMove: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDown: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDrag: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseUp: function(event) {
      this.base.onMouseMove(this, event);
    },
    onKeyDown: function(event) {console.log('structures onKeyDown')},
    openMenu: function(isSelected) {
      if (!isSelected) {
        if (this.iconMenu)
          this.iconMenu.remove();
      }
      else {
        asyncStructureDefinition.getAsyncValue(function(definitions) {
          this.iconMenu = createIconMenu(definitions);
        }.bind(this));
      }
    }
  },
  path: {
    base: baseToolDefinition,
    type: 'path',
    layer: mapLayer,
    icon: "path",
    tools: {},
    defaultTool: null,
    modifiers: {},
    defaultModifiers: {

    },
    onSelect: function(isSelected) {
      this.base.onSelect(this, isSelected);
    },
    onMouseMove: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDown: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseDrag: function(event) {
      this.base.onMouseMove(this, event);
    },
    onMouseUp: function(event) {
      this.base.onMouseMove(this, event);
    },
    onKeyDown: function(event) {
    },
  },
//  shovel: {

//},
//  sprite: {
//    type: 'sprite',
//    targetLayers: [mapIconLayer],
//  },
};
// add additional sub functions to all definitions
Object.keys(toolDefinition).forEach(function(toolType) {
  var def = toolDefinition[toolType];
  def.updateTool = def.base.updateTool;
});

var toolState = {
  activeTool: null,
  toolMap: {},
  toolMapValue: function(definition, tool, modifiers) {
    return {
      type: definition.type,
      definition: definition,
      tool: tool,
      modifiers: modifiers,
    };
  },
  defaultToolMapValue: function(toolType) {
    var def = toolDefinition[toolType];
    return this.toolMapValue(def, def.defaultTool, def.defaultModifiers);
  },
  switchToolType: function(toolType) {
    if (!this.toolMap.hasOwnProperty(toolType)) {
      this.switchTool(this.defaultToolMapValue(toolType));
    } else {
      this.switchTool(this.toolMap[toolType]);
    }
  },

  switchTool: function(toolData) {
    baseToolDefinition.updateTool(this.activeTool, toolData);

    this.activeTool = toolData;
    this.toolMap[toolData.type] = toolData;
  },
};

//function squircle (size){ // squircle=square+circle
//  var hsize = size / 2; // half size
//  
//  var squircle = new Path();
//
//  squircle.add(
//    new Segment(new Point(0,0), new Point(0,0), new Point(0,hsize)),
//    new Segment(new Point(0,size), new Point(0,size), new Point(hsize,size)),
//    new Segment(new Point(size,size), new Point(size,size), new Point(size,hsize)),
//    new Segment(new Point(size,0), new Point(size,0), new Point(hsize,0))
//  );
//  squircle.closed = true;
//
//  return squircle;
//}
//fixedLayer.activate();
//var box = squircle(100);
//box.fillColor = colors.npc;
//box.position = new Point(300, 300);
//box.selected = true;
//
//var d = new Path.Rectangle(300, 300, 10, 10);
//d.fillColor = colors.npc;


//var activeToolIndicator = new Path.Rectangle(0, 100, 5, 40);
//var activeToolIndicator = new Path.Circle(30, 120, 20);
//activeToolIndicator.fillColor = colors.npc;

Object.keys(toolDefinition).forEach(function(toolType) {
  var def = toolDefinition[toolType];
  var tool = new Raster(imgPath + toolPrefix + def.icon + '.png');

  var button = createButton(def, tool, 20, function() {toolState.switchToolType(toolType)});
  switch (def.icon) {
    case 'color':
      tool.position = new Point(-8, 0);
      break;
  }
  tool.scaling = new Point(.4, .4);
  
  addToLeftToolMenu(button);
  def.icon = button;
});

// add gap
leftToolMenuPosition.y += 60;

var activeColor = new Path.Circle([20, 20], 16);
activeColor.fillColor = paintColor;
addToLeftToolMenu(activeColor);


function updateColorTools() {
  activeColor
}

function onUpdateColor() {
  activeColor.fillColor = paintColor;
}

var paintColor = colors.level1;

fixedLayer.activate();

var toolsPosition = new Point(40, 80);


function initializeApp() {
  toolState.switchToolType(toolDefinition.structures.type);
}
initializeApp();

//var pointerToolButton = new Raster('../img/pointer.png');
//pointerToolButton.position = toolsPosition + new Point(0, 0);
//pointerToolButton.scaling = new Point(0.2, 0.2);

function onKeyDown(event) {
  var shift = Key.isDown('shift');
  var control = Key.isDown('control') || Key.isDown('meta');

  var prevActiveTool = toolState.activeTool;
  switch (event.key) {
    case '1':
      paintColor = colors.water;
      break;
    case '2':
      paintColor = colors.sand;
      break;
    case '3':
      paintColor = colors.level1;
      break;
    case '4':
      paintColor = colors.level2;
      break;
    case '5':
      paintColor = colors.level3;
      break;
    case '6':
      paintColor = colors.rock;
      break;
/*    case 'q':
      changePaintTool(paintTools.grid);
      break;
    case 'w':
      changePaintTool(paintTools.diagonals);
      break;
    case 'e':
      changePaintTool(paintTools.freeform);
      break;*/
    case 's':
      if (control) {
        saveMapToFile();
        event.preventDefault();
      }
      break;
    case 'o':
      if (control) {
        loadMapFromFile();
        event.preventDefault();
      }
      break;
    case '[':
      brushSize = Math.max(brushSize - 1, 1);
      updateBrush();
      break;
    case ']':
      brushSize = Math.max(brushSize + 1, 1);
      updateBrush();
      break;
    case 'p':
      cycleBrushHead();
      updateBrush();
      break;
    case 'v':
      toolState.switchToolType(toolDefinition.pointer.type);
      break;
    case 'b':
      toolState.switchToolType(toolDefinition.terrain.type);
      break;
    case 'n':
      toolState.switchToolType(toolDefinition.structures.type);
      break;
    case 'm':
      toolState.switchToolType(toolDefinition.path.type);
      break;
    case '/':
      console.log(encodeMap());
      break;
    case 'z':
      if (control && shift) {
        redo();
      }
      else if (control) {
        undo();
      }
      break;
  }
  if (prevActiveTool == toolState.activeTool) {
    toolState.activeTool.definition.onKeyDown(event);
  }
  onUpdateColor();
};

function encodeMap() {
    var o = objectMap(state.drawing, function(pathItem) {
    var p;
    if (pathItem._children) {
      p = pathItem._children.map(function(path) {
        return path._segments.map(function(s) {
          var c = s._point;
          return {
            x: Math.round(c.x),
            y: Math.round(c.y)
          };
        })
      });
    } else {
      p = pathItem._segments.map(function(s) {
        var c = s._point;
        return {
          x: Math.round(c.x),
          y: Math.round(c.y)
        };
      });
    }
    return p;
  });
  return JSON.stringify(o);
}

function decodeMap(json) {
  mapLayer.activate();
  return objectMap(json, function(colorData, color) {
    // if array of arrays, make compound path
    var p;
    if (colorData[0].x) {
      // normal path
      p = new Path(colorData);
    } else {
      p = new CompoundPath({
        children: colorData.map(function(pathData) {
          return new Path(pathData);
        }),
      });
    }
    p.locked = true;
    p.fillColor = color;
    return p;
  })
}

// ===============================================
// PATH DRAWING

var paintTools = {
  grid: 'grid',
  diagonals: 'diagonals',
  freeform: 'freeform',
};
var paintTool = paintTools.grid;

// Create a new path once, when the script is executed:
var myPath;

function startDraw(event) {
  switch (paintTool) {
    case paintTools.grid:
      startDrawGrid(event.point);
      break;
    case paintTools.diagonals:
      break;
    case paintTools.freeform:
      myPath = new Path();
      myPath.strokeColor = paintColor;
      myPath.strokeWidth = 10;
      break;
  }
}

function draw(event) {
  switch (paintTool) {
    case paintTools.grid:
      drawGrid(event.point);
      break;
    case paintTools.diagonals:
      break;
    case paintTools.freeform:
      // Add a segment to the path at the position of the mouse:
      myPath.add(event.point);
      myPath.smooth({
        type: 'catmull-rom'
      });
      break;
  }
}

function endDraw(event) {
  switch (paintTool) {
    case paintTools.grid:
      endDrawGrid(event.point);
      break;
    case paintTools.diagonals:
      break;
    case paintTools.freeform:
      break;
  }
}

function changePaintTool(newPaintTool) {
  paintTool = newPaintTool;
}


// ===============================================
// PIXEL FITTING
// TODO: have a way to convert back to the original path
// - save the original strokes, the pixelation is basically a filter on top
function fitToPixels() {

}


// ===============================================
// SHAPE DRAWING

// Draw a specified shape on the pixel grid


// ===============================================
// PIXEL COORDINATE HELPERS

var mapMargin = 0.1;
var horizontalBlocks = 7;
var verticalBlocks = 6;
var horizontalDivisions = 16;
var verticalDivisions = 16;
var verticalRatio = 1; //0.767;

var cellWidth = 0;
var cellHeight = 0;
var marginX = 0;
var marginY = 0;

//var remapX = function(i) {
//  return i
//};
//var remapY = function(i) {
//  return i
//};
//var remapInvX = function(i) {
//  return i
//};
//var remapInvY = function(i) {
//  return i
//};
resizeCoordinates();

var mapRatio = ((horizontalBlocks * horizontalDivisions) / (verticalBlocks * verticalDivisions)) / verticalRatio;
function resizeCoordinates() {
  var screenRatio = view.size.width / view.size.height;
  var horizontallyContrained = (screenRatio <= mapRatio);

  // todo - clean this up with less code duplication
  if (horizontallyContrained) {
    marginX = view.size.width * 0.1;

    var width = view.size.width - marginX * 2;
    var blockWidth = width / horizontalBlocks;
    cellWidth = blockWidth / horizontalDivisions;
    cellHeight = cellWidth * verticalRatio;
    var blockHeight = cellHeight * verticalDivisions;
    var height = blockHeight * verticalBlocks;

    marginY = (view.size.height - height) / 2;

    //var xView = view.size.width - marginX;
    //var xCoord = horizontalBlocks * horizontalDivisions;

    //var yView = height + marginX;
    //var yCoord = verticalBlocks * verticalDivisions;

    //remapX = createRemap(marginX, xView, 0, xCoord);
    //remapY = createRemap(marginY, yView, 0, yCoord);
    //remapInvX = createRemap(0, xCoord, marginX, xView);
    //remapInvY = createRemap(0, yCoord, marginY, yView);
  } else {
    marginY = view.size.height * 0.1;

    var height = view.size.height - marginY * 2;
    var blockHeight = height / verticalBlocks;
    cellHeight = blockHeight / verticalDivisions;
    cellWidth = cellHeight / verticalRatio;
    var blockWidth = cellWidth * horizontalDivisions;
    var width = blockWidth * horizontalBlocks;

    marginX = (view.size.width - width) / 2;
  }
  

  mapLayer.position = new Point(marginX, marginY);
  mapLayer.scaling = new Point(cellWidth, cellHeight);

  mapOverlayLayer.position = new Point(marginX, marginY);
  mapOverlayLayer.scaling = new Point(cellWidth, cellHeight);

  mapIconLayer.position = new Point(marginX, marginY);
  mapIconLayer.scaling = new Point(cellWidth, cellHeight);
}

function viewToMap(viewCoordinate) {
  return new Coordinate(
    remapX(viewCoordinate.x),
    remapY(viewCoordinate.y));
}

function mapToView(canvasCoordinate) {
  return new Point(
    remapInvX(canvasCoordinate.x),
    remapInvY(canvasCoordinate.y));
}

// ===============================================
// GRID overlay

mapOverlayLayer.activate();
var gridRaster;
createGrid();

function createGrid() {
  mapOverlayLayer.activate();
  if (gridRaster) gridRaster.remove();
  var grid = [];
  for (var i = 0; i < horizontalBlocks * horizontalDivisions; i++) {
    var line = createGridLine(getSegment(i, true), i % horizontalDivisions == 0);
    grid.push(line);
  }
  for (var i = 0; i < verticalBlocks * verticalDivisions; i++) {
    var line = createGridLine(getSegment(i, false), i % verticalDivisions == 0);
    grid.push(line);
  }
  var gridGroup = new Group(grid);
  gridRaster = gridGroup.rasterize(view.resolution * 10);
  gridGroup.remove();
  mapLayer.activate();
  gridRaster.locked = true;
}

function createGridLine(segment, blockEdge) {
  line = new Path(segment);
  line.strokeColor = '#ffffff';
  line.strokeWidth = blockEdge ? .2 : 0.1;
  line.strokeCap = 'round';
  //line.dashArray = blockEdge ? [4, 6] : null;
  line.opacity = blockEdge ? 0.5 : 0.3;
  return line;
}

function getSegment(i, horizontal) {
  return horizontal ? [new Point(i, 0), new Point(i, verticalBlocks * verticalDivisions)] : [new Point(0, i), new Point(horizontalBlocks * horizontalDivisions, i)];
}
/*function updateSegments() {
    for (var i = 0; i < horizontalBlocks * horizontalDivisions; i++) {
        var segmentPoints = getSegment(i, true);
        grid[i].segments[0].point = segmentPoints[0];
        grid[i].segments[1].point = segmentPoints[1];
    }
    for (var v = 0; v < verticalBlocks * verticalDivisions; v++) {
        var segmentPoints = getSegment(v, false);
        grid[i + v].segments[0].point = segmentPoints[0];
        grid[i + v].segments[1].point = segmentPoints[1];
    }
}*/

// ===============================================
// COORDINATE LABEL

mapOverlayLayer.activate();
//var coordinateLabel = new PointText(new Point(0, 0));
//coordinateLabel.fontSize = 3;

function centerBrushOffset(width, height) {
  return new Point(width * 0.5 * cellWidth, height * 0.5 * cellHeight);
}

var brushSize = 1;
var brushSegments;
var brush = new Path();
var brushOutline = new Path();

var brushTypes = {
  square: 'square',
  diamond: 'diamond',
};
var brushType = brushTypes.square;
updateBrush();

function cycleBrushHead() {
  var heads = Object.keys(brushTypes).sort(function(a, b) {
    return a == b ? 0 : a < b ? -1 : 1;
  });
  var index = heads.indexOf(brushType);
  brushType = heads[(index + 1) % heads.length];
}

function updateBrush() {
  brushSegments = getBrushSegments(brushSize);

  var prevPos = brushOutline.position;

  brush.layer = uiLayer;
  brush.segments = brushSegments;
  brush.pivot = new Point(brushSize / 2 - 0.5, brushSize / 2 - 0.5);
  brush.position = prevPos;
  brush.opacity = 0.5;
  brush.closed = true;
  brush.fillColor = paintColor;
  brush.locked = true;

  brushOutline.segments = brushSegments;
  brushOutline.position = prevPos;
  brushOutline.closed = true;
  brushOutline.strokeColor = '#fff';
  brushOutline.strokeWidth = 0.1;
  brushOutline.locked = true;
}

function updateCoordinateLabel(event) {
  var rawCoordinate = mapOverlayLayer.globalToLocal(event.point);
  var coordinate = rawCoordinate.floor();
  //coordinateLabel.content = '' + event.point + '\n' + coordinate.toString();
  //coordinateLabel.position = rawCoordinate;

  brushOutline.position = rawCoordinate;

  brush.position = coordinate;
}

function getBrushSegments(size, centered) {
  // square
  var sizeX = size;
  var sizeY = size;
  var offset = centered ?
    new Point(sizeX * -0.5, sizeY * -0.5) :
    new Point(0, 0);
  switch (brushType) {
    case brushTypes.square:
      return [
        offset,
        offset.add([0, sizeY]),
        offset.add([sizeX, sizeY]),
        offset.add([sizeX, 0]),
      ];
    case brushTypes.diamond:
      return [
        offset.add([sizeX * 0.5, sizeY]),
        offset.add([sizeX, sizeY * 0.5]),
        offset.add([sizeX * 0.5, 0]),
        offset.add([0, sizeY * 0.5]),
      ];
  }
}

function transformSegments(segments, coordinate) {
  var p = coordinate;
  return segments.map(function(s) {
    return s + p
  });
}

// ===============================================
// STATE AND HISTORY

// command pattern
// draw {
//   contains delta segments for each affected layer
// }
// 

function loadTemplate() {
  return decodeMap(template);
}

mapLayer.activate();
var state = {
  index: -1,
  // TODO: max history
  history: [],
  drawing: loadTemplate(),
};
var maxHistoryIndex = 99; // max length is one greater than this

function addToHistory(command) {
  state.index += 1;
  // remove future history if went back in time and made an edit
  if (state.index < state.history.length) {
    var removeNum = state.history.length - state.index;
    state.history.splice(-removeNum, removeNum);
  }

  // limit the amount of saved history to reduce memory
  if (state.index > maxHistoryIndex) {
    var removeNum = state.index - maxHistoryIndex;
    state.history.splice(0, removeNum); 
    state.index -= removeNum;
  }
  state.history[state.index] = command;
}

function setNewMapData(pathObject) {
  Object.keys(state.drawing).forEach(function(p){
    state.drawing[p].remove();
  });
  state.drawing = pathObject;
}

function undo() {
  if (state.index >= 0) {
    applyCommand(false, state.history[state.index]);
    state.index -= 1;
  } else {
    console.log('Nothing to undo');
  }
}

function redo() {
  if (state.index < state.history.length - 1) {
    state.index += 1;
    applyCommand(true, state.history[state.index]);
  } else {
    console.log('Nothing to redo');
  }
}

function applyCommand(isApply, command) {
  // if (draw command)
  switch(command.type) {
    case 'draw':
      applyDiff(isApply, command.data);
      break;
    case 'object':

      break;
  }
}

function drawCommand(drawData) {
  return {
    type: 'draw',
    data: drawData,
  }
}

function objectCommand(objectData) {
  return {
    type: 'object',
    data: objectData,
  }
}

// ===============================================
// DRAWING METHODS


//var drawPoints = [];

var prevGridCoordinate;
var prevDrawCoordinate;

var diffCollection = {};

function startDrawGrid(viewPosition) {
  mapLayer.activate();
  var coordinate = mapLayer.globalToLocal(viewPosition);
  prevGridCoordinate = coordinate;
  drawGrid(viewPosition);
}

function drawGrid(viewPosition) {
  mapLayer.activate();
  var coordinate = new Point(mapLayer.globalToLocal(viewPosition));

  var drawPaths = [];
  doForCellsOnLine(
    prevGridCoordinate.x, prevGridCoordinate.y,
    coordinate.x, coordinate.y,
    function(x, y) {
      var p = getDrawPath(new Point(x, y).floor());
      if (p) drawPaths.push(p);
    });

  var path; 
  if (drawPaths.length == 1) {
    path = drawPaths[0];
  }
  else if (drawPaths.length > 1) {
    var compound = new CompoundPath({children: drawPaths});
    path = uniteCompoundPath(compound);
  }
  if (path) {
    var diff = getDiff(path, paintColor);

    Object.keys(diff).forEach(function(c) {
      if (!diffCollection.hasOwnProperty(c)) {
        diffCollection[c] = [];
      }
      diffCollection[c].push(diff[c]);
    });
    applyDiff(true, diff);
  }

  prevGridCoordinate = coordinate;
}

function endDrawGrid(viewPosition) {
  var mergedDiff = {};
  Object.keys(diffCollection).forEach(function(k) {
    mergedDiff[k] = uniteCompoundPath(
      new CompoundPath({children: diffCollection[k]})
    );
  });
  diffCollection = {};
  if (Object.keys(mergedDiff).length > 0) {
    addToHistory(drawCommand(mergedDiff));
  }
}

function uniteCompoundPath(compound) {
  var p = new Path();
  compound.children.forEach(function(c) {var u = p.unite(c); p.remove(); p = u});
  compound.remove();
  return p;
}

function getDrawPath(coordinate, drawPath) {
  if (coordinate != prevDrawCoordinate) {
    prevDrawCoordinate = coordinate;
    var drawPoints = transformSegments(brushSegments, coordinate);
    
    var p = new Path(drawPoints);
    return p;
  }
}

// use for the vertex based drawing method for later
/*
function drawGridCoordinate(coordinate) {
  var newDrawPoints = transformSegments(brushSegments, coordinate);

  if (!newDrawPoints.equals(drawPoints)) {
    drawPoints = newDrawPoints;
    addDrawPoints(drawPoints, paintColor);
  }
}*/

function getDiff(path, color) {
  mapLayer.activate();
  if (!state.drawing.hasOwnProperty(color)) {
    state.drawing[color] = new Path();
    state.drawing[color].locked = true;
  }
  
  var diff = {};
  var delta = path.subtract(state.drawing[color]);
  if (delta.children || (delta.segments && delta.segments.length > 0)) {
    diff[color] = delta;
  }
  delta.remove();
  return diff;
}

function applyDiff(isApply, diff) {
  Object.keys(diff).forEach(function(color) {
    applyPath(isApply, diff[color], color);
  })
}


function applyPath(isApply, path, color) {
  if (!state.drawing.hasOwnProperty(color)) {
    state.drawing[color] = new Path();
    state.drawing[color].locked = true;
  }
  var combined = isApply
    ? state.drawing[color].unite(path)
    : state.drawing[color].subtract(path);
  combined.locked = true;
  combined.fillColor = color;
  combined.insertAbove(state.drawing[color]);

  state.drawing[color].remove();
  path.remove();

  state.drawing[color] = combined;
}

// ===============================================
// HELPERS

function addObjectArray(object, key, value) {
  if (!object.hasOwnProperty(key)) {
    object[key] = [];
  }
  object[key].push(value);
}

function createRemap(inMin, inMax, outMin, outMax) {
  return function remap(x) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  };
}

function doForCellsOnLine(x0, y0, x1, y1, setPixel) {
  var interval = 0.2;

  if (Math.abs(x0 - x1) + Math.abs(y0 - y1) < 0.2) {
    setPixel(x0, y0);
    return;
  }

  var p0 = new Point(x0, y0);
  var p1 = new Point(x1, y1);
  var delta = p1 - p0;
  var slope = delta.normalize() * interval;

  var prevCellPoint = null;
  var totalLength = delta.length;
  var length = 0;

  do {
    var cellPoint = p0.floor();
    if (prevCellPoint != cellPoint) {
      setPixel(cellPoint.x, cellPoint.y);
      prevCellPoint = cellPoint;
    }
    p0 += slope;
    length += interval;
  } while (length < totalLength)
}

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

// https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
Array.prototype.equals = function(array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time 
  if (this.length != array.length)
    return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

function objectMap(object, mapFn) {
  return Object.keys(object).reduce(function(result, key) {
    result[key] = mapFn(object[key], key)
    return result
  }, {})
}
