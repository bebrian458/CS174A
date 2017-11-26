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

      let square_array = Vec.cast( [ 1,0,-1 ], [ 0,1,-1 ], [ -1,0,-1 ], [ 0,-1,-1 ], [ 1,0,-1 ] ),               // Some helper arrays of points located along
            star_array = Array(19).fill( Vec.of( 1,0,-1 ) ), circle_array = Array(40).fill( Vec.of( 1,0,-1 ) );  // curves.  We'll extrude these into surfaces.
      circle_array = circle_array.map( (x,i,a) => Mat4.rotation( i/(a.length-1) * 2*Math.PI, Vec.of( 0,0,1 ) ).times( x.to4(1) ).to3() );
      star_array   =   star_array.map( (x,i,a) => Mat4.rotation( i/(a.length-1) * 2*Math.PI, Vec.of( 0,0,1 ) ).times( Mat4.translation([ (i%2)/2,0,0 ]) ).times( x.to4(1) ).to3() );

      let sin_rows_func       =      i  => { return Vec.of( .5 + Math.sin(777*i)/4, 2-4*i, 0 ) },                                   // Different callbacks for telling Grid_Patch
          sin_columns_func    = ( j,p ) => { return Mat4.translation([ Math.sin(777*j)/4,0,4/30    ]).times( p.to4(1) ).to3() },    // how it chould advance to the next row/column.
          rotate_columns_func = ( j,p ) => { return Mat4.rotation( .1*j*Math.PI, Vec.of( 0,1,0 )    ).times( p.to4(1) ).to3() },
          sample_square_func  =      i  => { return Grid_Patch.sample_array( square_array, i ) },
          sample_star_func    =      i  => { return Grid_Patch.sample_array( star_array,   i ) },
          sample_circle_func  =      i  => { return Grid_Patch.sample_array( circle_array, i ) },
          sample_two_arrays   = (j,p,i) => { return Mat4.translation([0,0,2*j]).times( sample_star_func(i).mix( sample_circle_func(i), j ).to4(1) ).to3() },
          sample_two_arrays2  = (j,p,i) => { return Mat4.rotation( .5*j*Math.PI, Vec.of( 1,1,1 ) ).times(
                                                    Mat4.translation([0,0,2*j]).times( sample_star_func(i).mix( sample_square_func(i), j ).to4(1) ) ).to3() },
          line_rows_func      = ( i,p ) => { return p ? Mat4.translation([0,i/50,0]).times( p.to4(1) ).to3() :  Vec.of( .01,-.05,-.1 ) },
          transform_cols_func = (j,p,i) => { return Mat4.rotation( Math.PI/8, Vec.of( 0,0,1 ) ).times( Mat4.scale([ 1.1,1.1,1.1 ])).times( Mat4.translation([ 0,0,.005 ]))
                                                      .times( p.to4(1) ).to3() };
      var shapes = { 'triangle'        : new Triangle(),                            // At the beginning of our program, instantiate all shapes we plan to use,
                     'strip'           : new Square(),                              // each with only one instance in the graphics card's memory.
                     'bad_tetrahedron' : new Tetrahedron( false ),                  // For example we would only create one "cube" blueprint in the GPU, but then
                     'tetrahedron'     : new Tetrahedron( true ),                   // re-use it many times per call to display to get multiple cubes in the scene.
                     'windmill'        : new Windmill( 10 ),
                     'box'             : new Cube(),
                     'axis'            : new Axis_Arrows(),
                     'text'            : new Text_Line(50),
                     'prism'           : new ( Capped_Cylinder   .prototype.make_flat_shaded_version() )( 10, 10, [[0,1],[0,1]] ),
                      good_sphere      : new Subdivision_Sphere( 4 ),                                           // A sphere made of nearly equilateral triangles / no singularities
                      vase             : new Grid_Patch( 30, 30, sin_rows_func, rotate_columns_func,   [[0,1],[0,1]] ),
                      ghost            : new Grid_Patch( 36, 10, sample_star_func, sample_two_arrays,  [[0,1],[0,1]] ),
                      shell            : new Grid_Patch( 10, 40, line_rows_func, transform_cols_func,  [[0,5],[0,1]] ),
                      waves            : new Grid_Patch( 30, 30, sin_rows_func, sin_columns_func,      [[0,1],[0,1]] ),
                      shell2           : new Grid_Patch( 30, 30, sample_star_func, sample_two_arrays2, [[0,1],[0,1]] ),
                      tube             : new Cylindrical_Tube  ( 10, 10, [[0,1],[0,1]] ),
                      open_cone        : new Cone_Tip          (  3, 10, [[0,1],[0,1]] ),
                      donut            : new Torus             ( 15, 15 ),
                      gem2             : new ( Torus             .prototype.make_flat_shaded_version() )( 20, 20 ),
                      bad_sphere       : new Grid_Sphere       ( 10, 10 ),                                            // A sphere made of rows and columns, with singularities
                      septagon         : new Regular_2D_Polygon(  2,  7 ),
                      cone             : new Closed_Cone       ( 4, 20, [[0,1],[0,1]] ),                       // Cone.  Useful.
                      capped           : new Capped_Cylinder   ( 4, 12, [[0,1],[0,1]] ),                       // Cylinder.  Also useful.
                      axis             : new Axis_Arrows(),                                                    // Axis.  Draw them often to check your current basis.
                      prism            : new ( Capped_Cylinder   .prototype.make_flat_shaded_version() )( 10, 10, [[0,1],[0,1]] ),
                      gem              : new ( Subdivision_Sphere.prototype.make_flat_shaded_version() )(  2     ),
                      swept_curve      : new Surface_Of_Revolution( 10, 10, [ ...Vec.cast( [2, 0, -1], [1, 0, 0], [1, 0, 1], [0, 0, 2] ) ], [ [ 0, 1 ], [ 0, 7 ] ], Math.PI/3 ),
                     'ball'            : new Subdivision_Sphere( 4 )};
      this.submit_shapes(context, shapes);
      Object.assign( context.globals.graphics_state, { camera_transform: Mat4.translation([ 0, -5,-25 ]), projection_transform: Mat4.perspective( Math.PI/4, context.width/context.height, .1, 1000 ) } );
      Object.assign( this, { shader: context.get_instance( Fake_Bump_Map ), textures: [], gallery: false, patch_only: false, revolution_only: false } );
      for( let filename of [ "/assets/rgb.jpg", "/assets/stars.png", "/assets/earth.gif", "/assets/text.png", "/assets/explosion.png", "/assets/text.png", "/assets/smiley.png", "/assets/wall.png", "/assets/ground1.jpg", "/assets/ground2.jpg", "/assets/hieroglyphics.jpg"] ) this.textures.push( context.get_instance( filename ) ); this.textures.push( undefined );
      Object.assign( this, { yellow       : context.get_instance( Phong_Model  ).material( Color.of( .8, .8, .3,  1 ), .2, 1, .7, 40 ),  // Call material() on the Phong_Shader,
                             brown        : context.get_instance( Phong_Model  ).material( Color.of( .3, .3, .1,  1 ), .2, 1,  1, 40 ),  // which returns a special-made "material"
                             red          : context.get_instance( Phong_Model  ).material( Color.of(  1,  0,  0, .9 ), .1, .7, 1, 40 ),  // (a JavaScript object)
                             green        : context.get_instance( Phong_Model  ).material( Color.of(  0, .5,  0,  1 ), .1, .7, 1, 40 ),
                             blue         : context.get_instance( Phong_Model  ).material( Color.of(  0,  0,  1, .8 ), .1, .7, 1, 40 ),
                             silver       : context.get_instance( Phong_Model  ).material( Color.of( .8, .8, .8,  1 ),  .05,  1, 1, 40 ),
                             purplePlastic: context.get_instance( Phong_Model  ).material( Color.of( .9,.5,.9, 1 ), .4, .4, .8, 40 ),
                             greyPlastic  : context.get_instance( Phong_Model  ).material( Color.of( .5,.5,.5, 1 ), .4, .8, .4, 20 ),   // Smaller exponent means
                             blueGlass    : context.get_instance( Phong_Model  ).material( Color.of( .5,.5, 1,.2 ), .4, .8, .4, 40 ),   // a bigger shiny spot.
                             fire         : context.get_instance( Funny_Shader ).material(),
                             rgb          : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, .5, .5, 40, context.get_instance( "assets/rgb.jpg" ) ),
                             smiley       : context.get_instance( Phong_Model  ).material( Color.of( .1,.1,.1,1 ), .5, .5, .5, 40, context.get_instance( "assets/smiley.png" ) ),
                             explosion    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/explosion.png" ) ),
                             wall         : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/wall.png" ) ),
                             ground1      : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/ground1.jpg" ) ),
                             ground2      : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, 0, 0, 40, context.get_instance( "assets/ground2.jpg" ) ),
                             hieroglyphics: context.get_instance( Phong_Model  ).material( Color.of( .1,.1,0,1 ), 1, .5, .5, 40, context.get_instance( "assets/hieroglyphics.jpg" ) ),
                             textColor    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, 0, 0, 40, context.get_instance( "assets/text.png" ) ),
                             stars        : context.get_instance( Phong_Model  ).material( Color.of( 0,0,1,1 ), .5, .5, .5, 40, context.get_instance( "assets/stars.png" ) ) } );
    }
    /*** Figure Pieces ***/
    draw_bullet(graphics_state, model_transform, color)
    { let bullet = model_transform;
      bullet = bullet.times(Mat4.translation(Vec.of(0,-1,0)));
      bullet = bullet.times(Mat4.scale(Vec.of(1,1,1)));
      bullet = bullet.times(Mat4.translation(Vec.of(1,-2,0)));
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

        // isShoot
        if(isShoot)
          this.draw_bullet(graphics_state, arm, this.fire);

      }
      arm = arm.times(Mat4.scale(Vec.of(1/2,1,1)));
      arm = arm.times(Mat4.translation(Vec.of(-1,-1,0)));
      this.shapes.box.draw(graphics_state, arm, color);
    }
    draw_figure(graphics_state, model_transform, t)
    { // Draw head
      let head = model_transform;
      head = head.times(Mat4.translation(Vec.of(0,1,0)));
      head = head.times(Mat4.scale(Vec.of(1/3,1/3,1/3)));
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
    draw_base(graphics_state, position)
    { let base = position;
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      base = base.times(Mat4.scale(Vec.of(2,1/2,2)));
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.box.draw(graphics_state, base, this.silver);
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      base = base.times(Mat4.scale(Vec.of(1/2,4,1/2)));
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.box.draw(graphics_state, base, this.silver);
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      base = base.times(Mat4.scale(Vec.of(1/4,1/4,1/4)));
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.box.draw(graphics_state, base, this.silver);
    }
    draw_donut_statue(graphics_state, position)
    { this.draw_base(graphics_state, position);
      let newPos = position.times(Mat4.translation(Vec.of(0,7,0)));
      newPos = newPos.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.donut.draw(graphics_state, newPos, this.yellow);
    }
    draw_shell_statue(graphics_state, position, side)
    { this.draw_base(graphics_state, position);
      let newPos = position.times(Mat4.translation(Vec.of(0,7,0)));
      newPos = newPos.times(Mat4.translation(Vec.of(0,1,1)));
      newPos = newPos.times(Mat4.scale(Vec.of(side,1,1)));
      this.shapes.shell.draw(graphics_state, newPos, this.yellow);
    }
    draw_vase_statue(graphics_state, position, side)
    { this.draw_base(graphics_state, position);
      let newPos = position.times(Mat4.translation(Vec.of(0,7,0)));
      newPos = newPos.times(Mat4.translation(Vec.of(0,2,0)));
      newPos = newPos.times(Mat4.scale(Vec.of(side,1,1)));
      this.shapes.vase.draw(graphics_state, newPos, this.yellow);
    }
    draw_ghost_statue(graphics_state, position)
    { this.draw_base(graphics_state, position);
      let newPos = position.times(Mat4.translation(Vec.of(0,7,0)));
      newPos = newPos.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.ghost.draw(graphics_state, newPos, this.yellow);
    }
    draw_gem_statue(graphics_state, position)
    { let base = position;
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      base = base.times(Mat4.scale(Vec.of(1/2,1/2,1/2)));
      base = base.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.box.draw(graphics_state, base, this.hieroglyphics);
      base = base.times(Mat4.translation(Vec.of(2,0,0)));
      this.shapes.box.draw(graphics_state, base, this.hieroglyphics);
      base = base.times(Mat4.translation(Vec.of(0,0,-2)));
      this.shapes.box.draw(graphics_state, base, this.hieroglyphics);
      base = base.times(Mat4.translation(Vec.of(-2,0,0)));
      this.shapes.box.draw(graphics_state, base, this.hieroglyphics);
      //TODO: change ball to gem
      this.shapes.ball.draw(graphics_state, base.times(Mat4.translation(Vec.of(1,2,1))), this.red);
    }
    draw_arena(graphics_state, center)
    {
      let arena = center;
      arena = arena.times(Mat4.scale(Vec.of(1,1,2.5)));

      // Draw walls
      for(let side of [1,-1]){
        let bl_corner = arena;
        bl_corner = bl_corner.times(Mat4.translation(Vec.of(0,0,19*side)));
        this.draw_wall(graphics_state, bl_corner);
        let lr_corner = arena;
        lr_corner = lr_corner.times(Mat4.translation(Vec.of(-17*side+17-1,0,-16)));
        lr_corner = lr_corner.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
        this.draw_wall(graphics_state, lr_corner);
      }

      // Draw statues
      let newCenter = center;
      newCenter = newCenter.times(Mat4.translation(Vec.of(16,-1,0)));

      for(let side of [1,-1]){
        let ghost = newCenter.times(Mat4.translation(Vec.of(0,0,-21)));
        ghost = ghost.times(Mat4.translation(Vec.of(side*10,0,0)));
        this.draw_ghost_statue(graphics_state, ghost);

        let donut = newCenter.times(Mat4.translation(Vec.of(0,0,-7)));
        donut = donut.times(Mat4.translation(Vec.of(side*10,0,0)));
        this.draw_donut_statue(graphics_state, donut);

        let shell = newCenter.times(Mat4.translation(Vec.of(0,0,7)));
        shell = shell.times(Mat4.translation(Vec.of(side*10,0,0)));
        this.draw_shell_statue(graphics_state, shell, side);

        let vase = newCenter.times(Mat4.translation(Vec.of(0,0,21)));
        vase = vase.times(Mat4.translation(Vec.of(side*10,0,0)));
        this.draw_vase_statue(graphics_state, vase, -side);

        let gem = newCenter.times(Mat4.translation(Vec.of(0,0,0)));
        this.draw_gem_statue(graphics_state, gem);
      }
    }

    display( graphics_state )
    { graphics_state.lights = [ new Light( Vec.of(  30,  30,  34, 1 ), Color.of( 0, .4, 0, 1 ), 100000 )];     // shader.  Arguments to construct a Light(): Light source position
                                // new Light( Vec.of( -10, -20, -14, 0 ), Color.of( 1, 1, .3, 1 ), 100    ) ];    // or vector (homogeneous coordinates), color, and size.

      // Time t is now in seconds, represents 1 unit for position
      let t = graphics_state.animation_time/300;

      // Init figure, axis, floor
      let figure1 = Mat4.identity();
      let floor = figure1.times(Mat4.scale(Vec.of(40,1,40)));
      // floor = floor.times(Mat4.translation(Vec.of(0,0,-1)));
      this.shapes.box.draw(graphics_state, floor, this.green);
      figure1 = figure1.times(Mat4.translation(Vec.of(0,1,0)));
      this.shapes.axis.draw(graphics_state, figure1, this.rgb);

      // Init figure2
      let figure2 = figure1;
      figure2 = figure1.times(Mat4.translation(Vec.of(0,0,40)));
      figure2 = figure2.times(Mat4.rotation(Math.PI, Vec.of(0,1,0)));

      // Init shuriken
      let shuriken = figure1;
      shuriken = shuriken.times(Mat4.translation(Vec.of(.5,2,-10)));
      shuriken = shuriken.times(Mat4.rotation(-Math.PI/2, Vec.of(0,0,1)));
      shuriken = shuriken.times(Mat4.scale(Vec.of(1/2,1/2,1/2)));

      // Position text
      let text_model = Mat4.identity();
      text_model = text_model.times(Mat4.translation(Vec.of(-8.5,13,-18+40)));
      text_model = text_model.times(Mat4.scale(Vec.of(1/3,1/3,1/3)));
      this.shapes.text.set_string("Here lies the Stone of Everlasting Life");

      // Draw arena
      let arena = figure1;
      arena = arena.times(Mat4.translation(Vec.of(-15,0,-30)));
      this.draw_arena(graphics_state, arena);

      // Init figure1 position and direction
      figure1 = figure1.times(Mat4.translation(Vec.of(0,0,40)));
      figure1 = figure1.times(Mat4.rotation(Math.PI, Vec.of(0,1,0)));

      /* Scenes */
      if(t <= 6){
        // Move figure1 to the right 12 units
        runSpeed = 2;
        headTilt_v_ang = Math.PI/6;
        arm_angle = -Math.PI/3;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*t)));

        // Start displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);

        // Camera scroll to the right
        // graphics_state.camera_transform = Mat4.look_at(Vec.of(figure1[0][3],13,25), Vec.of(figure1[0][3],0, 0) , Vec.of(0,1,0));
      }
      else if(t <= 8){
        // Look up
        isRun_leg = false;
        isRun_arm = false;
        headTilt_v_ang = -(t-6)*Math.PI/6 + Math.PI/6;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 10){
        // Wait a sec
        if(t >= 9)
          headTilt_v_ang = (t-9)*Math.PI/6 - Math.PI/6;
        else // Look straight
          headTilt_v_ang = -Math.PI/6;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 11){
        // Throw map up
        isThrowMap = 1;
        arm_angle_l = -Math.PI/3;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 20){
        // Make figure1 run 25 units; pos: 12+25=37
        isHoldMap = 0; isThrowMap = 0;
        arm_angle = 0; arm_angle_l = 0;
        isRun_arm = true; isRun_leg = true; runSpeed = 5;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6 + 5*(t-11))));
        figure1 = figure1.times(Mat4.translation(Vec.of(0,1/4,0)));
        figure1 = figure1.times(Mat4.rotation(Math.PI/12, Vec.of(1,0,0)));

        // Keep displaying text
        this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 32){
        // Make figure1 walk 32-19 units
        runSpeed = 1;
        isRun_arm = false;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9 + (t-19))));
      }
      else if(t <= 33){
        // Make figure1 turn towards gem and wait a sec
        isRun_leg = false;
        headTilt_v_ang = Math.PI/6;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19))));
        figure1 = figure1.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
      }
      else if(t <= 34){
        // Make figure1 raise arm to reach for gem
        arm_raise_l = true;
        arm_angle_l = -(t-33)*Math.PI/2;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19))));
        figure1 = figure1.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
      }
      else if(t <= 38){
        // Make figure1 stay
        arm_angle_l = -Math.PI/2;
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19))));
        figure1 = figure1.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));

        // Shuriken strikes
        if(t >=35){
          shuriken = shuriken.times(Mat4.translation(Vec.of(0,0,-30*(t-34))));
          shuriken = shuriken.times(Mat4.rotation(-5*t*Math.PI, Vec.of(0,1,0)));
          this.shapes.windmill.draw(graphics_state, shuriken, this.silver);
        }

        // Figure1 moves arm up to react
        if(t >= 35.1)
          arm_angle_l = -1.5*Math.PI;

        // Figure1 turns to attacker (figure 2)
        if(t >= 36){
          arm_raise_l = false;
          headTilt_v = false;
          figure1 = figure1.times(Mat4.rotation(-Math.PI/2, Vec.of(0,1,0)));
        }
      }
      else if(t <= 42){
        // Figure1 starts at current position
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19))));
        figure1 = figure1.times(Mat4.rotation(-Math.PI, Vec.of(0,1,0)));

        // Shuriken strikes
        if(t >= 38){
          shuriken = shuriken.times(Mat4.translation(Vec.of(3,-1.5,-30*(t-38))));
          shuriken = shuriken.times(Mat4.rotation(-5*t*Math.PI, Vec.of(0,1,0)));
          this.shapes.windmill.draw(graphics_state, shuriken, this.silver);
        }

        // Figure1 reacts by jumping
        if(t >= 39 && t <= 39.5){
          figure1 = figure1.times(Mat4.translation(Vec.of(0,Math.sin(t),0)));
        }
      }
      else if(t <= 43){
        // Figure1 starts at current position
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19))));
        figure1 = figure1.times(Mat4.rotation(-Math.PI, Vec.of(0,1,0)));

        // Figure1 and figure2 jumps into position for beam attack (4 units)
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,-4)));
        figure1 = figure1.times(Mat4.rotation(-(t-42)*Math.PI, Vec.of(1,0,0)));
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,4)));
        figure1 = figure1.times(Mat4.rotation((t-42)*Math.PI, Vec.of(1,0,0)));
        figure2 = figure2.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19)-16)));
        figure2 = figure2.times(Mat4.translation(Vec.of(0,0,4)));
        figure2 = figure2.times(Mat4.rotation((t-42)*Math.PI, Vec.of(1,0,0)));
        figure2 = figure2.times(Mat4.translation(Vec.of(0,0,-4)));
        figure2 = figure2.times(Mat4.rotation(-(t-42)*Math.PI, Vec.of(1,0,0)));
        this.draw_figure(graphics_state, figure2, t);
      }
      else if(t <= 47){
        // Figure1 and figure2 keep looking at each other
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19) + 8)));
        figure1 = figure1.times(Mat4.rotation(-Math.PI, Vec.of(0,1,0)));
        figure2 = figure2.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19) - 8)));

        // Figure1 and figure2 raise arms to charge ball attack for 3 secs
        if(t <= 44)
          arm_angle = -(t-43)*Math.PI/2;
        else
          isShoot = true;
        arm_raise_l = true;
        arm_angle_l = 0;
        arm_raise_r = true;

        //TODO: From 2nd to 3rd sec, move arm back and forth for lauch attack

        this.draw_figure(graphics_state, figure2, t);
      }
      else {
        // Figure1 and figure2 keep looking at each other
        figure1 = figure1.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19) + 8)));
        figure1 = figure1.times(Mat4.rotation(-Math.PI, Vec.of(0,1,0)));
        figure2 = figure2.times(Mat4.translation(Vec.of(0,0,2*6+5*9+(32-19) - 8)));
        this.draw_figure(graphics_state, figure2, t);
      }

      // */

      /*** TODO: Scenes ***/
      //TODO: figure2 throws fireball, hits ground in front of figure1
      //TODO: figure1 jumps up to dodge, jumps backward
      //TODO: both raise arms
      //TODO: form ball (charge attack)
      //TODO: release beams (elongated ball/tube)
      //TODO: after a sec, ball grows from collision (explosion)
      //TODO: both players fly back
      //TODO: gem splits to 4 pieces and scatters

      /*** TODO: Shapes ***/
      //TODO: gem
      //TODO: floor/sky

      //TODO: Camera adjustments

      // Always draw figure
      this.draw_figure(graphics_state, figure1, t);

    }
}
