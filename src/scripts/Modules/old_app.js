import $ from 'jquery';

var DATA_URL = 'http://vaska.vasktrafik.se/data.json';
var POST_URL = 'http://vaska.vasktrafik.se/post';
var TWITTER_API = 'http://cdn.api.twitter.com/1/urls/count.json';
var FACEBOOK_API = 'http://graph.facebook.com/http://www.vasktrafik.se';
var FACEBOOK_LIKE = "http://graph.facebook.com/632949043398485/";
var APP_ID = '150120968495146';
var SOUND_50KB = 'sound/500KB.wav';
var SOUND_10MB = 'sound/10MB.wav';
var fbHandler = (function() {
  var authed = false;
  var user = '';
  var token = '';
  return {
    init: function() {
      //$("#like").hide();
      console.log("facebook Initiated");
      FB.init({
        appId: '150120968495146',
        status: true,
        cookie: true,
        xfbml: false,
        oauth: true
      });
    },
    login: function(callback) {
      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          console.log("User already connected");
          if (callback && typeof(callback) === "function") {
            callback(fbHandler.user);
          }
        } else {
          console.log("login Initiated");
          FB.login(function(response) {
            if (response.authResponse) {
              console.log('Authenticated!');
              console.log(response.accessToken);
              fbHandler.authed = true;
              fbHandler.token = response.accessToken;
              FB.api('/me', function(response) {
                fbHandler.user = response;
                if (callback && typeof(callback) === "function") {
                  callback(response);
                }
              });
            } else {
              console.log('User cancelled login or did not fully authorize.');
            }
          });
        }
      }, {
        scope: 'email,publish_actions'
      });
    },
    getUser: function(callback) {
      fbHandler.login(function(response) {
        FB.api('/me', function(response) {
          callback(response);
        });
      });
    },
    share: function(message) {
      fbHandler.login(function() {
        fbHandler.doShare(message);
      });
    },
    doShare: function(message) {
      FB.ui({
        method: 'feed',
        link: 'http://vasktrafik.se',
        picture: 'http://vasktrafik.se/images/fb_share_image.jpg',
        caption: message,
        description: ' ',
        display: 'iframe',
      });
    }
  }
}())
;
// Window Size Handler
// Show or hide green button on finished depending on window size
var windowSizeHandler = (function() {
  return {
    windowSizeListener: function(e) {
      if ($(window).height() > 400) {
        $('#infoButton').hide();
      } else {
        $('#infoButton').show();
      }
    },
    startListener: function() {
      $(window).bind("resize", windowSizeHandler.windowSizeListener);
      windowSizeHandler.windowSizeListener();
    }
  }
}());
var dataFetcher = (function() {
  var timer = null;
  return {
    fetchData: function() {
      $.getJSON(DATA_URL, function(data) {
        dataFetcher.updateData(data);
      });
    },
    updateData: function(data) {
      var totalData = data.totalNrOfMB;
      var totalUsers = data.totalUsers;
      if (totalData > 1000000) {
        $("#totalMB").text(data.totalNrOfMB / 10000 + ' TB');
      } else {
        $("#totalMB").text(data.totalNrOfMB / 1000 + ' GB');
      }
      $("#totalUsers").text('av ' + data.totalUsers + ' användare');
      $("#wattHour").text(((data.totalNrOfMB * 5.9) / 1000).toFixed(2) + ' kWh');
      $("#wattIphone").text(((data.totalNrOfMB * 5.9) / 9.5).toFixed(0));
      $("#wattCar").text(((data.totalNrOfMB * 5.9) / (300 * 1.6)).toFixed(1));
    },
    start: function() {
      dataFetcher.fetchData();
      if (!dataFetcher.timer) {
        dataFetcher.timer = setInterval(function() {
          dataFetcher.fetchData()
        }, 5000);
      }
    },
    pause: function() {
      clearInterval(timer);
    }
  }
}());
var musicHandler = (function() {
  var muted = false;
  var sound = 0;
  return {
    play: function() {
      if (!muted) {
        $('#sound' + musicHandler.sound)[0].play();
      };
    },
    pause: function() {
      $('#sound' + musicHandler.sound)[0].pause();
    },
    muteClicked: function() {
      muted = !muted;
      if (!muted) {
        musicHandler.unmute();
      } else {
        musicHandler.mute();
      }
    },
    mute: function() {
      $("#muteButton").text("UNMUTE");
      musicHandler.pause();
    },
    unmute: function() {
      $("#muteButton").text("MUTE");
      musicHandler.play();
    },
    setSound: function(sound) {
      musicHandler.sound = sound;
    }
  }
}());
var progressBarController = (function() {
  return {
    init: function() {
      $("#progressBar").width('0%').text('0%');
      $(".progress").show("veryslow");
      progressBarController.lastMeasurement = (new Date()).getTime();
    },
    finished: function() {
      $(".progress").hide("veryslow");
      $("#progressStatusField").text("Det är ändå rätt mycket när allt kommer omkring!");
    },
    update: function(downloadedMB, targetMB, mbPerSecond) {
      $("#progressStatusField").text((downloadedMB).toFixed(2) + ' MB av ' + targetMB + ' MB Nerladdat (' + (mbPerSecond + ' Mbit/s)' || ""));
      $("#progressBar").width((downloadedMB / targetMB) * 100 + '%').text(((downloadedMB / targetMB) * 100).toFixed(2) + '%');
    },
    cancel: function() {
      $("#progressStatusField").text('');
      $("#progressBar").width('0%').text('0%');
    }
  }
}());
var vaskController = (function() {
  var style = '';
  var numOfMB = 0;
  var procent = 0;
  return {
    init: function() {
      fbHandler.init();
      $('#myCarousel').carousel({
        interval: 0
      });
      $('.progress .bar').first().css('width', '100%');
      $(".preload").fadeOut(500, function() {
        $(".content").fadeIn(500);
      });
      //windowSizeHandler.startListener();
      $('.marketing').hide();
      $("#shareButton").hide();
      $('#moreInfoButton').hide();
    },
    start: function() {
      dataFetcher.fetchData();
      musicHandler.play();
      progressBarController.init();
      $('#moreInfoButton').hide();
      $('#shareButton').hide();
      $("#muteButton").show();
      $("#vaskStyle").text(vaskController.style);
      $("#avbrytVask").text("Avbryt");
      if (vaskController.numOfMB < 50) { //prova den stora ett tag
        imageDownloader.startLoop(SOUND_50KB, 0.500, vaskController.numOfMB);
      } else {
        imageDownloader.startLoop(SOUND_10MB, 10, vaskController.numOfMB);
      }
    },
    finished: function() {
      dataFetcher.start();
      $('#moreInfoButton').show();
      $('#shareButton').show("fast");
      progressBarController.finished();
      resultHandler.uploadResult(vaskController.numOfMB);
      musicHandler.pause();
      $('.marketing').show("slow");
      $("#vaskStyle").text(vaskController.numOfMB + "MB = " + vaskController.numOfMB * 5.9 + "Wh!");
      $("#muteButton").hide();
      $("#avbrytVask").attr('data-slide', '').attr('data-slide', 'prev').text("En gång till!");
    },
    cancel: function() {
      imageDownloader.stopLoop();
      dataFetcher.start();
      musicHandler.pause();
      this.umOfMB = 10;
      this.numOfMBLeft = 10;
      this.procent = 100;
      $('.marketing').show("slow");
      $("#progressBar").width(0 + '%');
    },
    setSize: function(size) {
      this.numOfMB = size;
    },
    setStyleTitle: function(text) {
      this.style = text;
    }
  }
}());
var resultHandler = (function() {
  return {
    uploadResult: function(numOfMB) {
      $.ajax({
        type: "POST",
        url: POST_URL,
        data: {
          mb: numOfMB
        },
        dataType: "json",
        success: function(data) {
          alert(data);
        },
      });
    }
  }
}());

//BUTTON LISTENERS//////////////////////
$('#infoButton').click(function() {
  $('html, body').animate({
    scrollTop: $("#info").offset().top
  }, 1000);
});
$("#faceButton").click(function() {
  window.open("https://www.facebook.com/Vasktrafik", '_blank');
});
$("#twitterButton").click(function() {
  var url = $(this).attr('href');
  window.open('https://twitter.com/intent/tweet?hashtags=vasktrafik&text=*Skriv%20rolig%20tweet%20här*&url=http://www.vasktrafik.se', '_blank');
});
$("#moreInfoButton").click(function() {
  $('html, body').animate({
    scrollTop: $("#info").offset().top
  }, 1000);
});
$("#shareButton").click(function() {
  var message = " har vaskat " + vaskController.numOfMB + "MB = " + vaskController.numOfMB * 5.9 + "Wh! Schteek!";
  fbHandler.getUser(function(user) {
    fbHandler.share(user.first_name + message)
  });
});
$("#muteButton").click(function() {
  musicHandler.muteClicked();
});
$("#10MB").click(function() {
  vaskController.setSize(10);
  vaskController.setStyleTitle("Småstadsvaskar");
  musicHandler.setSound(0);
  vaskController.start();
});
$("#75MB").click(function() {
  vaskController.setSize(75);
  vaskController.setStyleTitle("Avenynsvaskar");
  musicHandler.setSound(1);
  vaskController.start();
});
$("#250MB").click(function() {
  vaskController.setSize(250);
  vaskController.setStyleTitle("Stureplansvaskar");
  musicHandler.setSound(2);
  vaskController.start();
});
$("#1GB").click(function() {
  vaskController.setSize(1000);
  vaskController.setStyleTitle("Båstadsvaskar!");
  musicHandler.setSound(2);
  vaskController.start();
});
$("#avbrytVask").click(function() {
  vaskController.cancel();
});
var imageDownloader = (function() {
  var imageURL = '';
  var imgSize = 0;
  var run = false;
  var targetMB = 0;
  var downloadedMB = 0;
  var startTime = 0;
  return {
    startLoop: function(url, imgSize, targetMB) {
      imageDownloader.run = true;
      imageDownloader.imageURL = url + '?';
      imageDownloader.downloadedMB = 0;
      imageDownloader.imgSize = imgSize;
      imageDownloader.targetMB = targetMB;
      progressBarController.update(0, targetMB);
      imageDownloader.startTime = Date.now();
      imageDownloader.loop();
    },
    loop: function() {
      if (imageDownloader.run) {
        if (imageDownloader.downloadedMB < 100) {
          imageDownloader.imageURL = SOUND_50KB + "?";
          imgSize = 0.05;
        } else {
          imageDownloader.imageURL = SOUND_10MB + "?";
          imgSize = 10;
        }
        var sound = $.ajax({
          url: imageDownloader.imageURL + Math.random() * 12345,
          success: function() {
            var time = (Date.now() - imageDownloader.startTime) / 1000;
            if (imageDownloader.downloadedMB < imageDownloader.targetMB) {
              var speed = Math.round(imageDownloader.downloadedMB * 8 / time);
              imageDownloader.downloadedMB = imageDownloader.downloadedMB + imageDownloader.imgSize;
              progressBarController.update(imageDownloader.downloadedMB, imageDownloader.targetMB, speed);
              speed = null;
              time = null;
              sound = null;
              data = null;
              imageDownloader.loop();
            } else {
              vaskController.finished();
              vaskController.run = false;
            }
          }
        })
      }
    },
    stopLoop: function() {
      imageDownloader.run = false;
    }
  }
}());

vaskController.init();
