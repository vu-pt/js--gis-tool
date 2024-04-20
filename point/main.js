var map;
var list_points = [];
var clickedPoint = [0, 0, 0];
var string_points = "";
var toDeg = function (rad) { return rad * 180 / Math.PI; }
var toRad = function (deg) { return deg * Math.PI / 180; }
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}
function findNewPoint(coord, bearing, distance) {
    /** http://www.movable-type.co.uk/scripts/latlong.html
     φ is latitude, λ is longitude, 
     θ is the bearing (clockwise from north), 
     δ is the angular distance d/R; 
     d being the distance travelled, R the earth’s radius*
     **/
    var
        radius = 6371e3, //meters
        δ = Number(distance) / radius, // angular distance in radians
        θ = toRad(Number(bearing)),
        φ1 = toRad(Number(coord[1])),
        λ1 = toRad(Number(coord[0]));

    var φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

    var λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

    λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180°

    return [toDeg(λ2), toDeg(φ2)]; //[lon, lat]
}
function savePoint(x, y, z) {
    clickedPoint[0] = x;
    clickedPoint[1] = y;
    if (z) {
        clickedPoint[2] = z;
    }
}
function logPoint(point) {
    if (point[2]) {
        $('#points').val($('#points').val() +"\n"+ JSON.stringify(point));
    }
    else {
        $('#points').val($('#points').val() +"\n"+ JSON.stringify([point[0], point[1]]));
    }
}
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GraphicsLayer",
    "esri/Graphic"
], function (Map, MapView, GraphicsLayer, Graphic) {
    map = new Map({
        basemap: "topo-vector"
    });
    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [106.80196068432218, 10.870525057480787],
        zoom: 16
    });
    var graphicsLayer = new GraphicsLayer();
    var drawPoint = function (x, y, second) {
        const color = second ? '#5bc039' : '#3991ef';
        return new Graphic({
            geometry: {
                type: "point",
                longitude: x,
                latitude: y
            },
            symbol: {
                type: "simple-marker",
                color: color,
                outline: {
                    color: color,
                    width: 1
                }
            }
        });
    };

    var onDraw = function() {
        graphicsLayer.removeAll();
        graphicsLayer.add(drawPoint(clickedPoint[0], clickedPoint[1]));
        logPoint(clickedPoint);
        if ($('#d').val() && $('#a').val()) {
            const newPoint = findNewPoint([clickedPoint[0], clickedPoint[1]], $('#a').val(), $('#d').val());
            $('#p2').val(JSON.stringify(newPoint));
            graphicsLayer.add(drawPoint(newPoint[0], newPoint[1], true));
            logPoint(newPoint);
        }
    }

    $('#draw-btn').click(function(){
        onDraw();
    });

    view.popup.autoOpenEnabled = false; // Disable the default popup behavior
    view.on("click", function (event) { // Listen for the click event
        view.hitTest(event).then(function (hitTestResults) { // Search for features where the user clicked
            if (hitTestResults.results) {
                if ($('#z').val()) {
                    $('#p1').val(JSON.stringify(clickedPoint));
                    savePoint(event.mapPoint.longitude, event.mapPoint.latitude, Number($('#z').val()));
                } else {
                    savePoint(event.mapPoint.longitude, event.mapPoint.latitude);
                    $('#p1').val(JSON.stringify([clickedPoint[0], clickedPoint[1]]));
                }
                
            }
        })
    });
    map.add(graphicsLayer);
});