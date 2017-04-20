google.maps.LatLng.prototype.distanceFrom = function(newLatLng) {
  var EarthRadiusMeters = 6378137.0; // meters
  var lat1 = this.lat();
  var lon1 = this.lng();
  var lat2 = newLatLng.lat();
  var lon2 = newLatLng.lng();
  var dLat = (lat2-lat1) * Math.PI / 180;
  var dLon = (lon2-lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = EarthRadiusMeters * c;
  return d;
}

google.maps.LatLng.prototype.latRadians = function() {
  return this.lat() * Math.PI/180;
}

google.maps.LatLng.prototype.lngRadians = function() {
  return this.lng() * Math.PI/180;
}

// === A method for testing if a point is inside a polygon
// === Returns true if poly contains point
// === Algorithm shamelessly stolen from http://alienryderflex.com/polygon/ 
google.maps.Polygon.prototype.Contains = function(point) {
  var j=0;
  var oddNodes = false;
  var x = point.lng();
  var y = point.lat();
  for (var i=0; i < this.getPath().getLength(); i++) {
    j++;
    if (j == this.getPath().getLength()) {j = 0;}
    if (((this.getPath().getAt(i).lat() < y) && (this.getPath().getAt(j).lat() >= y))
    || ((this.getPath().getAt(j).lat() < y) && (this.getPath().getAt(i).lat() >= y))) {
      if ( this.getPath().getAt(i).lng() + (y - this.getPath().getAt(i).lat())
      /  (this.getPath().getAt(j).lat()-this.getPath().getAt(i).lat())
      *  (this.getPath().getAt(j).lng() - this.getPath().getAt(i).lng())<x ) {
        oddNodes = !oddNodes
      }
    }
  }
  return oddNodes;
}

// === A method which returns the approximate area of a non-intersecting polygon in square metres ===
// === It doesn't fully account for spherical geometry, so will be inaccurate for large polygons ===
// === The polygon must not intersect itself ===
google.maps.Polygon.prototype.Area = function() {
  var a = 0;
  var j = 0;
  var b = this.Bounds();
  var x0 = b.getSouthWest().lng();
  var y0 = b.getSouthWest().lat();
  for (var i=0; i < this.getPath().getLength(); i++) {
    j++;
    if (j == this.getPath().getLength()) {j = 0;}
    var x1 = this.getPath().getAt(i).distanceFrom(new google.maps.LatLng(this.getPath().getAt(i).lat(),x0));
    var x2 = this.getPath().getAt(j).distanceFrom(new google.maps.LatLng(this.getPath().getAt(j).lat(),x0));
    var y1 = this.getPath().getAt(i).distanceFrom(new google.maps.LatLng(y0,this.getPath().getAt(i).lng()));
    var y2 = this.getPath().getAt(j).distanceFrom(new google.maps.LatLng(y0,this.getPath().getAt(j).lng()));
    a += x1*y2 - x2*y1;
  }
  return Math.abs(a * 0.5);
}

// === A method which returns the length of a path in metres ===
google.maps.Polygon.prototype.Distance = function() {
  var dist = 0;
  for (var i=1; i < this.getPath().getLength(); i++) {
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  return dist;
}

// === A method which returns the bounds as a GLatLngBounds ===
google.maps.Polygon.prototype.Bounds = function() {
  var bounds = new google.maps.LatLngBounds();
  for (var i=0; i < this.getPath().getLength(); i++) {
    bounds.extend(this.getPath().getAt(i));
  }
  return bounds;
}

// === A method which returns a GLatLng of a point a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetPointAtDistance = function(metres) {
  // some awkward special cases
  if (metres == 0) return this.getPath().getAt(0);
  if (metres < 0) return null;
  if (this.getPath().getLength() < 2) return null;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength() && dist < metres); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  if (dist < metres) {
    return null;
  }
  var p1= this.getPath().getAt(i-2);
  var p2= this.getPath().getAt(i-1);
  var m = (metres-olddist)/(dist-olddist);
  return new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m);
}

// === A method which returns an array of GLatLngs of points a given interval along the path ===
google.maps.Polygon.prototype.GetPointsAtDistance = function(metres) {
  var next = metres;
  var points = [];
  // some awkward special cases
  if (metres <= 0) return points;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength()); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
    while (dist > next) {
      var p1= this.getPath().getAt(i-1);
      var p2= this.getPath().getAt(i);
      var m = (next-olddist)/(dist-olddist);
      points.push(new google.maps.LatLng( p1.lat() + (p2.lat()-p1.lat())*m, p1.lng() + (p2.lng()-p1.lng())*m));
      next += metres;    
    }
  }
  return points;
}

// === A method which returns the Vertex number at a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetIndexAtDistance = function(metres) {
  // some awkward special cases
  if (metres == 0) return this.getPath().getAt(0);
  if (metres < 0) return null;
  var dist=0;
  var olddist=0;
  for (var i=1; (i < this.getPath().getLength() && dist < metres); i++) {
    olddist = dist;
    dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i-1));
  }
  if (dist < metres) {return null;}
  return i;
}

// === A function which returns the bearing between two vertices in decgrees from 0 to 360===
// === If v1 is null, it returns the bearing between the first and last vertex ===
// === If v1 is present but v2 is null, returns the bearing from v1 to the next vertex ===
// === If either vertex is out of range, returns void ===
google.maps.Polygon.prototype.Bearing = function(v1,v2) {
  if (v1 == null) {
    v1 = 0;
    v2 = this.getPath().getLength()-1;
  } else if (v2 ==  null) {
    v2 = v1+1;
  }
  if ((v1 < 0) || (v1 >= this.getPath().getLength()) || (v2 < 0) || (v2 >= this.getPath().getLength())) {
    return;
  }
  var from = this.getPath().getAt(v1);
  var to = this.getPath().getAt(v2);
  if (from.equals(to)) {
    return 0;
  }
  var lat1 = from.latRadians();
  var lon1 = from.lngRadians();
  var lat2 = to.latRadians();
  var lon2 = to.lngRadians();
  var angle = - Math.atan2( Math.sin( lon1 - lon2 ) * Math.cos( lat2 ), Math.cos( lat1 ) * Math.sin( lat2 ) - Math.sin( lat1 ) * Math.cos( lat2 ) * Math.cos( lon1 - lon2 ) );
  if ( angle < 0.0 ) angle  += Math.PI * 2.0;
  angle = angle * 180.0 / Math.PI;
  return parseFloat(angle.toFixed(1));
}
google.maps.Polyline.prototype.Contains             = google.maps.Polygon.prototype.Contains;
google.maps.Polyline.prototype.Area                 = google.maps.Polygon.prototype.Area;
google.maps.Polyline.prototype.Distance             = google.maps.Polygon.prototype.Distance;
google.maps.Polyline.prototype.Bounds               = google.maps.Polygon.prototype.Bounds;
google.maps.Polyline.prototype.GetPointAtDistance   = google.maps.Polygon.prototype.GetPointAtDistance;
google.maps.Polyline.prototype.GetPointsAtDistance  = google.maps.Polygon.prototype.GetPointsAtDistance;
google.maps.Polyline.prototype.GetIndexAtDistance   = google.maps.Polygon.prototype.GetIndexAtDistance;
google.maps.Polyline.prototype.Bearing              = google.maps.Polygon.prototype.Bearing;

/////////////////////////////////////////////////////////////  TOOLTIP  //////////////////////////////////////////////
//script que cria um tooltip para o veículo
function Tooltip(options) {
    this.marker_ = options.marker;
    this.content_ = options.content;
    this.map_ = options.marker.get('map');
    this.cssClass_ = options.cssClass || null;
    this.div_ = null;
    this.setMap(this.map_);
    this.visible = options.visible || null; //visibility
    this.esquerda = options.esquerda || 20;
    this.topo = options.topo || 60;
    var me = this;
}
Tooltip.prototype = new google.maps.OverlayView();
Tooltip.prototype.onAdd = function() {
    var div = document.createElement('DIV');
    div.style.position = "absolute";
    if (this.visible) {
        div.style.visibility = this.visible;
    }
    if (this.cssClass_)
        div.className += " " + this.cssClass_;
    div.innerHTML = this.content_;
    this.div_ = div;
    var panes = this.getPanes();
    panes.floatPane.appendChild(this.div_);
}
Tooltip.prototype.draw = function() {
    var overlayProjection = this.getProjection();
    var ne = overlayProjection.fromLatLngToDivPixel(this.marker_.getPosition());
    var div = this.div_;
    div.style.left = ne.x + this.esquerda + 'px';
    div.style.top = ne.y - this.topo + 'px';
}
Tooltip.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
}
Tooltip.prototype.hide = function() {
    if (this.div_) {
        this.div_.style.visibility = "hidden";
    }
}
Tooltip.prototype.show = function() {
    if (this.div_) {
        this.div_.style.visibility = "visible";
    }
}

/////////////////////////////////////////////////////////////  MOVE MARKER  //////////////////////////////////////////////
//Funções para criação do move marker
var arrayObjects = new Array();
var boundsMoveMarker = new google.maps.LatLngBounds();

function createObjects(records){
	var object;
	var timerOptions;
	var arrayAux;
	var tooltipOptions;
	for(var i=0;i<records.length;i++){
		arrayAux = new Array();
		object = new Object();
		timerOptions = new Object();
		object.id = records[i].id;
		for(var j=0;j<records[i].positions.length;j++){			
			arrayAux.push(new google.maps.LatLng(parseFloat(records[i].positions[j][0]), parseFloat(parseFloat(records[i].positions[j][1]))));			
			boundsMoveMarker.extend(arrayAux[arrayAux.length-1]);
		}
		object.polyline = new google.maps.Polyline({path: arrayAux,strokeColor: '#FF0000',strokeWeight: 3,map: map});
		object.polylineCalc = new google.maps.Polyline({path: [arrayAux[0]],strokeColor: '#FF0000',strokeWeight: 3});
		object.marker = createMarker(object.id, arrayAux[0]);
		object.marker.tooltip = new Tooltip({marker: object.marker, content: object.id, cssClass: 'tooltip'});
		object.timerHandle = null;
		timerOptions.tick = 20;
		timerOptions.step = 300;
		timerOptions.meters = null;
		timerOptions.lastVertex = 1;
		timerOptions.polylineDistance = object.polyline.Distance();
		object.timerOptions = timerOptions;
		arrayObjects.push(object);
	}
	map.fitBounds(boundsMoveMarker);
}

function createMarker(id, position){	
	var icon = new google.maps.MarkerImage();
	icon.url = pauseIcon; 
	icon.scaledSize = new google.maps.Size(25, 37);
	icon.size = new google.maps.Size(25, 37);
    var marker = new google.maps.Marker({
        position: position,
        map: map,        
        zIndex: Math.round(position.lat()*-100000)<<5,
		icon: icon
	});
	google.maps.event.addListener(marker, 'click', function() {
		pausePlay(id);
	});
    return marker;
}

function updatePoly(aux,object) {
	if (object.polylineCalc.getPath().getLength() > 20) {
		object.polylineCalc=new google.maps.Polyline([object.polyline.getPath().getAt(object.timerOptions.lastVertex-1)]);
	}
	if (object.polyline.GetIndexAtDistance(aux) < object.timerOptions.lastVertex+2) {
		if (object.polylineCalc.getPath().getLength()>1) {
			object.polylineCalc.getPath().removeAt(object.polylineCalc.getPath().getLength()-1)
		}
		object.polylineCalc.getPath().insertAt(object.polylineCalc.getPath().getLength(),object.polyline.GetPointAtDistance(aux));
	} else {
		var polyAux = object.polyline.getPath().getArray();
		object.polylineCalc.getPath().insertAt(object.polylineCalc.getPath().getLength(),polyAux[polyAux.length-1]);
	}
}

function animate(aux, id) {
	var object = getObjectById(id);
	if (aux>object.timerOptions.polylineDistance) {
		var polyAux = object.polyline.getPath().getArray();
		object.marker.setPosition(polyAux[polyAux.length-1]);
		object.marker.tooltip.marker_ = object.marker;
		object.marker.tooltip.draw();
		object.marker.getIcon().url = playIcon; 
		object.marker.setTitle("Play");
		google.maps.event.clearListeners(object.marker, 'click');
		google.maps.event.addListener(object.marker, 'click', function() {
			object.marker.setPosition(object.polyline.getPath().getArray()[0]);
			object.marker.getIcon().url = pauseIcon; 
			object.marker.setTitle("Pause");
			google.maps.event.clearListeners(object.marker, 'click');
			google.maps.event.addListener(object.marker, 'click', function() {
				pausePlay(object.id);
			});
			setTimeout("animate(0," + object.id + ")",0);
		});
		return;
	}
	var p = object.polyline.GetPointAtDistance(aux);
	object.marker.setPosition(p);
	object.marker.tooltip.marker_ = object.marker;
	object.marker.tooltip.draw();
	updatePoly(aux,object);
	object.timerOptions.meters = aux+object.timerOptions.step;
	object.timerOptions.timerHandle = setTimeout("animate("+ object.timerOptions.meters+","+ object.id+")", object.timerOptions.tick);
}

function getObjectById(id){
	for(var i=0;i<arrayObjects.length;i++){
		if(arrayObjects[i].id == id){
			return arrayObjects[i];
		}
	}
}

function pausePlay(id){
	var object = getObjectById(id);
	if (object.timerOptions.timerHandle != null) { 
		clearTimeout(object.timerOptions.timerHandle); 
		object.timerOptions.timerHandle = null;
		object.marker.getIcon().url = playIcon; 
		object.marker.setTitle("Play");
	}else{
		object.timerOptions.timerHandle = setTimeout("animate("+ object.timerOptions.meters +"," +object.id+")", 0);
		object.marker.getIcon().url = pauseIcon; 
		object.marker.setTitle("Pause");
	}
}

function changeSpeed(speed){
	// 0 - slow; 1 - normal; 2 - fast
	var changeSpeed = 0;
	switch(speed){
		case "0": changeSpeed = 50;
				break;
		case "1": changeSpeed = 300;
				break;
		case "2": changeSpeed = 600;
				break;
	}
	for(var i=0;i<arrayObjects.length;i++){
		arrayObjects[i].timerOptions.step = changeSpeed;
	}
}

function showHideTolltip(state){
	for(var i=0;i<arrayObjects.length;i++){
		if(state==0){
			arrayObjects[i].marker.tooltip.show();
		}
		else{
			arrayObjects[i].marker.tooltip.hide();
		}
	}
}