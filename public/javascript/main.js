// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

(function() {

  var cur_video_blob = null;

  var fb_instance;
  var happy = new Image();
  happy.src = "images/happy.png";
  var sad = new Image();
  sad.src = "images/sad.svg";
  var angry = new Image();
  angry.src = "images/angry.png";
  var bored = new Image();
  bored.src = "images/bored.png"
  
  var initial = true;

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });
    
  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://chat-looper.firebaseio.com/");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    var fb_instance_users = fb_new_chat_room.child('users');
    var fb_instance_stream = fb_new_chat_room.child('stream');
    var my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    
    // block until username is answered
    var username = window.prompt("Welcome! Emoticons: :-), :-(, >:(, :-|. What is your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();
      
      // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val(), username);
    });

    // bind submission box
    $("#submission input").keydown(function(event) {
      if (event.which == 13) {
        var emotion = has_emotions($(this).val());
        if(emotion != false){
          fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color, e: emotion, u: username});
        }else{
          fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
        }
        $(this).val("");
      }
    });
  }
  /*  
  var video = document.getElementById("reaction"); 
  var source = document.createElement("source");
 
  function initializeVideo() {
      video.autoplay = true;
      video.controls = false; // optional
      video.loop = true;
      video.width = 200;

      source.type =  "video/ogg";
      video.appendChild(source);
  }
*/
  // creates a message node and appends it to the conversation
  function display_msg(data, username){
    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
    if(data.v /*&& (data.u != username)*/){
      var source = document.createElement("source");
      var video = document.getElementById("reaction");

      if (initial == true) {
        video.autoplay = true;
        video.controls = false; // optional
        video.loop = true;
        video.width = 200;

        //source.type =  "video/ogg";
        //source.src =  URL.createObjectURL(base64_to_blob(data.v));
        //video.appendChild(source);
        initial = false;
      } else {
        var canvas_loc = document.getElementById("canvas_loc");
        canvas_loc.removeChild(canvas_loc.lastChild);
      }
      
      video.setAttribute("src", URL.createObjectURL(base64_to_blob(data.v)));
      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      //var video = document.createElement("img");
      //video.src = URL.createObjectURL(base64_to_blob(data.v));
      //document.getElementById("conversation").appendChild(video);
      var canvas = document.createElement("canvas");
      document.getElementById("canvas_loc").appendChild(canvas);
      canvas.className = ("my_canvas");
      var context = canvas.getContext('2d');
      context.clearRect(0,0, canvas.width, canvas.height);
      draw(video, context, video.width, video.height);
      function draw(vid, ctxt, wdh, hgt) {
          ctxt.drawImage(vid, 0, 0, 250, canvas.height); 
          var faces = detectFaces(); 
          drawMasks(faces);
          function detectFaces() {
            // What do these parameters mean?
            // I couldn't find any documentation, and used what was found here:
            // https://github.com/liuliu/ccv/blob/unstable/js/index.html
          return ccv.detect_objects({canvas : (ccv.pre(canvas)), cascade: cascade, interval: 2, min_neighbors: 1});
        } 
           function drawMasks(faces) {
                if(!faces) {
                    return false;
                }
                for (var i = 0; i < faces.length; i++) {
                    var face = faces[i];
                    var options = [":-)",":-(", ">:(", ":-|"];
                    var emotions = [happy, sad, angry, bored];
                    for(var i=0; i<options.length;i++){
                        if(data.e == options[i]){
                            var x_pos = [1.5, 1.5, 0.6, 1.3];
                            var y_pos = [0.1, 1.5, 0.1, 0.9];
                            var width = [1.3, 0.5, 0.8, 0.8];
                            var height = [1.0, 0.8, 0.8, 1.0];

                            ctxt.drawImage(emotions[i], face.x * x_pos[i], face.y * y_pos[i], face.width * width[i], face.height * height[i]);
                        }
                    }
                }
            setTimeout(draw, 20, vid, ctxt, wdh, hgt);
            } 
        }
    }
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };
      
    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= window.innerWidth;
      var video_height= window.innerHeight*0.9;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)

      });
    video.setAttribute('autoplay', true);
    //webcam_stream.appendChild(video);        
      
      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      var mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/ogg';
      //mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width;
      mediaRecorder.video_height = video_height;

      mediaRecorder.ondataavailable = function (blob) {
          //console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
          });
      };
      setInterval( function() {
        mediaRecorder.stop();
        mediaRecorder.start(3000);
      }, 3000 );
      console.log("connect to media stream!");
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    var options = [":-)", ":-(", ">:(", ":-|"];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return options[i];
      }
    }
    return false;
  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
