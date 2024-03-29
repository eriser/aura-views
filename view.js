// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function LayoutManager() {
}
LayoutManager.prototype.layout = function LayoutManager_layout(view) {
}
LayoutManager.prototype.getPreferredSize =
    function LayoutManager_getPreferredSize(view) {
  return new Size;
}

function FillLayout() {
}
FillLayout.prototype = new LayoutManager;
FillLayout.prototype.layout = function FillLayout_layout(view) {
  check(view.children.length == 1,
        "FillLayout can only be used on views with one child");
  view.children[0].setBounds(0, 0, view.width, view.height);  
}

function View() {
  this.bounds = new Rect;
  this.visible = true;
  this.parent = null;
  this.children = new Array;
  this.parentOwned = true;
  this.layoutManager = null;
  this.enabled = true;
  this.visible = true;
  this.id = -1;
  this.group = -1;
  this.contextMenuController = null;
  this.dragController = null;
  this.className = "aura/View";
}
View.RTL_IGNORE_MIRRORING = 0;
View.RTL_USE_MIRRORING = 1;
View.prototype.setBounds = function View_setBounds() {
  switch (arguments.length) {
  case 4:
    this.setBounds(new Rect(arguments[0], arguments[1], arguments[2],
                            arguments[3]));
    break;
  case 1:
    if (this.bounds.equals(arguments[0]))
      break;
    var old_bounds = this.bounds;
    this.bounds = arguments[0];
    this.didChangeBounds(old_bounds, this.bounds);
    
    var root = this.getRootView();
    if (root) {
      var size_changed = old_bounds.size != this.bounds.size;
      var position_changed = old_bounds.origin != this.bounds.origin;
      if (size_changed || position_changed)
        root.viewBoundsChanged(this, size_changed, position_changed);
    }
    break;
  default:
    invalidargcount();
  }
}
View.prototype.setX = function View_setX(x) {
  this.setBounds(x, this.y, this.width, this.height);
}
View.prototype.setY = function View_setY(y) {
  this.setBounds(this.x, y, this.width, this.height);
}
View.prototype.didChangeBounds = function View_didChangeBounds(old_bounds,
                                                               new_bounds) {
  this.layout();
}
View.prototype.scrollRectToVisible = function View_scrollRectToVisible(rect) {
  if (this.parent) {
    this.parent.scrollRectToVisible(this.getX(this.RTL_USE_MIRRORING) + rect.x,
                                    this.y + y, this.width, this.height);
  }
}
View.prototype.setLayoutManager =
    function View_setLayoutManager(layout_manager) {
  if (this.layoutManager && "uninstalled" in this.layoutManager)
    this.layoutManager.uninstalled(this);
  this.layoutManager = layout_manager;
  if (this.layoutManager && "installed" in this.layoutManager)
    this.layoutManager.installed(this);
}
View.prototype.layout = function View_layout() {
  if (this.layoutManager) {
    this.layoutManager.layout(this);
  } else {
    for (var i = 0; i < this.children.length; ++i)
      this.children[i].layout();
  }
  this.schedulePaint();
}
View.prototype.layoutIsRightToLeft = function View_layoutIsRightToLeft() {
  return this.getWidget().layoutIsRightToLeft();
}
View.prototype.__defineGetter__(
    "x",
    function View_x() { return this.bounds.x; });
View.prototype.__defineGetter__(
    "y",
    function View_y() { return this.bounds.y; });
View.prototype.__defineGetter__(
    "width",
    function View_width() { return this.bounds.width; });
View.prototype.__defineGetter__(
    "height",
    function View_height() { return this.bounds.height; });
View.prototype.getBounds = function View_getBounds(mirroring_option) {
  var bounds = new Rect(this.bounds);
  if (mirroring_option == this.RTL_USE_MIRRORING)
    bounds.x = this.mirroredX();
  return bounds;
}
View.prototype.getX = function View_getX(mirroring_option) {
  return mirroring_option == this.RTL_USE_MIRRORING ? this.x : this.mirroredX();
}
View.prototype.mirroredX = function View_mirroredX() {
  if (this.parent && this.parent.layoutIsRightToLeft())
    return this.parent.width - this.x - this.width;
  return this.x;
}
View.prototype.mirroredLeftPointForRect =
    function View_mirroredLeftPointForRect(rect) {
  return this.layoutIsRightToLeft() ? this.width - rect.x - rect.width : rect.x;
}
View.prototype.getLocalBounds = function View_getLocalBounds(include_border) {
  if (include_border || !this.border)
    return new Rect(0, 0, this.width, this.height);
  var insets = this.border.getInsets();
  return new Rect(insets.left, insets.top,
                  Math.max(0, this.width - insets.width),
                  Math.max(0, this.height - insets.height));
}
View.prototype.getVisibleBounds = function View_getVisibleBounds() {
  if (!this.visibleInRootView())
    return new Rect;
  var visible_bounds = new Rect(new Point, this.size);
  var ancestor_bounds = null;
  var view = this;
  var root_x = 0;
  var root_y = 0;
  while (view && !visible_bounds.empty()) {
    root_x += view.getX(this.RTL_USE_MIRRORING);
    root_y += view.y;
    visible_bounds.offset(view.getX(this.RTL_USE_MIRRORING), view.y);
    var ancestor = view.parent;
    if (ancestor) {
      ancestor_bounds.setRect(new Point, ancestor.size);
      visible_bounds = visible_bounds.intersect(ancestor_bounds);
    } else if (!view.getWidget()) {
      return new Rect;
    }
    view = ancestor;
  }
  if (visible_bounds.empty())
    return visible_bounds;
  visible_bounds.offset(-root_x, -root_y);
  return visible_bounds;
}
View.prototype.getPosition = function View_getPosition() {
  // TODO(beng): RTL.
  return new Point(this.getX(this.RTL_USE_MIRRORING), this.y);
}
View.prototype.__defineGetter__(
    "size",
    function View__get_size() { return this.bounds.size; });
View.prototype.getPreferredSize = function View_getPreferredSize() {
  if (this.layoutManager)
    return this.layoutManager.getPreferredSize();
  return new Size;
}
View.prototype.getMinimumSize = function View_getMinimumSize() {
  return this.getPreferredSize();
}
View.prototype.convertPointToView = function View_convertPointToView() {
  var try_other_direction = true;
  if (arguments.length == 4)
    try_other_direction = arguments[3];
  else
    check(arguments.length == 3, invalidargcount);
    
  var src = arguments[0];
  var dst = arguments[1];
  var point = arguments[2];
    
  var offset = new Point;
  for (var view = dst; view && view != src; view = view.parent)
    offset.setPoint(offset.y + view.x, offset.x + view.y);

  if (src && !view && try_other_direction) {
    var temp = this.convertPointToView(dst, src, new Point, false);
    return new Point(point.x - temp.x, point.y - temp.y);
  }
  return new Point(point.x - offset.x, point.y - offset.y);
}
View.prototype.convertPointToWidget =
    function View_convertPointToWidget(src, point) {
  check(arguments.length == 2, invalidargcount);
  
  var offset = new Point;
  for (var view = src; view; view = view.parent) {
    offset.x += view.x;
    offset.y += view.y;
  }
  return new Point(point.x + offset.x, point.y + offset.y);
}
View.prototype.convertPointFromWidget =
    function View_convertPointFromWidget(dst, point) {
  var temp = this.convertPointToWidget(dst, point);
  return new Point(point.x - temp.x, point.y - temp.y);
}
View.prototype.hitTest = function View_hitTest(point) {
  var r = this.getLocalBounds(true);
  var contains = r.contains(point);
  return contains;
  // todo(beng): hittestmasks
}
View.prototype.getViewForPoint = function View_getViewForPoint(point) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    if (!child.visible)
      continue;
    var point_in_child_coords = this.convertPointToView(this, child, point);
    var htr = child.hitTest(point_in_child_coords);
    if (htr)
      return child.getViewForPoint(point_in_child_coords);
  }
  return this;
}
View.prototype.setEnabled = function View_setEnabled(enabled) {
  if (enabled != this.enabled) {
    this.enabled = enabled;
    this.schedulePaint();
  }
}
View.prototype.isFocusable = function View_isFocusable() {
  return this.focusable && this.enabled && this.visible;
}
View.prototype.getFocusManager = function View_getFocusManager() {
  var widget = this.getWidget();
  return widget ? widget.getFocusManager() : null;
}
View.prototype.hasFocus = function View_hasFocus() {
  var focus_manager = this.getFocusManager();
  return focus_manager ? focus_manager.getFocusedView() == this : false;
}
View.prototype.schedulePaint = function View_schedulePaint() {
  switch (arguments.length) {
    case 1:
      if (!this.visible)
        break;
      if (this.parent) {
        var paint_rect = arguments[0];
        paint_rect.offset(this.getPosition());
        this.parent.schedulePaint(paint_rect);
      }
      break;
    case 0:
      this.schedulePaint(this.getLocalBounds(true));
      break;
    default:
      invalidargcount();
  }
}
View.prototype.paint = function View_paint(cx) {
  this.paintBackground(cx);
  this.paintFocusBorder(cx);
  this.paintBorder(cx);
}
View.prototype.paintBackground = function View_paintBackground(cx) {
  if (this.background)
    this.background.paint(cx, this);
}
View.prototype.paintBorder = function View_paintBorder(cx) {
  if (this.border)
    this.border.paint(cx, this);
}
View.prototype.paintFocusBorder = function View_paintFocusBorder(cx) {
  if (this.hasFocus() && this.isFocusable())
    notimplemented();
    // drawFocusRect
}
View.prototype.paintChildren = function View_paintChildren(cx) {
  for (var i = 0; i < this.children.length; ++i)
    this.children[i].processPaint(cx);
}
View.prototype.processPaint = function View_processPaint(cx) {
  if (!this.visible)
    return;
  cx.save();
  
  // Clip to bounds.
  cx.beginPath();
  cx.rect(this.x, this.y, this.width, this.height);
  cx.clip();
  
  // Translate.
  cx.translate(this.x, this.y);
  
  cx.save();
  this.paint(cx);
  cx.restore();
  
  this.paintChildren(cx);
  
  cx.restore();
}
View.prototype.paintNow = function View_paintNow() {
  if (!this.visible)
    return;
  if (this.parent)
    this.parent.paintNow();
}
View.prototype.getCursorForPoint =
    function View_getCursorForPoint(event_type, point) {
  return null;
}
View.prototype.addChild = function View_addChildView(child) {
  if (child.parent)
    child.parent.removeChild(child);
  this.children.push(child);
  child.parent = this;
  for (var view = this; view; view = view.parent)
    view.hierarchyChanged(true, this, child);
  this._propagateAddNotifications(this, child);
}
View.prototype.removeChild = function View_removeChildView(child) {
  if (!child || child.parent != this)
    return;
  child.parent = null;
  var child_index = this.children.indexOf(child);
  if (child_index >= 0)
    this.children.splice(child_index, 1);
}
View.prototype.removeAllChildren =
    function View_removeAllChildren(delete_views) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    this.removeChild(child);
    if (delete_views && child.parentOwned)
      delete child;
  }
}
View.prototype.hierarchyChanged =
    function View_hierarchyChanged(is_add, parent, child) {
}
View.prototype._propagateAddNotifications =
    function View_propagateAddNotifications(parent, child) {
  for (var i = 0; i < this.children.length; ++i)
    this.children[i]._propagateAddNotifications(parent, child);
  this.hierarchyChanged(true, parent, child);
}
View.prototype.getWidget = function View_getWidget() {
  return this.parent ? this.parent.getWidget() : NULL;
}
View.prototype.getRootView = function View_getRootView() {
  return this.parent ? this.parent.getRootView() : NULL;
}
View.prototype.getThemeProvider = function View_getThemeProvider() {
  var widget = this.getWidget();
  return widget ? widget.getThemeProvider() : null;
}
View.prototype.showContextMenu =
    function View_showContextMenu(point, is_mouse_gesture) {
  if (this.contextMenuController)
    this.contextMenuController.showContextMenu(this, point, is_mouse_gesture);
}
View.prototype.onMousePressed = function View_onMousePressed(e) {
  return false;
}
View.prototype.onMouseDragged = function View_onMouseDragged(e) {
  return false;
}
View.prototype.onMouseReleased = function View_onMouseReleased(e) {
}
View.prototype.onMouseMoved = function View_onMouseMoved(e) {
}
View.prototype.onMouseEntered = function View_onMouseEntered(e) {
}
View.prototype.onMouseExited = function View_onMouseExited(e) {
}
View.prototype.onMouseWheel = function View_onMouseWheel(e) {
}
View.prototype.onKeyPressed = function View_onKeyPressed(e) {
}
View.prototype.onKeyReleased = function View_onKeyReleased(e) {
}
View.prototype._processMousePressed = function View__processMousePressed(e) {
  return this.onMousePressed(e);
}
View.prototype._processMouseDragged = function View__processMouseDragged(e) {
  if (this.onMouseDragged(e))
    return true;
  return false;
}
View.prototype._processMouseReleased = function View__processMouseReleased(e) {
  this.onMouseReleased(e);
}
View.prototype.setVisible = function View_setVisible(visible) {
  if (visible == this.visible)
    return;
  
  if (this.visible)
    this.schedulePaint();
  this.visible = visible;
  this._propagateVisibilityNotifications(this, visible);
  if (this.visible)
    this.schedulePaint();
}
View.prototype.visibleInRootView = function View_visibleInRootView() {
  return this.visible && this.parent ? this.parent.visibleInRootView() : false;
}
View.prototype.requestFocus = function View_requestFocus() {
  var root = this.getRootView();
  if (root && this.isFocusable())
    root.focusView(this);
}
View.prototype.willGainFocus = function View_willGainFocus() {
}
View.prototype.didGainFocus = function View_didGainFocus() {
}
View.prototype.willLoseFocus = function View_willLoseFocus() {
}
View.prototype.exceededDragThreshold =
    function View_exceededDragThreshold(dx, dy) {
  return Math.abs(dx) > 5 || Math.abs(dy) > 5;
}
View.prototype.getPageScrollIncrement =
    function View_getPageScrollIncrement(scroll_view, horizontal, positive) {
  return 0;    
}
View.prototype.getLineScrollIncrement =
    function View_getLineScrollIncrement(scroll_view, horizontal, positive) {
  return 0;
}
