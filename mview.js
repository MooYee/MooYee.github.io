function XRay(){
	this.withFloor = false;
	this.withAxes = true;
	this.pointType = 'point';

	this.mx = -1;
	this.my = -1;
	this.mz = -1;
	this.mm = -1;
	this.mscale = 2;

	this.r = 50;
	this.globalAlpha = 0.9;
	this.userPanSpeed = 500;
	this.userZoomSpeed = 1.0;
	
	this.frameInterval = 2000;

	this.init();
}

XRay.prototype.log = function(s){
	console.log(s);
};

XRay.prototype.getUrlParam = function(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if (r != null) {
		return unescape(r[2]);
	}
	return null;
}


XRay.prototype.nextFrame = function(){
	if(this.frames.length == 1){
		this.log('only one frame');
		return;
	}
	this.frameIndex++;
	this.frameIndex %= this.data.frames.length;
	this.frame = this.data.frames[this.frameIndex];
	console.log('next frame: ' + this.frameIndex);
	this.pointsCloud.colors = this.colorsArr[this.frameIndex];
	this.pointsCloud.colorsNeedUpdate = true;
}

XRay.prototype.onLoadData = function(data){
	var self=this;
	this.log('data type:' + typeof(data));
	this.data = data;
	
	if(typeof(data.type) != 'undefined' && data.type == 'frame'){
		this.frames = this.data.frames;
	}
	else{
		this.frames = [data];
	}
	
	this.log('frame number:' + this.frames.length);
	this.frameIndex = 0;
	this.frame = this.frames[this.frameIndex];
	this.colorsArr = [];
	this.frames.forEach(function(frame){
		if(typeof(frame.point_arr)!='undefined'){
			var colors = [];
			frame.point_arr.forEach(function(point){
				colors.push(new THREE.Color(point.color));
			});
			self.colorsArr.push(colors);
		}
	});
	this.log('colors arr end');

	this.lastTime = new Date().getTime();

	this.exchangeXYZ();
	this.getMaxXYZ();
	this.initThree();
	this.animate();
};

XRay.prototype.loadData = function(){
	var self = this;
	self.log('before load data');
	window.xray_load_data = function(data){
		self.onLoadData(data);
	};
	var self = this;
	var data_url = 'data/' + self.getUrlParam('data')+".js";
	$.getScript(data_url);
};

XRay.prototype.init = function(){
	this.loadData();
};

XRay.prototype.forEachPoint = function(cbk){
	this.log('for each point');
	if(typeof(this.frame.point_arr)!='undefined'){
		this.frame.point_arr.forEach(cbk);
	}
};

XRay.prototype.forEachTri = function(cbk){
	if(typeof(this.frame.tri_arr)!='undefined'){
		this.frame.tri_arr.forEach(cbk);
	}
};

XRay.prototype.forEachTriPoint = function(cbk){
	this.log('for each tri point');
	this.forEachTri(function(tri){
		var i;
		for(i = 0; i < 3; i++){
			var point = tri.ps[i];
			cbk(point);
		}
	})
};

XRay.prototype.forEachLine = function(cbk){
	if(typeof(this.frame.line_arr)!='undefined'){
		this.log('line number:' + this.frame.line_arr.length);
		this.frame.line_arr.forEach(cbk);
	}
}


XRay.prototype.forEachLinePoint = function(cbk){
	this.log('for each line point');
	this.forEachLine(function(line){
		cbk(line.start);
		cbk(line.end);
	});
}

XRay.prototype.forEachMarker = function(cbk){
	if(typeof(this.frame.marker_arr)!='undefined'){
		this.frame.marker_arr.forEach(cbk);
	}
}

XRay.prototype.forEachMarkPoint = function(cbk){
	this.log('for each marker point');
	this.forEachMarker(function(marker){
		cbk(marker);
	});
}

XRay.prototype.forEachAllPoint = function(cbk){
	this.forEachPoint(cbk);
	this.forEachTriPoint(cbk);
	this.forEachLinePoint(cbk);
	this.forEachMarkPoint(cbk);
};


XRay.prototype.exchangeXYZ = function(){
	this.log('exchange xyz');
	var self = this;
	this.forEachAllPoint(function(point){
		// 交换 rhino 和 Three.js 的坐标系
		// rhino: x 向右，y 向屏幕内，z向上
		// Three.js: x 向右，y 向上，z 向屏幕
		var t = point.y;
		point.y = point.z;
		point.z = point.x;
		point.x = t
	});
};


XRay.prototype.getMaxXYZ = function(){
	this.log('get max xyz');
	var self = this;

	this.forEachAllPoint(function(point){
		if(Math.abs(point.x) > self.mx){
			self.mx = Math.abs(point.x);
		}
		if(Math.abs(point.y) > self.my){
			self.my = Math.abs(point.y);
		}
		if(Math.abs(point.z) > self.mz){
			self.mz = Math.abs(point.z);
		}
	});

	self.mm = Math.max(self.mx, self.my, self.mz);
	self.r = self.mm * 6.0 / 1280;

	this.userPanSpeed = self.mm * 2.0 / 1280;
	this.userZoomSpeed = self.mm * 1.0 / 1280 / 2;
};


XRay.prototype.toBinaryInt = function(num) {
    /**
     * @author fernandosavio
     * http://stackoverflow.com/a/16155417/1763602
     */

    "use strict";

    return (num >>> 0).toString(2);  // jshint ignore:line
}


XRay.prototype.getNextPowerOfTwo = function(num) {
    /**
     *  @author Marco Sulla (marcosullaroma@gmail.com)
     *  @date Feb 17, 2016
     */

    "use strict";

    if (num < 0) {
        throw new Error("Argument must be positive");
    }

    var bin_str = this.toBinaryInt(num - 1);

    if (bin_str.indexOf("0") < 0 || bin_str === "0") {
        return num;
    }
    else {
        return Math.pow(2, bin_str.length);
    }
}

XRay.prototype.adaptCanvasToText = function(canvas, message, font_size, font_face) {
    /**
     *  @author Marco Sulla (marcosullaroma@gmail.com)
     *  @date Feb 17, 2016
     */

    "use strict";

    var context = canvas.getContext('2d');

    if (canvas.height > canvas.width) {
        canvas.width = canvas.height;
    }


    while (true) {
        var side = this.getNextPowerOfTwo(canvas.width);

        if (side < 128) {
            side = 128;
        }

        canvas.width = canvas.height = side;

        context.font = "Bold " + font_size + "pt " + font_face;

        var metrics = context.measureText(message);
        var text_width = metrics.width;
        var text_side = this.getNextPowerOfTwo(Math.max(text_width, font_size));

        if (text_side >= 128) {
            if (side !== text_side) {
                canvas.width = text_side;
                continue;
            }
        }
        else if (side !== 128) {
            canvas.width = 128;
            continue;
        }

        break;
    }
}


XRay.prototype.makeTextSprite = function(message, opts) {  // jshint ignore:line
    /**
     *  @author Lee Stemkoski
     *  @author Marco Sulla (marcosullaroma@gmail.com)
     *  
     *  https://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
     *  
     */

    "use strict";

    if ( opts === undefined ) {
        opts = {};
    }

    var possible_opts = ["font_face", "font_size", "border_thickness", 
                         "border_color", "background_color", "text_color"];

    for (var k in opts) {
        if (opts.hasOwnProperty(k)) {
            if (possible_opts.indexOf(k) < 0) {
                throw new Error("Unknown option '" + k.toString() + "'");
            }
        }
    }

	
    if (opts["font_face"] === undefined) {
        opts["font_face"] = "Arial";
    }

    if (opts["font_size"] === undefined) {
        opts["font_size"] = 100;
    }

    var font_size = opts["font_size"];

    if (font_size <= 0) {
        throw new Error("'font_size' must be a positive number");
    }

    if (opts["border_thickness"] === undefined) {
        opts["border_thickness"] = 0;
    }
    

    if (opts["border_thickness"] < 0) {
        throw new Error("'border_thickness' must be >= 0");
    }

    if (opts["border_color"] === undefined) {
        opts["border_color"] = { r:0, g:0, b:0, a:1.0 };
    }

    if (opts["background_color"] === undefined) {
        opts["background_color"] = { r:255, g:255, b:255, a:1.0 };
    }

    if (opts["text_color"] === undefined) {
        opts["text_color"] = { r: 0, g: 0, b: 0, a: 1 };
    }


    var border_color = opts["border_color"];
    var background_color = opts["background_color"];
    var text_color = opts["text_color"];

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    this.adaptCanvasToText(canvas, message, font_size, opts["font_face"]);

    var scale;

    if (canvas.width > 128) {
        scale = canvas.width / 128;
    }
    
    // background color
    context.fillStyle   = ("rgba(" + background_color.r + "," + 
                           background_color.g + "," + background_color.b + "," + 
                           background_color.a + ")");
	this.log('fill style:'+context.fillStyle);
    // border color
    context.strokeStyle = ("rgba(" + border_color.r + "," + border_color.g + 
                           "," + border_color.b + "," + border_color.a + ")");

    context.lineWidth = opts["border_thickness"];
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = ("rgba(" + text_color.r + "," + text_color.g + 
                           "," + text_color.b + "," + text_color.a + ")");

    var metrics = context.measureText( message );
    var text_width = metrics.width;

    console.log(text_width);

    context.fillText( message, (canvas.width - text_width) / 2, canvas.height / 2 + font_size / 2);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial;

	spriteMaterial = new THREE.SpriteMaterial({map: texture});

    var sprite = new THREE.Sprite(spriteMaterial);

	scale = 15000;
    if (scale) {
        sprite.scale.set(scale, scale, 1);
    }

	this.log('sprite:' + sprite);
	this.log('width:' + canvas.width);
    return sprite;  
}

XRay.prototype.initThree = function(){
	this.log('init three');
	var self = this;
	this.scene = new THREE.Scene();

	// set the view size in pixels (custom or according to window size)
	// var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	// camera attributes
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = self.mm*20;
	// set up camera
	this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	// add the camera to the scene
	this.scene.add(this.camera);
	// the camera defaults to position (0,0,0)
	// 	so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
	this.camera.position.set(this.mm*this.mscale, this.mm*this.mscale, this.mm*this.mscale);
	this.camera.lookAt(this.scene.position);

	// create and start the renderer; choose antialias setting.
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( window.innerWidth, window.innerHeight );
	this.renderer.gammaInput = true;
	this.renderer.gammaOutput = true;
	this.renderer.shadowMap.enabled = true;
	
	// 黑色背景
	this.renderer.setClearColor(0x000000);
	
	// attach div element to variable to contain the renderer
	this.container = document.getElementById( 'ThreeJS' );
	// alternatively: to create the div at runtime, use:
	//   container = document.createElement( 'div' );
	//    document.body.appendChild( container );

	// attach renderer to the container div
	this.container.appendChild( this.renderer.domElement );

	////////////
	// EVENTS //
	////////////

	// automatically resize renderer
	THREEx.WindowResize(this.renderer, this.camera);
	// toggle full-screen on given key press
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	//////////////
	// CONTROLS //
	//////////////

	// move mouse and: left   click to rotate,
	//                 middle click to zoom,
	//                 right  click to pan
	// this.controls = new THREE.TrackballControls(this.camera );
	this.controls = new THREE.OrbitControls(this.camera );
	this.controls.userPanSpeed = this.userPanSpeed;
	this.controls.userZoomSpeed = this.userZoomSpeed;

	///////////
	// LIGHT //
	///////////

	// create a light
	var lx,ly,lz;
	var larr=[-1,1];
	for(lx=0;lx<2;lx++){
		for(ly=0;ly<2;ly++){
			for(lz=0;lz<2;lz++){
				this.light = new THREE.PointLight(0xffffff);
				this.light.position.set(larr[lx]*this.mx*this.mscale, larr[ly]*this.my*this.mscale, larr[lz]*this.mz*this.mscale);
				this.scene.add(this.light);
			}
		}
	}

	// var ambientLight = new THREE.AmbientLight(0x111111);
	// scene.add(ambientLight);

	//////////////
	// GEOMETRY //
	//////////////

	// most objects displayed are a "mesh":
	//  a collection of points ("geometry") and
	//  a set of surface parameters ("material")
	this.log('points cloud');
	this.pointsCloud = new THREE.Geometry();
	this.forEachPoint(function(point){
		var vertex = new THREE.Vector3();
		vertex.x = point.x;
		vertex.y = point.y;
		vertex.z = point.z;
		self.pointsCloud.vertices.push( vertex );
	});
	var material = new THREE.PointsMaterial({
		size: self.mm / 100 * 3,
		vertexColors: true,
	});
	if(this.colorsArr.length > 0){
		this.pointsCloud.colors = this.colorsArr[this.frameIndex];
	}
	var particles = new THREE.Points(this.pointsCloud, material );
	this.scene.add(particles );

	this.log('tri');
	this.forEachTri(function(tri){
		var p1 = new THREE.Vector3(tri.ps[0].x, tri.ps[0].y, tri.ps[0].z);
		var p2 = new THREE.Vector3(tri.ps[1].x, tri.ps[1].y, tri.ps[1].z);
		var p3 = new THREE.Vector3(tri.ps[2].x, tri.ps[2].y, tri.ps[2].z)
		var geometry = new THREE.Geometry();
		geometry.vertices.push(p1,p2,p3);
		var normal = new THREE.Vector3( 0, 0, 1 );
		var face = new THREE.Face3( 0, 1, 2, normal);
		geometry.faces.push( face );
		var material=new THREE.MeshLambertMaterial({
			color:0x555555,
			side:THREE.DoubleSide,
			transparent: true,
			opacity: (1-tri.alpha)*self.globalAlpha,
		});
		var mesh=new THREE.Mesh(geometry,material);
		self.scene.add(mesh);
	});

	this.log('line')
	this.forEachLine(function(line){
		var geometry = new THREE.Geometry();
		var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
		var color1 = new THREE.Color( 0xffffff ), color2 = new THREE.Color( 0xffffff );
		var p1 = new THREE.Vector3(line.start.x, line.start.y, line.start.z);
		var p2 = new THREE.Vector3(line.end.x, line.end.y, line.end.z);
		geometry.vertices.push(p1);
		geometry.vertices.push(p2);
		geometry.colors.push( color1, color2 );
		var line = new THREE.Line( geometry, material, THREE.LineSegments);
		self.log('add line2:'+line);
		self.scene.add(line);
	});

	//	if(this.makers.length  > 0){
	//		var loader = new THREE.FontLoader();
	//		loader.load('../examples/fonts/helvetiker_bold.typeface.json',function(font){
	//            init(font);
	//            animate();
	//        });
	//	}

	this.log('marker');
	this.forEachMarker(function(marker){
		self.log('add marker:' + marker);
		var rr = (marker.color >> 16) & 0xff;
		var gg = (marker.color >> 8) & 0xff;
		var bb = (marker.color) & 0xff;
		var s = self.makeTextSprite(""+marker.count, {
			font_size: 24, 
			border_color: {r:0, g:0, b:0xff, a:1.0},
			text_color: {r:rr, g:gg, b:bb, a:1.0},
			border_thickness:1
		} );
		self.log('s:' + s);
		s.position.set(marker.x, marker.y, marker.z);
		self.log('add marker:'+marker);
		self.scene.add( s );
	});

	if(this.withAxes){
		this.log('axes');
		// create a set of coordinate axes to help orient user
		//    specify length in pixels in each direction
		var axes = new THREE.AxisHelper(self.mm*this.mscale);
		self.scene.add( axes );
	}

	if(this.withFloor){
		this.log('floor');
		// note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.
		var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
		floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
		floorTexture.repeat.set( 10, 10 );
		// DoubleSide: render texture on both sides of mesh
		var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
		var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = -0.5;
		floor.rotation.x = Math.PI / 2;
		self.scene.add(floor);
	}
	this.log('after init');
}


XRay.prototype.animate = function(){
	var self = this;
	requestAnimationFrame(function(){
		self.animate();
	});
	
	var now = new Date().getTime();
	if(now - self.lastTime > self.frameInterval){
		this.nextFrame();
		self.lastTime = now;
	}
	
	this.render();
	this.update();
}

XRay.prototype.update = function(){
	this.controls.update();
}

XRay.prototype.render = function(){
	this.renderer.render(this.scene,this.camera );
}


new XRay();
