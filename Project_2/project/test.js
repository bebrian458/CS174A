var r_arm_angle = 0;
var isShoot = 0;
var bullet_pos = 0;
var music = new Audio("assets/river.mp3");
var isPlay = 1;
var isWalk = 0;


class Test extends Scene_Component
{ constructor(context)
    { super(context);
      var shapes = { 'triangle'        : new Triangle(),                            // At the beginning of our program, instantiate all shapes we plan to use,
                     'strip'           : new Square(),                              // each with only one instance in the graphics card's memory.
                     'bad_tetrahedron' : new Tetrahedron( false ),                  // For example we would only create one "cube" blueprint in the GPU, but then
                     'tetrahedron'     : new Tetrahedron( true ),                   // re-use it many times per call to display to get multiple cubes in the scene.
                     'windmill'        : new Windmill( 10 ),
                     'box'             : new Cube(),
                     'axis'            : new Axis_Arrows(),
                     'text'            : new Text_Line(30),
                     'prism'           : new ( Capped_Cylinder   .prototype.make_flat_shaded_version() )( 10, 10, [[0,1],[0,1]] ),
                     'ball'            : new Subdivision_Sphere( 4 )};
      this.submit_shapes(context, shapes);
      Object.assign( context.globals.graphics_state, { camera_transform: Mat4.translation([ 0, 0,-25 ]), projection_transform: Mat4.perspective( Math.PI/4, context.width/context.height, .1, 1000 ) } );
      Object.assign( this, { shader: context.get_instance( Fake_Bump_Map ), textures: [], gallery: false, patch_only: false, revolution_only: false } );
      for( let filename of [ "/assets/rgb.jpg", "/assets/stars.png", "/assets/earth.gif", "/assets/text.png", "/assets/explosion.png", "/assets/text.png", "/assets/smiley.png"] ) this.textures.push( context.get_instance( filename ) ); this.textures.push( undefined );
      Object.assign( this, { purplePlastic: context.get_instance( Phong_Model  ).material( Color.of( .9,.5,.9, 1 ), .4, .4, .8, 40 ),
                             greyPlastic  : context.get_instance( Phong_Model  ).material( Color.of( .5,.5,.5, 1 ), .4, .8, .4, 20 ),   // Smaller exponent means
                             blueGlass    : context.get_instance( Phong_Model  ).material( Color.of( .5,.5, 1,.2 ), .4, .8, .4, 40 ),   // a bigger shiny spot.
                             fire         : context.get_instance( Funny_Shader ).material(),
                             rgb          : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, .5, .5, 40, context.get_instance( "assets/rgb.jpg" ) ),
                             smiley       : context.get_instance( Phong_Model  ).material( Color.of( .1,.1,.1,1 ), .5, .5, .5, 40, context.get_instance( "assets/smiley.png" ) ),
                             explosion    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), .5, .5, .5, 40, context.get_instance( "assets/explosion.png" ) ),
                             textColor    : context.get_instance( Phong_Model  ).material( Color.of( 0,0,0,1 ), 1, 0, 0, 40, context.get_instance( "assets/text.png" ) ),
                             stars        : context.get_instance( Phong_Model  ).material( Color.of( 0,0,1,1 ), .5, .5, .5, 40, context.get_instance( "assets/stars.png" ) ) } );
    }
    draw_bullet(graphics_state, model_transform, color)
    {
      let bullet = model_transform;
      bullet = bullet.times(Mat4.translation(Vec.of(0,-1,0)));
      bullet = bullet.times(Mat4.scale(Vec.of(1,1,1)));
      bullet = bullet.times(Mat4.translation(Vec.of(0,-2,0)));
      bullet = bullet.times(Mat4.translation(Vec.of(0,-10*bullet_pos,0)));
      this.shapes.ball.draw(graphics_state, bullet, color);
    }

    draw_leg(graphics_state, model_transform, color, legSide, t)
    {
      let leg = model_transform;
      leg = leg.times(Mat4.translation(Vec.of(-1,-1,0)));
      leg = leg.times(Mat4.scale(Vec.of(1/2,1/2,1)));
      leg = leg.times(Mat4.translation(Vec.of(1,-1,0)));
      if(isWalk){
        leg = leg.times(Mat4.translation(Vec.of(0,1,1)));
        leg = leg.times(Mat4.rotation(1/2*legSide*Math.sin(t*Math.PI)-1/2, Vec.of(1,0,0)));
        leg = leg.times(Mat4.translation(Vec.of(0,-1,-1)));
      }
      this.shapes.box.draw(graphics_state, leg, color);
    }
    draw_arm(graphics_state, model_transform, color, isRaise)
    {
      let arm = model_transform;
      arm = arm.times(Mat4.translation(Vec.of(-1,-1,0)));
      if(isRaise){
        arm = arm.times(Mat4.translation(Vec.of(0,0,1)));
        arm = arm.times(Mat4.rotation(r_arm_angle, Vec.of(1,0,0)));
        arm = arm.times(Mat4.translation(Vec.of(0,0,-1)));

        if(isShoot){
          this.draw_bullet(graphics_state, arm, this.greyPlastic);
        }
      }
      arm = arm.times(Mat4.scale(Vec.of(1/2,1,1)));
      arm = arm.times(Mat4.translation(Vec.of(-1,-1,0)));
      this.shapes.box.draw(graphics_state, arm, color);
    }
    draw_figure(graphics_state, model_transform, t)
    {
      // Draw head
      let head = model_transform;
      // head = head.times(Mat4.rotation(45*graphics_state.animation_time/100000, Vec.of(0,1,0)));
      // head = head.times(Mat4.translation(Vec.of(5*t%10,0,0)));
      head = head.times(Mat4.scale(Vec.of(1/4,1/4,1/4)));
      head = head.times(Mat4.translation(Vec.of(0,10,0)));
      this.shapes.box.draw(graphics_state, head, this.smiley);

      // Face
      // let face = head;
      // face = face.times(Mat4.translation(Vec.of(0,0,1)));
      // this.shapes.strip.draw(graphics_state, face, this.smiley);

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
      this.draw_arm(graphics_state, left_arm, this.greyPlastic, 1);
      let right_arm = head;
      right_arm = right_arm.times(Mat4.scale(Vec.of(-1,1,1)));
      this.draw_arm(graphics_state, right_arm, this.blueGlass, 0);

    }

    display( graphics_state )
    { graphics_state.lights = [ new Light( Vec.of(  30,  30,  34, 1 ), Color.of( 0, .4, 0, 1 ), 100000 )];     // shader.  Arguments to construct a Light(): Light source position
                                // new Light( Vec.of( -10, -20, -14, 0 ), Color.of( 1, 1, .3, 1 ), 100    ) ];    // or vector (homogeneous coordinates), color, and size.

      var model_transform = Mat4.identity();
      // this.shapes.ball.draw(graphics_state, model_transform.times(Mat4.scale(Vec.of(500,500,500))), this.stars);
      this.shapes.axis.draw(graphics_state, model_transform, this.rgb);
      // this.shapes.prism.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,10,0))), this.stars);
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.scale(Vec.of(20,.5,20))), this.stars);

      let t = graphics_state.animation_time/1000

      // for(let i = 0; i < 8; i++){
      //   model_transform = model_transform.times(Mat4.rotation(2*i/8*Math.PI, Vec.of(0,1,0)));
      //   this.draw_figure(graphics_state, model_transform, t);
      // }

      let sphere = model_transform;
      sphere = sphere.times(Mat4.translation(Vec.of(15,2,0)));


      // let face = Mat4.identity();
      // face = face.times(Mat4.scale(Vec.of(10,10,10)));
      // this.shapes.strip.draw(graphics_state, face, this.smiley);

      if(t <= 5){
        isWalk = 1;
        // Play music
        if(t > 2 && isPlay){
          music.play();
          isPlay = 0;
        }
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*t,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        this.draw_figure(graphics_state, model_transform, t);
        this.shapes.ball.draw(graphics_state, sphere, this.purplePlastic);
        graphics_state.camera_transform = Mat4.look_at(Vec.of(model_transform[0][3],13,25), Vec.of(model_transform[0][3],0, 0) , Vec.of(0,1,0))
        let text_model = Mat4.identity();
        text_model = text_model.times(Mat4.translation(Vec.of(0,10,0)));
        text_model = text_model.times(Mat4.scale(Vec.of(.5,.5,.5)));
        this.shapes.text.set_string("This is a test");
        if(t > 2)
          this.shapes.text.draw(graphics_state, text_model, this.textColor);
      }
      else if(t <= 7){
        isWalk = 0;
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*5,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        r_arm_angle = -(t-5)/2*Math.PI/2;
        this.draw_figure(graphics_state, model_transform, t);
        this.shapes.ball.draw(graphics_state, sphere, this.purplePlastic);
      }
      else if(t <= 8){
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*5,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        this.draw_figure(graphics_state, model_transform, t);
        this.shapes.ball.draw(graphics_state, sphere, this.purplePlastic);
      }
      else if(t <= 9.2){
        music.play();
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*5,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        isShoot = 1;
        bullet_pos = (t-8);
        this.draw_figure(graphics_state, model_transform, t);
        this.shapes.ball.draw(graphics_state, sphere, this.purplePlastic);
      }
      else if(t <= 13){
        music.play();
        isShoot = 0;
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*5,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        this.draw_figure(graphics_state, model_transform, t);
        sphere = sphere.times(Mat4.scale(Vec.of(t-9.2, t-9.2, t-9.2)));
        this.shapes.ball.draw(graphics_state, sphere, this.explosion);
      }
      else{
        music.pause();
        model_transform = model_transform.times(Mat4.translation(Vec.of(2*5,0,0)));
        model_transform = model_transform.times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0)));
        this.draw_figure(graphics_state, model_transform, t);
      }

    }
}
