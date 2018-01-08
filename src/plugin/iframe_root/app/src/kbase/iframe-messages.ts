interface Listener {
    name: string;
    handler: Function
}

export interface Message {
    id: string;
    name: string
    from: string,
    // data: Map<String, MessagePayload>
}

export interface ReadyMessage extends Message {
    frameId: string
}

// export interface MessagePayload {

// }

export class IFrameMessages {
    lastId: number;
    sentCount: number;
    receivedCount: number;
    name: string;
    root: Window;
    partners: Map<String, any>;
    listeners: Map<String, Array<Listener>>;
    awaitingResponse: Map<String, any>;
    id: number;

    constructor(root: Window, name: string) {
        this.root = root;
        this.name = name;

        this.partners = new Map();
        this.listeners = new Map();
        this.awaitingResponse = new Map();
        this.id = new Date().getTime();
    }

    start() {
        this.root.addEventListener('message', event => {
            this.receive(event);
        }, false);
    }

    genId() {
        this.lastId += 1;
        return 'msg_' + String(this.lastId);
    }

    addPartner(config:any) {
        this.partners.set(config.name, config);
    }

    listen(listener : Listener) {
        if (!this.listeners.has(listener.name)) {
            this.listeners.set(listener.name, []);
        }
        let l = this.listeners.get(listener.name)
        if (!l) {
            return;
        }
        l.push(listener);
    }

    receive(event : MessageEvent) {
        var 
            // origin = event.origin,
            message = event.data,
            // listener, 
            response;
        
        this.receivedCount += 1;
        
        if (message.id && this.awaitingResponse.has(message.id)) {
            try {
                response = this.awaitingResponse.get(message.id);
                this.awaitingResponse.delete(message.id);
                response.handler(message, event);
                return;
            } catch (ex) {
                console.error('Error handling response for message ', message, ex);
            }
        }

        if (this.listeners.get(message.name)) {
            let m = this.listeners.get(message.name);
            if (!m) {
                return;
            }
            m.forEach(function (listener) {
                try {
                    listener.handler(message);
                    return;
                } catch (ex) {
                    console.error('Error handling listener for message ', message, ex);
                }
            });
        }
    }

     getPartner(name:string) {
        if (!this.partners.has(name)) {
            throw new Error('Partner ' + name + ' not registered');
        }
        return this.partners.get(name); 
    }

    send(partnerName : string, message : Message) {
        var partner = this.getPartner(partnerName);
        message.from = this.name;
        this.sentCount += 1;
        partner.window.postMessage(message, partner.host);
    }

    sendRequest(partnerName : string, message : Message, handler : Function) {
        var id = this.genId();
        message.id = id;
        this.awaitingResponse.set(id, {
            started: new Date(),
            handler: handler
        });
        this.send(partnerName, message);
    }

    request(partnerName:string, message:Message) {
        return new Promise( (resolve, reject) => {
            this.sendRequest(partnerName, message, function (response:Message) {
                resolve(response);
            });
        });
    }

}