import {IFrameMessages, Message, ReadyMessage} from './iframe-messages';
// import {IFrameHeightNotifier} from './iframe-height-notifier';
// import {Launcher} from '../app/main';

interface Params {
    frameId: string,
    parentHost: string
}

interface AuthStatus {
    token: string,
    username: string
}

export class KBase {
    mainNode: Node;
    params: Params;
    messageManager: IFrameMessages;
    token: string;
    username: string;
    config: any;
    // appLauncher: Launcher;
    // iframeHeightNotifier: IFrameHeightNotifier;

    constructor() {
        this.getParams();
        this.messageManager = new IFrameMessages(
            window,
            this.params.frameId
        );
        // this.appLauncher = new Launcher();
    }

    getParams() {
        if (!window.frameElement.hasAttribute('data-params')) {
            return;
        }
        let params = window.frameElement.getAttribute('data-params');
        var paramsJSON : string;
        if (params === null) {
            paramsJSON = '{}';
        } else {
            paramsJSON = decodeURIComponent(params);
        }

        this.params = <Params>JSON.parse(paramsJSON);
    }

    /* for now, emulate the quick hack */
    start(message:any) {
        return this.messageManager.request('parent', {
            id: 'someid',
            from: 'me',
            name: 'authStatus'
        })
        .then( (authStatus: AuthStatus) => {
            console.log('got auth status...', authStatus);
            this.token = authStatus.token;
            this.username = authStatus.username;
            return this.messageManager.request('parent', {
                id: 'someid',
                from: 'me',
                name: 'config'
            });
        })
        .then( (result:any) => {
            console.log('got config...', result);
            this.config = result.value;
            // I wish this would work...
            // return this.appLauncher.launch({
            //     token: KBase.token,
            //     username: KBase.username,
            //     config: KBase.config
            // });
        });
        // .then( () => {
        //     this.iframeHeightNotifier = new IFrameHeightNotifier({
        //         interval: 200,
        //         messageManager: this.messageManager,
        //         nodeGetter: function () {
        //             return document.querySelector('md-sidenav-layout .content');
        //         }
        //     });
        //     return this.iframeHeightNotifier.start();
        // })
        // .catch( (err) => {
        //     console.error('ERORR', err);
        // })
    }

    stop(message:any) {
    }

    go() {
        this.messageManager.start();

        var self = this;

        this.messageManager.addPartner({
            name: 'parent',
            window: window.parent,
            host: self.params.parentHost
        });

        // this.messageManager.listen({
        //     name: 'start',
        //     handler: function (message:Message) {
        //         self.start(message)
        //         .then( () => {
        //             console.log('do something...', this.messageManager.username);
        //         }
        //         .catch( (err) => {
        //             console.error('ERORR', err);
        //         })
        //     }
        // });

        this.messageManager.listen({
            name: 'stop',
            handler: function (message:Message) {
                self.stop(message);
            }
        });

        console.log('sending ready to parent!');
        this.messageManager.send('parent', <ReadyMessage>{
            name: 'ready',
            frameId: self.params.frameId
        });

    }
}