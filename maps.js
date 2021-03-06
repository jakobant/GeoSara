
//delete not used
$(document).ready(function () {
        $(".preview").hover(function(){
            $(this).find('img').fadeIn();
         }, function(){
            $(this).find('img').fadeOut();
        });
    });
// Alternatively with jQuery
    $(window).on('resize', function() {
       map.resize();
    });
window.isActive = true;
$(window).focus(function() { this.isActive = true; });
$(window).blur(function() { this.isActive = false; });
//if (window.DeviceOrientationEvent) { window.addEventListener('orientationchange', function() { location.reload(); }, false); }

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
d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vS_YSj972k5Do_gJJ-j_Rxx5-f7gU8ofh1jGNcQyTWiYxioQtDBtuZQyIYSGqEh2ZVuCBpumqL1K3CC/pub?output=csv", function(data) { flightdata = data; });
//d3.csv("flightdata.csv", function(data) { flightdata = data; });
function getAirport(iata) {
  for(i = 0; i < airports.length; i++){
    if (airports[i].iata == iata) { return airports[i]; }
  }
  return airports[0];
}

function getRandom(min, max) {return Math.random() * (max - min + 1) + min;}
function getRandomInt(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}

function prependFlightRow(id, args) {
    var tr = document.createElement('tr');
    count = args.length;

    for (var i = 0; i < count; i++) {
        var td = document.createElement('td');
        if (i === 2) {
            //var path = 'flags/' + args[i] + '.png';
            var imgname = args[i].replace('United Arab Emirates', 'UEA').replace(' ', '_');
            var path = 'https://www.free-country-flags.com/countries/' + imgname + '/1/tiny/' + imgname + '.png';
            var img = document.createElement('img');
            img.src = path;
            td.appendChild(img);
            tr.appendChild(td);
        } else {
            var textNode;
            if (i === 1) {
                textNode = document.createTextNode(args[i]);
            } else {
                textNode = document.createTextNode(args[i]);
            }
            td.appendChild(textNode);
            tr.appendChild(td);
        }
    }

    var element = document.getElementById(id);
    var rowCount = element.rows.length;

    // Only allow 50 rows
    if (rowCount >= 50) {
        //element.deleteRow(rowCount -1);
        element.removeChild(element.childNodes[0]);
    }
    element.appendChild(tr);
    //element.insertBefore(tr, element.firstChild);
}
function appendFlightRow(id, flight, num) {
    var tr = document.createElement('tr');
    // date
    var td = document.createElement('td');
    var textNode = document.createTextNode(flight.date);
    td.appendChild(textNode);
    tr.appendChild(td);
    // flag
    var td = document.createElement('td');
    //var imgname = flight.country;
    var imgname = flight.country.replace('United Arab Emirates', 'UEA').replace(' ', '_');
    var path = 'https://www.free-country-flags.com/countries/' + imgname + '/1/tiny/' + imgname + '.png';
    var img = document.createElement('img');
    img.src = path;
    td.appendChild(img);
    tr.appendChild(td);
    // ? video
    //var td = document.createElement('td');
    //if (flight.video || flight.video_id || flight.fbvideo_id || flight.link) {
    //    var textNode = document.createTextNode('Yes'); }
    //else  {
    //    var textNode = document.createTextNode('');}
    //td.appendChild(textNode);
    //tr.appendChild(td);
    // to city
    var td = document.createElement('td');
    var textNode = document.createTextNode(flight.city);
    td.appendChild(textNode);
    tr.appendChild(td);
    // competition
    var td = document.createElement('td');
    var a = document.createElement('a');
    a.setAttribute("href","#");
    a.setAttribute("class","showInfo");
    a.style.color = "white";
    a.id = num;
    //var link_text = '<a href="#" class="preview">'+ flight.competition +'<img src="'+ flight.img +'" class="hide-image" style="z-index: 100; position: absolute;"/>';
    var textNode = document.createTextNode(flight.competition);
    if (flight.video || flight.video_id || flight.fbvideo_id) {
        var img = document.createElement('img');
        img.src='images/play.png';
        img.height='11';
        a.appendChild(img);
    }
    if (flight.link) {
        var img = document.createElement('img');
        img.src='images/link.png';
        img.height='11';
        a.appendChild(img);
    }
    a.appendChild(textNode);
    td.appendChild(a);
    tr.appendChild(td);

    var element = document.getElementById(id);
    var rowCount = element.rows.length;
    // Only allow 50 rows
    if (rowCount >= 14) {
        element.removeChild(element.childNodes[0]);
    }
    element.appendChild(tr);
}

function handleFlights(msg, num) {
    appendFlightRow('flight-tracking', msg, num);
}

var hits = FixedQueue( 20, [  ] );
var boom = FixedQueue( 20, [  ] );
var map = new Datamap({
    scope: 'world',
    element: document.getElementById('container2'),
    setProjection: function(element) {
    var projection = d3.geo.mercator()
      .center([48.473142, 43.472180])
      //.rotate([4.4, 0])
      .scale(200)
      //.translate([element.offsetWidth / 2, element.offsetHeight / 2]);
      var path = d3.geo.path()
      .projection(projection);
    return {path: path, projection: projection};
  },
    //projection: 'mercator',
    //projection: 'orthographic',
     responsive: true,
    fills: { defaultFill: 'black', },
    geographyConfig: {
      dataUrl: null,
      hideAntarctica: true,
      hideHawaiiAndAlaska : true,
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
  console.log(map.options);

var f = 0;
var to_airport = {};
var flights = {
    interval: 3000,
    init: function(){
       setTimeout(
           jQuery.proxy(this.getData, this),
           this.interval
       );
    },
    getData: function() {
    var self = this;
        if (flightdata[f].type == 'flight') {
            strokeColor = 'rgb(0,'+ getRandomInt(66,255) +',0)'; strokeWidth = 2; arcSharpness = getRandom(0.8, 1.4); }
        else if (flightdata[f].type == 'train') {
            strokeColor = 'rgb(0,'+ getRandomInt(36,100) +','+ getRandomInt(100,255) +')'; strokeWidth = 2; arcSharpness = getRandom(0.8, 1.4); }
        else if (flightdata[f].type == 'car') {
            strokeColor = 'rgb('+getRandomInt(155,255) +','+ getRandomInt(10,100) +',0)';; strokeWidth = 2; arcSharpness = getRandom(0.8, 1.4); }
        else {
            strokeColor = 'pink'; strokeWidth = 1; arcSharpness = getRandom(1, 1.6); }
        if (flightdata[f].home) {
            strokeColor = 'yellow'; strokeWidth = 1; arcSharpness = getRandom(0.8, 1.4); }
        if (flightdata[f].from  == flightdata[f].to) {
            strokeColor = 'yellow'; strokeWidth = 0; arcSharpness = 0; }
        if (flightdata[f].home == 'true') {
        strokeWidth = 0.7; arcSharpness = 0.8; }

        handleFlights(flightdata[f], f);

        hits.push( { origin : { latitude: getAirport(flightdata[f].from).latitude, longitude: getAirport(flightdata[f].from).longitude },
            destination : { latitude: getAirport(flightdata[f].to).latitude, longitude: getAirport(flightdata[f].to).longitude } } );
        map.arc(hits, {strokeWidth: strokeWidth, strokeColor: strokeColor, arcSharpness: arcSharpness, animationSpeed: 2200});
        var res = '';
        if (flightdata[f].success) {
            res = 'Rank: '+ flightdata[f].success + '<br>'; }
        if (flightdata[f].video_id) {
            var media_link = '<a href="http://www.youtube.com/watch?feature=player_embedded&v=' + flightdata[f].video_id + '" target="_blank"><img src="http://img.youtube.com/vi/' + flightdata[f].video_id + '/0.jpg" alt="" width="90" height="auto" border="0" /></a>'; }
        //else if (flightdata[f].fbvideo_id) {
        //    var media_link = '<iframe width="280" height="auto" src="https://www.facebook.com/v2.3/plugins/video.php?allowfullscreen=true&autoplay=false&container_width=90&href=https%3A%2F%2Fwww.facebook.com%2Fredbull%2Fvideos%2F'+ flightdata[f].fbvideo_id +'%2F&locale=en_US&sdk=joey"></iframe>'; }
        else if (flightdata[f].video) {
            var media_link = '<a href="' + flightdata[f].video + '" target="_blank"><img src="' + flightdata[f].img + '" alt="" width="90" height="auto" border="0" /></a>'; }
        else if (flightdata[f].img) {
            var media_link = '<img src="' + flightdata[f].img + '" alt="" width="90" height="auto" border="0" />'; }
        else {
            var media_link = '<a href="https://www.facebook.com/nicoloandsara/" target="_blank"><img src="https://scontent-lhr3-1.xx.fbcdn.net/v/t1.0-1/p200x200/21617637_292475814494851_5223635608251391704_n.jpg?_nc_cat=0&oh=62ad851fc986f24b354c172cb2b275e4&oe=5B6F96ED" alt="" width="90" height="auto" border="0" /></a>'; }
        var bub_text = 'Date: '+flightdata[f].date+ '<br>C: ' + flightdata[f].competition+ '<br>Type: ' + flightdata[f].dance_type+ '<br>' + res + 'Country: ' + flightdata[f].country;

        boom.push( { radius: 4, latitude: getAirport(flightdata[f].to).latitude, longitude: getAirport(flightdata[f].to).longitude,
            fillOpacity: 1, text: bub_text, img: flightdata[f].img, media_link: media_link} );

        map.bubbles(boom, {
            popupTemplate: function(geo, data) {
            return '<div class="hoverpop"><div class="fixed">' + data.text + '</div><div class="flex-item">'+ data.media_link+'</div></div>';
        } });
        $("#informBubble").show();
        $("#informBubble").html('<div class="hoverpop"><div class="fixed">' + bub_text + '</div><div class="flex-item">'+ media_link+'</div></div>');

        f++;
        if (f == flightdata.length) { f = 0; }

        this.init() ;
	},
};


$(document).on("click","#informIP #exit", function (e) {
    $("#informIP").html('');
    $("#informIP").hide();
});

$(document).on("click", '#flight-tracking .showInfo', function(e) {
    console.log($(this));
    var index = $(this).attr("id");
    if (flightdata[index].video_id) {
        //embedded auto play
        //var media_link = '<iframe ' + flightdata[index].video_id + '&autoplay=1></iframe>"';
        var media_link = '<iframe width="280" height="auto" src="https://www.youtube.com/embed/'+ flightdata[index].video_id +'?rel=0&amp;autoplay=1&amp;controls=1&amp;showinfo=1" frameborder="0" allowfullscreen></iframe>';
        //var media_link = '<a href="http://www.youtube.com/watch?feature=player_embedded&v=' + flightdata[index].video_id + '" target="_blank"><img src="http://img.youtube.com/vi/' + flightdata[index].video_id + '/0.jpg" alt="" width="320" height="auto" border="0" /></a>';
    }
    else if (flightdata[index].video) {
        var media_link = '<a href="' + flightdata[index].video + '" target="_blank"><img src="' + flightdata[index].img + '" alt="" width="280" height="auto" border="0" /></a>';
    }
    else if (flightdata[index].fbvideo_id) {
        var media_link = '<iframe width="280" height="auto" src="https://www.facebook.com/v2.3/plugins/video.php?allowfullscreen=true&autoplay=true&container_width=280&href=https%3A%2F%2Fwww.facebook.com%2Fredbull%2Fvideos%2F'+ flightdata[index].fbvideo_id +'%2F&locale=en_US&sdk=joey"></iframe>';
        //var media_link = '<div class="fb-video" data-href="https://www.facebook.com/video.php?v=311800209229078'+ flightdata[index].fbvideo_id +'" data-width="280" data-autoplay="true" data-allowfullscreen="true"></div>';
   }
    else if (flightdata[index].link) {
        var media_link = '<a href="' + flightdata[index].link + '" target="_blank"><img src="' + flightdata[index].img + '" alt="" width="280" height="auto" border="0" /></a>';
    }
    else if (flightdata[index].img) {
        var media_link = '<img src="' + flightdata[index].img + '" alt="" width="280" height="auto" border="0" />';
    }
    else {
        var media_link = '<a href="https://www.facebook.com/nicoloandsara/" target="_blank"><img src="https://scontent-lhr3-1.xx.fbcdn.net/v/t1.0-9/25299069_1563821856986532_6757225713160239883_n.jpg?oh=4076e10d808812731f55e73b0ed6394e&oe=5AB86C06" alt="" width="280" height="auto" border="0" /></a>';
    }
    $("#informIP").show();
    $("#informIP").html( '<button id="exit">Close</button><h3>'+ flightdata[index].competition +'</h3>'+
            '<div class="hoverpop"><div class="fixed"><br>Country: ' + flightdata[index].country + ' ' + flightdata[index].city +
            '<br>Dance: ' + flightdata[index].dance_type +
            '<br>Country: ' + flightdata[index].country +
            '<br>Rank: ' + flightdata[index].success + '</div><div class="flex-item">' +
            media_link + '</div>');

    //setProjection: {function(element) {
    var projection = d3.geo.mercator()
      .center([19, -3])
      .rotate([4.4, 0])
      .scale(400)
      //.translate([element.offsetWidth / 2, element.offsetHeight / 2]);
    var path = d3.geo.path()
      .projection(projection);
    //return {path: path, projection: projection};
  //}}
    console.log(map.options)
    //$("#container2").datamaps.options( {projectionConfig: [0,0]});
});

// start the geo flights flowting!
flights.init();
