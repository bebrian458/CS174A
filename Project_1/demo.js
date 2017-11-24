
this.shapes.box.draw(graphics_state, Mat4.scale([15, 0.1, 15]), this.green);

this.t = graphics_state.animation_time/1000;
let model_transform = Mat4.identity();


model_transform = model_transform.times(Mat4.translation(Vec.of(0,10,0)));

this.shapes.ball.draw(graphics_state, model_transform, this,silver);	//Head

let nose = model_transform.times(Mat4.translation(Vec.of(0,0,1)));
nose = nose.times(Mat4.scae(Vec.of(.2,.2,4)));

this.shapes.cone.draw(graphics_state, nose, this.orange);


for( let i = 0; i < 3; i++)
{
	model_transform = model_transform.times(Mat4.scale(Vec.of(2,2,2)));

	model_transform = model_transform.times(Mat4.translation(Vec.of(0,-1.5,0)));

	this.shapes.ball.draw(graphics_sate, model_transform, this.red);		//Thorax

	if(i==0)
		this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(4,0,0)).times(Mat4.scale([3,.2,.2])), this.yellow);
}

// Reflection
for(let i = -1; i <= 1; i += 2)
		matrix.times(scale(i,1,1));

// Sinusoidal rotation
Math.sin(this.t) -1
vs
Math.abs(Math.sin(this.t))
vs
Math.sin(-this.t)

//butterfly wings
//rotate on hinge
//then translate by 1,1,0 to line up diagonal
	// or length of the box
//avoid having to use sqrt(2)


		// If scale is uniform, eg Scale(c,c,c)
		// then it won't affect translation/rotation

		// Post-multiply, with respect to current frame, eg code
		// Pre-multiply, with respect to world frame
