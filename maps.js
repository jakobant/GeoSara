window.isActive = true;
$(window).focus(function() { this.isActive = true; });
$(window).blur(function() { this.isActive = false; });


function FixedQueue( size, initialValues ){
    initialValues = (initialValues || []);
    var queue = Array.apply( null, initialValues );
    queue.fixedSize = size;
    queue.push = FixedQueue.push;
    queue.splice = FixedQueue.splice;
    queue.unshift = FixedQueue.unshift;
    FixedQueue.trimTail.call( queue );
    return( queue );
}
FixedQueue.trimHead = function(){
    if (this.length <= this.fixedSize){ return; }
    Array.prototype.splice.call( this, 0, (this.length - this.fixedSize) );
};
FixedQueue.trimTail = function(){
  if (this.length <= this.fixedSize) { return; }
  Array.prototype.splice.call( this, this.fixedSize, (this.length - this.fixedSize)
  );
};
FixedQueue.wrapMethod = function( methodName, trimMethod ){
  var wrapper = function(){
    var method = Array.prototype[ methodName ];
    var result = method.apply( this, arguments );
    trimMethod.call( this );
    return( result );
  };
  return( wrapper );
};
FixedQueue.push = FixedQueue.wrapMethod( "push", FixedQueue.trimHead );
FixedQueue.splice = FixedQueue.wrapMethod( "splice", FixedQueue.trimTail );
FixedQueue.unshift = FixedQueue.wrapMethod( "unshift", FixedQueue.trimTail );
var airports = [];
d3.csv("airports.csv", function(data) { airports = data;  });
d3.csv("flightdata.csv", function(data) { flightdata = data; });
function getAirport(iata) {
  for(i = 0; i < airports.length; i++){
    if (airports[i].iata == iata) { return airports[i]; }
  }
  return airports[0];
}

function getRandomInt(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}

function prependFlightRow(id, args) {
    var tr = document.createElement('tr');
    count = args.length;

    for (var i = 0; i < count; i++) {
        var td = document.createElement('td');
        if (args[i] === args[2]) {
        console.log(args[i])
        //var path = 'flags/' + args[i] + '.png';
        var path = 'https://www.free-country-flags.com/countries/' + args[i] + '/1/tiny/' + args[i] + '.png';
        var img = document.createElement('img');
        img.src = path;
        td.appendChild(img);
        tr.appendChild(td);
        } else {
        var textNode = document.createTextNode(args[i]);
        td.appendChild(textNode);
        tr.appendChild(td);
        }
    }

    var element = document.getElementById(id);
    console.log(id);
    console.log(element);
    var rowCount = element.rows.length;

    // Only allow 50 rows
    if (rowCount >= 10) {
        element.deleteRow(rowCount -1);
    }
    element.insertBefore(tr, element.firstChild);
}
function handleFlights(msg) {
    var flightList = [
              msg.date,
              msg.competition,
              getAirport(flightdata[f].to).country,
              getAirport(flightdata[f].to).country];
    prependFlightRow('flight-tracking', flightList);
}

var hits = FixedQueue( 15, [  ] );
var boom = FixedQueue( 15, [  ] );
var map = new Datamap({
    scope: 'world',
    element: document.getElementById('container2'),
    projection: 'mercator',
    fills: { defaultFill: 'black', },
    geographyConfig: {
      dataUrl: null,
      hideAntarctica: true,
      borderWidth: 0.75,
      borderColor: '#4393c3',
      popupTemplate: function(geography, data) {
        return '<div class="hoverinfo" style="color:white;background:black">' +
               geography.properties.name + '</div>';
      },
      popupOnHover: true,
      highlightOnHover: false,
      highlightFillColor: 'black',
      highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
      highlightBorderWidth: 2
    },

  })

var f = 0;
var randAir = getRandomInt(1, 10);
var to_airport = {};
var flights = {
    interval: 2000,
    init: function(){
       setTimeout(
           jQuery.proxy(this.getData, this),
           this.interval
       );
    },
    getData: function() {
    var self = this;
        //if (flightdata[f].home == 'true') { strokeColor = 'yellow'; strokeWidth = 1; arcSharpness = 0.8; }
        if (flightdata[f].type == 'flight') { strokeColor = 'green'; strokeWidth = 2; arcSharpness = 1.1; }
        else if (flightdata[f].type == 'train') { strokeColor = 'blue'; strokeWidth = 2; arcSharpness = 1.2; }
        else if (flightdata[f].type == 'car') { strokeColor = 'red'; strokeWidth = 2; arcSharpness = 1.3; }
        else { strokeColor = 'pink'; strokeWidth = 1; arcSharpness = 0.2; }
        handleFlights(flightdata[f]);
        //$('#flightsdiv').append("<div class='countList'>"+flightdata[f].date + " " + flightdata[f].competition + " " +
        //    getAirport(flightdata[f].to).city + " " + flightdata[f].type +
        //    " <span style='color:yellow'>" + flightdata[f].success + " "+ flightdata[f].dance_type + "</span> </div>");
        //$('#flightsdiv').animate({scrollTop: $('#flightsdiv').prop("scrollHeight")}, 100);
        if (flightdata[f].home == 'true') { strokeWidth = 0.7; arcSharpness = 0.8; }
        hits.push( { origin : { latitude: getAirport(flightdata[f].from).latitude, longitude: getAirport(flightdata[f].from).longitude },
            destination : { latitude: getAirport(flightdata[f].to).latitude, longitude: getAirport(flightdata[f].to).longitude } } );
        map.arc(hits, {strokeWidth: strokeWidth, strokeColor: strokeColor, arcSharpness: arcSharpness, animationSpeed: 1200});
        boom.push( { radius: 15, latitude: getAirport(flightdata[f].to).latitude, longitude: getAirport(flightdata[f].to).longitude,
            fillOpacity: 1, text: flightdata[f].competition, img: "saraung.png"} );
        map.bubbles(boom, {
            popupTemplate: function(geo, data) {
            return '<div class="hoverinfo">' + data.text + '<img src="'+ data.img+'" height=50 width=50></div>';
        } });

        f++;
        if (f == flightdata.length) { f = 0; }

        this.init() ;
	},
};


// start the ball rolling!
flights.init();
