// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function RepeatController(callback) {
  this._callback = callback;
  this._timer = new OneShotTimer;
}
RepeatController.prototype.INITIAL_REPEAT_DELAY = 250;
RepeatController.prototype.REPEAT_DELAY = 50;
RepeatController.prototype.start = function RepeatController_start() {
  this._timer.start(this.INITIAL_REPEAT_DELAY, this.tick, this);
}
RepeatController.prototype.stop = function RepeatController_stop() {
  this._timer.stop();
}
RepeatController.prototype.tick = function RepeatController_tick() {
  this._timer.start(this.REPEAT_DELAY, this.tick, this);
  this._callback();
}

function AutorepeatButton(listener) {
  ImageButton.call(this, listener);
  this._repeater = new RepeatController(this._notifyClick);
}
AutorepeatButton.prototype = new ImageButton;
AutorepeatButton.prototype.onMousePressed =
    function AutorepeatButton_onMousePressed(e) {
  Button.prototype._notifyClick.call(this, e.flags);
  this._repeater.start();
  return true;
}
AutorepeatButton.prototype.onMouseReleased =
    function AutorepeatButton_onMouseReleased(e) {
  this._repeater.stop();
  
}
AutorepeatButton.prototype._notifyClick =
    function AutorepeatButton__notifyClick() {
  Button.prototype._notifyClick.call(this, 0);
}

function ScrollbarThumb(scrollbar) {
  this._scrollBar = scrollbar;
  this._dragStartPosition = -1;
  this._mouseOffset = -1;
  this._state = CustomButton.prototype.BS_NORMAL;
  this._topImage = new Image;
  this._topImage.src = "chrome/scrollbar_thumb_top_cap.png";
  this._bgImage = new Image;
  this._bgImage.src = "chrome/scrollbar_thumb_background.png";
  this._bottomImage = new Image;
  this._bottomImage.src = "chrome/scrollbar_thumb_bottom_cap.png";
}
ScrollbarThumb.prototype = new View;
ScrollbarThumb.prototype.SCROLLBAR_THUMB_DRAG_OUT_SNAP = 100;
ScrollbarThumb.prototype.setSize = function ScrollbarThumb_setSize(size) {
  var ps = this.getPreferredSize();
  size = Math.max(size, this._scrollBar.horizontal ? ps.width : ps.height);
  var thumb_bounds = this.bounds;
  if (this._scrollBar.horizontal) {
    thumb_bounds.width = size;
  } else {
    thumb_bounds.height = size;
  }
  this.setBounds(thumb_bounds);
}
ScrollbarThumb.prototype.getSize = function ScrollbarThumb_getSize() {
  return this._scrollBar.horizontal ? this.width : this.height;
}
ScrollbarThumb.prototype.setPosition =
    function ScrollbarThumb_setPosition(position) {
  var thumb_bounds = this.bounds;
  var track_bounds = this._scrollBar.getTrackBounds();
  if (this._scrollBar.horizontal) {
    thumb_bounds.x = track_bounds.x + position;
  } else {
    thumb_bounds.y = track_bounds.y + position;
  }
  this.setBounds(thumb_bounds);
}
ScrollbarThumb.prototype.getScrollPosition =
    function ScrollbarThumb_getScrollPosition() {
  var track_bounds = this._scrollBar.getTrackBounds();
  if (this._scrollBar.horizontal)
    return this.x - track_bounds.x;
  return this.y - track_bounds.y;
}
ScrollbarThumb.prototype.getPreferredSize =
    function ScrollbarThumb_getPreferredSize() {
  // TODO(beng): size based on orientation and bitmap size.
  return new Size(15, 30);
}
ScrollbarThumb.prototype.paint = function ScrollbarThumb(cx) {
  // TODO(beng): horz/vert
  cx.drawImage(this._topImage, 0, 0);
  cx.drawImage(this._bottomImage, 0, this.height - this._bottomImage.height);
  cx.fillStyle = cx.createPattern(this._bgImage, "repeat");
  cx.fillRect(0, this._topImage.height, this.width,
              this.height - this._topImage.height - this._bottomImage.height);
}
ScrollbarThumb.prototype.onMouseEntered =
    function ScrollbarThumb_onMouseEntered(e) {
  this._setState(CustomButton.prototype.BS_HOT);
}
ScrollbarThumb.prototype.onMouseExited =
    function ScrollbarThumb_onMouseExited(e) {
  this._setState(CustomButton.prototype.BS_NORMAL);
}
ScrollbarThumb.prototype.onMousePressed =
    function ScrollbarThumb_onMousePressed(e) {
  this._mouseOffset = this._scrollBar.horizontal ? e.x : e.y;
  this._dragStartPosition = this.getScrollPosition();
  this._setState(CustomButton.prototype.BS_PUSHED);
  return true;
}
ScrollbarThumb.prototype.onMouseDragged =
    function ScrollbarThumb_onMouseDragged(e) {
  if (this._scrollBar.horizontal) {
    if ((e.y < this.y - this.SCROLLBAR_THUMB_DRAG_OUT_SNAP) ||
        (e.y > (this.y + this.height + this.SCROLLBAR_THUMB_DRAG_OUT_SNAP))) {
      this._scrollBar.scrollToThumbPosition(this._dragStartPosition, false);
      return true;
    }
    var thumb_x = e.x - this._mouseOffset;
    this._scrollBar.scrollToThumbPosition(this.x + thumb_x, false);
  } else {
    /*
    if ((e.x < this.x - this.SCROLLBAR_THUMB_DRAG_OUT_SNAP) ||
        (e.x > (this.x + this.width + this.SCROLLBAR_THUMB_DRAG_OUT_SNAP))) {
      this._scrollBar.scrollToThumbPosition(this._dragStartPosition, false);
      return true;
    }
    */
    var thumb_y = e.y - this._mouseOffset;
    this._scrollBar.scrollToThumbPosition(this.y + thumb_y, false);
  }
  return true;
}
ScrollbarThumb.prototype.onMouseReleased =
    function ScrollbarThumb_onMouseReleased(e) {
  this._setState(CustomButton.prototype.BS_HOT);
}
ScrollbarThumb.prototype._setState = function ScrollbarThumb__setState(state) {
  this._state = state;
  this.schedulePaint();
}

function Scrollbar(horizontal, show_scroll_buttons) {
  this.controller = null;
  this._maxPosition = 0;
  this._contentsSize = 0;
  this._contentsScrollOffset = 0;
  this._prevButton = new AutorepeatButton(this);
  this._prevButtonImage = new Image;
  this._prevButtonImage.src = "chrome/scrollbar_up.png";
  this._prevButton.setImage(this._prevButton.BS_NORMAL, this._prevButtonImage);
  this._nextButton = new AutorepeatButton(this);
  this._nextButtonImage = new Image;
  this._nextButtonImage.src = "chrome/scrollbar_down.png";
  this._nextButton.setImage(this._nextButton.BS_NORMAL, this._nextButtonImage);
  this._thumb = new ScrollbarThumb(this);
  this._thumbTrackState = CustomButton.prototype.BS_NORMAL;
  this._lastScrollAmount = this.SA_SCROLL_NONE;
  this._trackRepeater = new RepeatController(this._trackClicked);
  this._showScrollButtons = show_scroll_buttons;
  this.horizontal = horizontal;
  
  if (!this._showScrollButtons) {
    this._prevButton.setVisible(false);
    this._nextButton.setVisible(false);
  }
  this.addChild(this._prevButton);
  this.addChild(this._nextButton);
  this.addChild(this._thumb);
  
  this._trackImage = new Image;
  this._trackImage.src = "chrome/scrollbar_track_background.png";
}
Scrollbar.prototype = new View;
Scrollbar.prototype.SBP_PREV_BUTTON = 0;
Scrollbar.prototype.SBP_NEXT_BUTTON = 1;
Scrollbar.prototype.SBP_THUMB_START_CAP = 2;
Scrollbar.prototype.SBP_THUMB_MIDDLE = 3;
Scrollbar.prototype.SBP_THUMB_END_CAP = 4;
Scrollbar.prototype.SBP_THUMB_GRIPPY = 5;
Scrollbar.prototype.SBP_THUMB_TRACK = 6;
Scrollbar.prototype.SBP_PART_COUNT = 7;
Scrollbar.prototype.SA_SCROLL_NONE = 0;
Scrollbar.prototype.SA_SCROLL_START = 1;
Scrollbar.prototype.SA_SCROLL_END = 2;
Scrollbar.prototype.SA_SCROLL_PREV_LINE = 3;
Scrollbar.prototype.SA_SCROLL_NEXT_LINE = 4;
Scrollbar.prototype.SA_SCROLL_PREV_PAGE = 5;
Scrollbar.prototype.SA_SCROLL_NEXT_PAGE = 6;
Scrollbar.prototype.ST_VERTICAL = 1;
Scrollbar.prototype.ST_HORIZONTAL = 2;
Scrollbar.prototype.getTrackBounds = function Scrollbar_getTrackBounds() {
  var ps = this._prevButton.getPreferredSize();
  if (this.horizontal) {
    if (!this._showScrollButtons)
      ps.width = 0;
    var new_width = Math.max(0, this.width - (ps.width * 2));
    return new Rect(ps.width, 0, new_width, ps.height);
  }
  if (!this._showScrollButtons)
    ps.height = 0;
  var new_height = Math.max(0, this.height - (ps.height * 2));
  return new Rect(0, ps.height, ps.width, new_height);
}
Scrollbar.prototype.setImage = function Scrollbar_setImage(part, state, image) {
  check(part < this.SBP_PART_COUNT, "Invalid part id");
  check(state < CustomButton.prototype.BS_COUNT, "Invalid state");
  switch (part) {
  case this.SBP_PREV_BUTTON:
    this._prevButton.setImage(state, image);
    break;
  case this.SBP_NEXT_BUTTON:
    this._nextButton.setImage(state, image);
    break;
  case this.SBP_THUMB_START_CAP:
  case this.SBP_THUMB_MIDDLE:
  case this.SBP_THUMB_END_CAP:
  case this.SBP_THUMB_GRIPPY:
  case this.SBP_THUMB_TRACK:
    this._images[part][state] = image;
    break;
  }
}
Scrollbar.prototype.scrollByAmount = function Scrollbar_scrollByAmount(amount) {
  var offset = this._contentsScrollOffset;
  switch (amount) {
  case this.SA_SCROLL_START:
    offset = 0;
    break;
  case this.SA_SCROLL_END:
    offset = this._maxPosition;
    break;
  case this.SA_SCROLL_PREV_LINE:
    offset -= this.controller.getScrollIncrement(this, false, false);
    offset = Math.max(0, offset);
    break;
  case this.SA_SCROLL_NEXT_LINE:
    offset += this.controller.getScrollIncrement(this, false, true);
    offset = Math.min(this._maxPosition, offset);
    break;
  case this.SA_SCROLL_PREV_PAGE:
    offset -= this.controller.getScrollIncrement(this, true, false);
    offset = Math.max(0, offset);
    break;
  case this.SA_SCROLL_NEXT_PAGE:
    offset += this.controller.getScrollIncrement(this, true, true);
    offset = Math.min(this._maxPosition, offset);
    break;
  }
  this._contentsScrollOffset = offset;
  this._scrollContentsToOffset();
}
Scrollbar.prototype.scrollToThumbPosition =
    function Scrollbar_scrollToThumbPosition(thumb_position, scroll_to_middle) {
  this._contentsScrollOffset =
      this._calculateContentsOffset(thumb_position, scroll_to_middle);
  this._normalizeContentsOffset();
  this._scrollContentsToOffset();
}
Scrollbar.prototype.scrollByContentsOffset =
    function Scrollbar_scrollByContentsOffset(contents_offset) {
  this._contentsScrollOffset -= contents_offset;
  this._normalizeContentsOffset();
  this._scrollContentsToOffset();  
}
Scrollbar.prototype._normalizeContentsOffset =
    function Scrollbar__normalizeContentsOffset() {
  this._contentsScrollOffset =
      Math.max(this._contentsScrollOffset, 0);
  this._contentsScrollOffset =
      Math.min(this._contentsScrollOffset, this._maxPosition);  
}
Scrollbar.prototype._trackClicked = function Scrollbar_trackClicked() {
  if (this._lastScrollAmount != this.SA_SCROLL_NONE)
    this.scrollByAmount(this._lastScrollAmount);
}
Scrollbar.prototype.layout = function Scrollbar_layout() {
  if (this._showScrollButtons) {
    var ps = this._prevButton.getPreferredSize();
    this._prevButton.setBounds(0, 0, ps.width, ps.height);
    ps = this._nextButton.getPreferredSize();
    if (this.horizontal) {
      this._nextButton.setBounds(this.width - ps.width, 0, ps.width, ps.height);
    } else {
      this._nextButton.setBounds(0, this.height - ps.height, ps.width,
                                 ps.height);
    }
  } else {
    this._prevButton.setBounds(0, 0, 0, 0);
    this._nextButton.setBounds(0, 0, 0, 0);
  }
  
  var thumb_ps = this._thumb.getPreferredSize();
  var track_bounds = this.getTrackBounds();
  
  if (this.horizontal) {
    this._thumb.setBounds(this._thumb.x, this._thumb.y, this._thumb.width,
                          thumb_ps.height);
  } else {
    this._thumb.setBounds(this._thumb.x, this._thumb.y, thumb_ps.width,
                          this._thumb.height);
  }
  
  if ((this.horizontal && (track_bounds.width < thumb_ps.width)) ||
      (!this.horizontal && (track_bounds.height < thumb_ps.height))) {
    this._thumb.setVisible(false);    
  } else if (!this._thumb.visible) {
    this._thumb.setVisible(true);
  }
}
Scrollbar.prototype.getPreferredSize =
    function Scrollbar_getPreferredSize() {
  // TODO(beng): handle hscrollbars too.
  var ps = this._prevButton.getPreferredSize();
  return new Size(ps.width, ps.height * 2);
}
Scrollbar.prototype.paint = function Scrollbar_paint(cx) {
  var track_bounds = this.getTrackBounds();
  cx.fillStyle = cx.createPattern(this._trackImage, "repeat");
  cx.fillRect(track_bounds.x, track_bounds.y, track_bounds.width,
              track_bounds.height);
}
Scrollbar.prototype.onMousePressed = function Scrollbar_onMousePressed(e) {
  if (e.isOnlyLeftMouseButtonDown()) {
    this._setThumbTrackState(CustomButton.prototype.BS_PUSHED);
    var thumb_bounds = this._thumb.bounds;
    if (this.horizontal) {
      if (e.x < this._thumb.x) {
        this._lastScrollAmount = this.SA_SCROLL_PREV_PAGE;
      } else if (e.x > this._thumb.bounds.right) {
        this._lastScrollAmount = this.SA_SCROLL_NEXT_PAGE;
      }
    } else {
      if (e.y < this._thumb.y) {
        this._lastScrollAmount = this.SA_SCROLL_PREV_PAGE;
      } else if (e.y > this._thumb.bounds.bottom) {
        this._lastScrollAmount = this.SA_SCROLL_NEXT_PAGE;
      }
    }
    this._trackClicked();
    //this._trackRepeater.start();
  }
  return true;
}
Scrollbar.prototype.onMouseReleased = function Scrollbar_onMouseReleased(e) {
  this._setThumbTrackState(CustomButton.prototype.BS_NORMAL);
  this._trackRepeater.stop();
}
Scrollbar.prototype.buttonPressed =
    function Scrollbar_buttonPressed(button, event_flags) {
  switch (button) {
  case this._prevButton:
    this.scrollByAmount(this.SA_SCROLL_PREV_LINE);
    break;
  case this._nextButton:
    this.scrollByAmount(this.SA_SCROLL_NEXT_LINE);
    break;
  }
}
Scrollbar.prototype.update = function Scrollbar_update(viewport_size,
                                                       content_size,
                                                       contents_scroll_offset) {
  this._maxPosition = Math.max(0, content_size - viewport_size);
  this._contentsSize = Math.max(1, content_size);
  content_size = Math.max(0, content_size);
  contents_scroll_offset = Math.max(0, contents_scroll_offset);
  contents_scroll_offset = Math.min(contents_scroll_offset, content_size);
  var thumb_size = (viewport_size / this._contentsSize) * this._getTrackSize();
  this._thumb.setSize(thumb_size);
  
  var thumb_position = this._calculateThumbPosition(contents_scroll_offset);
  this._thumb.setPosition(thumb_position);
}
Scrollbar.prototype.getLayoutSize = function Scrollbar_getLayoutSize() {
  var ps = this._prevButton.getPreferredSize();
  return this.horizontal ? ps.height : ps.width;
}
Scrollbar.prototype.getScrollPosition = function Scrollbar_getScrollPosition() {
  this._thumb.getScrollPosition();
}
Scrollbar.prototype._scrollContentsToOffset =
    function Scrollbar__scrollContentsToOffset() {
  this.controller.scrollToPosition(this, this._contentsScrollOffset);
  this._thumb.setPosition(
      this._calculateThumbPosition(this._contentsScrollOffset));
}
Scrollbar.prototype._getTrackSize = function Scrollbar__getTrackSize() {
  var track_bounds = this.getTrackBounds();
  return this.horizontal ? track_bounds.width : track_bounds.height;
}
Scrollbar.prototype._calculateThumbPosition =
    function Scrollbar__calculateThumbPosition(contents_scroll_offset) {
  return (contents_scroll_offset * this._getTrackSize()) / this._contentsSize;
}
Scrollbar.prototype._calculateContentsOffset =
    function Scrollbar__calculateContentsOffset(thumb_position,
                                                scroll_to_middle) {
  if (scroll_to_middle)
    thumb_position -= (this._thumb.getSize() / 2);
  return (thumb_position * this._contentsSize) / this._getTrackSize();
}
Scrollbar.prototype._setThumbTrackState =
    function Scrollbar__setThumbTrackState(state) {
  this._thumbTrackState = state;
  this.schedulePaint();
}
