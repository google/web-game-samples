import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
    }

    async create ()
    {
        //  This will load our saved cloud data from the Playables API.

        //  We use the withTimeout wrapper to ensure that the loadData call doesn't hang indefinitely
        //  (which can happen often in the Test Suite if you're using a hot-reloaded setup)

        try
        {
            const data = await YouTubePlayables.withTimeout(YouTubePlayables.loadData(), 1000);

            //  You can also call: ytgame.game.loadData()

            //  'data' will contain the parsed JSON data from the Playables loadData call.
            //  You can now store it into the Phaser Registry, or elsewhere.
            //  Or it will be null/undefined if no data was present.

            console.log('loadData() result', data);

            this.registry.set('ball1', Phaser.Utils.Objects.GetFastValue(data, 'ball1', true));
            this.registry.set('ball2', Phaser.Utils.Objects.GetFastValue(data, 'ball2', false));
            this.registry.set('ball3', Phaser.Utils.Objects.GetFastValue(data, 'ball3', false));
            this.registry.set('ball4', Phaser.Utils.Objects.GetFastValue(data, 'ball4', false));
            this.registry.set('ball5', Phaser.Utils.Objects.GetFastValue(data, 'ball5', false));
            this.registry.set('ball6', Phaser.Utils.Objects.GetFastValue(data, 'ball6', false));

            this.registry.set('activeBall', Phaser.Utils.Objects.GetFastValue(data, 'activeBall', 'ball1'));
        }
        catch (error)
        {
            console.error(error);
        }

        //  We are now going to define our game pause and resume handlers.
        //  This is going to pause the entire Phaser game when the YouTube Playables API tells us to.

        YouTubePlayables.setOnPause(() => {

            console.log('YouTube Playables API has requested game pause');

            this.game.pause();

        });

        YouTubePlayables.setOnResume(() => {

            console.log('YouTube Playables API has requested game resume');

            this.game.resume();

        });

        this.scene.start('Preloader');
    }
}
