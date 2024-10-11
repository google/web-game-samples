export class Ball
{
    constructor (scene, id)
    {
        this.scene = scene;
        this.matter = scene.matter;
        this.active = false;

        this.ball = this.matter.add.image(-1000, 0, 'assets', scene.registry.get('activeBall')).setVisible(false);

        this.ball.name = id.toString();

        this.ball.setCircle(32, {
            friction: 0.8,
            frictionStatic: 0.8,
            restitution: 0.4,
            density: 0.004,
            label: 'ball'
        });

        this.ball.setCollisionGroup(scene.basketCollisionGroup);
        this.ball.setCollisionCategory(scene.ballCollisionCategory);
        this.ball.setCollidesWith(scene.basketCollisionGroup);

        this.scene.matter.world.remove(this.ball.body);

        this.view = scene.scale.getViewPort(scene.cameras.main);

        scene.sys.updateList.add(this);
    }

    throw (x, y)
    {
        this.ball.setPosition(x, y);
        this.ball.setVisible(true);

        this.scene.matter.world.add(this.ball.body);

        this.ball.setVelocityX(0);
        this.ball.setVelocityY(-35);

        if (x < this.view.centerX)
        {
            this.ball.setAngularVelocity(-0.12);
        }
        else
        {
            this.ball.setAngularVelocity(0.12);
        }

        this.ball.setData('hitTop1', false);
        this.ball.setData('hitBottom1', false);
        this.ball.setData('hitLeft1', false);
        this.ball.setData('hitRight1', false);
        this.ball.setData('scored1', false);
        this.ball.setData('missed1', false);

        this.ball.setData('hitTop2', false);
        this.ball.setData('hitBottom2', false);
        this.ball.setData('hitLeft2', false);
        this.ball.setData('hitRight2', false);
        this.ball.setData('scored2', false);
        this.ball.setData('missed2', false);

        this.active = true;
    }

    preUpdate ()
    {
        if (this.active && this.ball && this.ball.y > this.view.bottom + 300)
        {
            this.active = false;

            this.ball.setVisible(false);
            this.ball.setPosition(-1000, 0);

            this.scene.matter.world.remove(this.ball.body);
        }
    }

    destroy ()
    {
        this.scene.sys.updateList.remove(this);

        this.ball.destroy();
    }
}
