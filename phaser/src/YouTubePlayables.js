export const SDKErrorType = Object.freeze({
    UNKNOWN: 'UNKNOWN',
    API_UNAVAILABLE: 'API_UNAVAILABLE',
    INVALID_PARAMS: 'INVALID_PARAMS',
    SIZE_LIMIT_EXCEEDED: 'SIZE_LIMIT_EXCEEDED'
});

export const YouTubePlayables = {

    //  https://developers.google.com/youtube/gaming/playables/reference/sdk#sdk_version
    version: 'unloaded',

    //  https://developers.google.com/youtube/gaming/playables/reference/sdk#in_playables_env
    inPlayablesEnv: false,

    _ytgameRef: null,
    _firstFrameReady: false,
    _gameReady: false,
    _unsetAudioCallback: undefined,
    _language: 'unavailable',
    _data: null,

    boot: function (loadedCallback)
    {
        const callback = () => {

            if (window.ytgame)
            {
                this._ytgameRef = window.ytgame;
                this.version = this._ytgameRef.SDK_VERSION;
                this.inPlayablesEnv = this._ytgameRef.IN_PLAYABLES_ENV;
            }
            else
            {
                console.error('YouTube Playables SDK is not available.');
            }

            loadedCallback();

        };

        if (document.readyState === 'complete' || document.readyState === 'interactive')
        {
            callback();

            return;
        }

        const check = () =>
        {
            document.removeEventListener('DOMContentLoaded', check, true);
            window.removeEventListener('load', check, true);

            callback();
        };

        if (!document.body)
        {
            window.setTimeout(check, 20);
        }
        else
        {
            document.addEventListener('DOMContentLoaded', check, true);
            window.addEventListener('load', check, true);
        }
    },

    firstFrameReady: function ()
    {
        if (!this.isLoaded() || this._firstFrameReady)
        {
            return;
        }
        else
        {
            this._ytgameRef.game.firstFrameReady();

            this._firstFrameReady = true;
        }
    },

    gameReady: function ()
    {
        if (!this.isLoaded() || this._gameReady)
        {
            return;
        }

        if (!this._firstFrameReady)
        {
            console.error('gameReady called before firstFrameReady');

            return;
        }
        else
        {
            this._ytgameRef.game.gameReady();

            this._gameReady = true;
        }
    },

    isFirstFrameReady: function ()
    {
        return this._firstFrameReady;
    },

    isGameReady: function ()
    {
        return this._gameReady;
    },

    isLoaded: function ()
    {
        return (this._ytgameRef && this.inPlayablesEnv);
    },

    isReady: function ()
    {
        return (this.isLoaded() && this._firstFrameReady && this._gameReady);
    },

    sendScore: function (score)
    {
        if (this.isReady())
        {
            try
            {
                this._ytgameRef?.engagement.sendScore({ value: score });
            }
            catch (error)
            {
                if (error.errorType)
                {
                    this.handleError(error.errorType);
                }
            }
        }
    },

    setOnPause: function (callback)
    {
        if (this.isLoaded())
        {
            this._ytgameRef.system.onPause(callback);
        }
    },

    setOnResume: function (callback)
    {
        if (this.isLoaded())
        {
            this._ytgameRef.system.onResume(callback);
        }
    },

    loadData: function ()
    {
        return new Promise((resolve, reject) =>
        {
            if (this.isLoaded())
            {
                this._ytgameRef.game.loadData().then(rawdata => {

                    if (rawdata)
                    {
                        try
                        {
                            const data = JSON.parse(rawdata);

                            this._data = data;

                            resolve(data);
                        }
                        catch (error)
                        {
                            console.error('Failed to parse loadData');

                            this.logError();

                            reject(error);
                        }
                    }
                    else
                    {
                        resolve();
                    }

                }).catch(error => {

                    console.error('Failed to loadData');

                    if (error.errorType)
                    {
                        this.handleError(error.errorType);
                    }

                    this.logError();

                    reject(error);

                });
            }
            else
            {
                resolve();
            }

        });
    },

    hasLoneSurrogates: function (str)
    {
        //  Find lone high surrogates (D800-DBFF) not followed by a low surrogate (DC00-DFFF)
        const loneHighSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/;

        //  Find lone low surrogates (DC00-DFFF) not preceded by a high surrogate (D800-DBFF)
        const loneLowSurrogate = /(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

        return loneHighSurrogate.test(str) || loneLowSurrogate.test(str);
    },

    saveData: function (data)
    {
        return new Promise((resolve, reject) =>
        {
            if (this.isLoaded())
            {
                //  Serialize the object to JSON
                const jsonString = JSON.stringify(data);

                if (this.hasLoneSurrogates(jsonString))
                {
                    console.warn('Lone surrogates found in the JSON string');
                }

                //  Ensure the JSON string is a valid UTF-16 string by replacing lone surrogates
                const validUtf16String = jsonString.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');

                this._ytgameRef.game.saveData(validUtf16String).then(() => {

                    resolve(data);

                }).catch(error => {

                    console.error('Failed to saveData');

                    if (error.errorType)
                    {
                        this.handleError(error.errorType);
                    }

                    this.logError();

                    reject(error);

                });
            }
            else
            {
                resolve();
            }

        });
    },

    getData: function ()
    {
        return this._data;
    },

    loadLanguage: function ()
    {
        return new Promise((resolve, reject) =>
        {
            if (this.isLoaded())
            {
                this._ytgameRef.system.getLanguage().then(language => {

                    this._language = language;

                    resolve(language);

                }).catch(error => {

                    console.error('Failed to getLanguage');

                    this.logError();

                    reject(error);

                });
            }
            else
            {
                resolve(this._language);
            }
        });
    },

    getLanguage: function ()
    {
        return this._language;
    },

    isAudioEnabled: function ()
    {
        if (this.isLoaded())
        {
            return this._ytgameRef.system.isAudioEnabled();
        }
        else
        {
            return true;
        }
    },

    setAudioChangeCallback: function (callback)
    {
        if (this.isLoaded())
        {
            if (this._unsetAudioCallback)
            {
                this._unsetAudioCallback();
            }

            this._unsetAudioCallback = this._ytgameRef.system.onAudioEnabledChange(callback);
        }
    },

    unsetAudioChangeCallback: function ()
    {
        if (this.__unsetAudioCallback)
        {
            this._unsetAudioCallback();

            this._unsetAudioCallback = undefined;
        }
    },

    handleError: function (errorType)
    {
        let type = null;

        switch (errorType)
        {
            case SDKErrorType.UNKNOWN:
                console.error('The error is unknown.');
                type = SDKErrorType.UNKNOWN;
                break;
            case SDKErrorType.API_UNAVAILABLE:
                console.error('The API is temporarily unavailable. Please try again later.');
                type = SDKErrorType.API_UNAVAILABLE;
                break;
            case SDKErrorType.INVALID_PARAMS:
                console.error('The API was called with invalid parameters.');
                type = SDKErrorType.INVALID_PARAMS;
                break;
            case SDKErrorType.SIZE_LIMIT_EXCEEDED:
                console.error('The API was called with parameters exceeding the size limit.');
                type = SDKErrorType.SIZE_LIMIT_EXCEEDED;
                break;
            default:
                console.error('Unhandled error type.');
        }

        return type;
    },

    withTimeout: function (promise, timeout = 2000)
    {
        return new Promise((resolve, reject) =>
        {
            const timer = setTimeout(() =>
            {
                reject(new Error('Operation timed out'));
            }, timeout);

            promise
                .then(value =>
                {
                    clearTimeout(timer);
                    resolve(value);
                })
                .catch(err =>
                {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    },

    requestInterstitialAd: function()
    {
        if (this.isReady())
        {
            try
            {
                this._ytgameRef?.ads.requestInterstitialAd();
            }
            catch (error)
            {
                if (error.errorType)
                {
                    this.handleError(error.errorType);
                }
            }
        }
    }

};

