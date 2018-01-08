define([
    'bluebird',
    'kb_common/html',
    './host/iframeMessages',
    'bootstrap'
], function(
    Promise,
    html,
    IframeMessages
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        iframe = t('iframe');

    function factory(config) {
        var container,
            runtime = config.runtime,
            hostOrigin = getOrigin(),
            iframeOrigin = getOrigin(),
            iframeMessages = IframeMessages.makeHost({
                root: window,
                name: 'panel'
            });


        // VIEW

        //        function updateStats() {
        //            var stats = iframeMessages.stats(),
        //                content = table({class: 'table table-striped'}, [
        //                    Object.keys(stats).map(function (key) {
        //                        return tr([th(key), td(String(stats[key]))]);
        //                    })
        //                ]);
        //            container.querySelector('[data-element="stats"]').innerHTML = content;
        //        }

        function getOrigin() {
            return document.location.origin;
        }

        function makeIframe() {
            var frameNumber = html.genId(),
                frameId = 'frame_' + frameNumber,
                iframeIndex = '/modules/plugins/example-trr/iframe_root/index.html',
                iframeUrl = iframeOrigin + iframeIndex,
                content = div({
                    style: {
                        padding: '10px'
                    }
                }, [
                    // div({dataElement: 'stats'}),
                    iframe({
                        dataFrame: 'frame_' + frameNumber,
                        dataParams: encodeURIComponent(JSON.stringify({
                            parentHost: hostOrigin,
                            frameId: 'frame_' + frameNumber
                        })),
                        style: {
                            width: '100%',
                            height: 'auto'
                        },
                        frameborder: 0,
                        scrolling: 'no',
                        src: iframeUrl
                    })
                ]);
            return {
                parentHost: hostOrigin,
                host: iframeOrigin,
                frameNumber: frameNumber,
                frameId: frameId,
                content: content
            };
        }

        // API

        function attach(node) {
            return Promise.try(function() {
                container = node;
            });
        }

        function start(params) {
            return Promise.try(function() {
                var embeddedIframe = makeIframe();

                runtime.send('ui', 'setTitle', 'Example - Typescript React Redux');

                container.innerHTML = embeddedIframe.content;

                iframeMessages.start();

                iframeMessages.listen({
                    name: 'ready',
                    handler: function(message) {
                        console.log('got ready message...', message);
                        if (message.frameId !== embeddedIframe.frameId) {
                            console.error('Unexpected "ready"', message, message.frameId, embeddedIframe.frameId);
                            return;
                        }

                        iframeMessages.addPartner({
                            name: message.frameId,
                            host: embeddedIframe.host,
                            window: container.querySelector('[data-frame="frame_' + embeddedIframe.frameNumber + '"]').contentWindow
                        });

                        // updateStats();

                        iframeMessages.send(message.from, {
                            name: 'start'
                        });
                    }
                });

                iframeMessages.listen({
                    name: 'rendered',
                    handler: function(message) {
                        var height = message.height,
                            iframe = container.querySelector('[data-frame="frame_' + embeddedIframe.frameNumber + '"]');
                        iframe.style.height = height + 'px';
                    }
                });

                iframeMessages.listen({
                    name: 'authStatus',
                    handler: function(message) {
                        iframeMessages.send(message.from, {
                            name: 'authInfo',
                            id: message.id,
                            token: runtime.service('session').getAuthToken(),
                            username: runtime.service('session').getUsername()
                        });
                    }
                });

                iframeMessages.listen({
                    name: 'configProperty',
                    handler: function(message) {
                        iframeMessages.send(message.from, {
                            name: 'config',
                            id: message.id,
                            value: runtime.config(message.property)
                        });
                    }
                });

                iframeMessages.listen({
                    name: 'config',
                    handler: function(message) {
                        iframeMessages.send(message.from, {
                            name: 'config',
                            id: message.id,
                            value: runtime.rawConfig()
                        });
                    }
                });

                // updateStats();
            });
        }

        function stop() {
            return Promise.try(function() {
                iframeMessages.stop();
                container.innerHTML = '';
            });
        }

        return {
            attach: attach,
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});