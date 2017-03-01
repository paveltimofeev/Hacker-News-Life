// Custom Scripts for Primal Template //

jQuery(function($) {
    "use strict";


        // get the value of the bottom of the #main element by adding the offset of that element plus its height, set it as a variable
        var mainbottom = $('#main').offset().top;

        // on scroll,
        $(window).on('scroll',function(){

        // we round here to reduce a little workload
        stop = Math.round($(window).scrollTop());
        if (stop > mainbottom) {
            $('.navbar').addClass('past-main');
            $('.navbar').addClass('effect-main')
        } else {
            $('.navbar').removeClass('past-main');
       }

      });


    $(document).on('click.nav','.navbar-collapse.in',function(e) {
    if( $(e.target).is('a') ) {
    $(this).removeClass('in').addClass('collapse');
   }
  });


    $(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
  });


    var chartData = "http://research.patico.pro.s3-website-us-east-1.amazonaws.com/data/hacker-news-dev.json";
    var infoId = '#info';
    var chartId = '#network-monitoring';
    var c_width = '100%';
    var c_height = '180 ';
    var offset = parseInt((new Date()).getTimezoneOffset() / 60 * -1);
    
    var setChartData = function ( db ){
    
      var data = db.points
               .sort(function(a,b){ return a.id - b.id});

      var hasInfo = db.info && db.info.length > 0 && db.info[0];
      var latest = hasInfo ? (db.info[0].latest || 0) : 0;
      var timezone = hasInfo ? (db.info[0].timezone + (offset>=0?'+':'') + offset || ' (GMT)') : ' GMT';
                  
      $(chartId)
      .bind('sparklineRegionChange', function(ev) {
          var sparkline = ev.sparklines[0]
          var region = sparkline.getCurrentRegionFields();
          
          if( region.x ) {
            
            function setInfo( val, mmd ){
                
              var h = Math.floor(mmd / 60);
              var h_ = h + offset < 0 ? 24-(h + offset):h;
              var m = mmd - 60 * h;
              var time = h_ + (m < 10 ? ':0' : ':') + m;
              $(infoId).text(val + ' min at ' + time + timezone);
            }
              
            setInfo( region.y, region.x );
          }
      });
    
      $(chartId)
          .sparkline(
             data.map(function(v){ return [v.id, v.point] }),
             {
                type: 'line',
                fillColor: false,
                width: c_width,
                height: c_height,
                lineWidth: 1,
                lineColor: '#995c00',
                fillColor: '#F9F9F9',
                spotRadius: 10,
                spotColor: '',
                minSpotColor: '#50f050',
                maxSpotColor: '#50f050',
                highlightSpotColor: '#3f51b5',
                normalRangeColor: '#ff9900',
                normalRangeMin: 0,
                normalRangeMax: 60,
                tooltipFormat: '<span>{{y}} minutes</span>' 
              }
          );
      
      $(chartId)
          .sparkline(
               data.map(function(v){ return v.id != latest ? 0 : 60  }),
             {
                composite: true,
                type: 'bar',
                barColor: '#000',
                barWidth: 1,
                width: c_width,
                height: c_height,
                tooltipFormat: '' 
              }
          );
    }
    
    $.getJSON( chartData)
      .success( setChartData )
      .error( console.log );
});
