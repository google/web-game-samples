import { Scene } from 'phaser';

export class Background extends Scene
{
    constructor ()
    {
        super('Background');
    }

    create ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        this.bg = this.add.image(0, 0, 'background');

        this.bg.setOrigin(0, 0);
        this.bg.setDisplaySize(view.width, view.height);

        this.ts = this.add.tileSprite(0, 0, view.width, view.height, 'assets', 'tile');
        this.ts.setOrigin(0, 0);

        this.scale.on('resize', this.resize, this);
    }

    update ()
    {
        this.ts.tilePositionX -= 2;
    }

    resize ()
    {
        const view = this.scale.getViewPort();

        this.bg.setDisplaySize(view.width, view.height);
        this.ts.setDisplaySize(view.width, view.height);
    }
}
