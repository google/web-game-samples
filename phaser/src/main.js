import { Background } from './scenes/Background';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameBackground } from './scenes/GameBackground';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { UI } from './scenes/UI';
import { YouTubePlayables } from './YouTubePlayables';

//  Calling YouTubePlayables.boot will wait until the document has loaded
//  and the YouTube Playables API is ready before calling the callback function.

YouTubePlayables.boot(() => {

    //  Find out more information about the Game Config at:
    //  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig

    new Phaser.Game({
        type: Phaser.AUTO,
        width: 820,
        height: 1180,
        parent: 'gameParent',
        scale: {
            mode: Phaser.Scale.EXPAND
        },
        physics: {
            default: 'matter',
            matter: {
                positionIterations: 12,
                velocityIterations: 8,
                gravity: {
                    y: 1.6
                },
                debug: false
            }
        },
        scene: [
            Boot,
            Preloader,
            Background,
            MainMenu,
            Game,
            GameBackground,
            GameOver,
            UI
        ]
    });

});
