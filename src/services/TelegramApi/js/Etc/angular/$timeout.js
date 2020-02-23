
const timeout = (cb, t) => new Promise((resolve, reject) => {
    window.__timeoutID = setTimeout(() => {
        resolve(cb());
    }, t || 0);
});

timeout.cancel = (promise) => {
    if (!promise) {
        return;
    }

    clearTimeout(promise.__timeoutID);
};

export default timeout;
