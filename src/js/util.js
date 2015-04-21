var trans = 
  "msTransform" in document.body.style ? "msTransform" :
  "webkitTransform" in document.body.style ? "webkitTransform" :
  "transform";
  
var duration =
  "msTransitionDuration" in document.body.style ? "msTransitionDuration" :
  "webkitTransitionDuration" in document.body.style ? "webkitTransitionDuration" :
  "transitionDuration";

module.exports = {
  qsa : function(s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  },
  freeze: function(bounds, parent, element) {
    element.style.height = "1px";
    element.style.bottom = "auto";
    this.transform(element, bounds.top - parent.top + bounds.height, bounds.height);
  },
  transform: function(element, top, height) {
    element.style[trans] = "translateY(" + top + "px) scaleY(" + (height + 1) + ")"
  },
  transitionDuration: function(element, time) {
    element.style[duration] = time + "s";
  },
  removeTransform: function(element) {
    element.style[trans] = "";
  },
  skip: function(c) {
    c();
  },
  delay: function(interval) {
    return function() {
      var callback = arguments[arguments.length - 1];
      setTimeout(function() {
        callback();
      }, interval || 400);
    }
  },
  syncLayout: function(stages) {
    var reads = [];
    stages.forEach(function(stage, i) {
      var tag = "stage " + i;
      // console.time(tag);
      if (typeof stage == "function") {
        stage();
      } else {
        for (var i = 0; i < stage.length; i++) {
          stage[i]();
        }
      }
      reads.push(document.body.offsetTop);
      // console.timeEnd(tag);
    });
  }
};