import { GridSnap } from '../GridSnap';
import Phaser from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';

export class UI extends Phaser.Scene
{
    constructor ()
    {
        super('UI');
    }

    init ()
    {
        this.gridSnap = new GridSnap(this);

        this.gridSnap.setPadding(8, 8);

        this.scene.bringToTop();
    }

    create ()
    {
        this.audioIcon = this.add.sprite(0, 0, 'assets', 'audio-off');

        this.ballIcon = this.add.sprite(0, 0, 'assets', 'ball1');

        this.ballCount = this.add.text(0, 0, '50', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'left'
        });

        this.gridSnap.addSprite(this.audioIcon, GridSnap.TOP_RIGHT, -8);
        this.gridSnap.addSprite(this.ballIcon, GridSnap.TOP_LEFT);
        this.gridSnap.addSprite(this.ballCount, GridSnap.TOP_LEFT, 80, 10);
        this.gridSnap.resize();

        //  If audio is enabled in the YouTube Player then enable it our game too.
        //  You can also call: ytgame.system.isAudioEnabled()

        if (YouTubePlayables.isAudioEnabled())
        {
            this.enableAudio();
        }
        else
        {
            this.disableAudio();
        }

        //  We will also respond to the YouTube Player muting / unmuting the audio.
        //  You can also call: ytgame.system.onAudioEnabledChange(callback)

        YouTubePlayables.setAudioChangeCallback((enabled) => {

            if (enabled)
            {
                this.enableAudio();
            }
            else
            {
                this.disableAudio();
            }

        });

        this.registry.events.on('changedata-shots', this.updateScore, this);
        this.registry.events.on('changedata-activeBall', this.updateBallIcon, this);
    }

    updateScore (parent, score)
    {
        this.ballCount.setText(score.toString());
    }

    updateBallIcon (parent, ball)
    {
        this.ballIcon.setFrame(ball);
    }

    enableAudio ()
    {
        this.sound.setMute(false);

        this.audioIcon.setFrame('audio-on');
    }

    disableAudio ()
    {
        this.sound.setMute(true);

        this.audioIcon.setFrame('audio-off');
    }
}
