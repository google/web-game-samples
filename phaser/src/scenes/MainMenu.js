import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.createLogos();
        this.createText();

        this.input.on('pointerdown', (pointer) => {

            this.scene.stop('Background');
            this.scene.start('Game');

        });

        //  Our game is now ready to be interacted with,
        //  so we have to notify the YouTube Playables API about this:
        YouTubePlayables.gameReady();

        //  You can also do this by calling:
        // ytgame?.game.gameReady();

        //  Launch our animated background Scene
        this.scene.launch('Background');

        //  Bring our UI Scene to the top
        this.scene.bringToTop('UI');
    }

    createLogos ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        const logo = this.add.image(view.centerX, 260, 'assets', 'game-logo');
        
        logo.preFX.addShine(0.8, 1, 5);

        this.add.image(view.centerX, view.centerY, 'assets', 'logo');

        this.add.image(view.centerX, view.centerY + 190, 'assets', 'youtube-logo');
    }

    async createText ()
    {
        const view = this.scale.getViewPort(this.cameras.main);

        const language = await YouTubePlayables.loadLanguage();

        const info = [
            `YouTube SDK: ${YouTubePlayables.version}`,
            `In Env: ${YouTubePlayables.inPlayablesEnv}`,
            `Language: ${language}`
        ];

        this.add.text(view.centerX, view.bottom - 150, info, {
            fontFamily: 'Arial Black', fontSize: 30, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
    }
}
