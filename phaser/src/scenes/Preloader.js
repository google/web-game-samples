import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.createLoadingBar();

        //  Now we have displayed all of our loader graphics, we need to tell the YouTube Playables API that we are first-frame ready:
        YouTubePlayables.firstFrameReady();

        //  You can also do this by calling:
        // ytgame?.game.firstFrameReady();
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('gameBackground', 'game-background.png');
        this.load.image('basket', 'basket.png');
        this.load.atlas('assets', 'basket-shoot-out.png', 'basket-shoot-out.json');
        this.load.spritesheet('hands', 'hands.png', { frameWidth: 190, frameHeight: 300 });

        //  Audio from:
        //  https://opengameart.org/content/sfxthrow
        //  https://opengameart.org/content/inventory-sound-effects
        //  https://opengameart.org/content/85-short-music-jingles
        //  https://opengameart.org/content/magic-sfx-sample
        this.load.setPath('assets/fx');
        this.load.audio('throw', [ 'throw.wav', 'throw.mp3' ]);
        this.load.audio('net', [ 'net.wav',' net.mp3' ]);
        this.load.audio('ricochet', [ 'ricochet.wav', 'ricochet.mp3' ]);
        this.load.audio('super-shot', [ 'super-shot.wav', 'super-shot.mp3' ]);
        this.load.audio('next-stage', [ 'next-stage.wav', 'next-stage.mp3' ]);
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        this.anims.create({
            key: 'tapToStart',
            frames: this.anims.generateFrameNumbers('hands', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1,
            repeatDelay: 500
        });

        //  Launch our UI Scene
        this.scene.launch('UI');

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }

    createLoadingBar ()
    {
        const width = this.scale.width;
        const height = this.scale.height;

        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

        const cx = width / 2;
        const cy = height / 2;

        const barOuterWidth = width * 0.70;
        const barWidth = barOuterWidth - 4;

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(cx, cy, barOuterWidth, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(cx - (barWidth / 2) + 2, cy, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = barWidth * progress;

        });
    }
}
