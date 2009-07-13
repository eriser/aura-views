// Copyright (c) 2006-2009 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// listener can be NULL
function Button(listener) {
  this._listener = listener;
}
Button.prototype = new View;
Button.prototype._notifyClick = function Button__notifyClick(flags) {
  if (this._listener)
    this._listener.buttonPressed(this, flags);
}

function CustomButton(listener) {
  Button.call(this, listener);
  this._state = this.BS_NORMAL;
  this._animation = new SlideAnimation(this);
  this._animateOnStateChange = true;
}
CustomButton.prototype = new Button;
CustomButton.prototype.BS_NORMAL = 0;
CustomButton.prototype.BS_HOT = 1;
CustomButton.prototype.BS_PUSHED = 2;
CustomButton.prototype.BS_DISABLED = 3;
CustomButton.prototype.BS_COUNT = 4;
CustomButton.prototype.getPreferredSize =
    function CustomButton_getPreferredSize() {
  return new Size(100,100);
}
CustomButton.prototype.onMouseEntered =
    function CustomButton_onMouseEntered(e) {
  this._setState(this.BS_HOT);
}
CustomButton.prototype.onMouseExited =
    function CustomButton_onMouseExited(e) {
  this._setState(this.BS_NORMAL);
}
CustomButton.prototype.onMousePressed =
    function CustomButton_onMousePressed(e) {
  if (this._state != this.BS_DISABLED) {
    if (this._isTriggerableEvent(e) && this.hitTest(e.location))
      this._setState(this.BS_PUSHED);
  }
  return true;
}
CustomButton.prototype.onMouseReleased =
    function CustomButton_onMouseReleased(e) {
  if (this._state != this.BS_DISABLED) {
    // TODO(beng): canceled
    if (!this.hitTest(e.location)) {
      this._setState(this.BS_NORMAL);
    } else {
      this._setState(this.BS_HOT);
      if (this._isTriggerableEvent(e)) {
        this._notifyClick(e.flags);
        // No accesses beyond this point, could be deleted.
      }
    }
  }    
}
CustomButton.prototype._isTriggerableEvent =
    function CustomButton__isTriggerableEvent(e) {
  return e.flags & e.EF_LEFT_BUTTON_DOWN;
}
CustomButton.prototype._setState = function CustomButton__setState(state) {
  if (state != this._state) {
    if (this._animateOnStateChange || !this._animation.animating) {
      this._animateOnStateChange = true;
      if (this._state == this.BS_NORMAL && state == this.BS_HOT) {
        this._animation.show();
      } else if (this._state == this.BS_HOT && state == this.BS_NORMAL) {
        this._animation.hide();
      } else {
        this._animation.stop();
      }
    }
  }
  this._state = state;
  this.schedulePaint();
}
CustomButton.prototype.paint = function CustomButton_paint(cx) {
  cx.fillStyle = this._getFillStyle(this._hot);
  cx.fillRect(0, 0, this.width, this.height);
}
CustomButton.prototype.animationProgressed =
    function CustomButton_animationProgressed(animation) {
  this.schedulePaint();
}
CustomButton.prototype._getFillStyle =
    function CustomButton__getFillStyle(hot) {
  var alpha =
      this._animation.animating ? this._animation.getCurrentValue() : 1.0;
  return (hot ? "rgba(0,255,0," : "rgba(0,0,255,") + alpha + ")";
}

function ImageButton(listener) {
  CustomButton.call(this, listener);
  // Initialize the image set.
  this._images = [];
  for (var i = 0; i < this.BS_COUNT; ++i)
    this._images.push(null);
}
ImageButton.prototype = new CustomButton;
ImageButton.prototype.setImage = function ImageButton_setImage(state, image) {
  this._images[state] = image;
}
ImageButton.prototype.getPreferredSize =
    function ImageButton_getPreferredSize() {
  var normal_image = this._images[this.BS_NORMAL];
  check(normal_image, "must have a normal image state at least!");
  return new Size(normal_image.width, normal_image.height);
}
ImageButton.prototype.paint = function ImageButton_paint(cx) {
  // TODO(beng): alignment
  cx.drawImage(this._getImageToPaint(), 0, 0);
}
ImageButton.prototype._getImageToPaint = function ImageButton__getImageToPaint() {
  if (this._images[this._state])
    return this._images[this._state];
  check(this._images[this.BS_NORMAL], "must have a normal image state at least!");
  return this._images[this.BS_NORMAL];
}
