// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;

//World constants
var maxX = 250, maxZ = 250, minX = -250, minZ = -250, distPerSecond = 20, degPerSecond = 5, maxParticles = 500, numTextures = 10, planeThreshold = 200;
   
//Player vars
var score = 0;
var playerBoat = {pos:vec3(0,0,0) , velocity:vec3(0,0,0), acceleration:0, prevacceleration:0, yaw:0, turn:0, pitch:0, front:vec3(1,0,0), up:vec3(0,1,0), posbow:vec3(4,1,0),
    trackpitch:0, trackyaw:-90, firing:false,  fireCD:.1, currCD:0, trackvec:vec3(1,0,0),

'update': function(animation_delta_time){
    //Drag function
    
    //this.acceleration += -.05 * Math.sqrt(totalvel);
    
    //Modify the velocity based on the yaw and the acceleration
   
   
    var accelvec = vec4(this.acceleration,0,0,0);
    

    this.yaw += this.turn*degPerSecond*animation_delta_time*20;
    this.turn = 0;
    
    var yawrotation  =  rotate( this.yaw, 0, 1,  0 );
    var pitchrotation = rotate(this.pitch, 0, 0, 1);
	accelvec  = mult_vec( yawrotation,accelvec );
    
    
    //this.velocity = mult_vec( rotation,velocity );
    
    accelvec = add(accelvec, vec4(scale_vec(-.05*distPerSecond*animation_delta_time, this.velocity)));
    
    this.velocity = add(this.velocity, vec3(scale_vec(distPerSecond*animation_delta_time, accelvec)));
    var totalvel = length(this.velocity);
    if(this.acceleration != 0)
    {
        if(totalvel>2){
            this.velocity = scale_vec(2, normalize(vec3(accelvec)));
        }
        else{
            this.velocity = scale_vec(totalvel, normalize(vec3(accelvec)));
        }
    }
    this.pos = add(this.pos, scale_vec(distPerSecond*animation_delta_time, this.velocity));

    
    if(this.pos[0] > maxX){
        this.pos[0] = maxX;
    }
    else if(this.pos[0] < minX){
        this.pos[0] = minX;
    }
    if(this.pos[2] > maxZ){
        this.pos[2] = maxZ;
    }
    else if(this.pos[2] < minZ){
        this.pos[2] = minZ;
    }
    
    this.prevacceleration = this.acceleration;
    this.acceleration = 0;
    
    /*
    var totalvel = Math.sqrt(Math.pow(this.velocity[0],2) + Math.pow(this.velocity[1],2) + Math.pow(this.velocity[2],2));
    //console.log("Velocity: " + totalvel);
    if(totalvel < .001){
        this.velocity[0] = 0;
        this.velocity[1] = 0;
        this.velocity[2] = 0;
    }*/

    var newfront = vec3(1,0,0,0);
    newfront = mult_vec(yawrotation, newfront);
    newfront = mult_vec(pitchrotation, newfront);
    this.front = vec3(newfront[0],newfront[1],newfront[2]);
    this.posbow = add(add(this.pos, scale_vec(4, this.front)), this.up);
    
    
},
'updateTrackingVars':function(deltapitch, deltayaw){
    var mult = !this.firing*.5 + 1;
    this.trackpitch-=deltapitch*mult;
    this.trackyaw-=deltayaw*mult;
    if(this.trackyaw > 0){
        this.trackyaw = 0;
    }
    else if(this.trackyaw < -180){
        this.trackyaw = -180;
    }
    if(this.trackpitch < 0){
        this.trackpitch = 0;
    }
    else if(this.trackpitch > 90){
        this.trackpitch = 90;
    }
},
'resetTrackingVars':function(){
    this.trackpitch = 20;
    this.trackyaw = -90;
},
'setFacingVector':function(camMatrix){
    //Takes a camera matrix and converts it to a vec3
    this.trackvec = vec3(camMatrix[2]);
    this.trackvec = scale_vec(-1, this.trackvec);
},
'startFiring':function(){
    this.firing = true;
},
'endFiring':function(){
    this.firing = false;
} 
};

var blockade={
    bArray:[],
    'populate': function(totalHealth) {
        var occupied = [];
        for(var k = 0; k < totalHealth; k++){
            occupied[k] = 0;
        }
        while(totalHealth > 0)
        {
            var size = Math.min(totalHealth, Math.floor(3*Math.random()) + 1); //Bigger boats = bigger health
            
            var x = maxX;
            var y = 0;
            var temp = Math.floor(Math.random()*occupied.length);
            while(occupied[temp]){
                temp = Math.floor(Math.random()*occupied.length);
            }
            var z = (maxZ + minZ)/2 + ((temp/occupied.length)-.5)*maxZ/2;
            console.log(z);
            occupied[temp] = 1;
            var texture = Math.floor(Math.random() * numTextures);
            this.bArray.push({
                pos:vec3(x, y, z),
                velocity:vec3(0,0,0),
                health:size,
                scale: size,
                yaw: (Math.random())*360,
                pitch: 0,
                texture: texture,
                status:"alive"
            });
            totalHealth -= size;
        }
        
    },
    'update':function(animation_delta_time){
        for(var currBoat = 0; currBoat < this.bArray.length; currBoat++ ){
            if(this.bArray[currBoat].pos[1] < -5*this.bArray[currBoat].scale){
                this.bArray.splice(currBoat,1); //Remove dead boats
                currBoat--;
            }
            else if(this.bArray[currBoat].status == "falling"){
                var tempAccel = scale_vec(animation_delta_time*distPerSecond,vec3(0,-.01*this.bArray[currBoat].scale,0));
                this.bArray[currBoat].velocity=subtract(this.bArray[currBoat].velocity, tempAccel);
                this.bArray[currBoat].pos=subtract(this.bArray[currBoat].pos, scale_vec(animation_delta_time*distPerSecond,this.bArray[currBoat].velocity));
                var deltapitch = this.bArray[currBoat].pitch*animation_delta_time*degPerSecond*4 + .1;
                if(this.bArray[currBoat].pitch + deltapitch > 90){
                    deltapitch = 0;
                }
                this.bArray[currBoat].pitch = this.bArray[currBoat].pitch + deltapitch;
            }
        }
    },
    'getTotalHealth':function(){
        var totalHealth = 0;
        for(var currBoat = 0; currBoat < this.bArray.length; currBoat++ )
        {
            totalHealth+=this.bArray[currBoat].health;
        }
        return totalHealth;
    },
    'getRandomBoat':function(){
        var currBoat = Math.floor(Math.random() * this.bArray.length);
        return {
            boatNum: currBoat,
            pos: this.bArray[currBoat].pos
        };
    },
    'checkCollisions':function(pos, type){
        for(var currBoat = 0; currBoat < this.bArray.length; currBoat++){
            var diff = Math.abs(length(subtract(pos, this.bArray[currBoat].pos)));
            if(diff < 5 && this.bArray[currBoat].status == "alive"){
                if (type==2)
                    this.bArray[currBoat].health-=2;
                else{
                    this.bArray[currBoat].health--;
                }
                if(this.bArray[currBoat].health == 0){
                    this.bArray[currBoat].status = "falling";
                    
                }
                break;
            }
        }
    }
}

var particles={
    pArray:[],
    'addPart':function(ntype, naxis, npos, nvel, nroll, nrollv, dvel, ncolor){
        if(ntype == "p" && Math.random() < .25){
            ncolor = vec3(Math.random(), Math.random(),Math.random()); //Occasionally, randomize particle color
        }
        var skewVal = Math.random()*2;
        this.pArray.push({
            type:ntype,
            pos:npos,
            velocity:nvel, //linear velocity
            axis:naxis,
            daxis:0, //Distance from the axis. 
            roll:nroll,
            rollv:nrollv,
            color:ncolor,
            scale:1,
            skew:skewVal,
            dvel:dvel
        });
    },
    'update':function(animation_delta_time){
        for(var i = 0 ; i < this.pArray.length; i++){
            if(this.pArray[i].scale < .1){
                this.pArray.splice(i,1);
                i--;
                continue;
            }
            this.pArray[i].pos = add(this.pArray[i].pos, scale_vec(animation_delta_time*distPerSecond, this.pArray[i].velocity));
            this.pArray[i].rollv =  this.pArray[i].rollv * (1 - .25 * animation_delta_time * degPerSecond); //
            if( this.pArray[i].rollv < .001)
            {
                 this.pArray[i].rollv = 0;
            }
            this.pArray[i].roll+= this.pArray[i].rollv * animation_delta_time/5;
            this.pArray[i].daxis+=(this.pArray[i].dvel+ this.pArray[i].rollv/Math.PI) * animation_delta_time * degPerSecond;
            this.pArray[i].scale -= .3 * animation_delta_time;  
        }
    }
}

var planes={
    time_since_last_pop:0,
    pArray:[], //Array of living planes
    dArray:[], //Array of dead planes
    'populate': function(numPlanes, nvel){
        if(!nvel)
            nvel = .75;
        var initialDisp = vec3(minX, Math.random() * 20 + 3, (Math.random() * 15) + 5);
        var mBoat = blockade.getRandomBoat();
        var diff = subtract(mBoat.pos, initialDisp);
        var velocity = scale_vec(nvel, normalize(vec3(diff[0],0,diff[2])));
        if(Array.isArray(numPlanes)){ //Create planes from a matrix
            var y = Math.random() * 20;
            for(var k = 0; k < numPlanes.length; k++){
                for(var l = 0; l < numPlanes[k].length; l++){
                    if( numPlanes[k][l] > 0)
                    {
                        var x = 5 * k - numPlanes.length/2;
                        var z = 5 * l - numPlanes[k].length/2;
                        var r = Math.random();
                        var g = Math.random();
                        var b = Math.random();
                        this.pArray.push({
                        pos:add(vec3(x,y,z),initialDisp),
                        velocity: vec3(velocity),
                        color: vec3(r, g, b),
                        up: vec3(0,1,0),
                        roll: 0,
                        rollv: 0, //Angular roll velocity
                        status: "alive",
                        pitch:0,
                        yaw:0,
                        spawnCD:0,
                        type:numPlanes[k][l],
                        targetpos:mBoat.pos
                        });
                    }
                }
            }
        }
        else
        {
            for(var i = 0 ; i < numPlanes; i++){
                var x = 0;
                var y = Math.random() * 10;
                var z = Math.random() * 10;
                var r = Math.random();
                var g = Math.random();
                var b = Math.random();
                this.pArray.push({
                pos:add(vec3(x,y,z),initialDisp),
                velocity: vec3(velocity),
                color: vec3(r, g, b),
                up: vec3(0,1,0),
                roll: 0,
                rollv: 0, //Angular roll velocity
                status: "alive",
                pitch:0,
                yaw:0,
                spawnCD:0,
                type:1,
                targetpos:mBoat.pos
                });
            }
        }
    },
    'update': function(animation_delta_time){
        //For now, just remove all dead planes
        this.dArray = [];
        
        //Update living planes
        for(var i = 0 ; i < this.pArray.length; i++){
            if( this.pArray[i].status == "dead")
            {
                     this.dArray.push(this.pArray.splice(i,1));
                     i--;
            }
            else if( this.pArray[i].pos[1] < 0)
                this.pArray[i].status = "crashing";
            else
            {
                
                if(this.pArray[i].pos[0] > maxX)
                {
                    this.dArray.push(this.pArray.splice(i,1));
                     i--;
                     continue;
                }
                else if(this.pArray[i].pos[2] > maxZ || this.pArray[i].pos[2] < minZ)
                {
                     this.dArray.push(this.pArray.splice(i,1));
                     i--;
                     continue;
                }
                else{
                    //Check if we're within the threshold: If we are, normalize and start falling
                    if(this.pArray[i].pos[0] > planeThreshold){
                        var diff = subtract(this.pArray[i].targetpos, this.pArray[i].pos);
                        this.pArray[i].velocity = scale_vec(length(this.pArray[i].velocity), normalize(diff));
                    }
                    
                    this.pArray[i].pos = add(this.pArray[i].pos, scale_vec(animation_delta_time*distPerSecond, this.pArray[i].velocity));
                    
                    this.pArray[i].roll+=this.pArray[i].rollv*animation_delta_time*degPerSecond;
                    
                    
                    if(this.pArray[i].status == "falling"){
                        this.pArray[i].spawnCD-=animation_delta_time;
                        if(this.pArray[i].spawnCD < 0){
                            //Spawn a particle
                            particles.addPart("p", normalize(this.pArray[i].velocity), 
                                this.pArray[i].pos, scale_vec(-.5, this.pArray[i].velocity),
                                this.pArray[i].roll, this.pArray[i].rollv + Math.random()*.1, 0, this.pArray[i].color);
                                this.pArray[i].spawnCD = this.pArray[i].pitch*.01;
                        }
   
                        //Decrease velocity
                        this.pArray[i].velocity[1]-=.01 * animation_delta_time * distPerSecond;
                        this.pArray[i].rollv+=2-.05*this.pArray[i].rollv*animation_delta_time*degPerSecond;
                        
                    }
                   this.pArray[i].pitch = 180/Math.PI * Math.atan(this.pArray[i].velocity[1]/this.pArray[i].velocity[0]);
                    var tempUp = vec3(0,1,0);
                    var rotation  =  rotate( this.pArray[i].yaw, 0, 1,  0 );
                    tempUp  = mult_vec( rotation,tempUp );
                    rotation  =  rotate( this.pArray[i].pitch, 0, 0,  1 );
                    tempUp  = mult_vec( rotation,tempUp );
                    rotation  =  rotate( this.pArray[i].roll, 1, 0,  0 );
                    tempUp  = mult_vec( rotation,tempUp );
                    
                    this.pArray[i].up = tempUp;
                    
                    //this.checkCollisions(vec3(10, 0, 0), vec3(0, 1, 0));
                }
                
           }
        }
    },
    'getTriangle' : function(planeIndex){
        var currPlane = this.pArray[planeIndex];
        var front = normalize(currPlane.velocity);
        var side = cross(front, currPlane.up);
        
        var frontvert, sidevertright, sidevertleft;
        if(this.pArray[planeIndex].type == 2){
            frontvert = add((scale_vec(2,front)), currPlane.pos);
            sidevertleft = add(add((scale_vec(-3,front)), side), currPlane.pos);
            sidevertright = add(add((scale_vec(-3,front)), (scale_vec(-1,side))), currPlane.pos);
        }   
        else{
            frontvert = add((scale_vec(2,front)), currPlane.pos);
            sidevertleft = add(add((scale_vec(-2.2,front)), side), currPlane.pos);
            sidevertright = add(add((scale_vec(-2.2,front)), (scale_vec(-1,side))), currPlane.pos);
        }
        return {v1: frontvert,
            v2:sidevertright,
            v3:sidevertleft};
        
    },
    
    'checkCollisions': function(point, dir){
        var e1, e2 , triangle; //edges
        var p, q, t, normal; //
        var w0, w; //ray vectors
        var r,a,b; // params to calc ray-plane intersect
        var intersect;
        var hit = false;
        for(var i = 0 ;!hit && i < this.pArray.length; i++){
            triangle = this.getTriangle(i);
            e1 = subtract(triangle.v2, triangle.v1);
            e2 = subtract(triangle.v3, triangle.v1);
            normal = cross(e1, e2);
            if(normal == vec3(0,0,0))
                return -1;
            w0 = subtract(point,triangle.v1);
            a = -1*dot(normal, w0);
            b = dot(normal, dir);
            if(Math.abs(b) < .001){
                if(a == 0)
                {
                    this.pArray[i].status = "falling";
                    return 2; //Ray lies in triangle plane
                }
                else return 0; //Ray disjoint from plane
                
            }
            r = a/b;
            if(r < 0)
                //return 0; //no intersect
                continue;

            intersect = add(point,scale_vec(r,dir));
            //Is I inside T?
            var uu, uv, vv, wu, wv, D;
            uu = dot(e1, e1);
            uv = dot(e1, e2);
            vv = dot(e2, e2);
            w = subtract(intersect, triangle.v1);
            wu = dot(w,e1);
            wv = dot(w,e2);
            D = uv * uv - uu * vv;
            
            var s,t;
            s = (uv * wv - vv * wu) / D;
            if(s < 0 || s > 1) //I is outside T
                //return 0;
                continue;
            t = (uv * wu - uu * wv) / D;
            if(t < 0.0 || (s + t) > 1.0) //I is outside T
                //return 0;
                continue;
            if(this.pArray[i].status == "falling"){
                score += 10;
            }
            else{
                if(this.pArray[i].type == 2)
                {
                    score+=80;
                }
                else{
                    score+=40;
                }
                this.pArray[i].status = "falling";
            }
            var numParticles = Math.random()*4 + 3;
            for(; numParticles > 0; numParticles--){
                particles.addPart("p",scale_vec(-2 * Math.random(), dir), this.pArray[i].pos, scale_vec(-1, dir), Math.random()*360,
                 0, 3, vec3(Math.random(), Math.random(), Math.random()));
            }
            return 1;
        }
    }
};    

//splash data array
var splashes = {sArray:[], maxFrame:50,
'createSplash' : function(splashPos, splashColor){
    this.sArray.push({
        pos:splashPos,
        color: splashColor, //color of plane that splashed
        frame: 0, //Frame of the splash
        angle: Math.random()*360,
        //nodes: 1 //Number of nodes that the splash produces
        nodes: Math.floor(Math.random()*5) + 2
    });
}
};
        
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), 1, 1, 1, 40, "" ) ); }

//Difficulty manager. 
var difficulty = {
    currDiff:1, velocityMultiplier:.5, timeSinceLastSpawn:3, threshold:10, maxDiff:300, timetoNextWave:30,  wavegap:20,
    'update':function(animation_delta_time){
        
        this.timeSinceLastSpawn+=animation_delta_time;
        this.timetoNextWave -= animation_delta_time;
        
        if(this.currDiff < this.maxDiff){
            this.currDiff += animation_delta_time;
        }
        if(this.timeSinceLastSpawn > 5+3/Math.exp(this.currDiff/20)){
            //Randomly generate a value from 0 to 3 and see if that number of planes/2 can be spawned, otherwise do nothing
            var sqrtDiff = Math.pow((this.currDiff),.2);
            var planesToSpawn = Math.random()*sqrtDiff;
            if(planesToSpawn < this.timeSinceLastSpawn*sqrtDiff)
            {
                //Spawn random wave
                var velocity = sqrtDiff * this.velocityMultiplier;
                if(this.timetoNextWave < 0){
                    var form = Math.floor(Math.random()*5) + 1;
                    var arr;
                    switch(form){
                        case 1:
                            arr = form1();
                            break;
                        case 2:
                            arr = form2();
                            break;
                        case 3:
                            arr = form3();
                            break;
                         case 4:
                            arr = form4();
                            break;
                         case 5:
                            arr = form5();
                            break;
                    }
                    planes.populate(arr, velocity);
                    this.timetoNextWave = this.wavegap - .1 * sqrtDiff;
                    this.timeSinceLastSpawn-=this.timetoNextWave/4;
                }
                else
                {
                    planes.populate(Math.floor(planesToSpawn*sqrtDiff), velocity);
                }
                this.timeSinceLastSpawn = Math.min(0, this.timeSinceLastSpawn);
                
            } 
        }
    }
};

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( .2, .4, .5, 1 );			// Background color
        
        
        
		self.m_cube = new cube();
		//self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() ); 
		self.m_triangle = new triangle(mat4());
		self.m_windmill = new windmill(mat4());
		self.m_boat = new boat(mat4());
		self.m_plane = new paperplane(mat4());
        self.m_plane2 = new paperplane2(mat4());
        self.m_square = new square(mat4());
        self.m_cylinder = new cylindrical_strip(mat4());
		self.m_frame = 0;
        
        score = 0;
        
        //Boat initialization
        playerBoat.trackingMat = rotate(0, 1, 0, 0);
        
        //Blockade initialization
        blockade.populate(30);
        
        //Audio
        self.m_bgm = new Audio("paperboats.mp3");
        self.m_shot = new Audio("shot.wav");
        self.m_tear = new Audio("tear.wav");
        self.m_splash = new Audio("splash.wav");
        //self.m_bgm.play();

        
        //Cheesy crosshair fix
        var crosshair = document.createElement("img");
        var div = document.getElementById('canvas-box');
        crosshair.src = 'crosshairdiamond.png'
        crosshair.id = 'crosshair';
        crosshair.style.width = '50px';
        crosshair.style.height = '50px';
        crosshair.style.position = 'absolute';
        crosshair.style.left = '470px';
        crosshair.style.top = '280px';
        crosshair.style.zIndex = "10000";
        crosshair.ondragstart = function(){return false;}
        crosshair.style.webkitTransform = "translate(-50%, -50%)";
        crosshair.onload = function(){
            //document.body.appendChild(crosshair);
            div.appendChild(crosshair);
        }
        //crosshair.style.display = 'none';
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translate(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
    canvas.addEventListener('mousedown', function(e) {
       playerBoat.startFiring();
    });
    canvas.addEventListener('mouseup', function(e){
        playerBoat.endFiring();
    });
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts heres
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { playerBoat.acceleration=1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { 
        playerBoat.turn = 1;
        } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { playerBoat.acceleration=-1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { 
        playerBoat.turn = -1;; 
        } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; playerBoat.resetTrackingVars(); } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; 
        
    } );
	
	//shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	//shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )

	{
		var leeway = 20, border = 20;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		
        
	   //self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	   if(looking){
           for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.
            
            var velocity=[0,0];
            for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
            {
                velocity[i] = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
    //playerBoat.trackingMat = mult( rotate( velocity, i, 1-i, 0 ), playerBoat.trackingMat);			// On X step, rotate around Y axis, and vice versa.
                //self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
            }
            playerBoat.updateTrackingVars(velocity[1], velocity[0]);
            
           var trackingMat = inverse(translate(playerBoat.posbow));
           var rotMat = mult(inverse(rotate(playerBoat.trackpitch, 1, 0, 0)), inverse(rotate(playerBoat.trackyaw + playerBoat.yaw, 0, 1, 0)));

           
           self.graphicsState.camera_transform = mult(rotMat,trackingMat);
           playerBoat.setFacingVector(self.graphicsState.camera_transform);
           
       }
       
       if(!looking){
        var currPos = vec4(playerBoat.pos[0],playerBoat.pos[1],playerBoat.pos[2],1);
        var dir = vec4(-20, 5, 0 , 0);
        var rotation  =  rotate( playerBoat.yaw, 0, 1,  0 );
        dir  = mult_vec( rotation, dir );
        var backvec = vec3(currPos[0] + dir[0],currPos[1] + dir[1],currPos[2] + dir[2]);
        self.graphicsState.camera_transform = lookAt(backvec, playerBoat.pos, playerBoat.up);
       }
    }


Animation.prototype.update_audio= function(animate, sound){
    if(animate){
        this.m_bgm.play();
        if(sound == "shot"){
            this.m_shot.currentTime = 0;
            this.m_shot.play();
        }
        else if(sound == "tear"){
            //this.m_tear.currentTime = 0;
            this.m_tear.play();
        }
        else if(sound == "splash"){
            //this.m_tear.currentTime = 0;
            this.m_splash.play();
        }
    }
    else
    {
        this.m_bgm.pause();
    }
}
// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.
Animation.prototype.display = function(time)
	{
        
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
        if(blockade.bArray.length <= 0){
            animate = false;
            var defeatText = document.createElement("div");
            defeatText.innerHTML = "You lost. Final score: " + score;
            defeatText.style.color = "#FFFFFF";
            defeatText.style.font = "Arial";
            defeatText.style.position = 'absolute';
            defeatText.style.left = '400px';
            defeatText.style.top = '260px';
            document.body.appendChild(defeatText);
        }
        
		update_camera( this, this.animation_delta_time );
        this.update_audio(animate);
        
        var animate_time = 0;
        if(animate){
            animate_time = this.animation_delta_time/1000;
        }
			
		this.basis_id = 0;
		
		var model_transform = mat4();
		var stack = [];
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), 1, 1, 1, 40 ), // Omit the string parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "stars.png" ),
            crosshair = new Material( vec4( 1,1,1,1 ), 1, 1, 1, 40, "crosshairdiamond.png");
        var paper2 = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "paper2.png" );
		var textures = [new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "tree.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "chevron.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "diamonds.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "floral.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "hexes.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "palms.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "poca.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "redcon.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "silk.png" ),
         new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "vintage.png" )];
        
        difficulty.update(animate_time);
        
        
	   //model_transform = mult( model_transform, rotate( this.graphicsState.animation_time/20, 0, 1, 0 ) );
       
       
       this.draw_ground(model_transform);
       
       //BOAT STUFF----------------------------------------------------------------------------
        stack.push(model_transform);
        model_transform = mult(model_transform, translate(playerBoat.pos[0],
             playerBoat.pos[1], playerBoat.pos[2]));
        model_transform = mult( model_transform, rotate( playerBoat.yaw, 0, 1, 0 ) );
        playerBoat.update(animate_time);
        
        //Check collisions with planes
        
        playerBoat.currCD -= animate_time;
        //console.log(playerBoat.currCD);
        if(playerBoat.firing == true && animate_time > 0)
        {
            if(playerBoat.currCD < 0){
                 var hit = planes.checkCollisions(playerBoat.posbow, playerBoat.trackvec);
                 playerBoat.currCD = playerBoat.fireCD;
                 this.update_audio(animate, "shot");
                 if(hit){
                     this.update_audio(animate, "tear");
                 }
            }
                
        }
		this.m_boat.draw(this.graphicsState, model_transform, paper2);
        
        //Crosshair - put perpendicular to yaw and pitch
        var crosshair = document.getElementById("crosshair");
        
        if(crosshair)
        {
            if(looking){
                crosshair.style.visibility = 'visible';
                var size = Math.min(25, 25 - 10*(playerBoat.currCD/playerBoat.fireCD)) * 512/100;
                crosshair.style.width = size + "px";
                crosshair.style.height = size + "px";
                crosshair.style.top = 280 - size/2 + "px";
                crosshair.style.left = 470 - size/2 + "px";
            }
            else
                crosshair.style.visibility = 'hidden';
        }
        
        //OLD CROSSHAIR STUFF
        /*
        stack.push(model_transform);
        model_transform = mult( model_transform, translate(4, 1, 0 ) );
        model_transform = mult( model_transform, rotate( playerBoat.trackpitch, 0, 0, 1 ) );
        model_transform = mult( model_transform, rotate( playerBoat.trackyaw, 0, 1, 0 ) );
        //Rotate so it 
        //model_transform = mult( model_transform, rotate( 90, 0, 0, 1 ) );
         model_transform = mult( model_transform, translate(0, 0, -1 ) );
         model_transform = mult( model_transform, scale( Math.min(.1, .1 - .05*(playerBoat.currCD/playerBoat.fireCD)),
          Math.min(.1, .1 - .05*(playerBoat.currCD/playerBoat.fireCD)), 0 ) );
        //this.m_square.draw( this.graphicsState, model_transform, crosshair );
        model_transform = stack.pop();
        */
        
        
        //flagpole
        stack.push(model_transform);
        model_transform = mult( model_transform, translate(0, 2, 0 ) );
        model_transform = mult( model_transform, scale( .2, .4, .2 ) );
        model_transform = mult( model_transform, rotate( 90, 0, 1, 0 ) );
        var temp = playerBoat.prevacceleration;
        if(temp == 0) temp = 1;
        model_transform = this.draw_rotated_seg_rec(model_transform, -10*length(playerBoat.velocity)*temp, 1, 0, 0,  8, .5, 1, 0, "paper2.png");
        model_transform = mult( model_transform, translate(1, -1.8, 0 ) );

        model_transform = mult( model_transform, scale( 3, 1, 1 ) );
        this.m_triangle.draw( this.graphicsState, model_transform, paper2 );
        model_transform = stack.pop();
        model_transform = stack.pop();
        
        //BLOCKADE STUFF----------------------------------------------------------------------
        blockade.update(animate_time);
        stack.push(model_transform);
        for(var currBoat = 0; currBoat < blockade.bArray.length; currBoat++)
        {
            stack.push(model_transform);
            model_transform = mult( model_transform, translate(blockade.bArray[currBoat].pos) );
            model_transform = mult(model_transform, rotate(blockade.bArray[currBoat].yaw, vec3(0,1,0)));
            model_transform = mult(model_transform, rotate(blockade.bArray[currBoat].pitch, vec3(0,0,1)));
            var s = blockade.bArray[currBoat].scale;
            model_transform = mult( model_transform, scale( s, s, s ) );
            this.m_boat.draw(this.graphicsState, model_transform, textures[blockade.bArray[currBoat].texture]);
            model_transform = stack.pop();
        }
        
        model_transform = stack.pop();
        //PLANE STUFF-------------------------------------------------------------------------
        
		planes.update(animate_time);
        
        //Make planes
        
        
        
        for(var currPlane = 0; currPlane < planes.pArray.length; currPlane++){
            if(planes.pArray[currPlane].status!="dead"){
                 if(planes.pArray[currPlane].status=="crashing")
                 {
                     //If the plane is crashing: create a splash and set it to dead
                     splashes.createSplash(planes.pArray[currPlane].pos, planes.pArray[currPlane].color);
                     blockade.checkCollisions(planes.pArray[currPlane].pos, planes.pArray[currPlane].type);
                     planes.pArray[currPlane].status="dead";
                     
                 }
                 else{ //Plane is alive
                    var planeColor = new Material(vec4(planes.pArray[currPlane].color[0], planes.pArray[currPlane].color[1], 
                        planes.pArray[currPlane].color[2]),1,1,1,40);
                    //For each plane, translate based on the model_transform
                    stack.push(model_transform);
                    model_transform = mult(model_transform, translate(planes.pArray[currPlane].pos[0],
                        planes.pArray[currPlane].pos[1], planes.pArray[currPlane].pos[2]));
                    model_transform = mult( model_transform, rotate( planes.pArray[currPlane].pitch, 0,  0, 1 ) ); //pitch
                    model_transform = mult( model_transform, rotate( planes.pArray[currPlane].roll , 1,  0, 0 ) ); //roll
                    //yaw
                    model_transform = mult( model_transform, rotate( Math.acos(dot(normalize(planes.pArray[currPlane].velocity), vec3(1,0,0))) , 0,  1, 0 ) );
                    if(planes.pArray[currPlane].type==2)
                    {
                        this.m_plane2.draw(this.graphicsState, model_transform, planeColor);
                    }
                    else{
                        this.m_plane.draw(this.graphicsState, model_transform, planeColor);
                    }
                    model_transform = stack.pop();
                 }
            }
           
        }
        
        //PARTICLE STUFF ----------------------------------------------------------------
        stack.push(model_transform);
        particles.update(animate_time);
        for(var currPart = 0; currPart < particles.pArray.length; currPart++)
        {
            var partColor = new Material(vec4(particles.pArray[currPart].color[0], particles.pArray[currPart].color[1], 
                        particles.pArray[currPart].color[2]),1,1,1,40);
            stack.push(model_transform);
            //Translate
            model_transform = mult(model_transform, translate(particles.pArray[currPart].pos));
            //Rotate along large axis
            model_transform = mult(model_transform, rotate(particles.pArray[currPart].roll, particles.pArray[currPart].axis));
            model_transform = mult(model_transform, translate(scale_vec(particles.pArray[currPart].daxis,vec3(0,0,1))));
            model_transform = mult(model_transform, skew(0,particles.pArray[currPart].skew));
            model_transform = mult(model_transform, scale(particles.pArray[currPart].scale, particles.pArray[currPart].scale,  particles.pArray[currPart].scale) );
            this.m_square.draw(this.graphicsState, model_transform, partColor);
            model_transform = stack.pop();
        }
        model_transform = stack.pop();
        
        stack.push(model_transform);
        model_transform = mult(model_transform, translate( 0, -8, 0 ));
        //SPLASH STUFF -------------------------------------------------------------------
        for(var currSplash = 0; currSplash < splashes.sArray.length; currSplash++){
            if(splashes.sArray[currSplash].frame == 0){
                this.update_audio(animate, "splash");
            }
            if(splashes.sArray[currSplash].frame > splashes.maxFrame){ 
                //If the splash frame is greater than maxFrame, remove it
                splashes.sArray.splice(currSplash,1);
            }
            else{
                //If the splash frame is less, draw the frame 
                stack.push(model_transform);
                var sinFrame = Math.sin(Math.PI/splashes.maxFrame * splashes.sArray[currSplash].frame);
                var sqrtFrame = Math.sqrt( splashes.sArray[currSplash].frame/splashes.maxFrame);
                
                if(splashes.sArray[currSplash].frame < splashes.maxFrame/2){
                    //sinFrame = Math.sqrt(Math.pow(sinFrame, 20));
                }
                console.log("Curr splash: " + currSplash + "Frame: " + splashes.sArray[currSplash].frame/splashes.maxFrame)
                
                model_transform = mult(model_transform, translate(splashes.sArray[currSplash].pos));
                model_transform = mult(model_transform, translate( 0, 15*(-1+sinFrame), 0 ));
                model_transform = mult( model_transform, rotate(splashes.sArray[currSplash].angle, 0,  1, 0 ) ); //Rotate first by offset
                for(var n = 0; n < splashes.sArray[currSplash].nodes; n++){
                    //Call "draw_recursive_seg_rec" for every node
                    this.draw_rotated_seg_rec(model_transform, 0, .5, 0, 0,  Math.floor(15*sqrtFrame), 4, .75, -5, splashes.sArray[currSplash].color);
                    model_transform = mult(model_transform, translate( 0, 0, -.5*splashes.sArray[currSplash].nodes*(1+splashes.sArray[currSplash].frame/splashes.maxFrame) )); //Scale distance from center based on number of nodes and frame
                    model_transform = mult( model_transform, rotate(360/splashes.sArray[currSplash].nodes, 0,  1, 0 , splashes.sArray[currSplash].splashes) );
                    model_transform = mult(model_transform, translate( 0, 0, .5*splashes.sArray[currSplash].nodes ));
                }
                model_transform = stack.pop();
                splashes.sArray[currSplash].frame+=animate_time*30;
            }
            
        }
        model_transform = stack.pop();
        
        
        
	}	



Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
    debug_screen_object.string_map["score"] = "Score: " + score ;
    debug_screen_object.string_map["fps"] = "FPS: " + Math.floor(1000/(this.animation_delta_time));
    debug_screen_object.string_map["Health"] = "Total boat HP: " + blockade.getTotalHealth();
    debug_screen_object.string_map["s to wave"] = "Time to wave: " + Math.ceil(difficulty.timetoNextWave);
	//debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	//debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	//debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
}


Animation.prototype.draw_ground = function( model_transform )
{
	var greenBG = new Material(vec4(.5, .5, .5),1,1,1,40);
    var earth = new Material(vec4(.5, .5, .5),1,1,1,40, "earth.gif");
    var plaid = new Material( vec4( .9,.9,9,1 ), 1, 1, 1, 40, "plaid.png");
    var sky = new Material( vec4( .9,.9,9,1 ), .5, 0, 1, 40, "sky.png");
	var wsky = new Material( vec4( .9,.9,9,1 ), 1, 1, 1, 40, "ricepaper.png");
    var stack=[];
    stack.push(model_transform);
    model_transform = mult( model_transform, rotate( 90, 1,  0, 0 ) );
	model_transform = mult( model_transform, scale( 600, 300, 600 ) );
	this.m_square.draw( this.graphicsState, model_transform, plaid );
    model_transform = stack.pop(model_transform);
    model_transform = mult( model_transform, scale( (maxX-minX + 50), 300, (maxZ-minZ) ) );
    this.m_cube.draw( this.graphicsState, model_transform, sky );
}



//Recursively draw a rotated segment, one after the other
//angle1 represents angle, axis values represent teh axis of rotation, numSegs represents the number of segnments you want
//Height represents height of segment: options scaled to segment size
Animation.prototype.draw_rotated_seg_rec = function(model_transform, angle1, axis_x, axis_y, axis_z, numSegs, height, heightScaling, angleDiff, color)
{
	//Allows input of negative height values, represent downward-faceing stems
    var brown;
    if(Array.isArray(color))
	    brown = new Material(vec4(color), 1, 1, 1, 10);
    else
        brown = new Material(vec4(.5,.5,.5), 1, 1, 1, 10, color); 
	//int length = .5
	
	if(numSegs > 0)
	{
        
		var absHeight = Math.abs(height);
		numSegs--;
		model_transform = mult( model_transform, scale( 1, absHeight, 1 ) );
		this.m_square.draw( this.graphicsState, model_transform, brown );
		model_transform = mult( model_transform, scale( 1, (1/absHeight),  1) );
        
        model_transform = mult(model_transform, translate( 0, height, 0)); 
		model_transform = mult( model_transform, rotate(angle1, axis_x , axis_y, axis_z ) );
		model_transform = mult(model_transform, translate( 0, 3/4*height, 0)); 
		var temp = this.draw_rotated_seg_rec(model_transform, angle1-angleDiff, axis_x, axis_y, axis_z,  numSegs, height * heightScaling, heightScaling, angleDiff, color);
        if(numSegs == 0)
            return model_transform;
         else return temp;

	}
	else{
		//return model_transform;
	}
}

