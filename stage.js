/*
 * Global constants
*/
const POINT_COLOR = 'black';
const POINT_RADIUS = 5;
var path_colors = ['blue', 'turquoise', 'green', 'brown'];
const PATH_STROKE = 1;
var BEZIER_COLOR = 'red';
const BEZIER_STROKE = 4;
const T_BEZIER_COLOR = 'pink';
const T_BEZIER_STROKE = 2;
const transp = new color.RGBAColor(0, 0, 0, 0.0);


/*
 * Global variables
*/
var evaluations = 500; //default value
var t_evaluations = 50; //default value
var sb = 20; //default value
var countPoints = 0;
var paths = [];
var bezier_curves = [];
var c_bezier_curves = [];
var all_points = [[], [], [], []];
var colors = [];
var draw_t = false;
for(i = 0; i < 4; i++){
  paths.push(new Path().stroke(path_colors[i], PATH_STROKE).addTo(stage));
  bezier_curves.push(new Path().stroke(BEZIER_COLOR, BEZIER_STROKE).addTo(stage));
}

/*
 * Global functions
*/

function getColors() {
  colors = [];
  var red = 255, green = 0, blue = 0;
  var block_green = false;
  var block_red = false;
  var block_blue = false;
  var calc = 256/sb;
  for(i = 0; i <= sb; i++){
    col = new color.RGBAColor(red, green, blue, 0.5);
    colors.push(col);
    if(green < 255 && !block_green){
      green += calc * 2.5;
      if(green > 255) green = 255;
    } else if (red > 0 && !block_red) {
      red -= calc * 4;
      if(red < 0) red = 0;
    } else if(green > 0 && blue < 255 && !block_blue) {
      block_green = true;
      green -= calc * 3.8;
      blue += calc * 3.8;
      if(green < 0) green = 0;
      if(blue > 255) blue = 255;
    } else if(red < 75 && blue > 130 && !block_blue) {
      block_red = true;
      red += calc * 4;
      blue -= calc * 4;
      if(blue < 130) blue = 130;
      if(red > 255) red = 255;
    } else if(red < 143 && blue < 255){
      block_blue = true;
      red += calc * 4;
      blue += calc * 4;
      if(blue > 255) blue = 255;
      if(red > 143) red = 143;
    }
  }
}

function removeCurves() {
  var arr = c_bezier_curves;
  arr.forEach(function(cb){
    stage.removeChild(cb);
  });
  c_bezier_curves = [];
}

function create_c_bezier(){
  for(i = 0; i <= sb; i++){
    if(draw_t) c_bezier_curves.push(new Path().stroke(colors[i], T_BEZIER_STROKE).addTo(stage));
    else c_bezier_curves.push(new Path().stroke(transp, T_BEZIER_STROKE).addTo(stage));
  }
}

/* Draws original bezier curves */
function drawBezierCurve(i) {
  var n, x, y;
  if(paths[i].segments().length < 2) return;
  var points = paths[i].segments();

  bezier_curves[i].segments(Array(0));

  bezier_curves[i].moveTo(points[0][1], points[0][2]);
  n = points.length - 1;
  x = 0, y = 0;

  for(t = 1/evaluations; t < 1; t += 1/evaluations, x = 0, y = 0) {
    for(p = 1; p < points.length; p++){
      for(c = 0; c < points.length - p; c++){
        points[c][1] = (1 - t) * points[c][1] + t * points[c + 1][1];
        points[c][2] = (1 - t) * points[c][2] + t * points[c + 1][2];
      }
    }
    x = points[0][1];
    y = points[0][2];

    bezier_curves[i].lineTo(x, y);
  }

  bezier_curves[i].lineTo(points[n][1], points[n][2]);
}

/* Draws the t_bezier_curves based on points (faster) */
function draw_by_points(){
  create_c_bezier();
  var controlPoints = [];
  var count = 0;
  var aux = paths[3].segments();
  for (q = 0; q < 1.001; q += 1/sb) {
    var tpoints = [];
    for (i = 0; i < 4; i++){
      controlPoints[0] = paths[0].segments()[i];
      controlPoints[1] = paths[1].segments()[i];
      controlPoints[2] = paths[2].segments()[i];
      controlPoints[3] = paths[3].segments()[i];

      for(var pt = 1; pt < controlPoints.length; pt++) {
        for(var ct = 0; ct < controlPoints.length - pt; ct++) {
          controlPoints[ct][1] = (1 - q) * controlPoints[ct][1] + q * controlPoints[ct + 1][1];
          controlPoints[ct][2] = (1 - q) * controlPoints[ct][2] + q * controlPoints[ct + 1][2];
        }
      }
      tpoints.push(controlPoints[0]);
    }
	drawTBezierCurve(count, tpoints);
	count++;
  }
}

/* Auxiliar function */
function drawTBezierCurve(i, points) {
  var n, x, y;
  c_bezier_curves[i].segments(Array(0));

  c_bezier_curves[i].moveTo(points[0][1], points[0][2]);
  n = points.length - 1;
  x = 0, y = 0;

  for(t = 1/t_evaluations; t < 1; t += 1/t_evaluations, x = 0, y = 0) {
    for(p = 1; p < points.length; p++){
      for(c = 0; c < points.length - p; c++){
        points[c][1] = (1 - t) * points[c][1] + t * points[c + 1][1];
        points[c][2] = (1 - t) * points[c][2] + t * points[c + 1][2];
      }
    }
    x = points[0][1];
    y = points[0][2];

    c_bezier_curves[i].lineTo(x, y);
  }
   c_bezier_curves[i].moveTo(points[n][1], points[n][2]);
}

/*
 * Communication functions
*/

/* Sends the default evaluations values to HTML */
stage.sendMessage('here', {eval: evaluations, t_evaluations: t_evaluations});

/* Gets the evaluatios value from the front */
stage.on('message:getEval', function(data){
  evaluations = parseInt(data.eval);
  bezier_curves.forEach(function(bc,i){
      drawBezierCurve(i);
  });
  t_evaluations = parseInt(data.t_eval);
  sb = parseInt(data.t);
  var arr = c_bezier_curves;
  getColors();
  removeCurves();
  if(countPoints == 16 && draw_t) draw_by_points();
});

/* Gets the button press to draw t_bezier_curves */
stage.on('message:draw', function(data) {
  draw_t = true;
  stage.sendMessage('draw_t', {bool: draw_t});
  sb = parseInt(data.t);
  removeCurves();
  getColors();
  draw_by_points();
});

/* Hide points, curves and segments functions */
stage.on('message:hide', function(data){
  var arr, col, stroke;
  if(data.id == 'points'){
    all_points.forEach(function(points){
      points.forEach(function(point){
        stage.children().forEach(function(e){
          if(e.id == point) {
            if(!data.checked) e.fill(transp);
            else e.fill(POINT_COLOR);
          }
        });
      });
    });
  } else if(data.id != "t_curves"){
    if (data.id == 'segments') {
      arr = paths; col = path_colors; stroke = PATH_STROKE;
      arr.forEach(function(el,i){
        if(!data.checked) el.stroke(transp, stroke).addTo(stage);
        else el.stroke(col[i], stroke).addTo(stage);
      });
    }
    else if(data.id == 'curves') {
      arr = bezier_curves; col = BEZIER_COLOR;
      stroke = BEZIER_STROKE;
      arr.forEach(function(el){
      if(!data.checked) el.stroke(transp, stroke).addTo(stage);
      else el.stroke(col, stroke).addTo(stage);
      });
    }
  } else {
    arr = c_bezier_curves; stroke = T_BEZIER_STROKE;
    arr.forEach(function(el,i){
      if(!data.checked){
        draw_t = false;
        el.stroke(transp, stroke).addTo(stage);
      }
      else {
        draw_t = true;
        el.stroke(colors[i], stroke).addTo(stage);
      }
    });
  }
});

/*
 * Click based functions
*/
stage.on('click', function(clickEvent) {

  target = clickEvent.target;

  if(target.id <= 2 && 'id' in target && countPoints < 16){
    x = clickEvent.x;
    y = clickEvent.y;

    point = new Circle(x, y, POINT_RADIUS).fill(POINT_COLOR).addTo(stage);

    if(all_points[0].length < 4) all_points[0].push(point.id);
    else if(all_points[1].length < 4) all_points[1].push(point.id);
    else if(all_points[2].length < 4) all_points[2].push(point.id);
    else if(all_points[3].length < 4) all_points[3].push(point.id);
    countPoints++;

    /*
     * Drag functions
    */
    point.on('drag', function(dragEvent){
      this.attr({"x": dragEvent.x, "y": dragEvent.y});
      point_id = this.id;
      var aux = this;
      all_points.forEach(function(points, i){
        if(points.includes(point_id)){
          segments = paths[i].segments();
          segments[points.indexOf(point_id)][1] = aux.attr("x");
          segments[points.indexOf(point_id)][2] = aux.attr("y");
          paths[i].segments(segments);
          drawBezierCurve(i);
        }
      });
      if(countPoints == 16) {
        var arr = c_bezier_curves;
        removeCurves();
        draw_by_points();
      }
    });


    /*
     * Delete point functions
    */
    point.on('doubleclick', function(dragEvent){
      var owner_num, num_of_points;
      var point_clicked = this.id;

      all_points.forEach(function(points, i){
        if(points.includes(point_clicked)){
          owner_num = i;
          countPoints -= points.length;
          stage.removeChild(paths[i]);
          stage.removeChild(bezier_curves[i]);
          stage.children().forEach(function(ch){
            if(points.includes(ch.id)){
              stage.removeChild(ch);
            }
          });
        }
      });
      for(i = owner_num; i < 4; i++){
        if(i < 3) {
          all_points[i] = all_points[i + 1];
          paths[i] = paths[i+1];
          paths[i].stroke(path_colors[i], PATH_STROKE);
          bezier_curves[i] = bezier_curves[i + 1];
        } else {
          all_points[i] = [];
          paths[i] = new Path().stroke(path_colors[i], PATH_STROKE).addTo(stage);
          bezier_curves[i] = new Path().stroke(BEZIER_COLOR, BEZIER_STROKE).addTo(stage);
        }
      }
      stage.sendMessage("deactivate", {});
      if(draw_t) {
        removeCurves();
        c_bezier_curves = [];
      }
      draw_t = false;
      stage.sendMessage('draw_t', {bool: draw_t});
    });
    /*
     * Draw functions
    */
    all_points.forEach(function(points, i){
      if(points.includes(point.id)) {
        if(paths[i].segments().length === 0) paths[i].moveTo(x, y);
        else paths[i].lineTo(x, y);
        drawBezierCurve(i);
      }
    });

    // Activate buttons when there are 16 points
    if(countPoints == 16) stage.sendMessage("activate", {});
  }
});
