export class Basket
{
    constructor (id, scene, collisionGroup)
    {
        this.scene = scene;
        this.matter = scene.matter;
        this.tweens = scene.tweens;

        this.id = id;
        this.active = false;
        this.visible = false;

        this.position = new Phaser.Math.Vector2(0, 0);
        this.speed = new Phaser.Math.Vector2(0, 0);

        this.targetX = new Phaser.Math.Vector2(0, 0);
        this.targetY = new Phaser.Math.Vector2(0, 0);

        this.easeX = 'Sine.easeInOut';
        this.easeY = 'Power2';

        this.basket = scene.add.image(0, 0, 'basket').setOrigin(0.5, 0).setName(id);
        this.netGraphic = scene.add.graphics().setDepth(9);
        this.hoop = scene.add.image(0, 0, 'assets', 'hoop').setOrigin(0.5, 0).setDepth(10);

        const leftBumper = this.matter.bodies.rectangle(-66, 52, 16, 54, { label: 'left', chamfer: { radius: [ 0, 8, 8, 0 ] }, restitution: 0.2 });
        const rightBumper = this.matter.bodies.rectangle(66, 52, 16, 54, { label: 'right', chamfer: { radius: [ 8, 0, 0, 8 ] }, restitution: 0.2 });

        const topSensor = this.matter.bodies.rectangle(0, 0, 128, 32, { isSensor: true, label: 'top' });
        const bottomSensor = this.matter.bodies.rectangle(0, 75, 100, 35, { isSensor: true, label: 'bottom' });

        this.body = this.matter.body.create({
            parts: [ leftBumper, rightBumper, topSensor, bottomSensor ],
            isStatic: true,
            collisionFilter: {
                group: collisionGroup
            },
            gameObject: this.basket
        });
       
        this.basket.setVisible(false);
        this.hoop.setVisible(false);
        this.netGraphic.setVisible(false);
 
        scene.sys.updateList.add(this);
    }

    setActive (x, y)
    {
        this.active = true;

        this.basket.setVisible(true);
        this.hoop.setVisible(true);
        this.netGraphic.setVisible(true);

        this.position.set(x, y);

        this.createNet();

        this.matter.world.add(this.body);
        this.matter.world.add(this.net);

        this.syncPositions();

        return this;
    }

    setInActive ()
    {
        this.active = false;

        this.basket.setVisible(false);
        this.hoop.setVisible(false);
        this.netGraphic.setVisible(false);

        this.matter.world.remove(this.body);
        this.matter.world.remove(this.net);

        return this;
    }

    setXSpeed (x)
    {
        this.speed.x = x;

        return this;
    }

    setYSpeed (y)
    {
        this.speed.y = y;

        return this;
    }

    setSpeed (x, y = 0)
    {
        this.speed.set(x, y);

        return this;
    }

    setTweenXBetween (a, b)
    {
        this.targetX.set(a, b);

        return this;
    }

    setTweenYBetween (a, b)
    {
        this.targetY.set(a, b);

        return this;
    }

    setXEase (x)
    {
        this.easeX = x;

        return this;
    }

    setYEase (y)
    {
        this.easeY = y;

        return this;
    }

    setEase (x, y)
    {
        this.easeX = x;

        if (y)
        {
            this.easeY = y;
        }

        return this;
    }

    startHorizontalTween ()
    {
        this.tweens.add({
            targets: this.position,
            x: this.targetX.y,
            ease: this.easeX,
            duration: this.speed.x,
            onComplete: () => this.loopHorizontalTween()
        });
    }

    loopHorizontalTween ()
    {
        this.tweens.add({
            targets: this.position,
            x: this.targetX.x,
            ease: this.easeX,
            duration: this.speed.x,
            onComplete: () => this.startHorizontalTween()
        });
    }

    startVerticalTween ()
    {
        this.tweens.add({
            targets: this.position,
            y: this.targetY.y,
            ease: this.easeY,
            duration: this.speed.y,
            onComplete: () => this.loopVerticalTween()
        });
    }

    loopVerticalTween ()
    {
        this.tweens.add({
            targets: this.position,
            y: this.targetY.x,
            ease: this.easeY,
            duration: this.speed.y,
            onComplete: () => this.startVerticalTween()
        });
    }

    createNet ()
    {
        this.net = this.matter.composites.softBody(
            this.position.x - 60,
            this.position.y + 160,
            7, 5,
            0, 0,
            false, 5,
            {
                friction: 0.01
            },
            {
                stiffness: 0.09
            }
        );

        for (let i = 0; i < this.net.bodies.length; i++)
        {
            const body = this.net.bodies[i];

            if (i < 7)
            {
                body.isStatic = true;
            }

            //  Stop the net from hitting the basket bodies
            body.collisionFilter.mask = 0;
        }
    }

    pullNet ()
    {
        //  Apply a little force to the bottom middle of the net

        const bodies = this.net.bodies;

        this.matter.body.setVelocity(bodies[31], { x: 0, y: 20 });
        this.matter.body.setVelocity(bodies[23], { x: 0, y: 20 });
        this.matter.body.setVelocity(bodies[24], { x: 0, y: 20 });
        this.matter.body.setVelocity(bodies[25], { x: 0, y: 20 });
    }

    preUpdate ()
    {
        this.syncPositions();
        this.renderNet();
    }

    syncPositions ()
    {
        this.basket.setPosition(this.position.x, this.position.y);
        this.hoop.setPosition(this.position.x, this.position.y + 159);

        this.matter.body.setPosition(this.body, {
            x: this.position.x,
            y: this.position.y + 168
        });

        if (this.net)
        {
            let x = this.body.position.x - 50;

            for (let i = 0; i < 7; i++)
            {
                const body = this.net.bodies[i];
    
                this.matter.body.setPosition(body, {
                    x: x + (i * 16),
                    y: this.body.position.y
                });
            }
        }
    }

    renderNet ()
    {
        const graphics = this.netGraphic;
        const vector = this.matter.vector;

        graphics.clear();
        graphics.lineStyle(2, 0xffffff, 1);

        const constraints = this.matter.composite.allConstraints(this.matter.world.localWorld);

        for (let i = 0; i < constraints.length; i++)
        {
            const constraint = constraints[i];

            const bodyA = constraint.bodyA;
            const bodyB = constraint.bodyB;

            const start = (bodyA) ? vector.add(bodyA.position, constraint.pointA) : constraint.pointA;
            const end = (bodyB) ? vector.add(bodyB.position, constraint.pointB) : constraint.pointB;
    
            graphics.beginPath();
            graphics.moveTo(start.x, start.y);
            graphics.lineTo(end.x, end.y);
            graphics.strokePath();
        }
    }

    destroy ()
    {
        this.scene.sys.updateList.remove(this);

        this.basket.destroy();
        this.hoop.destroy();
        this.netGraphic.destroy();
    }
}
