import { Ball } from '../gameobjects/Ball';
import { Basket } from '../gameobjects/Basket';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.view = this.scale.getViewPort(this.cameras.main);

        this.scene.launch('GameBackground');
        this.scene.bringToTop();

        this.basketCollisionGroup = this.matter.world.nextGroup();
        this.ballCollisionCategory = this.matter.world.nextCategory();

        this.basket1 = new Basket(1, this, this.basketCollisionGroup);
        this.basket2 = new Basket(2, this, this.basketCollisionGroup);

        this.balls = [];

        for (let i = 0; i < 8; i++)
        {
            this.balls.push(new Ball(this, i));
        }

        this.matter.world.on('collisionstart', (event, bodyA, bodyB) => this.collisionCheck(event, bodyA, bodyB));
        this.matter.world.on('collisionactive', (event, bodyA, bodyB) => this.collisionCheck(event, bodyA, bodyB));

        this.input.on('pointerdown', (pointer) => this.throwBall(pointer));

        this.registry.set('shots', 50);
        this.registry.set('score', 0);

        this.pendingGameOver = false;

        this.showHand();

        this.checkStage();
    }

    checkStage ()
    {
        const left = this.view.left + 190;
        const right = this.view.right - 190;
        const top = this.view.top + 128;

        const shots = this.registry.get('shots');

        const basket1 = this.basket1;
        const basket2 = this.basket2;

        switch (shots)
        {
            case 50:
                // console.log('Stage 1');
                basket1.setActive(left, top);
                basket1.setTweenXBetween(left, right).setXSpeed(6000).setXEase('Linear');
                basket1.startHorizontalTween();
                this.sound.play('next-stage');
                break;

            case 45:
                // console.log('Stage 2');
                basket1.setEase('Sine.easeInOut').setXSpeed(5000);
                this.sound.play('next-stage');
                break;

            case 40:
                // console.log('Stage 3');
                basket1.setXSpeed(4000);
                this.sound.play('next-stage');
                break;

            case 35:
                // console.log('Stage 4');
                basket2.setActive(left, top + 380);
                basket2.setTweenXBetween(left, right).setXSpeed(5000).setXEase('Sine.easeInOut');
                basket2.startHorizontalTween();
                this.sound.play('next-stage');
                break;
    
            case 25:
                // console.log('Stage 5');
                basket1.setTweenYBetween(top, top + 150).setYSpeed(2000).setYEase('Sine.easeInOut');
                basket1.startVerticalTween();
                this.sound.play('next-stage');
                break;
    
            case 20:
                // console.log('Stage 6');
                basket2.setXSpeed(4000);
                this.sound.play('next-stage');
                break;
    
            case 10:
                // console.log('Stage 7');
                basket2.setTweenYBetween(top + 380, top + 480).setYSpeed(2000).setYEase('Sine.easeInOut');
                basket2.startVerticalTween();
                this.sound.play('next-stage');
                break;
        
            case 0:
                this.pendingGameOver = true;
                this.sound.play('next-stage');
                break;
        }
    }

    throwBall (pointer)
    {
        if (this.handCursor)
        {
            this.handCursor.destroy();
            this.handCursor = null;
        }

        const ball = Phaser.Utils.Array.GetFirst(this.balls, 'active', false);

        if (ball && this.registry.get('shots') > 0)
        {
            const y = (pointer.worldY < this.view.centerY) ? this.view.centerY : pointer.worldY;

            ball.throw(pointer.worldX, y);

            this.registry.inc('shots', -1);

            this.checkStage();

            this.sound.play('throw');
        }
    }

    showHand ()
    {
        const cx = this.view.centerX;
        const cy = this.view.centerY + 200;
        const x = this.view.right;
        const y = this.view.bottom;

        this.handCursor = this.add.sprite(x, y, 'hands', 1).setDepth(20).setAlpha(0);

        this.tweens.add({
            targets: this.handCursor,
            x: { value: cx, duration: 1000, ease: 'Sine.easeOut' },
            y: { value: cy, duration: 1500, ease: 'Sine.easeOut' },
            alpha: { value: 1, duration: 500, ease: 'Linear' },
            onComplete: () => {
                if (this.handCursor)
                {
                    this.handCursor.play('tapToStart');
                }
            }
        });
    }

    collisionCheck (event, bodyA, bodyB)
    {
        let ball = null;
        let top = null;
        let bottom = null;
        let left = null;
        let right = null;
        let netSprite = null;

        if (bodyA.label === 'ball')
        {
            ball = bodyA;
            top = (bodyB.label === 'top') ? bodyB : null;
            bottom = (bodyB.label === 'bottom') ? bodyB : null;
            left = (bodyB.label === 'left') ? bodyB : null;
            right = (bodyB.label === 'right') ? bodyB : null;
            netSprite = bodyB.parent.gameObject;
        }
        else if (bodyB.label === 'ball')
        {
            ball = bodyB;
            top = (bodyA.label === 'top') ? bodyA : null;
            bottom = (bodyA.label === 'bottom') ? bodyA : null;
            left = (bodyA.label === 'left') ? bodyA : null;
            right = (bodyA.label === 'right') ? bodyA : null;
            netSprite = bodyA.parent.gameObject;
        }

        const ballSprite = (ball) ? ball.gameObject : null;

        if (!ball || !ballSprite || !netSprite)
        {
            return;
        }

        const netID = netSprite.name;
        const hasScored = ballSprite.getData(`scored${netID}`);
        const hasMissed = ballSprite.getData(`missed${netID}`);
        const hitBottom = ballSprite.getData(`hitBottom${netID}`);
        const hitTop = ballSprite.getData(`hitTop${netID}`);
        const hitLeft = ballSprite.getData(`hitLeft${netID}`);
        const hitRight = ballSprite.getData(`hitRight${netID}`);

        if (hasScored || hasMissed)
        {
            return;
        }

        if (!hasScored && !hasMissed)
        {
            if (left)
            {
                // console.log(`ball ${ballSprite.name} hit left bumper`);
                ballSprite.setData(`hitLeft${netID}`, true);
            }
            else if (right)
            {
                // console.log(`ball ${ballSprite.name} hit right bumper`);
                ballSprite.setData(`hitRight${netID}`, true);
            }
        }

        if (top)
        {
            if (!hitBottom)
            {
                // Ball hit the top sensor BEFORE hitting the bottom sensor
                ballSprite.setData(`hitTop${netID}`, true);
            }
            else
            {
                // Ball hit the top sensor AFTER hitting the bottom sensor, so it's a miss
                ballSprite.setData(`missed${netID}`, true);
            }
        }
        else if (bottom)
        {
            if (!hitTop)
            {
                // Ball hit the bottom sensor BEFORE hitting the top sensor, so it's a miss
                ballSprite.setData(`missed${netID}`, true);
            }
            else
            {
                // Ball hit the bottom sensor AFTER hitting the top one, so they scored
                ballSprite.setData(`scored${netID}`, true);

                //  Check if they also hit the other net
                if ((netID === 1 && ballSprite.getData('scored2')) || (netID === 2 && ballSprite.getData('scored1')))
                {
                    this.registry.inc('score', 100);
                    this.launchScore('super-shot', netID);
                }
                else if (hitLeft && hitRight)
                {
                    this.registry.inc('score', 15);
                    this.launchScore('ricochet', netID);
                }
                else if (!hitLeft && !hitRight)
                {
                    this.registry.inc('score', 20);
                    this.launchScore('swish', netID);
                }
                else
                {
                    this.registry.inc('score', 10);
                    this.launchScore('shot', netID);
                }
            }
        }
    }

    launchScore (type, netID)
    {
        const x = this.view.right + 200;
        const cy = this.view.centerY;

        const image = this.add.image(x, cy, 'assets', type).setDepth(20);

        this.tweens.add({
            targets: image,
            x: { value: this.view.left - 300, duration: 1500, ease: 'sine.inout' },
            alpha: { value: 0, duration: 200, delay: 1000, ease: 'linear' },
            onComplete: () => {
                image.destroy();
            }
        });

        if (netID === 1)
        {
            this.basket1.pullNet();
        }
        else if (netID === 2)
        {
            this.basket2.pullNet();
        }

        //  Getting a super-shot unlocks ball designs
        if (type === 'super-shot')
        {
            if (!this.registry.get('ball2'))
            {
                this.registry.set('ball2', true);
            }
            else if (!this.registry.get('ball3'))
            {
                this.registry.set('ball3', true);
            }
            else if (!this.registry.get('ball4'))
            {
                this.registry.set('ball4', true);
            }
            else if (!this.registry.get('ball5'))
            {
                this.registry.set('ball5', true);
            }
            else if (!this.registry.get('ball6'))
            {
                this.registry.set('ball6', true);
            }

            this.sound.play('super-shot');
        }
        else if (type === 'ricochet')
        {
            this.sound.play('ricochet');
        }
        else
        {
            this.sound.play('net');
        }
    }

    update ()
    {
        if (this.pendingGameOver)
        {
            //  All balls finished
            let gameOver = true;

            for (let i = 0; i < this.balls.length; i++)
            {
                if (this.balls[i].active)
                {
                    gameOver = false;
                    return;
                }
            }

            if (gameOver)
            {
                this.scene.stop('GameBackground');
                this.scene.start('GameOver');
            }
        }
    }
}
