$(document).ready(function(){
var toSearch = "https://api.themoviedb.org/3/search/movie?include_adult=false&page=1&language=en-US&api_key=23abb84ac98a9a48d58b9f80720f6b86&query=";

var genreList = 'https://api.themoviedb.org/3/genre/movie/list?language=en-US&api_key=23abb84ac98a9a48d58b9f80720f6b86'
var config = 'https://api.themoviedb.org/3/configuration?api_key=23abb84ac98a9a48d58b9f80720f6b86';
var omdb = 'http://www.omdbapi.com/?t=';
var settings = {
  "async": true,
  "crossDomain": true,
  "url": "https://api.themoviedb.org/3/search/movie?include_adult=false&page=1&language=en-US&api_key=23abb84ac98a9a48d58b9f80720f6b86&query=inception",
  "method": "GET",
  "headers": {},
  "data": "{}"
}

var imgSet = {
 "async": true,
  "crossDomain": true,
  "url": config,
  "method": "GET",
  "headers": {},
  "data": "{}"
}

var title;

//verifies whether movie meets the criteria
function verification(genre){
  for(var x = 0; x < genre.length; x++){
    if(genre[x].localeCompare("Biography") === 0 || genre[x].localeCompare("Documentary") === 0 || genre[x].localeCompare("History") === 0 || genre[x].localeCompare("War") === 0){
      console.log('correct genre: '+ genre[x]);
      return true; 
    }
  }//end for
  return false;
}

function checkGenre(response){
  var genre = [];
  var ids = response.results[0].genre_ids; 
  $.getJSON(genreList, function(data){
    for(var x = 0; x < data.genres.length; x++){
      for(var y = 0; y < ids.length; y++){
        if(data.genres[x].id === ids[y]){
          genre.push(data.genres[x].name);
        }
      }
    } 
  });


  $.getJSON("http://www.omdbapi.com/?t=" + title.match(/(?=[A-Z])[ |A-Z|a-z]+(?!\()/g), 
    function(data){
      if(data.Genre){
        var splitDem = data.Genre.split(", ");
        for(var x = 0; x < splitDem.length; x++){
          genre.push(splitDem[x]); 
        }
        asyncFin(response, genre);
      }
    }
  );

}

function asyncFin(response, genre){
  console.log('final genre: '+genre);
  if(verification(genre)){
    console.log("Status: "+verification(genre));
  }else{
    console.log("This may not be based off a true story")
  }
  $('#filmTitle').text(response.results[0].title);
  $('#overview').text(response.results[0].overview);
  $('filmTitle').show();

  $.ajax(imgSet).done(function (data){
      $("#poster").attr("src",data.images.base_url+data.images.poster_sizes[1]+response.results[0].poster_path);
      $("#poster").show();
  })
}


function getIt(){
  $.ajax(settings).done(function (response) {
      checkGenre(response);    
  });
}

function details(cari){
  var searchLink = "https://en.wikipedia.org/w/api.php?action=opensearch&search="+cari+"&format=json&callback=?";
  $.getJSON(searchLink, 
      function(data){
        title = cari;
        if(!data[1][0].includes('film') && data[1].length > 1){
          for(var x = 0; x < data[1].length; x++){
            if((data[2][x]).includes("film")){
              $('#details').text(data[1][x]);
              title= data[1][x];
              break;
            }
          }
        }else{
          $('#details').text(data[1]);
        }



        $.getJSON('https://www.wikidata.org/w/api.php?action=wbsearchentities&search='+cari+'&language=en&format=json&callback=?', function(data){
      // console.log("DESCRIPTION: "+data.search[0].description);
      var i = -1; 
      do{
        i++;
        $.getJSON('https://www.wikidata.org/w/api.php?action=parse&page='+data.search[i].id+'&format=json&callback=?', function(info){

          var regex = /(main subject).*(?=(country of origin))/g;
          var polish = /(main subject)|(\<\/\w*(?=\>)>)?\\n|(<(\w|\s|=|\\|"|-|\$|\/)*>)|0 references|<.*>/g;
          if(JSON.stringify(info.parse.text).match(regex)){
            var parse = JSON.stringify(info.parse.text).match(regex).toString().replace(polish,",").split(',');
            parse = $.map( parse, function(v){
              return v === "" ? null : v;
            });
            events = parse;
            events.push(cari);
            console.log('test= ' + events);

            getDetails(events);
          }
        });
      }while(data.search[i].description !== undefined && data.search[i].description.includes('film'));

    });

        console.log('The title: '+title);


        var trueStoryLink = "https://en.wikipedia.org/w/api.php?format=xml&action=query&prop=extracts&titles="+title+"&redirects=true&format=json&callback=?";
        $.getJSON(trueStoryLink, 
            function(data){
              if(!JSON.stringify(data.query).includes('"pages":{"-1":{"ns":0,')){
                var r = /(?!<span id=\\"\w+\\">)([\w|\s]+)(?=<\/span>)/g;

                var nude = JSON.stringify(data.query);
                var unedited = nude.match(r).toString();
                // console.log("nude "+nude);
                var edited = unedited.toString().split(',');
                console.log("EDITED: "+edited);

                var trueLists = ['history', 'historical', 'novel','representation' ,'critical response', 'comparison to actual events', 'development'];
                $('#info').text("");
                for(var x = 0; x < edited.length; x++){
                  for(var y = 0; y < trueLists.length; y++){
                    console.log('edited: '+edited[x]+"   trueList: "+trueLists[y]);
                    if(edited[x].toLowerCase().includes(trueLists[y])){
                      var content = new RegExp(edited[x]+"<\/span><\/h\\d{1}>(\\\\n)*<(\\w)>+.+?(?=<span)", "g");
                      var corrupted = nude.match(content);
                      console.log('corrupted: '+corrupted);
                      corrupted = corrupted.toString().replace(/\\n|\\"/g, '' );
                      $('#info').append(corrupted);
                      $('#info').show();
                      break;
                    }
                  }
                }
              }else{
                $('#trueStory').text("No info found on Wikipedia");
              }
              
              getIt();
            }
        ); 

      }//end of function
  );
}

var final;

function ParseDMS(input) {
    var parts = input.split(/[^\d\w\.]+/);    
    var lat = ConvertDMSToDD(parts[0], parts[1], parts[2], parts[3]);
    var lng = ConvertDMSToDD(parts[4], parts[5], parts[6], parts[7]);
    // console.log('parts[0]: ' + parts[0] +'parts[2]: ' + parts[2] + 'parts[3]: ' + parts[3] +'parts[4]: ' + parts[4]);
    // console.log(parts);
    return {
        lattitude: lat,
        longitude: lng,
        Position : lat + ',' + lng
    }
}


function ConvertDMSToDD(days, minutes, seconds, direction) {
   var dd = 0; 
    dd += parseFloat(days) + parseFloat(minutes/60) + (seconds/(3600));
    if (direction == "S" || direction == "W") {
        dd *= -1;
    } // Don't do anything for N or E
    console.log('dddd:  '+dd);
    return dd;
}

function getDetails(events){
  console.log('TEST');
  var locations;
  $('#eventsDetail').text('');
  console.log('events: '+events);
  for(var x = 0; x < events.length; x++){
    $.getJSON('https://www.wikidata.org/w/api.php?action=wbsearchentities&search='+events[x]+'&language=en&format=json&callback=?', function(data){
      $('#eventsDetail').append('<b>'+data.searchinfo.search+"= </b> <br />"+data.search[0].description+'<br />');
      $('#eventsDetail').show();
      

      
      $.getJSON('https://www.wikidata.org/w/api.php?action=wbsearchentities&search='+events[x]+'&language=en&format=json&callback=?', function(info){

        console.log('checkdata: '+data.search[0].id)
        $.getJSON('https://www.wikidata.org/w/api.php?action=parse&page='+data.search[0].id+'&format=json&callback=?', function(coor){
          var regex = /\d+.{1}\d+'\d+&\w+;N, \d+.{1}\d+'\d+&\w+;W/g;
          console.log('coor only: '+JSON.stringify(coor).match(regex));
          if(JSON.stringify(coor).match(regex)){
            var test = JSON.stringify(coor).match(regex).toString().replace(/&quot;/g, ' ').replace(/,/, '');

            final = ParseDMS(test);
            console.log('final: '+final[0]);
            initMap();
          }

        
        });
      });
      

    });
  }
}

  var map;
  var infowindow;

  function initMap() {
    $('#map').show();
    var lattitude;
    var longitude; 
    $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=apartemen semanggi&key=AIzaSyC_rxuNBzcclkEGcLEZoixCxJeuJtjs0wo&libraries=places', function(data){
      lattitude = final.lattitude;
      longitude = final.longitude;
    
    factLoc = {lat: lattitude, lng: longitude};

    console.log('factLoc: '+JSON.stringify(factLoc));

    map = new google.maps.Map(document.getElementById('map'), {
      center: factLoc,
      zoom: 9,
    });

    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    service.textSearch({
      location: factLoc,
      radius: 500,
      type: ['country', 'point_of_interest' , 'street_address']
    }, callback);

    });
  }

  function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        createMarker(results[i]);
        console.log('result'+i+'  ='+results[i]);
      }
    }
  }

  function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
    });
  }

    
var events; 

$('#searchFilm').keypress(function (e) {
  cari = "";
  events = "";


  if (e.which == 13) {
    var cari = $('#searchFilm').val();
    settings.url = toSearch+cari;
    $('#historicalFacts').show();
    $('#events').show();
    details(cari);
    $("#map").hide();
    console.log('keypress= '+cari);

    return false;
  }
});






});



