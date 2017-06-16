var doc = app.activeDocument;
var docLayersLength = doc.layers.length;
var rootLayers = [];
var pathsManifest = {
   base: {
       name: "Base",
       idArray: []
   },
   secondary: {
       name: "Secondary",
       idArray: []
   },
   tertiary: {
       name: "Tertiary",
       idArray: []
   }
}
 
// indexOf does not work with ExtendScript https://forums.adobe.com/thread/1311522 - courtesy of Michael Hale
if (typeof Array.prototype.indexOf !== "function") { 
   Array.prototype.indexOf = function (item) { 
       for(var i = 0; i < this.length; i++) if(item === this[i]) return i; 
       return -1; 
   } 
}
 
 
createDialog();
 
function hexToRGB(hex) {
   var r = hex >> 16;
   var g = hex >> 8 & 0xFF;
   var b = hex & 0xFF;
 
   return {
       red: r,
       green: g,
       blue: b
   };
};
 
function chooseColor() {
   var colorDecimal = $.colorPicker();
   var colorHexadecimal = colorDecimal.toString(16);
   var colorRGBValue = hexToRGB(parseInt(colorHexadecimal, 16));
   return colorRGBValue;
}
 
function setColorOnPaths(itemIdArray, colorToSet) {
   for (var i = 0; i < itemIdArray.length; i++) {
       var item = doc.pathItems.getByName(itemIdArray[i]);
       if (item) {
           item.fillColor.red = colorToSet.red;
           item.fillColor.green = colorToSet.green;
           item.fillColor.blue = colorToSet.blue;
       }
   }
}
 
function getRootLayers() {
   for (var i = 0; i < docLayersLength; i++) {
       var layer = doc.layers[i];
       rootLayers.push(layer.name);
   }
}
 
function createTabsAndPopulatePanels(dialog, pathIdArray) {
   for (var i = 0; i < rootLayers.length; i++) {
       var rootlayer = doc.layers[i];
       var sublayers = rootlayer.layers;
       
       dialog.tabs[i] = dialog.tabGroup.add ('group');
       
       for(var ii = 0; ii < sublayers.length; ii++) {
            if (sublayers[ii].name === "DELETE") {
                continue;
            }
           
           dialog.tabs[i].add ('statictext', undefined, sublayers[ii].name);
           dialog.tabs[i].add ('panel');
           
           var pathItems = sublayers[ii].pathItems;
           
           
           for (var iii = 0; iii < pathItems.length; iii++) {
               var pathItemName = pathItems[iii].name;
               var checkbox = dialog.tabs[i].add("checkbox", undefined, pathItemName);

               if (pathIdArray.indexOf(pathItemName) !== -1) {
                   checkbox.value = true;
               }

               checkbox.onClick = function() {
                   var isChecked = this.value;
                   var checkboxName = this.text;
                   var index = pathIdArray.indexOf(checkboxName)
                   if (isChecked) {
                       if (index === -1) {
                           pathIdArray.push(checkboxName);
                       }
                   } else {
                        if (index !== -1) {
                           pathIdArray.splice(index, 1);
                       }
                   }
               }
           }
       }
   }
}
 
function createLayersDialog(pathIdArray) {
   var layersDialog = new Window('dialog {text: "' + pathIdArray.name + ' Color", orientation: "column", alignChildren:["fill","fill"], properties: {closeButton: false}}');
   layersDialog.main = layersDialog.add('group {preferredSize: [600, 500], alignChildren: ["left","fill"]}');
   layersDialog.listBoxItem = layersDialog.main.add('listbox', undefined, rootLayers);
   layersDialog.listBoxItem.preferredSize.width = 150;
   layersDialog.tabGroup = layersDialog.main.add('group {alignment: ["fill","fill"], orientation: "stack"}');
   layersDialog.tabs = [];
 
   createTabsAndPopulatePanels(layersDialog, pathIdArray.idArray);
 
   layersDialog.buttons = layersDialog.add('group {alignment: "right"}');
   layersDialog.buttons.add('button {text: "OK"}');
   layersDialog.buttons.add('button {text: "Cancel"}');
 
   for (var i = 0; i < layersDialog.tabs.length; i++) {
       layersDialog.tabs[i].orientation = 'column';
       layersDialog.tabs[i].alignChildren = 'fill';
       layersDialog.tabs[i].alignment = ['fill','fill'];
       layersDialog.tabs[i].visible = false;
   }
 
   layersDialog.listBoxItem.onChange = showTab;
   function showTab() {
       if (layersDialog.listBoxItem.selection !== null) {
           for (var i = layersDialog.tabs.length-1; i >= 0; i--) {
               layersDialog.tabs[i].visible = false;
           }
           layersDialog.tabs[layersDialog.listBoxItem.selection.index].visible = true;
       }
   }
   layersDialog.onShow = function () {
       layersDialog.listBoxItem.selection = 0;
       showTab;
   }
 
   layersDialog.center();
   layersDialog.show();
}

function setColorOnPreviewBlock(panel, color) {
    var g = panel.graphics;
    var formatRGBColor = [color.red/255,color.green/255,color.blue/255];
    g.backgroundColor = g.newBrush(g.BrushType.SOLID_COLOR, formatRGBColor);
}

function createColorButtons(colorName, dialogName, pathIdArray) {
   var colorPanel = dialogName.add("panel", undefined, pathIdArray.name);
   colorPanel.orientation = "row";
   colorPanel.alignChildren = ["fill", "fill"];
 
   var showSelectedColorPanel = colorPanel.add("panel");
   showSelectedColorPanel.size = [50, 20];
   showSelectedColorPanel.orientation = "row";
 
   var colorButton = colorPanel.add("button", undefined, "Colour");
   colorButton.onClick = function() {
       var color = new RGBColor();
       color = chooseColor();
       setColorOnPreviewBlock(showSelectedColorPanel, color);
       setColorOnPaths(pathIdArray.idArray, color);
       app.redraw();
   };
 
   var selectBaseLayersButton = colorPanel.add("button", undefined, "Layers");
   selectBaseLayersButton.onClick = function() {
       createLayersDialog(pathIdArray);
   }
}
 
function createDialog() {
 
   //TODO: create a treeview of the layers that have been selected
 
   getRootLayers();
 
   var dialog = new Window( "dialog", "Colour Selection", undefined );
   dialog.orientation = "column";
   dialog.alignChildren = ["fill", "fill"];
 
   createColorButtons( "Base Color", dialog, pathsManifest.base);
   createColorButtons( "Secondary Color", dialog, pathsManifest.secondary);
   createColorButtons( "Tertiary Color", dialog, pathsManifest.tertiary);
 
   dialog.center();
   dialog.show();
}
