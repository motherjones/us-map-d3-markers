//stuff to help me find the center of a state
function Point(x,y) {
   this.x=x;
   this.y=y;
}

function Contour(points) {
    this.pts = points || []; // an array of Point objects defining the contour
}


Contour.prototype.area = function() {
   var area=0;
   var pts = this.pts;
   var nPts = pts.length;
   var j=nPts-1;
   var p1; var p2;

   for (var i=0;i<nPts;j=i++) {
      p1=pts[i]; p2=pts[j];
      area+=p1.x*p2.y;
      area-=p1.y*p2.x;
   }
   area/=2;
    
   return area;
};

Contour.prototype.centroid = function() {
   var pts = this. pts;
   var nPts = pts.length;
   var x=0; var y=0;
   var f;
   var j=nPts-1;
   var p1; var p2;

   for (var i=0;i<nPts;j=i++) {
      p1=pts[i]; p2=pts[j];
      f=p1.x*p2.y-p2.x*p1.y;
      x+=(p1.x+p2.x)*f;
      y+=(p1.y+p2.y)*f;
   }

   f=this.area()*6;
    
   return new Point(x/f, y/f);
};

var center_of_svg_path = function(path) {
    var path_points = path.replace("M", '')
        .replace("Z", '').split('L'); 
    var polygon = [];
    for (var i = 0; i < path_points.length; i++) {
        coordinate = path_points[i].split(',');
        var this_lon = parseFloat(coordinate[0]);
        var this_lat = parseFloat(coordinate[1]);
        polygon.push({ x : this_lon, y: this_lat });
    }

    var con = new Contour(polygon);
    center = con.centroid();

    return [center.x, center.y];
}

