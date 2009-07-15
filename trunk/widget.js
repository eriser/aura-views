// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function EventHandler(name, handler) {
  this.name = name;
  this.handler = handler;
}

function Widget() {
  this.rootView = null;
  this.canvas = null;
  this.themeProvider = null;
  this._hasCapture = false;
  this._isMouseDown = false;
}
Widget.prototype.init = function Widget_init(parent, bounds) {
  this.rootView = new RootView(this);
  this._removeEventHandlers();
  this.canvas = document.createElement("canvas");
  parent.addChildNode(canvas);
  this._addEventHandlers();
  this.resize();
  //this.focusManager = new FocusManager(this);
}
Widget.prototype.setContentsView = function Widget_setContentsView(contents_view) {
  this.rootView.setLayoutManager(new FillLayout);
  if (this.rootView.children.length > 0)
    this.rootView.removeAllChildren(true);
  this.rootView.addChild(contents_view);
  this.rootView.layout();
}
Widget.prototype.getBounds = function Widget_getBounds() {
  return new Rect(this.canvas.style.left, this.canvas.style.top,
                  this.canvas.style.width, this.canvas.style.height);
}
Widget.prototype.setBounds = function Widget_setBounds(bounds) {
  this.canvas.style.left = bounds.x;
  this.canvas.style.top = bounds.y;
  this.canvas.style.width = bounds.width;
  this.canvas.style.height = bounds.height;
  this.resize();  
}
Widget.prototype.hide = function Widget_hide() {
  this.canvas.style.display = 'none';
}
Widget.prototype.show = function Widget_show() {
  this.canvas.style.display = 'block';
}
Widget.prototype._callPaintNow = function Widget__callPaintNow(widget) {
  widget.paintNow();
}
Widget.prototype.paintNow = function Widget_paintNow() {
  var cx = this.canvas.getContext("2d");
  
  cx.save();
  
  // Clip painting ot the invalid region, or the bounds of the root view if
  // there is no invalid region.
  var clip_rect = this.rootView.invalidRect;
  if (clip_rect.empty())
    clip_rect = this.rootView.bounds;
  cx.beginPath();
  cx.rect(clip_rect.x, clip_rect.y, clip_rect.width, clip_rect.height);
  cx.clip();
  this.rootView.processPaint(cx);
  cx.restore();
  
  // Validate.
  this.rootView.invalidRect = new Rect;
}
Widget.prototype.resize = function Widget_resize() {
  if (!this.rootView.bounds.size.equals(new Size(this.canvas.width,
                                                 this.canvas.height))) {
    this.rootView.setBounds(0, 0, this.canvas.width, this.canvas.height);
    this.rootView.schedulePaint();
  }
}
Widget.prototype.setOpacity = function Widget_setOpacity(opacity) {
  this.canvas.style.opacity = opacity;
}
Widget.prototype._addEventHandlers = function Widget__addEventHandlers() {
  var self = this;
  this.canvas.addEventListener("keydown",
                               function(event) { self.onKeyDown(event); },
                               false);
  this.canvas.addEventListener("keypress",
                               function(event) { self.onKeyDown(event); },
                               false);
  this.canvas.addEventListener("keyup",
                               function(event) { self.onKeyUp(event); },
                               false);
  this.canvas.addEventListener("mousedown",
                               function(event) { self.onMouseDown(event); },
                               false);
  this.canvas.addEventListener("mousemove",
                               function(event) { self.onMouseMove(event); },
                               false);
  this.canvas.addEventListener("mouseup",
                               function(event) { self.onMouseUp(event); },
                               false);
  this.canvas.addEventListener("mouseout",
                               function(event) { self.onMouseOut(event); },
                               false);
  this.canvas.addEventListener("mouseover",
                               function(event) { self.onMouseOver(event); },
                               false);
}
Widget.prototype._removeEventHandlers = function Widget__removeEventHandlers() {
  if (!this.canvas)
    return;
    /*
  for (var i = 0; i < this._eventHandlers.length; ++i) {
    var handler = this._eventHandlers[i];
    this.canvas.removeEventListener(handler.name, handler.handler, false);
  }
  */
}
Widget.prototype.onKeyDown = function Widget_onKeyDown(event) {
}
Widget.prototype.onKeyPress = function Widget_onKeyPress(event) {
}
Widget.prototype.onKeyUp = function Widget_onKeyUp(event) {
}
Widget.prototype.onMouseDown = function Widget_onMouseDown(event) {
  if (this.rootView.onMousePressed(new MouseEvent(event))) {
    // setcapture?!
    this._hasCapture = true;
    this._isMouseDown = true;
  }                      
}
Widget.prototype.onMouseMove = function Widget_onMouseMove(event) {
  if (this._hasCapture && this._isMouseDown) {
    this.rootView.onMouseDragged(new MouseEvent(event));
  } else {
    this.rootView.onMouseMoved(new MouseEvent(event));
  }
}
Widget.prototype.onMouseUp = function Widget_onMouseUp(event) {
  // clean up capture?!
  this._hasCapture = false;
  this._isMouseDown = false;
  this.rootView.onMouseReleased(new MouseEvent(event));
}
Widget.prototype.onMouseOut = function Widget_onMouseOut(event) {
  this.rootView._processMouseExited();
}
Widget.prototype.onMouseOver = function Widget_onMouseOver(event) {
}
