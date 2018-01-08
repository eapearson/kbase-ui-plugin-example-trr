import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
// import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { KBase } from './kbase/iframe-kbase-integration';
import { Message } from './kbase/iframe-messages';

var kbase = new KBase();
kbase.go();

kbase.messageManager.listen({
  name: 'start',
  handler: function (message : Message) {
      kbase.start(message)
        .then( () => {
            console.log('do something with...', kbase.username);
            ReactDOM.render(
              <App />,
              document.getElementById('root') as HTMLElement
            );
        })
        .catch( (err) => {
            console.error('ERORR', err);
        });
  }
});


// registerServiceWorker();
