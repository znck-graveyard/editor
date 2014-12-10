# Editor [![Build Status](https://secure.travis-ci.org/znck/editor.svg?branch=master)](https://travis-ci.org/znck/editor) [![GitHub version](https://badge.fury.io/gh/znck%2Feditor.svg)](http://badge.fury.io/gh/znck%2Feditor)

This is a minimalistic html editor.

## Demo
Try it [here](http://znck.github.io/editor/demo.html)

## Installation
Use `bower` to install the editor. Add following line to dependencies:

    "editor": "https://github.com/znck/editor.git"

## Documentation

**addOption**  
Type: `function(Extension extension, Object options)`  
Return type: `undefined`  
Create a new options menu entry for the extension with given options. `options` object 
is a map from button data to callback function.

```js
window.editor.addOption(someExtension, {
    /* '<button id>,[font awesome icon class],[additional html]': function(){} */
    'dummy-button,icon,html': function(selection) {}
});
```

**editor**  
Type: `function()`  
Return type: `Element` jQuery selector for editable element of the editor

**extensions**  
Type: `function()`  
Return type: `Extension[]` list of all loaded extensions  

**init**  
Type: `function()`  
Return type: `undefined`  
Normally, you should never call this function. It initiates the editor and creates required elements.

**menu**  
Type: `function()`  
Return type: `Element` jQuery selector for menu container element of the editor

**options**  
Type: `function()`  
Return type: `Element` jQuery selector for options menu element of the editor

**restoreSelection**  
Type: `function(Range[] savedSel)`  
Return type: `undefined`  
It loads the saved selection.

**saveSelection**  
Type: `function()`  
Return type: `Range[]` list of all selected ranges.  
It stores the current selection in an array and returns it.

**selection**  
Type: `function()`  
Return type: `Object`  
Structure of selection object:

```js
{
    selection: Selection,       // Current selection
    nodes: Node[],              // List of nodes, includes parent nodes of current selection
    blur: bool,                 // Is selection fading away?
    position: Object {          // Position of focused node
                top: number,
                left: number,
                right: number,
                bottom: number,
                width: number,
                height: number
              },
    event: Event,               // Event object (keyup or mouseup)
    isCollapsed: bool           // Is selection collapsed?
}
```

**surroundSelection**  
Type: `function(HTMLElement)`  
Return type: `undefined`  
It wraps current selection in the given element object.  

**topNode**  
Type: `function(Node)`  
Return type: `$(Node)` jQuery selection for the top most parent of the given node.

## Extensions
Editor supports extensions. `TODO: Complete extension documentation`  
