//Globals
var arm_angle = 0,      arm_angle_l = 0,
    arm_raise_l = true, arm_raise_r = true,
    headTilt_v = true,  headTilt_v_ang = 0,
    isShoot = false,    bullet_pos = false,
    isRun_leg = true,   isRun_arm = false,  runSpeed = 1,
    isHoldMap = 1,      isThrowMap = 0;


class Project extends Scene_Component
{ constructor(context)
    { super(context);
      var shapes = { 'triangle'        : new Triangle(),                            // At the beginning of our program, instantiate all shapes we plan to use,
                     'strip'           : new Square(),                              // each with only one instance in the graphics card's memory.
                     'bad_tetrahedron' : new Tetrahedron( false ),                  // For example we would only create one "cube" blueprint in the GPU, but then
                     'tetrahedron'     : new Tetrahedron( true ),                   // re-use it many times per call to display to get multiple cubes in the scene.
                     'windmill'        : new Windmill( 10 ),
                     'box'             : new Cube(),
                     'axis'            : new Axis_Arrows(),
                     'text'            : new Text_Line(50),
                     'prism'           : new ( Capped_Cylinder   .prototype.make_flat_shaded_version() )( 10, 10, [[0,1],[0,1]] ),
                     'ball'            : new Subdivision_Sphere( 4 )};
      this.submit_shapes(context, shapes);
      Object.assign( context.globals.graphics_state, { camera_transform: Mat4.translation([ 0, -5,-25 ]), projection_transform: Mat4.perspective( Math.PI/4, context.width/context.height, .1, 1000 ) } );
      Object.assign( this, { shader: context.get_instance( Fake_Bump_Map ), textures: [], gallery: false, patch_only: false, revolution_only: false } );
      for( let filename of [ "/assets/rgb.jpg", "/assets/stars.png", "/assets/earth.gif", "/assets/text.png", "/assets/explosion.png", "/assets/text.png", "/assets/smiley.png", "/assets/wall.png"] ) this.textures.push( context.get_instance( filename ) ); this.textures.push( undefined );
      Object.assign( this, { yellow       : context.get_instance( Phong_Model  ).material( Color.of( .8, .8, .3,  1 ), .2, 1, .7, 40 ),  // Call material() on the Phong_Shader,
                             brown        : context.get_instance( Phong_Model  ).material( Color.of( .3, .3, .1,  1 ), .2, 1,  1, 40 ),  // which returns a special-made "material"
                             red          : context.get_instance( Phong_Model  ).material( Color.of(  1,  0,  0, .9 ), .1, .7, 1, 40 ),  // (a JavaScript object)
                             green        : context.get_instance( Phong_Model  ).material( Color.of(  0, .5,  0,  1 ), .1, .7, 1, 40 ),
                             blue         : context.get_instance( Phong_Model  ).material( Color.of(  0,  0,  1, .8 ), .1, .7, 1, 40 ),
                             silver       : context.get_instance( Phong_Model  ).material( Color.of( .8, .8, .8,  1 ),  0,  1, 1, 40 ),
                             purplePlastic: context.get_instance( Phong_Model  ).material( Color.of( .9,.5,.9, 1 ), .4, .4, .8, 40 ),
                             greyPlastic  : context.get_instance( Phong_Model  ).material( Color.of( .5,.5,.5, 1 ), .4, .8, .4, 20 ),   // Smaller exponent means
                             blueGlass    : context.get_instance( Phong_Model  ).material( Color.of( .5,.5, 1,.2 ), .4, .8, .4, 40 ),   // a bigger shiny spot.
                             fire         : context.get_instance( Funny_Shader ).material(),
                             rgb          : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, .5, .5, 40, context.get_instance( "assets/rgb.jpg" ) ),
                             smiley       : context.get_instance( Phong_Model  ).material( Color.of( .1,.1,.1,1 ), .5, .5, .5, 40, context.get_instance( "assets/smiley.png" ) ),
                             explosion    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/explosion.png" ) ),
                             wall         : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/wall.png" ) ),
                             textColor    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, 0, 0, 40, context.get_instance( "assets/text.png" ) ),
                             stars        : context.get_instance( Phong_Model  ).material( Color.of( 0,0,1,1 ), .5, .5, .5, 40, context.get_instance( "assets/stars.png" ) ) } );
    }
    /*** Figure Pieces ***/
    draw_bullet(graphics_state, model_transform, color)
    { let bullet = model_transform;
      bullet = bullet.times(Mat4.translation(Vec.of(0,-1,0)));
      bullet = bullet.times(Mat4.scale(Vec.of(1,1,1)));
      bullet = bullet.times(Mat4.translation(Vec.of(0,-2,0)));
      bullet = bullet.times(Mat4.translation(Vec.of(0,-10*bullet_pos,0)));
      this.shapes.ball.draw(graphics_state, bullet, color);
    }
    draw_leg(graphics_state, model_transform, color, legSide, t)
    { let leg = model_transform;
      leg = leg.times(Mat4.translation(Vec.of(-1,-1,0)));
      leg = leg.times(Mat4.scale(Vec.of(1/2,1/2,1)));
      leg = leg.times(Mat4.translation(Vec.of(1,-1,0)));
      if(isRun_leg){
        leg = leg.times(Mat4.translation(Vec.of(0,1,1)));
        leg = leg.times(Mat4.rotation(1/2*legSide*Math.sin(runSpeed*t*Math.PI)-1/2, Vec.of(1,0,0)));
        leg = leg.times(Mat4.translation(Vec.of(0,-1,-1)));
      }
      this.shapes.box.draw(graphics_state, leg, color);
    }
    draw_arm(graphics_state, model_transform, color, armSide, t, isRaise)
    { let arm = model_transform;
      arm = arm.times(Mat4.translation(Vec.of(-1,-1,0)));

      // Move arm for running
      if(isRun_arm){
        arm = arm.times(Mat4.translation(Vec.of(0,0,1)));
        arm = arm.times(Mat4.rotation(armSide*Math.sin(runSpeed*t*Math.PI)-1, Vec.of(1,0,0)));
        arm = arm.times(Mat4.translation(Vec.of(0,0,-1)));
      }

      // Move arm to fixed position
      if(isRaise){
        arm = arm.times(Mat4.translation(Vec.of(0,0,1)));
        arm = arm.times(Mat4.rotation(arm_angle, Vec.of(1,0,0)));
        if(armSide == 1)
          arm = arm.times(Mat4.rotation(arm_angle_l, Vec.of(1,0,0)));
        arm = arm.times(Mat4.translation(Vec.of(0,0,-1)));

        // Hold map relative to left arm
        if(armSide == 1 && isHoldMap){
          let map = arm;
          map = map.times(Mat4.translation(Vec.of(1,-2,0)));
          map = map.times(Mat4.scale(Vec.of(1,1/2,1)));

          // Throw map with left arm
          if(isThrowMap){
            map = map.times(Mat4.translation(Vec.of(-20*(t-10),10*(t-10),20*(t-10))));
          }
          this.shapes.box.draw(graphics_state, map, this.red);
        }
      }
      arm = arm.times(Mat4.scale(Vec.of(1/2,1,1)));
      arm = arm.times(Mat4.translation(Vec.of(-1,-1,0)));
      this.shapes.box.draw(graphics_state, arm, color);
    }
    draw_figure(graphics_state, model_transform, t)
    { // Draw head
      let head = model_transform;
      head = head.times(Mat4.translation(Vec.of(0,1,0)));
      head = head.times(Mat4.scale(Vec.of(1/4,1/4,1/4)));
      head = head.times(Mat4.translation(Vec.of(0,4,0)));
      if(headTilt_v){
        let tilt = head;
        tilt = tilt.times(Mat4.translation(Vec.of(0,-1,1)));
        tilt = tilt.times(Mat4.rotation(headTilt_v_ang, Vec.of(1,0,0)));
        tilt = tilt.times(Mat4.translation(Vec.of(0,1,-1)));
        this.shapes.box.draw(graphics_state, tilt, this.blue);
      }
      else
        this.shapes.box.draw(graphics_state, head, this.blue);

      // Draw body
      let body = head;
      body = body.times(Mat4.translation(Vec.of(0,-1,0)));
      body = body.times(Mat4.scale(Vec.of(1,2,1)));
      body = body.times(Mat4.translation(Vec.of(0,-1,0)));
      this.shapes.box.draw(graphics_state, body, this.rgb);

      // Draw legs
      let left_leg = body;
      let right_leg = body;
      right_leg = right_leg.times(Mat4.scale(Vec.of(-1,1,1)));
      this.draw_leg(graphics_state, left_leg, this.greyPlastic, 1, t);
      this.draw_leg(graphics_state, right_leg, this.blueGlass, -1, t);

      // Draw arms
      let left_arm = head;
      this.draw_arm(graphics_state, left_arm, this.greyPlastic, 1, t, arm_raise_l);
      let right_arm = head;
      right_arm = right_arm.times(Mat4.scale(Vec.of(-1,1,1)));
      this.draw_arm(graphics_state, right_arm, this.blueGlass, -1, t, arm_raise_r);
    }
    /*** Arena Pieces ***/
    draw_wall(graphics_state, bl_corner)
    { let section = bl_corner;
      section = section.times(Mat4.rotation(-Math.PI/2, Vec.of(1,0,0)));
      section = section.times(Mat4.scale(Vec.of(2,1,3)));
      section = section.times(Mat4.translation(Vec.of(0,0,1)));

      // Draw wall with 9x4 sections => 36x24 units
      for(let i = 0; i < 9; i++){
        let curr_sec = section;
        curr_sec = curr_sec.times(Mat4.translation(Vec.of(2*i,0,0)));
        for(let j of [0,2,2,2]){
          curr_sec = curr_sec.times(Mat4.translation(Vec.of(0,0,j)));

          // Don't draw section at entrance
          if(i != 4 || j )
            this.shapes.box.draw(graphics_state, curr_sec, this.wall);
        }
      }
    }
    draw_arena(graphics_state, arena)
    {
      // let bl_corner = arena;
      // // front
      // bl_corner = bl_corner.times(Mat4.translation(Vec.of(-15,0,-20)));
      // this.draw_wall(graphics_state, bl_corner);
      // // left
      // bl_corner = bl_corner.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
      // bl_corner = bl_corner.times(Mat4.translation(Vec.of(3,0,-1)));
      // this.draw_wall(graphics_state, bl_corner);
      // // back
      // bl_corner = bl_corner.times(Mat4.translation(Vec.of(35,0,1)));
      // bl_corner = bl_corner.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
      // this.draw_wall(graphics_state, bl_corner);
      // // right
      // bl_corner = bl_corner.times(Mat4.translation(Vec.of(33,0,3)));
      // bl_corner = bl_corner.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
      // this.draw_wall(graphics_state, bl_corner);

      for(let side of [1,-1]){
        let bl_corner = arena;
        bl_corner = bl_corner.times(Mat4.translation(Vec.of(0,0,19*side)));
        this.draw_wall(graphics_state, bl_corner);
        let lr_corner = arena;
        lr_corner = lr_corner.times(Mat4.translation(Vec.of(-17*side+17-1,0,-16)));
        lr_corner = lr_corner.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
        this.draw_wall(graphics_state, lr_corner);
      }


    }

    display( graphics_state )
    { graphics_state.lights = [ new Light( Vec.of(  30,  30,  34, 1 ), Color.of( 0, .4, 0, 1 ), 100000 )];     // shader.  Arguments to construct a Light(): Light source position
                                // new Light( Vec.of( -10, -20, -14, 0 ), Color.of( 1, 1, .3, 1 ), 100    ) ];    // or vector (homogeneous coordinates), color, and size.

      // Time t is now in seconds, represents 1 unit for position
      let t = graphics_state.animation_time/1000;

      // Init figure, axis, floor
      let figure1 = Mat4.identity();
      let floor = figure1.times(Mat4.scale(Vec.of(40,1,40)));
      // floor = floor.times(Mat4.translation(Vec.of(0,0,-1)));
      this.shapes.box.draw(graphics_state, floor, this.green);
      figure1 = figure1.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.axis.draw(graphics_state, figure1, this.rgb);

      // Position text
      let text_model = Mat4.identity();
      text_model = text_model.times(Mat4.translation(Vec.of(-13,13,-18)));
      text_model = text_model.times(Mat4.scale(Vec.of(.5,.5,.5)));
      this.shapes.text.set_string("Here lies the Stone of Everlasting Life");

      // Draw arena
      let arena = figure1;
      arena = arena.times(Mat4.translation(Vec.of(-15,0,-70)));
      // arena = arena.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
      arena = arena.times(Mat4.scale(Vec.of(1,1,2.5)));
      this.draw_arena(graphics_state, arena);

      figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));

      /* Scenes*/
      if(t <= 6){
        // Move figure1 to the right 12 units
        runSpeed = 2;
        headTilt_v_ang = Math.PI/6;
        arm_angle = -Math.PI/3;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*t,0,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));



        // Camera scroll to the right
        // graphics_state.camera_transform = Mat4.look_at(Vec.of(figure1[0][3],13,25), Vec.of(figure1[0][3],0, 0) , Vec.of(0,1,0));
      }
      else if(t <= 8){
        // Look up
        isRun_leg = false;
        isRun_arm = false;
        headTilt_v_ang = -(t-6)*Math.PI/6 + Math.PI/6;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*6,0,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));

        // Start displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 10){
        // Wait a sec
        if(t >= 9)
          headTilt_v_ang = (t-9)*Math.PI/6 - Math.PI/6;
        else // Look straight
          headTilt_v_ang = -Math.PI/6;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*6,0,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if (t <= 11){
        // Throw map up
        isThrowMap = 1;
        arm_angle_l = -Math.PI/3;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*6,0,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if (t <= 16){
        // Make figure1 run 25 units; pos: 12+25=37
        isHoldMap = 0; isThrowMap = 0;
        arm_angle = 0; arm_angle_l = 0;
        isRun_arm = true; isRun_leg = true; runSpeed = 5;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*6 + 5*(t-11),0,0)));
        figure1 = figure1.times(Mat4.translation(Vec.of(0,1/4,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/12, Vec.of(1,0,0)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else{
        // Make figure1 walk _ units
        runSpeed = 1;
        isRun_arm = false;
        figure1 = figure1.times(Mat4.translation(Vec.of(2*6+5*5 + (t-16),0,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
      }
      //*/

      /*** TODO: Scenes ***/
      //TODO: look left and right
      //TODO: stop and look straight at gem
      //TODO: attempt a grab
      //TODO: shuriken/fan/ball coming from figure2
      //TODO: look toward figure2
      //TODO: both jump back
      //TODO: raise arms
      //TODO: form ball (charge attack)
      //TODO: release beams
      //TODO: after a sec, ball grows from collision (explosion)
      //TODO: both players fly back
      //TODO: gem splits to 4 pieces and scatters

      /*** TODO: Shapes ***/
      //TODO: gem
      //TODO: statues (sun, moon, lightning, tree)
      //TODO: castle/arena

      //TODO: Camera adjustments

      // Always draw figure
      this.draw_figure(graphics_state, figure1, t);

    }
}
