import $rootScope from "./angular/$rootScope";
import $timeout from "./angular/$timeout";

export default class IdleManagerModule {

    toPromise = false;
    started = false;
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';

    constructor() {
        $rootScope.idle = { isIDLE: false };

        if (typeof document.hidden !== 'undefined') {
            // default
        } else if (typeof document.mozHidden !== 'undefined') {
            this.hidden = 'mozHidden';
            this.visibilityChange = 'mozvisibilitychange';
        } else if (typeof document.msHidden !== 'undefined') {
            this.hidden = 'msHidden';
            this.visibilityChange = 'msvisibilitychange';
        } else if (typeof document.webkitHidden !== 'undefined') {
            this.hidden = 'webkitHidden';
            this.visibilityChange = 'webkitvisibilitychange';
        }
    }

    start() {
        if (!this.started) {
            this.started = true;
            window.addEventListener(this.visibilityChange + ' blur focus keydown mousedown touchstart', this.onEvent);

            setTimeout(() => {
                this.onEvent({ type: 'blur' });
            }, 0);
        }
    }

    onEvent(e) {
        if (e.type == 'mousemove') {
            const e = e.originalEvent || e;
            if (e && e.movementX === 0 && e.movementY === 0) {
                return;
            }
            window.removeEventListener('mousemove', this.onEvent);
        }

        let isIDLE = e.type == 'blur' || e.type == 'timeout' ? true : false;
        if (this.hidden && document[this.hidden]) {
            isIDLE = true;
        }

        $timeout.cancel(this.toPromise);

        if (!isIDLE) {
            // console.log('update timeout');
            this.toPromise = $timeout(() => {
                this.onEvent({ type: 'timeout' });
            }, 30000);
        }

        if (isIDLE && e.type == 'timeout') {
            window.addEventListener('mousemove', this.onEvent);
        }
    }
}
