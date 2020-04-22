const testSlider = document.getElementById('testSlider');
const testSliderValueLabel = document.getElementById('testSliderValueLabel');

testSlider.addEventListener('input', (ev) => {
    testSliderValueLabel.innerText = testSlider.value;
    // fire event to send cc to BOX
});



/*  this kind of works (if you change ID of the knob div to "target"), but I don't get it and it only works when the mouse is over the knob
 * don't use it though... operating knobs via the mouse/trackpad is trash
(function() {
    var R2D, active, angle, center, init, rotate, rotation, start, startAngle, stop;
  
    active = false;
  
    angle = 0;
  
    rotation = 0;
  
    startAngle = 0;
  
    center = {
      x: 0,
      y: 0
    };
  
    document.ontouchmove = function(e) {
      return e.preventDefault();
    };
  
    init = function() {
      target.addEventListener("mousedown", start, false);
      target.addEventListener("mousemove", rotate, false);
      return target.addEventListener("mouseup", stop, false);
    };
  
    R2D = 180 / Math.PI;
  
    start = function(e) {
      var height, left, top, width, x, y, _ref;
      e.preventDefault();
      _ref = this.getBoundingClientRect(), top = _ref.top, left = _ref.left, height = _ref.height, width = _ref.width;
      center = {
        x: left + (width / 2),
        y: top + (height / 2)
      };
      x = e.clientX - center.x;
      y = e.clientY - center.y;
      startAngle = R2D * Math.atan2(y, x);
      return active = true;
    };
  
    rotate = function(e) {
      var d, x, y;
      e.preventDefault();
      x = e.clientX - center.x;
      y = e.clientY - center.y;
      d = R2D * Math.atan2(y, x);
      rotation = d - startAngle;
      if (active) {
        return this.style.webkitTransform = "rotate(" + (angle + rotation) + "deg)";
      }
    };
  
    stop = function() {
      angle += rotation;
      return active = false;
    };
  
    init();
  
  }).call(this);
  */