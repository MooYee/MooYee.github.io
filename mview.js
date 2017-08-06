function XRay(){
	this.withFloor = false;
	this.withAxes = true;
	this.pointType = 'point';
	this.points = [];
	this.tris = [];
	this.lines = [];
	this.markers = [];

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
	
	this.frameIndex = 0;
	this.frame = this.frames[this.frameIndex];
	this.colorsArr = [];
	this.frames.forEach(function(frame){
		var colors = [];
		frame.point_arr.forEach(function(point){
			colors.push(new THREE.Color(point.color));
		});
		self.colorsArr.push(colors);
	});

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
		this.frame.line_arr.forEach(cbk);
	}
}


XRay.prototype.forEachLinePoint = function(cbk){
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


XRay.prototype.roundRect = function (ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x+r, y);
	ctx.lineTo(x+w-r, y);
	ctx.quadraticCurveTo(x+w, y, x+w, y+r);
	ctx.lineTo(x+w, y+h-r);
	ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	ctx.lineTo(x+r, y+h);
	ctx.quadraticCurveTo(x, y+h, x, y+h-r);
	ctx.lineTo(x, y+r);
	ctx.quadraticCurveTo(x, y, x+r, y);
	ctx.closePath();
	ctx.fill();
	//ctx.stroke();
};

XRay.prototype.makeTextSprite = function( message, parameters ){
	var self = this;
	if ( parameters === undefined ) parameters = {};

	var fontface = parameters.hasOwnProperty("fontface") ?
	parameters["fontface"] : "Arial";

	var fontsize = parameters.hasOwnProperty("fontsize") ?
	parameters["fontsize"] : 18;

	var borderThickness = parameters.hasOwnProperty("borderThickness") ?
	parameters["borderThickness"] : 4;

	var borderColor = parameters.hasOwnProperty("borderColor") ?
	parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
	parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	var spriteAlignment = THREE.SpriteAlignment.topLeft;

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
	+ backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
	+ borderColor.b + "," + borderColor.a + ")";
	context.lineWidth = borderThickness;
	this.roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);

	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas)
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial(
	{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
	var sprite = new THREE.Sprite( spriteMaterial );
	var scale = 1.0 * self.mm * 24 / 1280 * 20000/800;
	self.log(scale);
	sprite.scale.set(scale,scale,scale);
	return sprite;
}

XRay.prototype.initThree = function(){
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
	this.controls = new THREE.TrackballControls(this.camera );
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
	this.pointsCloud = new THREE.Geometry();
	this.forEachPoint(function(point){
		var vertex = new THREE.Vector3();
		vertex.x = point.x;
		vertex.y = point.y;
		vertex.z = point.z;
		self.pointsCloud.vertices.push( vertex );
	});
	var material = new THREE.PointsMaterial({
		size: 1000,
		vertexColors: true,
	});
	this.pointsCloud.colors = this.colorsArr[this.frameIndex];
	var particles = new THREE.Points(this.pointsCloud, material );
	this.scene.add(particles );

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

	this.forEachLine(function(line){
		var geometry = new THREE.Geometry();
		var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
		var color1 = new THREE.Color( 0 ), color2 = new THREE.Color( 0 );
		var p1 = new THREE.Vector3(line.start.x, line.start.y, line.start.z);
		var p2 = new THREE.Vector3(line.end.x, line.end.y, line.end.z);
		geometry.vertices.push(p1);
		geometry.vertices.push(p2);
		geometry.colors.push( color1, color2 );
		var line = new THREE.Line( geometry, material, THREE.LinePieces );
		self.scene.add(line);
	});

	//	if(this.makers.length  > 0){
	//		var loader = new THREE.FontLoader();
	//		loader.load('../examples/fonts/helvetiker_bold.typeface.json',function(font){
	//            init(font);
	//            animate();
	//        });
	//	}

	this.forEachMarker(function(marker){
		var rr = (marker.color >> 16) & 0xff;
		var gg = (marker.color >> 8) & 0xff;
		var bb = (marker.color) & 0xff;
		var s = self.makeTextSprite(""+marker.count,
		{fontSize: 24, borderColor: {r:0, g:0, b:0xff, a:1.0}, backgroundColor: {r:rr, g:gg, b:bb, a:0.8} } );
		s.position.set(marker.x, marker.y, marker.z);
		self.scene.add( s );
	});

	if(this.withAxes){
		// create a set of coordinate axes to help orient user
		//    specify length in pixels in each direction
		var axes = new THREE.AxisHelper(self.mm*this.mscale);
		self.scene.add( axes );
	}

	if(this.withFloor){
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