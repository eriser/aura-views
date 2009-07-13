// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function Viewport() {
}
Viewport.prototype = new View;
Viewport.prototype.scrollRectToVisible =
    function Viewport_scrollRectToVisible(x, y, width, height) {
  if (this.children.length == 0 || !this.parent)
    return;
  
  var contents = this.children[0];
  x -= contents.x;
  y -= contents.y;
  this.parent.scrollContentsRegionToBeVisible(x, y, width, height);
}

function ScrollView(horizontalScrollbar, verticalScrollbar) {
  this.contents = null;
  this._horizontalScrollbar = horizontalScrollbar;
  this._verticalScrollbar = verticalScrollbar;
  this._viewport = new Viewport;
  this.addChild(this._viewport);
  
  this._horizontalScrollbar.setVisible(false);
  this._horizontalScrollbar.controller = this;  
  this._verticalScrollbar.setVisible(false);
  this._verticalScrollbar.controller = this;
}
ScrollView.prototype = new View;
ScrollView.prototype.paint = function ScrollView_paint(cx) {
  cx.fillStyle = "rgb(255,255,255)";
  cx.fillRect(0, 0, this.width, this.height);
}
ScrollView.prototype.setContents = function ScrollView_setContents(view) {
  if (this.contents && this.contents != view) {
    this._viewport.removeChild(this.contents);
    delete this.contents;
    this.contents = null;
  }
  if (view) {
    this.contents = view;
    this._viewport.addChild(this.contents);
  }
  this.layout();
}
ScrollView.prototype.setControlVisibility =
    function ScrollView_setControlVisibility(control, show) {
  if (!control)
    return;
    
  if (show) {
    if (!control.visible) {
      this.addChild(control);
      control.setVisible(true);
    }
  } else {
    this.removeChild(control);
    control.setVisible(false);
  }
}
ScrollView.prototype.computeScrollbarVisibility =
    function ScrollView_computeScrollbarVisibility(viewport_size,
                                                   content_size) {
  return [false, true];
  if (content_size.width <= viewport_size.width && content_size.height <= viewport_size.height) {
    return [false, false]; 
  } else if (content_size.width <= viewport_size.width - this.getScrollbarWidth()) {
    return [false, true];
  } else if (content_size.height <= viewport_size.height - this.getScrollbarHeight()) {
    return [true, false];
  }
  return [true, true];  
}
ScrollView.prototype.layout = function ScrollView_layout() {
  var viewport_bounds = this.getLocalBounds(true);
  viewport_bounds.origin = new Point;
  var viewport_size = viewport_bounds.size;
  if (viewport_bounds.empty())
    return;

  var horizontal_scrollbar_height = this.getScrollbarHeight();
  var vertical_scrollbar_width = this.getScrollbarWidth();
  viewport_bounds.width -= vertical_scrollbar_width;
  this._viewport.setBounds(viewport_bounds);
  
  if (this.contents)
    this.contents.layout();
  
  var should_layout_contents = false;
  var required_scrollbars = [];
  if (this.contents) {
    required_scrollbars = this.computeScrollbarVisibility(viewport_size,
                                                          this.contents.size);
  }
  this.setControlVisibility(this._horizontalScrollbar, required_scrollbars[0]);
  this.setControlVisibility(this._verticalScrollbar, required_scrollbars[1]);
  
  if (required_scrollbars[0]) {
    viewport_bounds.height -= horizontal_scrollbar_height;
    should_layout_contents = true;
  }
  if (!required_scrollbars[1]) {
    viewport_bounds.width += vertical_scrollbar_width;
    should_layout_contents = true;
  }
  
  if (required_scrollbars[0]) {
    this._horizontalScrollbar.setBounds(0, viewport_bounds.bottom,
                                        viewport_bounds.right,
                                        horizontal_scrollbar_height);
  }
  if (required_scrollbars[1]) {
    this._verticalScrollbar.setBounds(viewport_bounds.right, 0,
                                      vertical_scrollbar_width,
                                      viewport_bounds.bottom);
  }
  
  this._viewport.setBounds(viewport_bounds);
  if (should_layout_contents && this.contents)
    this.contents.layout();
    
  this.checkScrollBounds();
  this.schedulePaint();
  this.updateScrollbarPositions();
}
ScrollView.prototype.checkScrollBounds =
    function ScrollView_checkScrollBounds(viewport_size,
                                          content_size,
                                          current_pos) {
  switch (arguments.length) {
  case 3:
    var viewport_size = arguments[0];
    var content_size = arguments[1];
    var current_pos = arguments[2];
    var max = Math.max(content_size - viewport_size, 0);
    current_pos = Math.max(current_pos, 0);
    current_pos = Math.min(current_pos, max);
    return current_pos;
  case 0:
    if (this.contents) {
      var x = this.checkScrollBounds(this._viewport.width, this.contents.width,
                                     -this.contents.x);
      var y = this.checkScrollBounds(this._viewport.height,
                                     this.contents.height, -this.contents.y);
      this.contents.setBounds(-x, -y, this.contents.width,
                              this.contents.height);
    }
  }
}
ScrollView.prototype.getVisibleRect = function ScrollView_getVisibleRect() {
  if (!this.contents)
    return new Rect;
  var x = (this._horizontalScrollbar && this._horizontalScrollbar.visible) ?
      this._horizontalScrollbar.getPosition() : 0;
  var y = (this._verticalScrollbar && this._verticalScrollbar.visible) ?
      this._verticalScrollbar.getPosition() : 0;
  return new Rect(x, y, this._viewport.width, this._viewport.height);
}
ScrollView.prototype.scrollContentsRegionToBeVisible =
    function ScrollView_scrollContentsRegionToBeVisible(x, y, width, height) {
  if (!this.contents ||
      ((!this._horizontalScrollbar || !this._horizontalScrollbar.visible) &&
       (!this._verticalScrollbar || !this._verticalScrollbar.visible))) {
    return;
  }
  var contents_max_x = Math.max(this._viewport.width, this.contents.width);
  var contents_max_y = Math.max(this._viewport.height, this.contents.height);
  x = Math.max(0, Math.min(contents_max_x, x));
  y = Math.max(0, Math.min(contents_max_y, y));
  var max_x = Math.min(contents_max_x,
                       x + Math.min(width, this._viewport.width));
  var max_y = Math.min(contents_max_y,
                       y + Math.min(height, this._viewport.height));
  var visible_rect = this.getVisibleRect();
  if (visible_rect.contains(new Rect(x, y, max_x - x, max_y - y)))
    return;
  
  var new_x = visible_rect.x > x ? x : Math.max(0, max_x - this._viewport.width);
  var new_y = visible_rect.y > y ? y : Math.max(0, max_y - this._viewport.height);
  this.contents.setX(-new_x);
  this.contents.setY(-new_y);
  this.updateScrollbarPositions();
}
ScrollView.prototype.updateScrollbarPositions =
    function ScrollView_updateScrollbarPositions() {
  if (!this.contents)
    return;
  if (this._horizontalScrollbar.visible) {
    this._horizontalScrollbar.update(this._viewport.width, this.contents.width,
                                     this.contents.x);
  }
  if (this._verticalScrollbar.visible) {
    this._verticalScrollbar.update(this._viewport.height, this.contents.height,
                                   this.contents.y);
  }
}
ScrollView.prototype.scrollToPosition =
    function ScrollView_scrollToPosition(source, position) {
  if (!this.contents)
    return;
  
  if (source == this._horizontalScrollbar &&
      this._horizontalScrollbar.visible) {
    if (-this.contents.x != position) {
      var max_pos = Math.max(0, this.contents.width - this._viewport.width);
      position = Math.max(0, position);
      position = Maht.min(max_pos, position);
      this.contents.setX(-position);
      this.contents.schedulePaint();
    }
  } else if (source == this._verticalScrollbar && 
             this._verticalScrollbar.visible) {
    if (-this.contents.y != position) {
      var max_pos = Math.max(0, this.contents.height - this._viewport.height);
      position = Math.max(0, position);
      position = Math.min(max_pos, position);
      this.contents.setY(-position);
      this.contents.schedulePaint();
    }
  }
}
ScrollView.prototype.getScrollIncrement =
    function ScrollView_getScrollIncrement(source, is_page, is_positive) {
  var amount = 0;
  if (this.contents) {
    if (is_page) {
      amount = 500 //this.contents.getPageScrollIncrement(this, source.horizontal,
                   //                                 is_positive);
    } else {
      amount = 50; // this.contents.getLineScrollIncrement(this, source.horizontal,
                     //                               is_positive);
    }
    if (amount > 0)
      return amount;
  }
  if (is_page)
    return source.horizontal ? this._viewport.width : this._viewport.height;
  return source.horizontal ? this._viewport.width / 5 : this._viewport.height / 5;
}
ScrollView.prototype.getScrollbarWidth =
    function ScrollView_getScrollbarWidth() {
  return this._verticalScrollbar.getLayoutSize();
}
ScrollView.prototype.getScrollbarHeight =
    function ScrollView_getScrollbarHeight() {
  return this._horizontalScrollbar.getLayoutSize();
}
