
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const country = writable('');
    const focused = writable('');
    const code = writable('');
    const password = writable('');
    const name = writable('');
    const lastName = writable('');

    const hideCountryPopup = derived(focused, $focused => $focused !== 'country');

    const updatePhone = text => {
        const newText = text.replace(/\D/g, '').slice(0, 15);
        const idx = Math.max(newText.length - 10, 1);
        const code = newText.slice(0, idx);
        const number = newText.slice(idx);
        if (number.length >= 9) {
            return `+${code} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8)}`;
        }
        if (number.length >= 7) {
            return `+${code} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
        }
        if (number.length >= 5) {
            return `+${code} ${number.slice(0, 3)} ${number.slice(3)}`;
        }
        if (number.length >= 1) {
            return `+${code} ${number.slice(0)}`;
        }
        return `+${code}`;
    };

    const createPhone = () => {
        const { subscribe, set } = writable('');

    	return {
    		subscribe,
            reset: () => set(''),
            set: (value) => set(updatePhone(value))
    	};
    };

    const phone = createPhone();
    const hideSubmit = derived(phone, $phone => $phone.length < 10);

    var countrylist = [
    	{
    		name: "Afghanistan",
    		code: "93",
    		alpha: "AF"
    	},
    	{
    		name: "Åland Islands",
    		code: "358",
    		alpha: "AX"
    	},
    	{
    		name: "Albania",
    		code: "355",
    		alpha: "AL"
    	},
    	{
    		name: "Algeria",
    		code: "213",
    		alpha: "DZ"
    	},
    	{
    		name: "American Samoa",
    		code: "1684",
    		alpha: "AS"
    	},
    	{
    		name: "Andorra",
    		code: "376",
    		alpha: "AD"
    	},
    	{
    		name: "Angola",
    		code: "244",
    		alpha: "AO"
    	},
    	{
    		name: "Anguilla",
    		code: "1264",
    		alpha: "AI"
    	},
    	{
    		name: "Antarctica",
    		code: "672",
    		alpha: "AQ"
    	},
    	{
    		name: "Antigua and Barbuda",
    		code: "1268",
    		alpha: "AG"
    	},
    	{
    		name: "Argentina",
    		code: "54",
    		alpha: "AR"
    	},
    	{
    		name: "Armenia",
    		code: "374",
    		alpha: "AM"
    	},
    	{
    		name: "Aruba",
    		code: "297",
    		alpha: "AW"
    	},
    	{
    		name: "Australia",
    		code: "61",
    		alpha: "AU"
    	},
    	{
    		name: "Austria",
    		code: "43",
    		alpha: "AT"
    	},
    	{
    		name: "Azerbaijan",
    		code: "994",
    		alpha: "AZ"
    	},
    	{
    		name: "Bahamas",
    		code: "1242",
    		alpha: "BS"
    	},
    	{
    		name: "Bahrain",
    		code: "973",
    		alpha: "BH"
    	},
    	{
    		name: "Bangladesh",
    		code: "880",
    		alpha: "BD"
    	},
    	{
    		name: "Barbados",
    		code: "1246",
    		alpha: "BB"
    	},
    	{
    		name: "Belarus",
    		code: "375",
    		alpha: "BY"
    	},
    	{
    		name: "Belgium",
    		code: "32",
    		alpha: "BE"
    	},
    	{
    		name: "Belize",
    		code: "501",
    		alpha: "BZ"
    	},
    	{
    		name: "Benin",
    		code: "229",
    		alpha: "BJ"
    	},
    	{
    		name: "Bermuda",
    		code: "1441",
    		alpha: "BM"
    	},
    	{
    		name: "Bhutan",
    		code: "975",
    		alpha: "BT"
    	},
    	{
    		name: "Bolivia (Plurinational State of)",
    		code: "591",
    		alpha: "BO"
    	},
    	{
    		name: "Bonaire, Sint Eustatius and Saba",
    		code: "5997",
    		alpha: "BQ"
    	},
    	{
    		name: "Bosnia and Herzegovina",
    		code: "387",
    		alpha: "BA"
    	},
    	{
    		name: "Botswana",
    		code: "267",
    		alpha: "BW"
    	},
    	{
    		name: "Bouvet Island",
    		code: "",
    		alpha: "BV"
    	},
    	{
    		name: "Brazil",
    		code: "55",
    		alpha: "BR"
    	},
    	{
    		name: "British Indian Ocean Territory",
    		code: "246",
    		alpha: "IO"
    	},
    	{
    		name: "United States Minor Outlying Islands",
    		code: "",
    		alpha: "UM"
    	},
    	{
    		name: "Virgin Islands (British)",
    		code: "1284",
    		alpha: "VG"
    	},
    	{
    		name: "Virgin Islands (U.S.)",
    		code: "1 340",
    		alpha: "VI"
    	},
    	{
    		name: "Brunei Darussalam",
    		code: "673",
    		alpha: "BN"
    	},
    	{
    		name: "Bulgaria",
    		code: "359",
    		alpha: "BG"
    	},
    	{
    		name: "Burkina Faso",
    		code: "226",
    		alpha: "BF"
    	},
    	{
    		name: "Burundi",
    		code: "257",
    		alpha: "BI"
    	},
    	{
    		name: "Cambodia",
    		code: "855",
    		alpha: "KH"
    	},
    	{
    		name: "Cameroon",
    		code: "237",
    		alpha: "CM"
    	},
    	{
    		name: "Canada",
    		code: "1",
    		alpha: "CA"
    	},
    	{
    		name: "Cabo Verde",
    		code: "238",
    		alpha: "CV"
    	},
    	{
    		name: "Cayman Islands",
    		code: "1345",
    		alpha: "KY"
    	},
    	{
    		name: "Central African Republic",
    		code: "236",
    		alpha: "CF"
    	},
    	{
    		name: "Chad",
    		code: "235",
    		alpha: "TD"
    	},
    	{
    		name: "Chile",
    		code: "56",
    		alpha: "CL"
    	},
    	{
    		name: "China",
    		code: "86",
    		alpha: "CN"
    	},
    	{
    		name: "Christmas Island",
    		code: "61",
    		alpha: "CX"
    	},
    	{
    		name: "Cocos (Keeling) Islands",
    		code: "61",
    		alpha: "CC"
    	},
    	{
    		name: "Colombia",
    		code: "57",
    		alpha: "CO"
    	},
    	{
    		name: "Comoros",
    		code: "269",
    		alpha: "KM"
    	},
    	{
    		name: "Congo",
    		code: "242",
    		alpha: "CG"
    	},
    	{
    		name: "Congo (Democratic Republic of the)",
    		code: "243",
    		alpha: "CD"
    	},
    	{
    		name: "Cook Islands",
    		code: "682",
    		alpha: "CK"
    	},
    	{
    		name: "Costa Rica",
    		code: "506",
    		alpha: "CR"
    	},
    	{
    		name: "Croatia",
    		code: "385",
    		alpha: "HR"
    	},
    	{
    		name: "Cuba",
    		code: "53",
    		alpha: "CU"
    	},
    	{
    		name: "Curaçao",
    		code: "599",
    		alpha: "CW"
    	},
    	{
    		name: "Cyprus",
    		code: "357",
    		alpha: "CY"
    	},
    	{
    		name: "Czech Republic",
    		code: "420",
    		alpha: "CZ"
    	},
    	{
    		name: "Denmark",
    		code: "45",
    		alpha: "DK"
    	},
    	{
    		name: "Djibouti",
    		code: "253",
    		alpha: "DJ"
    	},
    	{
    		name: "Dominica",
    		code: "1767",
    		alpha: "DM"
    	},
    	{
    		name: "Dominican Republic",
    		code: "1809",
    		alpha: "DO"
    	},
    	{
    		name: "Ecuador",
    		code: "593",
    		alpha: "EC"
    	},
    	{
    		name: "Egypt",
    		code: "20",
    		alpha: "EG"
    	},
    	{
    		name: "El Salvador",
    		code: "503",
    		alpha: "SV"
    	},
    	{
    		name: "Equatorial Guinea",
    		code: "240",
    		alpha: "GQ"
    	},
    	{
    		name: "Eritrea",
    		code: "291",
    		alpha: "ER"
    	},
    	{
    		name: "Estonia",
    		code: "372",
    		alpha: "EE"
    	},
    	{
    		name: "Ethiopia",
    		code: "251",
    		alpha: "ET"
    	},
    	{
    		name: "Falkland Islands (Malvinas)",
    		code: "500",
    		alpha: "FK"
    	},
    	{
    		name: "Faroe Islands",
    		code: "298",
    		alpha: "FO"
    	},
    	{
    		name: "Fiji",
    		code: "679",
    		alpha: "FJ"
    	},
    	{
    		name: "Finland",
    		code: "358",
    		alpha: "FI"
    	},
    	{
    		name: "France",
    		code: "33",
    		alpha: "FR"
    	},
    	{
    		name: "French Guiana",
    		code: "594",
    		alpha: "GF"
    	},
    	{
    		name: "French Polynesia",
    		code: "689",
    		alpha: "PF"
    	},
    	{
    		name: "French Southern Territories",
    		code: "",
    		alpha: "TF"
    	},
    	{
    		name: "Gabon",
    		code: "241",
    		alpha: "GA"
    	},
    	{
    		name: "Gambia",
    		code: "220",
    		alpha: "GM"
    	},
    	{
    		name: "Georgia",
    		code: "995",
    		alpha: "GE"
    	},
    	{
    		name: "Germany",
    		code: "49",
    		alpha: "DE"
    	},
    	{
    		name: "Ghana",
    		code: "233",
    		alpha: "GH"
    	},
    	{
    		name: "Gibraltar",
    		code: "350",
    		alpha: "GI"
    	},
    	{
    		name: "Greece",
    		code: "30",
    		alpha: "GR"
    	},
    	{
    		name: "Greenland",
    		code: "299",
    		alpha: "GL"
    	},
    	{
    		name: "Grenada",
    		code: "1473",
    		alpha: "GD"
    	},
    	{
    		name: "Guadeloupe",
    		code: "590",
    		alpha: "GP"
    	},
    	{
    		name: "Guam",
    		code: "1671",
    		alpha: "GU"
    	},
    	{
    		name: "Guatemala",
    		code: "502",
    		alpha: "GT"
    	},
    	{
    		name: "Guernsey",
    		code: "44",
    		alpha: "GG"
    	},
    	{
    		name: "Guinea",
    		code: "224",
    		alpha: "GN"
    	},
    	{
    		name: "Guinea-Bissau",
    		code: "245",
    		alpha: "GW"
    	},
    	{
    		name: "Guyana",
    		code: "592",
    		alpha: "GY"
    	},
    	{
    		name: "Haiti",
    		code: "509",
    		alpha: "HT"
    	},
    	{
    		name: "Heard Island and McDonald Islands",
    		code: "",
    		alpha: "HM"
    	},
    	{
    		name: "Holy See",
    		code: "379",
    		alpha: "VA"
    	},
    	{
    		name: "Honduras",
    		code: "504",
    		alpha: "HN"
    	},
    	{
    		name: "Hong Kong",
    		code: "852",
    		alpha: "HK"
    	},
    	{
    		name: "Hungary",
    		code: "36",
    		alpha: "HU"
    	},
    	{
    		name: "Iceland",
    		code: "354",
    		alpha: "IS"
    	},
    	{
    		name: "India",
    		code: "91",
    		alpha: "IN"
    	},
    	{
    		name: "Indonesia",
    		code: "62",
    		alpha: "ID"
    	},
    	{
    		name: "Côte d'Ivoire",
    		code: "225",
    		alpha: "CI"
    	},
    	{
    		name: "Iran (Islamic Republic of)",
    		code: "98",
    		alpha: "IR"
    	},
    	{
    		name: "Iraq",
    		code: "964",
    		alpha: "IQ"
    	},
    	{
    		name: "Ireland",
    		code: "353",
    		alpha: "IE"
    	},
    	{
    		name: "Isle of Man",
    		code: "44",
    		alpha: "IM"
    	},
    	{
    		name: "Israel",
    		code: "972",
    		alpha: "IL"
    	},
    	{
    		name: "Italy",
    		code: "39",
    		alpha: "IT"
    	},
    	{
    		name: "Jamaica",
    		code: "1876",
    		alpha: "JM"
    	},
    	{
    		name: "Japan",
    		code: "81",
    		alpha: "JP"
    	},
    	{
    		name: "Jersey",
    		code: "44",
    		alpha: "JE"
    	},
    	{
    		name: "Jordan",
    		code: "962",
    		alpha: "JO"
    	},
    	{
    		name: "Kazakhstan",
    		code: "76",
    		alpha: "KZ"
    	},
    	{
    		name: "Kenya",
    		code: "254",
    		alpha: "KE"
    	},
    	{
    		name: "Kiribati",
    		code: "686",
    		alpha: "KI"
    	},
    	{
    		name: "Kuwait",
    		code: "965",
    		alpha: "KW"
    	},
    	{
    		name: "Kyrgyzstan",
    		code: "996",
    		alpha: "KG"
    	},
    	{
    		name: "Lao People's Democratic Republic",
    		code: "856",
    		alpha: "LA"
    	},
    	{
    		name: "Latvia",
    		code: "371",
    		alpha: "LV"
    	},
    	{
    		name: "Lebanon",
    		code: "961",
    		alpha: "LB"
    	},
    	{
    		name: "Lesotho",
    		code: "266",
    		alpha: "LS"
    	},
    	{
    		name: "Liberia",
    		code: "231",
    		alpha: "LR"
    	},
    	{
    		name: "Libya",
    		code: "218",
    		alpha: "LY"
    	},
    	{
    		name: "Liechtenstein",
    		code: "423",
    		alpha: "LI"
    	},
    	{
    		name: "Lithuania",
    		code: "370",
    		alpha: "LT"
    	},
    	{
    		name: "Luxembourg",
    		code: "352",
    		alpha: "LU"
    	},
    	{
    		name: "Macao",
    		code: "853",
    		alpha: "MO"
    	},
    	{
    		name: "Macedonia (the former Yugoslav Republic of)",
    		code: "389",
    		alpha: "MK"
    	},
    	{
    		name: "Madagascar",
    		code: "261",
    		alpha: "MG"
    	},
    	{
    		name: "Malawi",
    		code: "265",
    		alpha: "MW"
    	},
    	{
    		name: "Malaysia",
    		code: "60",
    		alpha: "MY"
    	},
    	{
    		name: "Maldives",
    		code: "960",
    		alpha: "MV"
    	},
    	{
    		name: "Mali",
    		code: "223",
    		alpha: "ML"
    	},
    	{
    		name: "Malta",
    		code: "356",
    		alpha: "MT"
    	},
    	{
    		name: "Marshall Islands",
    		code: "692",
    		alpha: "MH"
    	},
    	{
    		name: "Martinique",
    		code: "596",
    		alpha: "MQ"
    	},
    	{
    		name: "Mauritania",
    		code: "222",
    		alpha: "MR"
    	},
    	{
    		name: "Mauritius",
    		code: "230",
    		alpha: "MU"
    	},
    	{
    		name: "Mayotte",
    		code: "262",
    		alpha: "YT"
    	},
    	{
    		name: "Mexico",
    		code: "52",
    		alpha: "MX"
    	},
    	{
    		name: "Micronesia (Federated States of)",
    		code: "691",
    		alpha: "FM"
    	},
    	{
    		name: "Moldova (Republic of)",
    		code: "373",
    		alpha: "MD"
    	},
    	{
    		name: "Monaco",
    		code: "377",
    		alpha: "MC"
    	},
    	{
    		name: "Mongolia",
    		code: "976",
    		alpha: "MN"
    	},
    	{
    		name: "Montenegro",
    		code: "382",
    		alpha: "ME"
    	},
    	{
    		name: "Montserrat",
    		code: "1664",
    		alpha: "MS"
    	},
    	{
    		name: "Morocco",
    		code: "212",
    		alpha: "MA"
    	},
    	{
    		name: "Mozambique",
    		code: "258",
    		alpha: "MZ"
    	},
    	{
    		name: "Myanmar",
    		code: "95",
    		alpha: "MM"
    	},
    	{
    		name: "Namibia",
    		code: "264",
    		alpha: "NA"
    	},
    	{
    		name: "Nauru",
    		code: "674",
    		alpha: "NR"
    	},
    	{
    		name: "Nepal",
    		code: "977",
    		alpha: "NP"
    	},
    	{
    		name: "Netherlands",
    		code: "31",
    		alpha: "NL"
    	},
    	{
    		name: "New Caledonia",
    		code: "687",
    		alpha: "NC"
    	},
    	{
    		name: "New Zealand",
    		code: "64",
    		alpha: "NZ"
    	},
    	{
    		name: "Nicaragua",
    		code: "505",
    		alpha: "NI"
    	},
    	{
    		name: "Niger",
    		code: "227",
    		alpha: "NE"
    	},
    	{
    		name: "Nigeria",
    		code: "234",
    		alpha: "NG"
    	},
    	{
    		name: "Niue",
    		code: "683",
    		alpha: "NU"
    	},
    	{
    		name: "Norfolk Island",
    		code: "672",
    		alpha: "NF"
    	},
    	{
    		name: "Korea (Democratic People's Republic of)",
    		code: "850",
    		alpha: "KP"
    	},
    	{
    		name: "Northern Mariana Islands",
    		code: "1670",
    		alpha: "MP"
    	},
    	{
    		name: "Norway",
    		code: "47",
    		alpha: "NO"
    	},
    	{
    		name: "Oman",
    		code: "968",
    		alpha: "OM"
    	},
    	{
    		name: "Pakistan",
    		code: "92",
    		alpha: "PK"
    	},
    	{
    		name: "Palau",
    		code: "680",
    		alpha: "PW"
    	},
    	{
    		name: "Palestine, State of",
    		code: "970",
    		alpha: "PS"
    	},
    	{
    		name: "Panama",
    		code: "507",
    		alpha: "PA"
    	},
    	{
    		name: "Papua New Guinea",
    		code: "675",
    		alpha: "PG"
    	},
    	{
    		name: "Paraguay",
    		code: "595",
    		alpha: "PY"
    	},
    	{
    		name: "Peru",
    		code: "51",
    		alpha: "PE"
    	},
    	{
    		name: "Philippines",
    		code: "63",
    		alpha: "PH"
    	},
    	{
    		name: "Pitcairn",
    		code: "64",
    		alpha: "PN"
    	},
    	{
    		name: "Poland",
    		code: "48",
    		alpha: "PL"
    	},
    	{
    		name: "Portugal",
    		code: "351",
    		alpha: "PT"
    	},
    	{
    		name: "Puerto Rico",
    		code: "1787",
    		alpha: "PR"
    	},
    	{
    		name: "Qatar",
    		code: "974",
    		alpha: "QA"
    	},
    	{
    		name: "Republic of Kosovo",
    		code: "383",
    		alpha: "XK"
    	},
    	{
    		name: "Réunion",
    		code: "262",
    		alpha: "RE"
    	},
    	{
    		name: "Romania",
    		code: "40",
    		alpha: "RO"
    	},
    	{
    		name: "Russian Federation",
    		code: "7",
    		alpha: "RU"
    	},
    	{
    		name: "Rwanda",
    		code: "250",
    		alpha: "RW"
    	},
    	{
    		name: "Saint Barthélemy",
    		code: "590",
    		alpha: "BL"
    	},
    	{
    		name: "Saint Helena, Ascension and Tristan da Cunha",
    		code: "290",
    		alpha: "SH"
    	},
    	{
    		name: "Saint Kitts and Nevis",
    		code: "1869",
    		alpha: "KN"
    	},
    	{
    		name: "Saint Lucia",
    		code: "1758",
    		alpha: "LC"
    	},
    	{
    		name: "Saint Martin (French part)",
    		code: "590",
    		alpha: "MF"
    	},
    	{
    		name: "Saint Pierre and Miquelon",
    		code: "508",
    		alpha: "PM"
    	},
    	{
    		name: "Saint Vincent and the Grenadines",
    		code: "1784",
    		alpha: "VC"
    	},
    	{
    		name: "Samoa",
    		code: "685",
    		alpha: "WS"
    	},
    	{
    		name: "San Marino",
    		code: "378",
    		alpha: "SM"
    	},
    	{
    		name: "Sao Tome and Principe",
    		code: "239",
    		alpha: "ST"
    	},
    	{
    		name: "Saudi Arabia",
    		code: "966",
    		alpha: "SA"
    	},
    	{
    		name: "Senegal",
    		code: "221",
    		alpha: "SN"
    	},
    	{
    		name: "Serbia",
    		code: "381",
    		alpha: "RS"
    	},
    	{
    		name: "Seychelles",
    		code: "248",
    		alpha: "SC"
    	},
    	{
    		name: "Sierra Leone",
    		code: "232",
    		alpha: "SL"
    	},
    	{
    		name: "Singapore",
    		code: "65",
    		alpha: "SG"
    	},
    	{
    		name: "Sint Maarten (Dutch part)",
    		code: "1721",
    		alpha: "SX"
    	},
    	{
    		name: "Slovakia",
    		code: "421",
    		alpha: "SK"
    	},
    	{
    		name: "Slovenia",
    		code: "386",
    		alpha: "SI"
    	},
    	{
    		name: "Solomon Islands",
    		code: "677",
    		alpha: "SB"
    	},
    	{
    		name: "Somalia",
    		code: "252",
    		alpha: "SO"
    	},
    	{
    		name: "South Africa",
    		code: "27",
    		alpha: "ZA"
    	},
    	{
    		name: "South Georgia and the South Sandwich Islands",
    		code: "500",
    		alpha: "GS"
    	},
    	{
    		name: "Korea (Republic of)",
    		code: "82",
    		alpha: "KR"
    	},
    	{
    		name: "South Sudan",
    		code: "211",
    		alpha: "SS"
    	},
    	{
    		name: "Spain",
    		code: "34",
    		alpha: "ES"
    	},
    	{
    		name: "Sri Lanka",
    		code: "94",
    		alpha: "LK"
    	},
    	{
    		name: "Sudan",
    		code: "249",
    		alpha: "SD"
    	},
    	{
    		name: "Suriname",
    		code: "597",
    		alpha: "SR"
    	},
    	{
    		name: "Svalbard and Jan Mayen",
    		code: "4779",
    		alpha: "SJ"
    	},
    	{
    		name: "Swaziland",
    		code: "268",
    		alpha: "SZ"
    	},
    	{
    		name: "Sweden",
    		code: "46",
    		alpha: "SE"
    	},
    	{
    		name: "Switzerland",
    		code: "41",
    		alpha: "CH"
    	},
    	{
    		name: "Syrian Arab Republic",
    		code: "963",
    		alpha: "SY"
    	},
    	{
    		name: "Taiwan",
    		code: "886",
    		alpha: "TW"
    	},
    	{
    		name: "Tajikistan",
    		code: "992",
    		alpha: "TJ"
    	},
    	{
    		name: "Tanzania, United Republic of",
    		code: "255",
    		alpha: "TZ"
    	},
    	{
    		name: "Thailand",
    		code: "66",
    		alpha: "TH"
    	},
    	{
    		name: "Timor-Leste",
    		code: "670",
    		alpha: "TL"
    	},
    	{
    		name: "Togo",
    		code: "228",
    		alpha: "TG"
    	},
    	{
    		name: "Tokelau",
    		code: "690",
    		alpha: "TK"
    	},
    	{
    		name: "Tonga",
    		code: "676",
    		alpha: "TO"
    	},
    	{
    		name: "Trinidad and Tobago",
    		code: "1868",
    		alpha: "TT"
    	},
    	{
    		name: "Tunisia",
    		code: "216",
    		alpha: "TN"
    	},
    	{
    		name: "Turkey",
    		code: "90",
    		alpha: "TR"
    	},
    	{
    		name: "Turkmenistan",
    		code: "993",
    		alpha: "TM"
    	},
    	{
    		name: "Turks and Caicos Islands",
    		code: "1649",
    		alpha: "TC"
    	},
    	{
    		name: "Tuvalu",
    		code: "688",
    		alpha: "TV"
    	},
    	{
    		name: "Uganda",
    		code: "256",
    		alpha: "UG"
    	},
    	{
    		name: "Ukraine",
    		code: "380",
    		alpha: "UA"
    	},
    	{
    		name: "United Arab Emirates",
    		code: "971",
    		alpha: "AE"
    	},
    	{
    		name: "United Kingdom of Great Britain and Northern Ireland",
    		code: "44",
    		alpha: "GB"
    	},
    	{
    		name: "United States of America",
    		code: "1",
    		alpha: "US"
    	},
    	{
    		name: "Uruguay",
    		code: "598",
    		alpha: "UY"
    	},
    	{
    		name: "Uzbekistan",
    		code: "998",
    		alpha: "UZ"
    	},
    	{
    		name: "Vanuatu",
    		code: "678",
    		alpha: "VU"
    	},
    	{
    		name: "Venezuela (Bolivarian Republic of)",
    		code: "58",
    		alpha: "VE"
    	},
    	{
    		name: "Viet Nam",
    		code: "84",
    		alpha: "VN"
    	},
    	{
    		name: "Wallis and Futuna",
    		code: "681",
    		alpha: "WF"
    	},
    	{
    		name: "Western Sahara",
    		code: "212",
    		alpha: "EH"
    	},
    	{
    		name: "Yemen",
    		code: "967",
    		alpha: "YE"
    	},
    	{
    		name: "Zambia",
    		code: "260",
    		alpha: "ZM"
    	},
    	{
    		name: "Zimbabwe",
    		code: "263",
    		alpha: "ZW"
    	}
    ];

    let setted;

    const countries = derived([phone, country], ([ph, cn]) => {
        const phcheck = ph.replace(/\D/g, '').slice(0,3);
        const newCountries = countrylist.filter(cntry => {
            if (phcheck) {
                if (cntry.code) {
                    return cntry.code.match(phcheck) && cntry.name.toLowerCase().includes(cn.toLowerCase()) || phcheck.includes(cntry.code);      
                } 

                return false;
            }

            return cntry.name.toLowerCase().includes(cn.toLowerCase());
        });
        
        if (newCountries.length === 1 && setted !== newCountries[0].code) {
            setted = newCountries[0].code;
            country.set(newCountries[0].name);
            if (phcheck.length < newCountries[0].code.length) {
                phone.set(newCountries[0].code);
            }
        } else if (newCountries.length > 1) {
            setted = void '';
        }

        return newCountries;
    });

    const createRouter = () => {
        const { subscribe, set } = writable({ route: '', props: {} });

        return {
            subscribe,
            setRoute: route => set({ route }),
            setRouteAndProps: (route, props) => set ({ route, props })
        };
    };

    const router = createRouter();

    /* src\components\ui-kit\inputs\input-country.svelte generated by Svelte v3.18.2 */
    const file = "src\\components\\ui-kit\\inputs\\input-country.svelte";

    function create_fragment(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t2;
    	let div2;
    	let div0;
    	let t3;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Country";
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div1 = element("div");
    			input.required = true;
    			attr_dev(input, "type", "country");
    			add_location(input, file, 41, 0, 896);
    			attr_dev(label, "for", "country");
    			add_location(label, file, 42, 0, 987);
    			attr_dev(div0, "class", "line svelte-1a4tcl5");
    			add_location(div0, file, 44, 1, 1046);
    			attr_dev(div1, "class", "line svelte-1a4tcl5");
    			add_location(div1, file, 45, 1, 1073);
    			attr_dev(div2, "class", "icon svelte-1a4tcl5");
    			add_location(div2, file, 43, 0, 1025);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			/*input_binding*/ ctx[4](input);
    			set_input_value(input, /*$country*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			dispose = [
    				listen_dev(input, "focus", /*onFocus*/ ctx[2], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$country*/ 2) {
    				set_input_value(input, /*$country*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[4](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $focused;
    	let $country;
    	validate_store(focused, "focused");
    	component_subscribe($$self, focused, $$value => $$invalidate(3, $focused = $$value));
    	validate_store(country, "country");
    	component_subscribe($$self, country, $$value => $$invalidate(1, $country = $$value));
    	let elem;

    	const onFocus = () => {
    		focused.set("country");
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, elem = $$value);
    		});
    	}

    	function input_input_handler() {
    		$country = this.value;
    		country.set($country);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elem" in $$props) $$invalidate(0, elem = $$props.elem);
    		if ("$focused" in $$props) focused.set($focused = $$props.$focused);
    		if ("$country" in $$props) country.set($country = $$props.$country);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$focused, elem*/ 9) {
    			 $focused === "country" && elem.focus();
    		}
    	};

    	return [elem, $country, onFocus, $focused, input_binding, input_input_handler];
    }

    class Input_country extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_country",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\ui-kit\inputs\input-phone.svelte generated by Svelte v3.18.2 */
    const file$1 = "src\\components\\ui-kit\\inputs\\input-phone.svelte";

    function create_fragment$1(ctx) {
    	let input;
    	let t0;
    	let label;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Phone Number";
    			input.required = true;
    			attr_dev(input, "type", "phone");
    			add_location(input, file$1, 15, 0, 303);
    			attr_dev(label, "for", "phone");
    			add_location(label, file$1, 16, 0, 390);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			/*input_binding*/ ctx[4](input);
    			set_input_value(input, /*$phone*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(input, "focus", /*onFocus*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$phone*/ 2) {
    				set_input_value(input, /*$phone*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[4](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $focused;
    	let $phone;
    	validate_store(focused, "focused");
    	component_subscribe($$self, focused, $$value => $$invalidate(3, $focused = $$value));
    	validate_store(phone, "phone");
    	component_subscribe($$self, phone, $$value => $$invalidate(1, $phone = $$value));
    	let elem;

    	const onFocus = () => {
    		focused.set("phone");
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, elem = $$value);
    		});
    	}

    	function input_input_handler() {
    		$phone = this.value;
    		phone.set($phone);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elem" in $$props) $$invalidate(0, elem = $$props.elem);
    		if ("$focused" in $$props) focused.set($focused = $$props.$focused);
    		if ("$phone" in $$props) phone.set($phone = $$props.$phone);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$focused, elem*/ 9) {
    			 $focused === "phone" && elem.focus();
    		}
    	};

    	return [elem, $phone, onFocus, $focused, input_binding, input_input_handler];
    }

    class Input_phone extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_phone",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    var data = [
    	{
    		code: "AD",
    		emoji: "🇦🇩",
    		unicode: "U+1F1E6 U+1F1E9",
    		name: "Andorra",
    		title: "flag for Andorra"
    	},
    	{
    		code: "AE",
    		emoji: "🇦🇪",
    		unicode: "U+1F1E6 U+1F1EA",
    		name: "United Arab Emirates",
    		title: "flag for United Arab Emirates"
    	},
    	{
    		code: "AF",
    		emoji: "🇦🇫",
    		unicode: "U+1F1E6 U+1F1EB",
    		name: "Afghanistan",
    		title: "flag for Afghanistan"
    	},
    	{
    		code: "AG",
    		emoji: "🇦🇬",
    		unicode: "U+1F1E6 U+1F1EC",
    		name: "Antigua and Barbuda",
    		title: "flag for Antigua and Barbuda"
    	},
    	{
    		code: "AI",
    		emoji: "🇦🇮",
    		unicode: "U+1F1E6 U+1F1EE",
    		name: "Anguilla",
    		title: "flag for Anguilla"
    	},
    	{
    		code: "AL",
    		emoji: "🇦🇱",
    		unicode: "U+1F1E6 U+1F1F1",
    		name: "Albania",
    		title: "flag for Albania"
    	},
    	{
    		code: "AM",
    		emoji: "🇦🇲",
    		unicode: "U+1F1E6 U+1F1F2",
    		name: "Armenia",
    		title: "flag for Armenia"
    	},
    	{
    		code: "AO",
    		emoji: "🇦🇴",
    		unicode: "U+1F1E6 U+1F1F4",
    		name: "Angola",
    		title: "flag for Angola"
    	},
    	{
    		code: "AQ",
    		emoji: "🇦🇶",
    		unicode: "U+1F1E6 U+1F1F6",
    		name: "Antarctica",
    		title: "flag for Antarctica"
    	},
    	{
    		code: "AR",
    		emoji: "🇦🇷",
    		unicode: "U+1F1E6 U+1F1F7",
    		name: "Argentina",
    		title: "flag for Argentina"
    	},
    	{
    		code: "AS",
    		emoji: "🇦🇸",
    		unicode: "U+1F1E6 U+1F1F8",
    		name: "American Samoa",
    		title: "flag for American Samoa"
    	},
    	{
    		code: "AT",
    		emoji: "🇦🇹",
    		unicode: "U+1F1E6 U+1F1F9",
    		name: "Austria",
    		title: "flag for Austria"
    	},
    	{
    		code: "AU",
    		emoji: "🇦🇺",
    		unicode: "U+1F1E6 U+1F1FA",
    		name: "Australia",
    		title: "flag for Australia"
    	},
    	{
    		code: "AW",
    		emoji: "🇦🇼",
    		unicode: "U+1F1E6 U+1F1FC",
    		name: "Aruba",
    		title: "flag for Aruba"
    	},
    	{
    		code: "AX",
    		emoji: "🇦🇽",
    		unicode: "U+1F1E6 U+1F1FD",
    		name: "Åland Islands",
    		title: "flag for Åland Islands"
    	},
    	{
    		code: "AZ",
    		emoji: "🇦🇿",
    		unicode: "U+1F1E6 U+1F1FF",
    		name: "Azerbaijan",
    		title: "flag for Azerbaijan"
    	},
    	{
    		code: "BA",
    		emoji: "🇧🇦",
    		unicode: "U+1F1E7 U+1F1E6",
    		name: "Bosnia and Herzegovina",
    		title: "flag for Bosnia and Herzegovina"
    	},
    	{
    		code: "BB",
    		emoji: "🇧🇧",
    		unicode: "U+1F1E7 U+1F1E7",
    		name: "Barbados",
    		title: "flag for Barbados"
    	},
    	{
    		code: "BD",
    		emoji: "🇧🇩",
    		unicode: "U+1F1E7 U+1F1E9",
    		name: "Bangladesh",
    		title: "flag for Bangladesh"
    	},
    	{
    		code: "BE",
    		emoji: "🇧🇪",
    		unicode: "U+1F1E7 U+1F1EA",
    		name: "Belgium",
    		title: "flag for Belgium"
    	},
    	{
    		code: "BF",
    		emoji: "🇧🇫",
    		unicode: "U+1F1E7 U+1F1EB",
    		name: "Burkina Faso",
    		title: "flag for Burkina Faso"
    	},
    	{
    		code: "BG",
    		emoji: "🇧🇬",
    		unicode: "U+1F1E7 U+1F1EC",
    		name: "Bulgaria",
    		title: "flag for Bulgaria"
    	},
    	{
    		code: "BH",
    		emoji: "🇧🇭",
    		unicode: "U+1F1E7 U+1F1ED",
    		name: "Bahrain",
    		title: "flag for Bahrain"
    	},
    	{
    		code: "BI",
    		emoji: "🇧🇮",
    		unicode: "U+1F1E7 U+1F1EE",
    		name: "Burundi",
    		title: "flag for Burundi"
    	},
    	{
    		code: "BJ",
    		emoji: "🇧🇯",
    		unicode: "U+1F1E7 U+1F1EF",
    		name: "Benin",
    		title: "flag for Benin"
    	},
    	{
    		code: "BL",
    		emoji: "🇧🇱",
    		unicode: "U+1F1E7 U+1F1F1",
    		name: "Saint Barthélemy",
    		title: "flag for Saint Barthélemy"
    	},
    	{
    		code: "BM",
    		emoji: "🇧🇲",
    		unicode: "U+1F1E7 U+1F1F2",
    		name: "Bermuda",
    		title: "flag for Bermuda"
    	},
    	{
    		code: "BN",
    		emoji: "🇧🇳",
    		unicode: "U+1F1E7 U+1F1F3",
    		name: "Brunei Darussalam",
    		title: "flag for Brunei Darussalam"
    	},
    	{
    		code: "BO",
    		emoji: "🇧🇴",
    		unicode: "U+1F1E7 U+1F1F4",
    		name: "Bolivia",
    		title: "flag for Bolivia"
    	},
    	{
    		code: "BQ",
    		emoji: "🇧🇶",
    		unicode: "U+1F1E7 U+1F1F6",
    		name: "Bonaire, Sint Eustatius and Saba",
    		title: "flag for Bonaire, Sint Eustatius and Saba"
    	},
    	{
    		code: "BR",
    		emoji: "🇧🇷",
    		unicode: "U+1F1E7 U+1F1F7",
    		name: "Brazil",
    		title: "flag for Brazil"
    	},
    	{
    		code: "BS",
    		emoji: "🇧🇸",
    		unicode: "U+1F1E7 U+1F1F8",
    		name: "Bahamas",
    		title: "flag for Bahamas"
    	},
    	{
    		code: "BT",
    		emoji: "🇧🇹",
    		unicode: "U+1F1E7 U+1F1F9",
    		name: "Bhutan",
    		title: "flag for Bhutan"
    	},
    	{
    		code: "BV",
    		emoji: "🇧🇻",
    		unicode: "U+1F1E7 U+1F1FB",
    		name: "Bouvet Island",
    		title: "flag for Bouvet Island"
    	},
    	{
    		code: "BW",
    		emoji: "🇧🇼",
    		unicode: "U+1F1E7 U+1F1FC",
    		name: "Botswana",
    		title: "flag for Botswana"
    	},
    	{
    		code: "BY",
    		emoji: "🇧🇾",
    		unicode: "U+1F1E7 U+1F1FE",
    		name: "Belarus",
    		title: "flag for Belarus"
    	},
    	{
    		code: "BZ",
    		emoji: "🇧🇿",
    		unicode: "U+1F1E7 U+1F1FF",
    		name: "Belize",
    		title: "flag for Belize"
    	},
    	{
    		code: "CA",
    		emoji: "🇨🇦",
    		unicode: "U+1F1E8 U+1F1E6",
    		name: "Canada",
    		title: "flag for Canada"
    	},
    	{
    		code: "CC",
    		emoji: "🇨🇨",
    		unicode: "U+1F1E8 U+1F1E8",
    		name: "Cocos (Keeling) Islands",
    		title: "flag for Cocos (Keeling) Islands"
    	},
    	{
    		code: "CD",
    		emoji: "🇨🇩",
    		unicode: "U+1F1E8 U+1F1E9",
    		name: "Congo",
    		title: "flag for Congo"
    	},
    	{
    		code: "CF",
    		emoji: "🇨🇫",
    		unicode: "U+1F1E8 U+1F1EB",
    		name: "Central African Republic",
    		title: "flag for Central African Republic"
    	},
    	{
    		code: "CG",
    		emoji: "🇨🇬",
    		unicode: "U+1F1E8 U+1F1EC",
    		name: "Congo",
    		title: "flag for Congo"
    	},
    	{
    		code: "CH",
    		emoji: "🇨🇭",
    		unicode: "U+1F1E8 U+1F1ED",
    		name: "Switzerland",
    		title: "flag for Switzerland"
    	},
    	{
    		code: "CI",
    		emoji: "🇨🇮",
    		unicode: "U+1F1E8 U+1F1EE",
    		name: "Côte D'Ivoire",
    		title: "flag for Côte D'Ivoire"
    	},
    	{
    		code: "CK",
    		emoji: "🇨🇰",
    		unicode: "U+1F1E8 U+1F1F0",
    		name: "Cook Islands",
    		title: "flag for Cook Islands"
    	},
    	{
    		code: "CL",
    		emoji: "🇨🇱",
    		unicode: "U+1F1E8 U+1F1F1",
    		name: "Chile",
    		title: "flag for Chile"
    	},
    	{
    		code: "CM",
    		emoji: "🇨🇲",
    		unicode: "U+1F1E8 U+1F1F2",
    		name: "Cameroon",
    		title: "flag for Cameroon"
    	},
    	{
    		code: "CN",
    		emoji: "🇨🇳",
    		unicode: "U+1F1E8 U+1F1F3",
    		name: "China",
    		title: "flag for China"
    	},
    	{
    		code: "CO",
    		emoji: "🇨🇴",
    		unicode: "U+1F1E8 U+1F1F4",
    		name: "Colombia",
    		title: "flag for Colombia"
    	},
    	{
    		code: "CR",
    		emoji: "🇨🇷",
    		unicode: "U+1F1E8 U+1F1F7",
    		name: "Costa Rica",
    		title: "flag for Costa Rica"
    	},
    	{
    		code: "CU",
    		emoji: "🇨🇺",
    		unicode: "U+1F1E8 U+1F1FA",
    		name: "Cuba",
    		title: "flag for Cuba"
    	},
    	{
    		code: "CV",
    		emoji: "🇨🇻",
    		unicode: "U+1F1E8 U+1F1FB",
    		name: "Cape Verde",
    		title: "flag for Cape Verde"
    	},
    	{
    		code: "CW",
    		emoji: "🇨🇼",
    		unicode: "U+1F1E8 U+1F1FC",
    		name: "Curaçao",
    		title: "flag for Curaçao"
    	},
    	{
    		code: "CX",
    		emoji: "🇨🇽",
    		unicode: "U+1F1E8 U+1F1FD",
    		name: "Christmas Island",
    		title: "flag for Christmas Island"
    	},
    	{
    		code: "CY",
    		emoji: "🇨🇾",
    		unicode: "U+1F1E8 U+1F1FE",
    		name: "Cyprus",
    		title: "flag for Cyprus"
    	},
    	{
    		code: "CZ",
    		emoji: "🇨🇿",
    		unicode: "U+1F1E8 U+1F1FF",
    		name: "Czech Republic",
    		title: "flag for Czech Republic"
    	},
    	{
    		code: "DE",
    		emoji: "🇩🇪",
    		unicode: "U+1F1E9 U+1F1EA",
    		name: "Germany",
    		title: "flag for Germany"
    	},
    	{
    		code: "DJ",
    		emoji: "🇩🇯",
    		unicode: "U+1F1E9 U+1F1EF",
    		name: "Djibouti",
    		title: "flag for Djibouti"
    	},
    	{
    		code: "DK",
    		emoji: "🇩🇰",
    		unicode: "U+1F1E9 U+1F1F0",
    		name: "Denmark",
    		title: "flag for Denmark"
    	},
    	{
    		code: "DM",
    		emoji: "🇩🇲",
    		unicode: "U+1F1E9 U+1F1F2",
    		name: "Dominica",
    		title: "flag for Dominica"
    	},
    	{
    		code: "DO",
    		emoji: "🇩🇴",
    		unicode: "U+1F1E9 U+1F1F4",
    		name: "Dominican Republic",
    		title: "flag for Dominican Republic"
    	},
    	{
    		code: "DZ",
    		emoji: "🇩🇿",
    		unicode: "U+1F1E9 U+1F1FF",
    		name: "Algeria",
    		title: "flag for Algeria"
    	},
    	{
    		code: "EC",
    		emoji: "🇪🇨",
    		unicode: "U+1F1EA U+1F1E8",
    		name: "Ecuador",
    		title: "flag for Ecuador"
    	},
    	{
    		code: "EE",
    		emoji: "🇪🇪",
    		unicode: "U+1F1EA U+1F1EA",
    		name: "Estonia",
    		title: "flag for Estonia"
    	},
    	{
    		code: "EG",
    		emoji: "🇪🇬",
    		unicode: "U+1F1EA U+1F1EC",
    		name: "Egypt",
    		title: "flag for Egypt"
    	},
    	{
    		code: "EH",
    		emoji: "🇪🇭",
    		unicode: "U+1F1EA U+1F1ED",
    		name: "Western Sahara",
    		title: "flag for Western Sahara"
    	},
    	{
    		code: "ER",
    		emoji: "🇪🇷",
    		unicode: "U+1F1EA U+1F1F7",
    		name: "Eritrea",
    		title: "flag for Eritrea"
    	},
    	{
    		code: "ES",
    		emoji: "🇪🇸",
    		unicode: "U+1F1EA U+1F1F8",
    		name: "Spain",
    		title: "flag for Spain"
    	},
    	{
    		code: "ET",
    		emoji: "🇪🇹",
    		unicode: "U+1F1EA U+1F1F9",
    		name: "Ethiopia",
    		title: "flag for Ethiopia"
    	},
    	{
    		code: "EU",
    		emoji: "🇪🇺",
    		unicode: "U+1F1EA U+1F1FA",
    		name: "European Union",
    		title: "flag for European Union"
    	},
    	{
    		code: "FI",
    		emoji: "🇫🇮",
    		unicode: "U+1F1EB U+1F1EE",
    		name: "Finland",
    		title: "flag for Finland"
    	},
    	{
    		code: "FJ",
    		emoji: "🇫🇯",
    		unicode: "U+1F1EB U+1F1EF",
    		name: "Fiji",
    		title: "flag for Fiji"
    	},
    	{
    		code: "FK",
    		emoji: "🇫🇰",
    		unicode: "U+1F1EB U+1F1F0",
    		name: "Falkland Islands (Malvinas)",
    		title: "flag for Falkland Islands (Malvinas)"
    	},
    	{
    		code: "FM",
    		emoji: "🇫🇲",
    		unicode: "U+1F1EB U+1F1F2",
    		name: "Micronesia",
    		title: "flag for Micronesia"
    	},
    	{
    		code: "FO",
    		emoji: "🇫🇴",
    		unicode: "U+1F1EB U+1F1F4",
    		name: "Faroe Islands",
    		title: "flag for Faroe Islands"
    	},
    	{
    		code: "FR",
    		emoji: "🇫🇷",
    		unicode: "U+1F1EB U+1F1F7",
    		name: "France",
    		title: "flag for France"
    	},
    	{
    		code: "GA",
    		emoji: "🇬🇦",
    		unicode: "U+1F1EC U+1F1E6",
    		name: "Gabon",
    		title: "flag for Gabon"
    	},
    	{
    		code: "GB",
    		emoji: "🇬🇧",
    		unicode: "U+1F1EC U+1F1E7",
    		name: "United Kingdom",
    		title: "flag for United Kingdom"
    	},
    	{
    		code: "GD",
    		emoji: "🇬🇩",
    		unicode: "U+1F1EC U+1F1E9",
    		name: "Grenada",
    		title: "flag for Grenada"
    	},
    	{
    		code: "GE",
    		emoji: "🇬🇪",
    		unicode: "U+1F1EC U+1F1EA",
    		name: "Georgia",
    		title: "flag for Georgia"
    	},
    	{
    		code: "GF",
    		emoji: "🇬🇫",
    		unicode: "U+1F1EC U+1F1EB",
    		name: "French Guiana",
    		title: "flag for French Guiana"
    	},
    	{
    		code: "GG",
    		emoji: "🇬🇬",
    		unicode: "U+1F1EC U+1F1EC",
    		name: "Guernsey",
    		title: "flag for Guernsey"
    	},
    	{
    		code: "GH",
    		emoji: "🇬🇭",
    		unicode: "U+1F1EC U+1F1ED",
    		name: "Ghana",
    		title: "flag for Ghana"
    	},
    	{
    		code: "GI",
    		emoji: "🇬🇮",
    		unicode: "U+1F1EC U+1F1EE",
    		name: "Gibraltar",
    		title: "flag for Gibraltar"
    	},
    	{
    		code: "GL",
    		emoji: "🇬🇱",
    		unicode: "U+1F1EC U+1F1F1",
    		name: "Greenland",
    		title: "flag for Greenland"
    	},
    	{
    		code: "GM",
    		emoji: "🇬🇲",
    		unicode: "U+1F1EC U+1F1F2",
    		name: "Gambia",
    		title: "flag for Gambia"
    	},
    	{
    		code: "GN",
    		emoji: "🇬🇳",
    		unicode: "U+1F1EC U+1F1F3",
    		name: "Guinea",
    		title: "flag for Guinea"
    	},
    	{
    		code: "GP",
    		emoji: "🇬🇵",
    		unicode: "U+1F1EC U+1F1F5",
    		name: "Guadeloupe",
    		title: "flag for Guadeloupe"
    	},
    	{
    		code: "GQ",
    		emoji: "🇬🇶",
    		unicode: "U+1F1EC U+1F1F6",
    		name: "Equatorial Guinea",
    		title: "flag for Equatorial Guinea"
    	},
    	{
    		code: "GR",
    		emoji: "🇬🇷",
    		unicode: "U+1F1EC U+1F1F7",
    		name: "Greece",
    		title: "flag for Greece"
    	},
    	{
    		code: "GS",
    		emoji: "🇬🇸",
    		unicode: "U+1F1EC U+1F1F8",
    		name: "South Georgia",
    		title: "flag for South Georgia"
    	},
    	{
    		code: "GT",
    		emoji: "🇬🇹",
    		unicode: "U+1F1EC U+1F1F9",
    		name: "Guatemala",
    		title: "flag for Guatemala"
    	},
    	{
    		code: "GU",
    		emoji: "🇬🇺",
    		unicode: "U+1F1EC U+1F1FA",
    		name: "Guam",
    		title: "flag for Guam"
    	},
    	{
    		code: "GW",
    		emoji: "🇬🇼",
    		unicode: "U+1F1EC U+1F1FC",
    		name: "Guinea-Bissau",
    		title: "flag for Guinea-Bissau"
    	},
    	{
    		code: "GY",
    		emoji: "🇬🇾",
    		unicode: "U+1F1EC U+1F1FE",
    		name: "Guyana",
    		title: "flag for Guyana"
    	},
    	{
    		code: "HK",
    		emoji: "🇭🇰",
    		unicode: "U+1F1ED U+1F1F0",
    		name: "Hong Kong",
    		title: "flag for Hong Kong"
    	},
    	{
    		code: "HM",
    		emoji: "🇭🇲",
    		unicode: "U+1F1ED U+1F1F2",
    		name: "Heard Island and Mcdonald Islands",
    		title: "flag for Heard Island and Mcdonald Islands"
    	},
    	{
    		code: "HN",
    		emoji: "🇭🇳",
    		unicode: "U+1F1ED U+1F1F3",
    		name: "Honduras",
    		title: "flag for Honduras"
    	},
    	{
    		code: "HR",
    		emoji: "🇭🇷",
    		unicode: "U+1F1ED U+1F1F7",
    		name: "Croatia",
    		title: "flag for Croatia"
    	},
    	{
    		code: "HT",
    		emoji: "🇭🇹",
    		unicode: "U+1F1ED U+1F1F9",
    		name: "Haiti",
    		title: "flag for Haiti"
    	},
    	{
    		code: "HU",
    		emoji: "🇭🇺",
    		unicode: "U+1F1ED U+1F1FA",
    		name: "Hungary",
    		title: "flag for Hungary"
    	},
    	{
    		code: "ID",
    		emoji: "🇮🇩",
    		unicode: "U+1F1EE U+1F1E9",
    		name: "Indonesia",
    		title: "flag for Indonesia"
    	},
    	{
    		code: "IE",
    		emoji: "🇮🇪",
    		unicode: "U+1F1EE U+1F1EA",
    		name: "Ireland",
    		title: "flag for Ireland"
    	},
    	{
    		code: "IL",
    		emoji: "🇮🇱",
    		unicode: "U+1F1EE U+1F1F1",
    		name: "Israel",
    		title: "flag for Israel"
    	},
    	{
    		code: "IM",
    		emoji: "🇮🇲",
    		unicode: "U+1F1EE U+1F1F2",
    		name: "Isle of Man",
    		title: "flag for Isle of Man"
    	},
    	{
    		code: "IN",
    		emoji: "🇮🇳",
    		unicode: "U+1F1EE U+1F1F3",
    		name: "India",
    		title: "flag for India"
    	},
    	{
    		code: "IO",
    		emoji: "🇮🇴",
    		unicode: "U+1F1EE U+1F1F4",
    		name: "British Indian Ocean Territory",
    		title: "flag for British Indian Ocean Territory"
    	},
    	{
    		code: "IQ",
    		emoji: "🇮🇶",
    		unicode: "U+1F1EE U+1F1F6",
    		name: "Iraq",
    		title: "flag for Iraq"
    	},
    	{
    		code: "IR",
    		emoji: "🇮🇷",
    		unicode: "U+1F1EE U+1F1F7",
    		name: "Iran",
    		title: "flag for Iran"
    	},
    	{
    		code: "IS",
    		emoji: "🇮🇸",
    		unicode: "U+1F1EE U+1F1F8",
    		name: "Iceland",
    		title: "flag for Iceland"
    	},
    	{
    		code: "IT",
    		emoji: "🇮🇹",
    		unicode: "U+1F1EE U+1F1F9",
    		name: "Italy",
    		title: "flag for Italy"
    	},
    	{
    		code: "JE",
    		emoji: "🇯🇪",
    		unicode: "U+1F1EF U+1F1EA",
    		name: "Jersey",
    		title: "flag for Jersey"
    	},
    	{
    		code: "JM",
    		emoji: "🇯🇲",
    		unicode: "U+1F1EF U+1F1F2",
    		name: "Jamaica",
    		title: "flag for Jamaica"
    	},
    	{
    		code: "JO",
    		emoji: "🇯🇴",
    		unicode: "U+1F1EF U+1F1F4",
    		name: "Jordan",
    		title: "flag for Jordan"
    	},
    	{
    		code: "JP",
    		emoji: "🇯🇵",
    		unicode: "U+1F1EF U+1F1F5",
    		name: "Japan",
    		title: "flag for Japan"
    	},
    	{
    		code: "KE",
    		emoji: "🇰🇪",
    		unicode: "U+1F1F0 U+1F1EA",
    		name: "Kenya",
    		title: "flag for Kenya"
    	},
    	{
    		code: "KG",
    		emoji: "🇰🇬",
    		unicode: "U+1F1F0 U+1F1EC",
    		name: "Kyrgyzstan",
    		title: "flag for Kyrgyzstan"
    	},
    	{
    		code: "KH",
    		emoji: "🇰🇭",
    		unicode: "U+1F1F0 U+1F1ED",
    		name: "Cambodia",
    		title: "flag for Cambodia"
    	},
    	{
    		code: "KI",
    		emoji: "🇰🇮",
    		unicode: "U+1F1F0 U+1F1EE",
    		name: "Kiribati",
    		title: "flag for Kiribati"
    	},
    	{
    		code: "KM",
    		emoji: "🇰🇲",
    		unicode: "U+1F1F0 U+1F1F2",
    		name: "Comoros",
    		title: "flag for Comoros"
    	},
    	{
    		code: "KN",
    		emoji: "🇰🇳",
    		unicode: "U+1F1F0 U+1F1F3",
    		name: "Saint Kitts and Nevis",
    		title: "flag for Saint Kitts and Nevis"
    	},
    	{
    		code: "KP",
    		emoji: "🇰🇵",
    		unicode: "U+1F1F0 U+1F1F5",
    		name: "North Korea",
    		title: "flag for North Korea"
    	},
    	{
    		code: "KR",
    		emoji: "🇰🇷",
    		unicode: "U+1F1F0 U+1F1F7",
    		name: "South Korea",
    		title: "flag for South Korea"
    	},
    	{
    		code: "KW",
    		emoji: "🇰🇼",
    		unicode: "U+1F1F0 U+1F1FC",
    		name: "Kuwait",
    		title: "flag for Kuwait"
    	},
    	{
    		code: "KY",
    		emoji: "🇰🇾",
    		unicode: "U+1F1F0 U+1F1FE",
    		name: "Cayman Islands",
    		title: "flag for Cayman Islands"
    	},
    	{
    		code: "KZ",
    		emoji: "🇰🇿",
    		unicode: "U+1F1F0 U+1F1FF",
    		name: "Kazakhstan",
    		title: "flag for Kazakhstan"
    	},
    	{
    		code: "LA",
    		emoji: "🇱🇦",
    		unicode: "U+1F1F1 U+1F1E6",
    		name: "Lao People's Democratic Republic",
    		title: "flag for Lao People's Democratic Republic"
    	},
    	{
    		code: "LB",
    		emoji: "🇱🇧",
    		unicode: "U+1F1F1 U+1F1E7",
    		name: "Lebanon",
    		title: "flag for Lebanon"
    	},
    	{
    		code: "LC",
    		emoji: "🇱🇨",
    		unicode: "U+1F1F1 U+1F1E8",
    		name: "Saint Lucia",
    		title: "flag for Saint Lucia"
    	},
    	{
    		code: "LI",
    		emoji: "🇱🇮",
    		unicode: "U+1F1F1 U+1F1EE",
    		name: "Liechtenstein",
    		title: "flag for Liechtenstein"
    	},
    	{
    		code: "LK",
    		emoji: "🇱🇰",
    		unicode: "U+1F1F1 U+1F1F0",
    		name: "Sri Lanka",
    		title: "flag for Sri Lanka"
    	},
    	{
    		code: "LR",
    		emoji: "🇱🇷",
    		unicode: "U+1F1F1 U+1F1F7",
    		name: "Liberia",
    		title: "flag for Liberia"
    	},
    	{
    		code: "LS",
    		emoji: "🇱🇸",
    		unicode: "U+1F1F1 U+1F1F8",
    		name: "Lesotho",
    		title: "flag for Lesotho"
    	},
    	{
    		code: "LT",
    		emoji: "🇱🇹",
    		unicode: "U+1F1F1 U+1F1F9",
    		name: "Lithuania",
    		title: "flag for Lithuania"
    	},
    	{
    		code: "LU",
    		emoji: "🇱🇺",
    		unicode: "U+1F1F1 U+1F1FA",
    		name: "Luxembourg",
    		title: "flag for Luxembourg"
    	},
    	{
    		code: "LV",
    		emoji: "🇱🇻",
    		unicode: "U+1F1F1 U+1F1FB",
    		name: "Latvia",
    		title: "flag for Latvia"
    	},
    	{
    		code: "LY",
    		emoji: "🇱🇾",
    		unicode: "U+1F1F1 U+1F1FE",
    		name: "Libya",
    		title: "flag for Libya"
    	},
    	{
    		code: "MA",
    		emoji: "🇲🇦",
    		unicode: "U+1F1F2 U+1F1E6",
    		name: "Morocco",
    		title: "flag for Morocco"
    	},
    	{
    		code: "MC",
    		emoji: "🇲🇨",
    		unicode: "U+1F1F2 U+1F1E8",
    		name: "Monaco",
    		title: "flag for Monaco"
    	},
    	{
    		code: "MD",
    		emoji: "🇲🇩",
    		unicode: "U+1F1F2 U+1F1E9",
    		name: "Moldova",
    		title: "flag for Moldova"
    	},
    	{
    		code: "ME",
    		emoji: "🇲🇪",
    		unicode: "U+1F1F2 U+1F1EA",
    		name: "Montenegro",
    		title: "flag for Montenegro"
    	},
    	{
    		code: "MF",
    		emoji: "🇲🇫",
    		unicode: "U+1F1F2 U+1F1EB",
    		name: "Saint Martin (French Part)",
    		title: "flag for Saint Martin (French Part)"
    	},
    	{
    		code: "MG",
    		emoji: "🇲🇬",
    		unicode: "U+1F1F2 U+1F1EC",
    		name: "Madagascar",
    		title: "flag for Madagascar"
    	},
    	{
    		code: "MH",
    		emoji: "🇲🇭",
    		unicode: "U+1F1F2 U+1F1ED",
    		name: "Marshall Islands",
    		title: "flag for Marshall Islands"
    	},
    	{
    		code: "MK",
    		emoji: "🇲🇰",
    		unicode: "U+1F1F2 U+1F1F0",
    		name: "Macedonia",
    		title: "flag for Macedonia"
    	},
    	{
    		code: "ML",
    		emoji: "🇲🇱",
    		unicode: "U+1F1F2 U+1F1F1",
    		name: "Mali",
    		title: "flag for Mali"
    	},
    	{
    		code: "MM",
    		emoji: "🇲🇲",
    		unicode: "U+1F1F2 U+1F1F2",
    		name: "Myanmar",
    		title: "flag for Myanmar"
    	},
    	{
    		code: "MN",
    		emoji: "🇲🇳",
    		unicode: "U+1F1F2 U+1F1F3",
    		name: "Mongolia",
    		title: "flag for Mongolia"
    	},
    	{
    		code: "MO",
    		emoji: "🇲🇴",
    		unicode: "U+1F1F2 U+1F1F4",
    		name: "Macao",
    		title: "flag for Macao"
    	},
    	{
    		code: "MP",
    		emoji: "🇲🇵",
    		unicode: "U+1F1F2 U+1F1F5",
    		name: "Northern Mariana Islands",
    		title: "flag for Northern Mariana Islands"
    	},
    	{
    		code: "MQ",
    		emoji: "🇲🇶",
    		unicode: "U+1F1F2 U+1F1F6",
    		name: "Martinique",
    		title: "flag for Martinique"
    	},
    	{
    		code: "MR",
    		emoji: "🇲🇷",
    		unicode: "U+1F1F2 U+1F1F7",
    		name: "Mauritania",
    		title: "flag for Mauritania"
    	},
    	{
    		code: "MS",
    		emoji: "🇲🇸",
    		unicode: "U+1F1F2 U+1F1F8",
    		name: "Montserrat",
    		title: "flag for Montserrat"
    	},
    	{
    		code: "MT",
    		emoji: "🇲🇹",
    		unicode: "U+1F1F2 U+1F1F9",
    		name: "Malta",
    		title: "flag for Malta"
    	},
    	{
    		code: "MU",
    		emoji: "🇲🇺",
    		unicode: "U+1F1F2 U+1F1FA",
    		name: "Mauritius",
    		title: "flag for Mauritius"
    	},
    	{
    		code: "MV",
    		emoji: "🇲🇻",
    		unicode: "U+1F1F2 U+1F1FB",
    		name: "Maldives",
    		title: "flag for Maldives"
    	},
    	{
    		code: "MW",
    		emoji: "🇲🇼",
    		unicode: "U+1F1F2 U+1F1FC",
    		name: "Malawi",
    		title: "flag for Malawi"
    	},
    	{
    		code: "MX",
    		emoji: "🇲🇽",
    		unicode: "U+1F1F2 U+1F1FD",
    		name: "Mexico",
    		title: "flag for Mexico"
    	},
    	{
    		code: "MY",
    		emoji: "🇲🇾",
    		unicode: "U+1F1F2 U+1F1FE",
    		name: "Malaysia",
    		title: "flag for Malaysia"
    	},
    	{
    		code: "MZ",
    		emoji: "🇲🇿",
    		unicode: "U+1F1F2 U+1F1FF",
    		name: "Mozambique",
    		title: "flag for Mozambique"
    	},
    	{
    		code: "NA",
    		emoji: "🇳🇦",
    		unicode: "U+1F1F3 U+1F1E6",
    		name: "Namibia",
    		title: "flag for Namibia"
    	},
    	{
    		code: "NC",
    		emoji: "🇳🇨",
    		unicode: "U+1F1F3 U+1F1E8",
    		name: "New Caledonia",
    		title: "flag for New Caledonia"
    	},
    	{
    		code: "NE",
    		emoji: "🇳🇪",
    		unicode: "U+1F1F3 U+1F1EA",
    		name: "Niger",
    		title: "flag for Niger"
    	},
    	{
    		code: "NF",
    		emoji: "🇳🇫",
    		unicode: "U+1F1F3 U+1F1EB",
    		name: "Norfolk Island",
    		title: "flag for Norfolk Island"
    	},
    	{
    		code: "NG",
    		emoji: "🇳🇬",
    		unicode: "U+1F1F3 U+1F1EC",
    		name: "Nigeria",
    		title: "flag for Nigeria"
    	},
    	{
    		code: "NI",
    		emoji: "🇳🇮",
    		unicode: "U+1F1F3 U+1F1EE",
    		name: "Nicaragua",
    		title: "flag for Nicaragua"
    	},
    	{
    		code: "NL",
    		emoji: "🇳🇱",
    		unicode: "U+1F1F3 U+1F1F1",
    		name: "Netherlands",
    		title: "flag for Netherlands"
    	},
    	{
    		code: "NO",
    		emoji: "🇳🇴",
    		unicode: "U+1F1F3 U+1F1F4",
    		name: "Norway",
    		title: "flag for Norway"
    	},
    	{
    		code: "NP",
    		emoji: "🇳🇵",
    		unicode: "U+1F1F3 U+1F1F5",
    		name: "Nepal",
    		title: "flag for Nepal"
    	},
    	{
    		code: "NR",
    		emoji: "🇳🇷",
    		unicode: "U+1F1F3 U+1F1F7",
    		name: "Nauru",
    		title: "flag for Nauru"
    	},
    	{
    		code: "NU",
    		emoji: "🇳🇺",
    		unicode: "U+1F1F3 U+1F1FA",
    		name: "Niue",
    		title: "flag for Niue"
    	},
    	{
    		code: "NZ",
    		emoji: "🇳🇿",
    		unicode: "U+1F1F3 U+1F1FF",
    		name: "New Zealand",
    		title: "flag for New Zealand"
    	},
    	{
    		code: "OM",
    		emoji: "🇴🇲",
    		unicode: "U+1F1F4 U+1F1F2",
    		name: "Oman",
    		title: "flag for Oman"
    	},
    	{
    		code: "PA",
    		emoji: "🇵🇦",
    		unicode: "U+1F1F5 U+1F1E6",
    		name: "Panama",
    		title: "flag for Panama"
    	},
    	{
    		code: "PE",
    		emoji: "🇵🇪",
    		unicode: "U+1F1F5 U+1F1EA",
    		name: "Peru",
    		title: "flag for Peru"
    	},
    	{
    		code: "PF",
    		emoji: "🇵🇫",
    		unicode: "U+1F1F5 U+1F1EB",
    		name: "French Polynesia",
    		title: "flag for French Polynesia"
    	},
    	{
    		code: "PG",
    		emoji: "🇵🇬",
    		unicode: "U+1F1F5 U+1F1EC",
    		name: "Papua New Guinea",
    		title: "flag for Papua New Guinea"
    	},
    	{
    		code: "PH",
    		emoji: "🇵🇭",
    		unicode: "U+1F1F5 U+1F1ED",
    		name: "Philippines",
    		title: "flag for Philippines"
    	},
    	{
    		code: "PK",
    		emoji: "🇵🇰",
    		unicode: "U+1F1F5 U+1F1F0",
    		name: "Pakistan",
    		title: "flag for Pakistan"
    	},
    	{
    		code: "PL",
    		emoji: "🇵🇱",
    		unicode: "U+1F1F5 U+1F1F1",
    		name: "Poland",
    		title: "flag for Poland"
    	},
    	{
    		code: "PM",
    		emoji: "🇵🇲",
    		unicode: "U+1F1F5 U+1F1F2",
    		name: "Saint Pierre and Miquelon",
    		title: "flag for Saint Pierre and Miquelon"
    	},
    	{
    		code: "PN",
    		emoji: "🇵🇳",
    		unicode: "U+1F1F5 U+1F1F3",
    		name: "Pitcairn",
    		title: "flag for Pitcairn"
    	},
    	{
    		code: "PR",
    		emoji: "🇵🇷",
    		unicode: "U+1F1F5 U+1F1F7",
    		name: "Puerto Rico",
    		title: "flag for Puerto Rico"
    	},
    	{
    		code: "PS",
    		emoji: "🇵🇸",
    		unicode: "U+1F1F5 U+1F1F8",
    		name: "Palestinian Territory",
    		title: "flag for Palestinian Territory"
    	},
    	{
    		code: "PT",
    		emoji: "🇵🇹",
    		unicode: "U+1F1F5 U+1F1F9",
    		name: "Portugal",
    		title: "flag for Portugal"
    	},
    	{
    		code: "PW",
    		emoji: "🇵🇼",
    		unicode: "U+1F1F5 U+1F1FC",
    		name: "Palau",
    		title: "flag for Palau"
    	},
    	{
    		code: "PY",
    		emoji: "🇵🇾",
    		unicode: "U+1F1F5 U+1F1FE",
    		name: "Paraguay",
    		title: "flag for Paraguay"
    	},
    	{
    		code: "QA",
    		emoji: "🇶🇦",
    		unicode: "U+1F1F6 U+1F1E6",
    		name: "Qatar",
    		title: "flag for Qatar"
    	},
    	{
    		code: "RE",
    		emoji: "🇷🇪",
    		unicode: "U+1F1F7 U+1F1EA",
    		name: "Réunion",
    		title: "flag for Réunion"
    	},
    	{
    		code: "RO",
    		emoji: "🇷🇴",
    		unicode: "U+1F1F7 U+1F1F4",
    		name: "Romania",
    		title: "flag for Romania"
    	},
    	{
    		code: "RS",
    		emoji: "🇷🇸",
    		unicode: "U+1F1F7 U+1F1F8",
    		name: "Serbia",
    		title: "flag for Serbia"
    	},
    	{
    		code: "RU",
    		emoji: "🇷🇺",
    		unicode: "U+1F1F7 U+1F1FA",
    		name: "Russia",
    		title: "flag for Russia"
    	},
    	{
    		code: "RW",
    		emoji: "🇷🇼",
    		unicode: "U+1F1F7 U+1F1FC",
    		name: "Rwanda",
    		title: "flag for Rwanda"
    	},
    	{
    		code: "SA",
    		emoji: "🇸🇦",
    		unicode: "U+1F1F8 U+1F1E6",
    		name: "Saudi Arabia",
    		title: "flag for Saudi Arabia"
    	},
    	{
    		code: "SB",
    		emoji: "🇸🇧",
    		unicode: "U+1F1F8 U+1F1E7",
    		name: "Solomon Islands",
    		title: "flag for Solomon Islands"
    	},
    	{
    		code: "SC",
    		emoji: "🇸🇨",
    		unicode: "U+1F1F8 U+1F1E8",
    		name: "Seychelles",
    		title: "flag for Seychelles"
    	},
    	{
    		code: "SD",
    		emoji: "🇸🇩",
    		unicode: "U+1F1F8 U+1F1E9",
    		name: "Sudan",
    		title: "flag for Sudan"
    	},
    	{
    		code: "SE",
    		emoji: "🇸🇪",
    		unicode: "U+1F1F8 U+1F1EA",
    		name: "Sweden",
    		title: "flag for Sweden"
    	},
    	{
    		code: "SG",
    		emoji: "🇸🇬",
    		unicode: "U+1F1F8 U+1F1EC",
    		name: "Singapore",
    		title: "flag for Singapore"
    	},
    	{
    		code: "SH",
    		emoji: "🇸🇭",
    		unicode: "U+1F1F8 U+1F1ED",
    		name: "Saint Helena, Ascension and Tristan Da Cunha",
    		title: "flag for Saint Helena, Ascension and Tristan Da Cunha"
    	},
    	{
    		code: "SI",
    		emoji: "🇸🇮",
    		unicode: "U+1F1F8 U+1F1EE",
    		name: "Slovenia",
    		title: "flag for Slovenia"
    	},
    	{
    		code: "SJ",
    		emoji: "🇸🇯",
    		unicode: "U+1F1F8 U+1F1EF",
    		name: "Svalbard and Jan Mayen",
    		title: "flag for Svalbard and Jan Mayen"
    	},
    	{
    		code: "SK",
    		emoji: "🇸🇰",
    		unicode: "U+1F1F8 U+1F1F0",
    		name: "Slovakia",
    		title: "flag for Slovakia"
    	},
    	{
    		code: "SL",
    		emoji: "🇸🇱",
    		unicode: "U+1F1F8 U+1F1F1",
    		name: "Sierra Leone",
    		title: "flag for Sierra Leone"
    	},
    	{
    		code: "SM",
    		emoji: "🇸🇲",
    		unicode: "U+1F1F8 U+1F1F2",
    		name: "San Marino",
    		title: "flag for San Marino"
    	},
    	{
    		code: "SN",
    		emoji: "🇸🇳",
    		unicode: "U+1F1F8 U+1F1F3",
    		name: "Senegal",
    		title: "flag for Senegal"
    	},
    	{
    		code: "SO",
    		emoji: "🇸🇴",
    		unicode: "U+1F1F8 U+1F1F4",
    		name: "Somalia",
    		title: "flag for Somalia"
    	},
    	{
    		code: "SR",
    		emoji: "🇸🇷",
    		unicode: "U+1F1F8 U+1F1F7",
    		name: "Suriname",
    		title: "flag for Suriname"
    	},
    	{
    		code: "SS",
    		emoji: "🇸🇸",
    		unicode: "U+1F1F8 U+1F1F8",
    		name: "South Sudan",
    		title: "flag for South Sudan"
    	},
    	{
    		code: "ST",
    		emoji: "🇸🇹",
    		unicode: "U+1F1F8 U+1F1F9",
    		name: "Sao Tome and Principe",
    		title: "flag for Sao Tome and Principe"
    	},
    	{
    		code: "SV",
    		emoji: "🇸🇻",
    		unicode: "U+1F1F8 U+1F1FB",
    		name: "El Salvador",
    		title: "flag for El Salvador"
    	},
    	{
    		code: "SX",
    		emoji: "🇸🇽",
    		unicode: "U+1F1F8 U+1F1FD",
    		name: "Sint Maarten (Dutch Part)",
    		title: "flag for Sint Maarten (Dutch Part)"
    	},
    	{
    		code: "SY",
    		emoji: "🇸🇾",
    		unicode: "U+1F1F8 U+1F1FE",
    		name: "Syrian Arab Republic",
    		title: "flag for Syrian Arab Republic"
    	},
    	{
    		code: "SZ",
    		emoji: "🇸🇿",
    		unicode: "U+1F1F8 U+1F1FF",
    		name: "Swaziland",
    		title: "flag for Swaziland"
    	},
    	{
    		code: "TC",
    		emoji: "🇹🇨",
    		unicode: "U+1F1F9 U+1F1E8",
    		name: "Turks and Caicos Islands",
    		title: "flag for Turks and Caicos Islands"
    	},
    	{
    		code: "TD",
    		emoji: "🇹🇩",
    		unicode: "U+1F1F9 U+1F1E9",
    		name: "Chad",
    		title: "flag for Chad"
    	},
    	{
    		code: "TF",
    		emoji: "🇹🇫",
    		unicode: "U+1F1F9 U+1F1EB",
    		name: "French Southern Territories",
    		title: "flag for French Southern Territories"
    	},
    	{
    		code: "TG",
    		emoji: "🇹🇬",
    		unicode: "U+1F1F9 U+1F1EC",
    		name: "Togo",
    		title: "flag for Togo"
    	},
    	{
    		code: "TH",
    		emoji: "🇹🇭",
    		unicode: "U+1F1F9 U+1F1ED",
    		name: "Thailand",
    		title: "flag for Thailand"
    	},
    	{
    		code: "TJ",
    		emoji: "🇹🇯",
    		unicode: "U+1F1F9 U+1F1EF",
    		name: "Tajikistan",
    		title: "flag for Tajikistan"
    	},
    	{
    		code: "TK",
    		emoji: "🇹🇰",
    		unicode: "U+1F1F9 U+1F1F0",
    		name: "Tokelau",
    		title: "flag for Tokelau"
    	},
    	{
    		code: "TL",
    		emoji: "🇹🇱",
    		unicode: "U+1F1F9 U+1F1F1",
    		name: "Timor-Leste",
    		title: "flag for Timor-Leste"
    	},
    	{
    		code: "TM",
    		emoji: "🇹🇲",
    		unicode: "U+1F1F9 U+1F1F2",
    		name: "Turkmenistan",
    		title: "flag for Turkmenistan"
    	},
    	{
    		code: "TN",
    		emoji: "🇹🇳",
    		unicode: "U+1F1F9 U+1F1F3",
    		name: "Tunisia",
    		title: "flag for Tunisia"
    	},
    	{
    		code: "TO",
    		emoji: "🇹🇴",
    		unicode: "U+1F1F9 U+1F1F4",
    		name: "Tonga",
    		title: "flag for Tonga"
    	},
    	{
    		code: "TR",
    		emoji: "🇹🇷",
    		unicode: "U+1F1F9 U+1F1F7",
    		name: "Turkey",
    		title: "flag for Turkey"
    	},
    	{
    		code: "TT",
    		emoji: "🇹🇹",
    		unicode: "U+1F1F9 U+1F1F9",
    		name: "Trinidad and Tobago",
    		title: "flag for Trinidad and Tobago"
    	},
    	{
    		code: "TV",
    		emoji: "🇹🇻",
    		unicode: "U+1F1F9 U+1F1FB",
    		name: "Tuvalu",
    		title: "flag for Tuvalu"
    	},
    	{
    		code: "TW",
    		emoji: "🇹🇼",
    		unicode: "U+1F1F9 U+1F1FC",
    		name: "Taiwan",
    		title: "flag for Taiwan"
    	},
    	{
    		code: "TZ",
    		emoji: "🇹🇿",
    		unicode: "U+1F1F9 U+1F1FF",
    		name: "Tanzania",
    		title: "flag for Tanzania"
    	},
    	{
    		code: "UA",
    		emoji: "🇺🇦",
    		unicode: "U+1F1FA U+1F1E6",
    		name: "Ukraine",
    		title: "flag for Ukraine"
    	},
    	{
    		code: "UG",
    		emoji: "🇺🇬",
    		unicode: "U+1F1FA U+1F1EC",
    		name: "Uganda",
    		title: "flag for Uganda"
    	},
    	{
    		code: "UM",
    		emoji: "🇺🇲",
    		unicode: "U+1F1FA U+1F1F2",
    		name: "United States Minor Outlying Islands",
    		title: "flag for United States Minor Outlying Islands"
    	},
    	{
    		code: "US",
    		emoji: "🇺🇸",
    		unicode: "U+1F1FA U+1F1F8",
    		name: "United States",
    		title: "flag for United States"
    	},
    	{
    		code: "UY",
    		emoji: "🇺🇾",
    		unicode: "U+1F1FA U+1F1FE",
    		name: "Uruguay",
    		title: "flag for Uruguay"
    	},
    	{
    		code: "UZ",
    		emoji: "🇺🇿",
    		unicode: "U+1F1FA U+1F1FF",
    		name: "Uzbekistan",
    		title: "flag for Uzbekistan"
    	},
    	{
    		code: "VA",
    		emoji: "🇻🇦",
    		unicode: "U+1F1FB U+1F1E6",
    		name: "Vatican City",
    		title: "flag for Vatican City"
    	},
    	{
    		code: "VC",
    		emoji: "🇻🇨",
    		unicode: "U+1F1FB U+1F1E8",
    		name: "Saint Vincent and The Grenadines",
    		title: "flag for Saint Vincent and The Grenadines"
    	},
    	{
    		code: "VE",
    		emoji: "🇻🇪",
    		unicode: "U+1F1FB U+1F1EA",
    		name: "Venezuela",
    		title: "flag for Venezuela"
    	},
    	{
    		code: "VG",
    		emoji: "🇻🇬",
    		unicode: "U+1F1FB U+1F1EC",
    		name: "Virgin Islands, British",
    		title: "flag for Virgin Islands, British"
    	},
    	{
    		code: "VI",
    		emoji: "🇻🇮",
    		unicode: "U+1F1FB U+1F1EE",
    		name: "Virgin Islands, U.S.",
    		title: "flag for Virgin Islands, U.S."
    	},
    	{
    		code: "VN",
    		emoji: "🇻🇳",
    		unicode: "U+1F1FB U+1F1F3",
    		name: "Viet Nam",
    		title: "flag for Viet Nam"
    	},
    	{
    		code: "VU",
    		emoji: "🇻🇺",
    		unicode: "U+1F1FB U+1F1FA",
    		name: "Vanuatu",
    		title: "flag for Vanuatu"
    	},
    	{
    		code: "WF",
    		emoji: "🇼🇫",
    		unicode: "U+1F1FC U+1F1EB",
    		name: "Wallis and Futuna",
    		title: "flag for Wallis and Futuna"
    	},
    	{
    		code: "WS",
    		emoji: "🇼🇸",
    		unicode: "U+1F1FC U+1F1F8",
    		name: "Samoa",
    		title: "flag for Samoa"
    	},
    	{
    		code: "YE",
    		emoji: "🇾🇪",
    		unicode: "U+1F1FE U+1F1EA",
    		name: "Yemen",
    		title: "flag for Yemen"
    	},
    	{
    		code: "YT",
    		emoji: "🇾🇹",
    		unicode: "U+1F1FE U+1F1F9",
    		name: "Mayotte",
    		title: "flag for Mayotte"
    	},
    	{
    		code: "ZA",
    		emoji: "🇿🇦",
    		unicode: "U+1F1FF U+1F1E6",
    		name: "South Africa",
    		title: "flag for South Africa"
    	},
    	{
    		code: "ZM",
    		emoji: "🇿🇲",
    		unicode: "U+1F1FF U+1F1F2",
    		name: "Zambia",
    		title: "flag for Zambia"
    	},
    	{
    		code: "ZW",
    		emoji: "🇿🇼",
    		unicode: "U+1F1FF U+1F1FC",
    		name: "Zimbabwe",
    		title: "flag for Zimbabwe"
    	}
    ];

    var data$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': data
    });

    /**
     * lodash 3.0.4 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /** `Object#toString` result references. */
    var arrayTag = '[object Array]',
        funcTag = '[object Function]';

    /** Used to detect host constructors (Safari > 5). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /**
     * Checks if `value` is object-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /** Used for native method references. */
    var objectProto = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var fnToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objToString = objectProto.toString;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeIsArray = getNative(Array, 'isArray');

    /**
     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = object == null ? undefined : object[key];
      return isNative(value) ? value : undefined;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(function() { return arguments; }());
     * // => false
     */
    var isArray = nativeIsArray || function(value) {
      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
    };

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return isObject(value) && objToString.call(value) == funcTag;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (isFunction(value)) {
        return reIsNative.test(fnToString.call(value));
      }
      return isObjectLike(value) && reIsHostCtor.test(value);
    }

    var lodash_isarray = isArray;

    /**
     * lodash 3.0.6 (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]',
        arrayTag$1 = '[object Array]',
        boolTag = '[object Boolean]',
        dateTag = '[object Date]',
        errorTag = '[object Error]',
        funcTag$1 = '[object Function]',
        mapTag = '[object Map]',
        numberTag = '[object Number]',
        objectTag = '[object Object]',
        regexpTag = '[object RegExp]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        weakMapTag = '[object WeakMap]';

    var arrayBufferTag = '[object ArrayBuffer]',
        dataViewTag = '[object DataView]',
        float32Tag = '[object Float32Array]',
        float64Tag = '[object Float64Array]',
        int8Tag = '[object Int8Array]',
        int16Tag = '[object Int16Array]',
        int32Tag = '[object Int32Array]',
        uint8Tag = '[object Uint8Array]',
        uint8ClampedTag = '[object Uint8ClampedArray]',
        uint16Tag = '[object Uint16Array]',
        uint32Tag = '[object Uint32Array]';

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag$1] =
    typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
    typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
    typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag] = typedArrayTags[numberTag] =
    typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
    typedArrayTags[setTag] = typedArrayTags[stringTag] =
    typedArrayTags[weakMapTag] = false;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto$1.toString;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length,
     *  else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength$1(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$1(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike$1(value) &&
        isLength$1(value.length) && !!typedArrayTags[objectToString.call(value)];
    }

    var lodash_istypedarray = isTypedArray;

    /**
     * lodash 3.9.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /** `Object#toString` result references. */
    var funcTag$2 = '[object Function]';

    /** Used to detect host constructors (Safari > 5). */
    var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;

    /**
     * Checks if `value` is object-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     */
    function isObjectLike$2(value) {
      return !!value && typeof value == 'object';
    }

    /** Used for native method references. */
    var objectProto$2 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var fnToString$1 = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objToString$1 = objectProto$2.toString;

    /** Used to detect if a method is native. */
    var reIsNative$1 = RegExp('^' +
      fnToString$1.call(hasOwnProperty$1).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative$1(object, key) {
      var value = object == null ? undefined : object[key];
      return isNative$1(value) ? value : undefined;
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction$1(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return isObject$1(value) && objToString$1.call(value) == funcTag$2;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$1(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative$1(value) {
      if (value == null) {
        return false;
      }
      if (isFunction$1(value)) {
        return reIsNative$1.test(fnToString$1.call(value));
      }
      return isObjectLike$2(value) && reIsHostCtor$1.test(value);
    }

    var lodash__getnative = getNative$1;

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$2 = 9007199254740991;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]',
        funcTag$3 = '[object Function]',
        genTag = '[object GeneratorFunction]';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$3.toString;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject(value) && hasOwnProperty$2.call(value, 'callee') &&
        (!propertyIsEnumerable.call(value, 'callee') || objectToString$1.call(value) == argsTag$1);
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength$2(value.length) && !isFunction$2(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike$3(value) && isArrayLike(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction$2(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject$2(value) ? objectToString$1.call(value) : '';
      return tag == funcTag$3 || tag == genTag;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength$2(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$2(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$3(value) {
      return !!value && typeof value == 'object';
    }

    var lodash_isarguments = isArguments;

    /**
     * lodash 3.1.2 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /** Used to detect unsigned integer values. */
    var reIsUint = /^\d+$/;

    /** Used for native method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeKeys = lodash__getnative(Object, 'keys');

    /**
     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER$3 = 9007199254740991;

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * that affects Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /**
     * Checks if `value` is array-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     */
    function isArrayLike$1(value) {
      return value != null && isLength$3(getLength(value));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
      length = length == null ? MAX_SAFE_INTEGER$3 : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength$3(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$3;
    }

    /**
     * A fallback implementation of `Object.keys` which creates an array of the
     * own enumerable property names of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function shimKeys(object) {
      var props = keysIn(object),
          propsLength = props.length,
          length = propsLength && object.length;

      var allowIndexes = !!length && isLength$3(length) &&
        (lodash_isarray(object) || lodash_isarguments(object));

      var index = -1,
          result = [];

      while (++index < propsLength) {
        var key = props[index];
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty$3.call(object, key)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$3(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      var Ctor = object == null ? undefined : object.constructor;
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
          (typeof object != 'function' && isArrayLike$1(object))) {
        return shimKeys(object);
      }
      return isObject$3(object) ? nativeKeys(object) : [];
    };

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      if (object == null) {
        return [];
      }
      if (!isObject$3(object)) {
        object = Object(object);
      }
      var length = object.length;
      length = (length && isLength$3(length) &&
        (lodash_isarray(object) || lodash_isarguments(object)) && length) || 0;

      var Ctor = object.constructor,
          index = -1,
          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
          result = Array(length),
          skipIndexes = length > 0;

      while (++index < length) {
        result[index] = (index + '');
      }
      for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) &&
            !(key == 'constructor' && (isProto || !hasOwnProperty$3.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    var lodash_keys = keys;

    /**
     * lodash 3.0.7 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /** `Object#toString` result references. */
    var argsTag$2 = '[object Arguments]',
        arrayTag$2 = '[object Array]',
        boolTag$1 = '[object Boolean]',
        dateTag$1 = '[object Date]',
        errorTag$1 = '[object Error]',
        numberTag$1 = '[object Number]',
        objectTag$1 = '[object Object]',
        regexpTag$1 = '[object RegExp]',
        stringTag$1 = '[object String]';

    /**
     * Checks if `value` is object-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     */
    function isObjectLike$4(value) {
      return !!value && typeof value == 'object';
    }

    /** Used for native method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

    /**
     * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
     * of values.
     */
    var objToString$2 = objectProto$5.toString;

    /**
     * A specialized version of `_.some` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * The base implementation of `_.isEqual` without support for `this` binding
     * `customizer` functions.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject$4(value) && !isObjectLike$4(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objIsArr = lodash_isarray(object),
          othIsArr = lodash_isarray(other),
          objTag = arrayTag$2,
          othTag = arrayTag$2;

      if (!objIsArr) {
        objTag = objToString$2.call(object);
        if (objTag == argsTag$2) {
          objTag = objectTag$1;
        } else if (objTag != objectTag$1) {
          objIsArr = lodash_istypedarray(object);
        }
      }
      if (!othIsArr) {
        othTag = objToString$2.call(other);
        if (othTag == argsTag$2) {
          othTag = objectTag$1;
        } else if (othTag != objectTag$1) {
          othIsArr = lodash_istypedarray(other);
        }
      }
      var objIsObj = objTag == objectTag$1,
          othIsObj = othTag == objectTag$1,
          isSameTag = objTag == othTag;

      if (isSameTag && !(objIsArr || objIsObj)) {
        return equalByTag(object, other, objTag);
      }
      if (!isLoose) {
        var objIsWrapped = objIsObj && hasOwnProperty$4.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty$4.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
        }
      }
      if (!isSameTag) {
        return false;
      }
      // Assume cyclic values are equal.
      // For more information on detecting circular references see https://es5.github.io/#JO.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == object) {
          return stackB[length] == other;
        }
      }
      // Add `object` and `other` to the stack of traversed objects.
      stackA.push(object);
      stackB.push(other);

      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

      stackA.pop();
      stackB.pop();

      return result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing arrays.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var index = -1,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
        return false;
      }
      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index],
            result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

        if (result !== undefined) {
          if (result) {
            continue;
          }
          return false;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (isLoose) {
          if (!arraySome(other, function(othValue) {
                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              })) {
            return false;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} value The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag) {
      switch (tag) {
        case boolTag$1:
        case dateTag$1:
          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
          return +object == +other;

        case errorTag$1:
          return object.name == other.name && object.message == other.message;

        case numberTag$1:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object)
            ? other != +other
            : object == +other;

        case regexpTag$1:
        case stringTag$1:
          // Coerce regexes to strings and treat strings primitives and string
          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objProps = lodash_keys(object),
          objLength = objProps.length,
          othProps = lodash_keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isLoose) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isLoose ? key in other : hasOwnProperty$4.call(other, key))) {
          return false;
        }
      }
      var skipCtor = isLoose;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key],
            result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

        // Recursively compare objects (susceptible to call stack limits).
        if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
          return false;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (!skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$4(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    var lodash__baseisequal = baseIsEqual;

    /**
     * lodash 3.0.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /**
     * A specialized version of `baseCallback` which only supports `this` binding
     * and specifying the number of arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function bindCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity$1;
      }
      if (thisArg === undefined) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
        case 5: return function(value, other, key, object, source) {
          return func.call(thisArg, value, other, key, object, source);
        };
      }
      return function() {
        return func.apply(thisArg, arguments);
      };
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity$1(value) {
      return value;
    }

    var lodash__bindcallback = bindCallback;

    /**
     * lodash 3.0.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject(value) {
      return isObject$5(value) ? value : Object(value);
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$5(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Creates a two dimensional array of the key-value pairs for `object`,
     * e.g. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
     */
    function pairs(object) {
      object = toObject(object);

      var index = -1,
          props = lodash_keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    var lodash_pairs = pairs;

    /**
     * lodash 3.3.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /** Used to match property names within property paths. */
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
        reIsPlainProp = /^\w*$/,
        rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

    /** Used to match backslashes in property paths. */
    var reEscapeChar = /\\(\\)?/g;

    /**
     * Converts `value` to a string if it's not one. An empty string is returned
     * for `null` or `undefined` values.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      return value == null ? '' : (value + '');
    }

    /**
     * The base implementation of `_.callback` which supports specifying the
     * number of arguments to provide to `func`.
     *
     * @private
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function baseCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (type == 'function') {
        return thisArg === undefined
          ? func
          : lodash__bindcallback(func, thisArg, argCount);
      }
      if (func == null) {
        return identity$2;
      }
      if (type == 'object') {
        return baseMatches(func);
      }
      return thisArg === undefined
        ? property(func)
        : baseMatchesProperty(func, thisArg);
    }

    /**
     * The base implementation of `get` without support for string paths
     * and default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path of the property to get.
     * @param {string} [pathKey] The key representation of path.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path, pathKey) {
      if (object == null) {
        return;
      }
      if (pathKey !== undefined && pathKey in toObject$1(object)) {
        path = [pathKey];
      }
      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[path[index++]];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `_.isMatch` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} matchData The propery names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = toObject$1(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var result = customizer ? customizer(objValue, srcValue, key) : undefined;
          if (!(result === undefined ? lodash__baseisequal(srcValue, objValue, customizer, true) : result)) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.matches` which does not clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        var key = matchData[0][0],
            value = matchData[0][1];

        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value && (value !== undefined || (key in toObject$1(object)));
        };
      }
      return function(object) {
        return baseIsMatch(object, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to compare.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, srcValue) {
      var isArr = lodash_isarray(path),
          isCommon = isKey(path) && isStrictComparable(srcValue),
          pathKey = (path + '');

      path = toPath(path);
      return function(object) {
        if (object == null) {
          return false;
        }
        var key = pathKey;
        object = toObject$1(object);
        if ((isArr || !isCommon) && !(key in object)) {
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          if (object == null) {
            return false;
          }
          key = last(path);
          object = toObject$1(object);
        }
        return object[key] === srcValue
          ? (srcValue !== undefined || (key in object))
          : lodash__baseisequal(srcValue, object[key], undefined, true);
      };
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty$1(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      var pathKey = (path + '');
      path = toPath(path);
      return function(object) {
        return baseGet(object, path, pathKey);
      };
    }

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * Gets the propery names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = lodash_pairs(object),
          length = result.length;

      while (length--) {
        result[length][2] = isStrictComparable(result[length][1]);
      }
      return result;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
        return true;
      }
      if (lodash_isarray(value)) {
        return false;
      }
      var result = !reIsDeepProp.test(value);
      return result || (object != null && value in toObject$1(object));
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject$6(value);
    }

    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject$1(value) {
      return isObject$6(value) ? value : Object(value);
    }

    /**
     * Converts `value` to property path array if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array} Returns the property path array.
     */
    function toPath(value) {
      if (lodash_isarray(value)) {
        return value;
      }
      var result = [];
      baseToString(value).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array ? array.length : 0;
      return length ? array[length - 1] : undefined;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$6(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity$2(value) {
      return value;
    }

    /**
     * Creates a function that returns the property value at `path` on a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty$1(path) : basePropertyDeep(path);
    }

    var lodash__basecallback = baseCallback;

    /**
     * lodash 3.0.4 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /**
     * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER$4 = 9007199254740991;

    /**
     * The base implementation of `_.forEach` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `baseForIn` and `baseForOwn` which iterates
     * over `object` properties returned by `keysFunc` invoking `iteratee` for
     * each property. Iteratee functions may exit iteration early by explicitly
     * returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * The base implementation of `_.forOwn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return baseFor(object, iteratee, lodash_keys);
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty$2(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        var length = collection ? getLength$1(collection) : 0;
        if (!isLength$4(length)) {
          return eachFunc(collection, iteratee);
        }
        var index = fromRight ? length : -1,
            iterable = toObject$2(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var iterable = toObject$2(object),
            props = keysFunc(object),
            length = props.length,
            index = fromRight ? length : -1;

        while ((fromRight ? index-- : ++index < length)) {
          var key = props[index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * that affects Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength$1 = baseProperty$2('length');

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength$4(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$4;
    }

    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject$2(value) {
      return isObject$7(value) ? value : Object(value);
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject$7(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    var lodash__baseeach = baseEach;

    /**
     * lodash 3.0.0 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /**
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
     * without support for callback shorthands and `this` binding, which iterates
     * over `collection` using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @param {boolean} [retKey] Specify returning the key of the found element
     *  instead of the element itself.
     * @returns {*} Returns the found element or its key, else `undefined`.
     */
    function baseFind(collection, predicate, eachFunc, retKey) {
      var result;
      eachFunc(collection, function(value, key, collection) {
        if (predicate(value, key, collection)) {
          result = retKey ? key : value;
          return false;
        }
      });
      return result;
    }

    var lodash__basefind = baseFind;

    /**
     * lodash 3.6.0 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    var lodash__basefindindex = baseFindIndex;

    /**
     * lodash 3.2.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */


    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFind(eachFunc, fromRight) {
      return function(collection, predicate, thisArg) {
        predicate = lodash__basecallback(predicate, thisArg, 3);
        if (lodash_isarray(collection)) {
          var index = lodash__basefindindex(collection, predicate, fromRight);
          return index > -1 ? collection[index] : undefined;
        }
        return lodash__basefind(collection, predicate, eachFunc);
      };
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.result(_.find(users, function(chr) {
     *   return chr.age < 40;
     * }), 'user');
     * // => 'barney'
     *
     * // using the `_.matches` callback shorthand
     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.result(_.find(users, 'active', false), 'user');
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.result(_.find(users, 'active'), 'user');
     * // => 'barney'
     */
    var find = createFind(lodash__baseeach);

    var lodash_find = find;

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var data$2 = getCjsExportFromNamespace(data$1);

    var methods = {
      countryCode: function(countryCode) {
        if (!countryCode) {
          throw new Error('Expected 1 country code as the first argument');
        }

        return lodash_find(data$2, function(country) {
          return country.code === countryCode.toUpperCase();
        });
      },

      get data() {
        return data$2;
      }
    };

    ['emoji', 'code', 'name', 'unicode'].forEach(function(prop) {
      Object.defineProperty(methods, prop + 's', {
        get: function() {
          return data$2.map(function(country) {
            return country[prop];
          });
        }
      });
    });

    // TODO: figure out if this is a good idea
    data$2.forEach(function(prop, index) {
      methods[prop.code] = data$2[index];
    });

    var emojiFlags = methods;

    /* src\components\ui-kit\popup-items\popup-item-country.svelte generated by Svelte v3.18.2 */
    const file$2 = "src\\components\\ui-kit\\popup-items\\popup-item-country.svelte";

    function create_fragment$2(ctx) {
    	let li;
    	let span0;

    	let t0_value = (emojiFlags[/*alpha*/ ctx[1]]
    	? emojiFlags[/*alpha*/ ctx[1]].emoji
    	: "NONE") + "";

    	let t0;
    	let t1;
    	let span1;
    	let t2;
    	let t3;
    	let span2;
    	let t4;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(/*code*/ ctx[2]);
    			attr_dev(span0, "class", "popup-item__flag svelte-zg0gkw");
    			add_location(span0, file$2, 44, 4, 1004);
    			attr_dev(span1, "class", "popup-item__name svelte-zg0gkw");
    			add_location(span1, file$2, 45, 4, 1102);
    			attr_dev(span2, "class", "popup-item__code svelte-zg0gkw");
    			add_location(span2, file$2, 46, 4, 1152);
    			attr_dev(li, "class", "svelte-zg0gkw");
    			toggle_class(li, "active", /*active*/ ctx[3]);
    			add_location(li, file$2, 43, 0, 958);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(span0, t0);
    			append_dev(li, t1);
    			append_dev(li, span1);
    			append_dev(span1, t2);
    			append_dev(li, t3);
    			append_dev(li, span2);
    			append_dev(span2, t4);
    			dispose = listen_dev(li, "click", /*onItemClick*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*alpha*/ 2 && t0_value !== (t0_value = (emojiFlags[/*alpha*/ ctx[1]]
    			? emojiFlags[/*alpha*/ ctx[1]].emoji
    			: "NONE") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    			if (dirty & /*code*/ 4) set_data_dev(t4, /*code*/ ctx[2]);

    			if (dirty & /*active*/ 8) {
    				toggle_class(li, "active", /*active*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { alpha } = $$props;
    	let { code } = $$props;
    	let { active = false } = $$props;

    	const onItemClick = () => {
    		country.set(name);
    		focused.set("phone");
    	};

    	const writable_props = ["name", "alpha", "code", "active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Popup_item_country> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("alpha" in $$props) $$invalidate(1, alpha = $$props.alpha);
    		if ("code" in $$props) $$invalidate(2, code = $$props.code);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    	};

    	$$self.$capture_state = () => {
    		return { name, alpha, code, active };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("alpha" in $$props) $$invalidate(1, alpha = $$props.alpha);
    		if ("code" in $$props) $$invalidate(2, code = $$props.code);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    	};

    	return [name, alpha, code, active, onItemClick];
    }

    class Popup_item_country extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0, alpha: 1, code: 2, active: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup_item_country",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Popup_item_country> was created without expected prop 'name'");
    		}

    		if (/*alpha*/ ctx[1] === undefined && !("alpha" in props)) {
    			console.warn("<Popup_item_country> was created without expected prop 'alpha'");
    		}

    		if (/*code*/ ctx[2] === undefined && !("code" in props)) {
    			console.warn("<Popup_item_country> was created without expected prop 'code'");
    		}
    	}

    	get name() {
    		throw new Error("<Popup_item_country>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Popup_item_country>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alpha() {
    		throw new Error("<Popup_item_country>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alpha(value) {
    		throw new Error("<Popup_item_country>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get code() {
    		throw new Error("<Popup_item_country>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<Popup_item_country>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Popup_item_country>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Popup_item_country>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ui-kit\popups\popup-countries.svelte generated by Svelte v3.18.2 */
    const file$3 = "src\\components\\ui-kit\\popups\\popup-countries.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (59:12) {:else}
    function create_else_block(ctx) {
    	let current;
    	const popupitemcountry_spread_levels = [/*country*/ ctx[3]];
    	let popupitemcountry_props = {};

    	for (let i = 0; i < popupitemcountry_spread_levels.length; i += 1) {
    		popupitemcountry_props = assign(popupitemcountry_props, popupitemcountry_spread_levels[i]);
    	}

    	const popupitemcountry = new Popup_item_country({
    			props: popupitemcountry_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popupitemcountry.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popupitemcountry, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popupitemcountry_changes = (dirty & /*countries*/ 1)
    			? get_spread_update(popupitemcountry_spread_levels, [get_spread_object(/*country*/ ctx[3])])
    			: {};

    			popupitemcountry.$set(popupitemcountry_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popupitemcountry.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popupitemcountry.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popupitemcountry, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(59:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:12) {#if i === active}
    function create_if_block(ctx) {
    	let current;
    	const popupitemcountry_spread_levels = [/*country*/ ctx[3], { active: true }];
    	let popupitemcountry_props = {};

    	for (let i = 0; i < popupitemcountry_spread_levels.length; i += 1) {
    		popupitemcountry_props = assign(popupitemcountry_props, popupitemcountry_spread_levels[i]);
    	}

    	const popupitemcountry = new Popup_item_country({
    			props: popupitemcountry_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popupitemcountry.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popupitemcountry, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popupitemcountry_changes = (dirty & /*countries*/ 1)
    			? get_spread_update(popupitemcountry_spread_levels, [get_spread_object(/*country*/ ctx[3]), popupitemcountry_spread_levels[1]])
    			: {};

    			popupitemcountry.$set(popupitemcountry_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popupitemcountry.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popupitemcountry.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popupitemcountry, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:12) {#if i === active}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#each countries as country, i}
    function create_each_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[5] === /*active*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:8) {#each countries as country, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t;
    	let div;
    	let ul;
    	let div_transition;
    	let current;
    	let dispose;
    	let each_value = /*countries*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t = space();
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-16lzl4d");
    			add_location(ul, file$3, 54, 4, 1377);
    			attr_dev(div, "class", "popup svelte-16lzl4d");
    			add_location(div, file$3, 53, 0, 1292);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			dispose = [
    				listen_dev(document.body, "keydown", /*keyHandler*/ ctx[2], false, false, false),
    				listen_dev(div, "keydown", /*keyHandler*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*countries, active*/ 3) {
    				each_value = /*countries*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { countries } = $$props;
    	let active = -1;

    	const keyHandler = event => {
    		switch (event.key) {
    			case "ArrowDown":
    				$$invalidate(1, active++, active);
    				break;
    			case "ArrowUp":
    				$$invalidate(1, active--, active);
    				break;
    			case "Enter":
    				if (countries[active]) {
    					country.set(countries[active].name);
    					focused.set("phone");
    				}
    				break;
    		}
    	};

    	const writable_props = ["countries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Popup_countries> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("countries" in $$props) $$invalidate(0, countries = $$props.countries);
    	};

    	$$self.$capture_state = () => {
    		return { countries, active };
    	};

    	$$self.$inject_state = $$props => {
    		if ("countries" in $$props) $$invalidate(0, countries = $$props.countries);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    	};

    	return [countries, active, keyHandler];
    }

    class Popup_countries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { countries: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup_countries",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*countries*/ ctx[0] === undefined && !("countries" in props)) {
    			console.warn("<Popup_countries> was created without expected prop 'countries'");
    		}
    	}

    	get countries() {
    		throw new Error("<Popup_countries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countries(value) {
    		throw new Error("<Popup_countries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\checkbox.svelte generated by Svelte v3.18.2 */

    const file$4 = "src\\components\\checkbox.svelte";

    // (30:0) {#if label}
    function create_if_block$1(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", /*name*/ ctx[1]);
    			attr_dev(label_1, "class", "svelte-1113ob5");
    			add_location(label_1, file$4, 30, 4, 720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);

    			if (dirty & /*name*/ 2) {
    				attr_dev(label_1, "for", /*name*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(30:0) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let input;
    	let t;
    	let if_block_anchor;
    	let dispose;
    	let if_block = /*label*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			input.checked = /*checked*/ ctx[2];
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", /*name*/ ctx[1]);
    			attr_dev(input, "name", /*name*/ ctx[1]);
    			attr_dev(input, "class", "svelte-1113ob5");
    			add_location(input, file$4, 28, 0, 632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			dispose = listen_dev(input, "change", /*change_handler*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 4) {
    				prop_dev(input, "checked", /*checked*/ ctx[2]);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(input, "id", /*name*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(input, "name", /*name*/ ctx[1]);
    			}

    			if (/*label*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { label } = $$props;
    	let { name } = $$props;
    	let { checked = false } = $$props;
    	const writable_props = ["label", "name", "checked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("checked" in $$props) $$invalidate(2, checked = $$props.checked);
    	};

    	$$self.$capture_state = () => {
    		return { label, name, checked };
    	};

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("checked" in $$props) $$invalidate(2, checked = $$props.checked);
    	};

    	return [label, name, checked, change_handler];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { label: 0, name: 1, checked: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[0] === undefined && !("label" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'label'");
    		}

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'name'");
    		}
    	}

    	get label() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\button.svelte generated by Svelte v3.18.2 */
    const file$5 = "src\\components\\button.svelte";

    function create_fragment$5(ctx) {
    	let button;
    	let span;
    	let t;
    	let button_intro;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");

    			if (!default_slot) {
    				t = text("Button");
    			}

    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "svelte-1uap9ai");
    			add_location(span, file$5, 50, 1, 1155);
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			attr_dev(button, "class", "svelte-1uap9ai");
    			toggle_class(button, "loading", /*loading*/ ctx[2]);
    			toggle_class(button, "primary", /*variant*/ ctx[1] === "primary");
    			add_location(button, file$5, 49, 0, 1032);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!default_slot) {
    				append_dev(span, t);
    			}

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}

    			if (dirty & /*loading*/ 4) {
    				toggle_class(button, "loading", /*loading*/ ctx[2]);
    			}

    			if (dirty & /*variant*/ 2) {
    				toggle_class(button, "primary", /*variant*/ ctx[1] === "primary");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fly, { duration: 200, y: 100 });
    					button_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { type } = $$props;
    	let { variant } = $$props;
    	let { loading } = $$props;
    	const writable_props = ["type", "variant", "loading"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("variant" in $$props) $$invalidate(1, variant = $$props.variant);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type, variant, loading };
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("variant" in $$props) $$invalidate(1, variant = $$props.variant);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    	};

    	return [type, variant, loading, $$scope, $$slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { type: 0, variant: 1, loading: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !("type" in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}

    		if (/*variant*/ ctx[1] === undefined && !("variant" in props)) {
    			console.warn("<Button> was created without expected prop 'variant'");
    		}

    		if (/*loading*/ ctx[2] === undefined && !("loading" in props)) {
    			console.warn("<Button> was created without expected prop 'loading'");
    		}
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\helpers\click-outside.svelte generated by Svelte v3.18.2 */
    const file$6 = "src\\components\\helpers\\click-outside.svelte";

    function create_fragment$6(ctx) {
    	let t;
    	let div;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			t = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$6, 25, 0, 572);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[7](div);
    			current = true;
    			dispose = listen_dev(document.body, "click", /*onClickOutside*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[7](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { exclude = [] } = $$props;
    	let child;
    	const dispatch = createEventDispatcher();

    	const isExcluded = target => {
    		let parent = target;

    		while (parent) {
    			if (exclude.indexOf(parent) >= 0 || parent === child) {
    				return true;
    			}

    			parent = parent.parentNode;
    		}

    		return false;
    	};

    	function onClickOutside(event) {
    		if (!isExcluded(event.target)) {
    			dispatch("clickoutside");
    		}
    	}

    	const writable_props = ["exclude"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Click_outside> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, child = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("exclude" in $$props) $$invalidate(2, exclude = $$props.exclude);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { exclude, child };
    	};

    	$$self.$inject_state = $$props => {
    		if ("exclude" in $$props) $$invalidate(2, exclude = $$props.exclude);
    		if ("child" in $$props) $$invalidate(0, child = $$props.child);
    	};

    	return [
    		child,
    		onClickOutside,
    		exclude,
    		dispatch,
    		isExcluded,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class Click_outside extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { exclude: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Click_outside",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get exclude() {
    		throw new Error("<Click_outside>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set exclude(value) {
    		throw new Error("<Click_outside>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\login-form.svelte generated by Svelte v3.18.2 */
    const file$7 = "src\\pages\\login-form.svelte";

    // (100:12) {#if !$hideCountryPopup}
    function create_if_block_1(ctx) {
    	let current;

    	const countrypopup = new Popup_countries({
    			props: { countries: /*$countries*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(countrypopup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(countrypopup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const countrypopup_changes = {};
    			if (dirty & /*$countries*/ 32) countrypopup_changes.countries = /*$countries*/ ctx[5];
    			countrypopup.$set(countrypopup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countrypopup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countrypopup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(countrypopup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(100:12) {#if !$hideCountryPopup}",
    		ctx
    	});

    	return block;
    }

    // (97:4) <ClickOutside on:clickoutside={onClickOutside} >
    function create_default_slot_1(ctx) {
    	let div;
    	let t;
    	let current;
    	const countryinput = new Input_country({ $$inline: true });
    	countryinput.$on("focus", /*onCountryFocus*/ ctx[6]);
    	let if_block = !/*$hideCountryPopup*/ ctx[4] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(countryinput.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "input-group country svelte-wohgfo");
    			add_location(div, file$7, 97, 8, 2293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(countryinput, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*$hideCountryPopup*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countryinput.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countryinput.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(countryinput);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(97:4) <ClickOutside on:clickoutside={onClickOutside} >",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#if !$hideSubmit}
    function create_if_block$2(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "submit",
    				variant: "primary",
    				loading: /*loading*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};
    			if (dirty & /*loading*/ 2) button_changes.loading = /*loading*/ ctx[1];

    			if (dirty & /*$$scope*/ 4096) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(112:8) {#if !$hideSubmit}",
    		ctx
    	});

    	return block;
    }

    // (113:12) <Button type="submit" variant="primary" {loading}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("NEXT");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(113:12) <Button type=\\\"submit\\\" variant=\\\"primary\\\" {loading}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let t0;
    	let div3;
    	let img;
    	let img_src_value;
    	let t1;
    	let h1;
    	let t3;
    	let div0;
    	let t5;
    	let t6;
    	let form;
    	let div1;
    	let t7;
    	let div2;
    	let t8;
    	let current;
    	let dispose;

    	const clickoutside = new Click_outside({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	clickoutside.$on("clickoutside", /*onClickOutside*/ ctx[7]);
    	const phoneinput = new Input_phone({ $$inline: true });

    	const checkbox = new Checkbox({
    			props: {
    				checked: true,
    				name: "keep",
    				label: "Keep me signed in"
    			},
    			$$inline: true
    		});

    	let if_block = !/*$hideSubmit*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			div3 = element("div");
    			img = element("img");
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Sign in to Telegram";
    			t3 = space();
    			div0 = element("div");
    			div0.textContent = "Please confirm your country and enter your phone number";
    			t5 = space();
    			create_component(clickoutside.$$.fragment);
    			t6 = space();
    			form = element("form");
    			div1 = element("div");
    			create_component(phoneinput.$$.fragment);
    			t7 = space();
    			div2 = element("div");
    			create_component(checkbox.$$.fragment);
    			t8 = space();
    			if (if_block) if_block.c();
    			if (img.src !== (img_src_value = "./images/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Telegram logo");
    			attr_dev(img, "class", "logo svelte-wohgfo");
    			add_location(img, file$7, 93, 4, 2048);
    			add_location(h1, file$7, 94, 4, 2116);
    			attr_dev(div0, "class", "hint svelte-wohgfo");
    			add_location(div0, file$7, 95, 4, 2150);
    			attr_dev(div1, "class", "input-group svelte-wohgfo");
    			add_location(div1, file$7, 105, 8, 2614);
    			attr_dev(div2, "class", "keep svelte-wohgfo");
    			add_location(div2, file$7, 108, 8, 2693);
    			attr_dev(form, "action", "login");
    			attr_dev(form, "class", "svelte-wohgfo");
    			add_location(form, file$7, 104, 4, 2539);
    			attr_dev(div3, "class", "login-form svelte-wohgfo");
    			add_location(div3, file$7, 92, 0, 2001);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, img);
    			append_dev(div3, t1);
    			append_dev(div3, h1);
    			append_dev(div3, t3);
    			append_dev(div3, div0);
    			append_dev(div3, t5);
    			mount_component(clickoutside, div3, null);
    			append_dev(div3, t6);
    			append_dev(div3, form);
    			append_dev(form, div1);
    			mount_component(phoneinput, div1, null);
    			append_dev(form, t7);
    			append_dev(form, div2);
    			mount_component(checkbox, div2, null);
    			append_dev(form, t8);
    			if (if_block) if_block.m(form, null);
    			/*form_binding*/ ctx[10](form);
    			/*div3_binding*/ ctx[11](div3);
    			current = true;

    			dispose = [
    				listen_dev(document.body, "keydown", /*keyHandler*/ ctx[8], false, false, false),
    				listen_dev(form, "submit", /*submitHandle*/ ctx[9], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const clickoutside_changes = {};

    			if (dirty & /*$$scope, $countries, $hideCountryPopup*/ 4144) {
    				clickoutside_changes.$$scope = { dirty, ctx };
    			}

    			clickoutside.$set(clickoutside_changes);

    			if (!/*$hideSubmit*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(form, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clickoutside.$$.fragment, local);
    			transition_in(phoneinput.$$.fragment, local);
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clickoutside.$$.fragment, local);
    			transition_out(phoneinput.$$.fragment, local);
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			destroy_component(clickoutside);
    			destroy_component(phoneinput);
    			destroy_component(checkbox);
    			if (if_block) if_block.d();
    			/*form_binding*/ ctx[10](null);
    			/*div3_binding*/ ctx[11](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $hideSubmit;
    	let $hideCountryPopup;
    	let $countries;
    	validate_store(hideSubmit, "hideSubmit");
    	component_subscribe($$self, hideSubmit, $$value => $$invalidate(3, $hideSubmit = $$value));
    	validate_store(hideCountryPopup, "hideCountryPopup");
    	component_subscribe($$self, hideCountryPopup, $$value => $$invalidate(4, $hideCountryPopup = $$value));
    	validate_store(countries, "countries");
    	component_subscribe($$self, countries, $$value => $$invalidate(5, $countries = $$value));
    	let submit;
    	let loading = false;
    	let elem;

    	const onCountryFocus = () => {
    		focused.set("country");
    	};

    	const onClickOutside = () => {
    		focused.set("");
    	};

    	const keyHandler = event => {
    		if (event.key === "Enter" && !$hideSubmit) {
    			submit.dispatchEvent(new Event("submit"));
    		}
    	};

    	const submitHandle = event => {
    		event.preventDefault();

    		if (!$hideSubmit) {
    			$$invalidate(1, loading = true);
    			router.setRoute("login-code");
    		}
    	};

    	function form_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, submit = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, elem = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("submit" in $$props) $$invalidate(0, submit = $$props.submit);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("elem" in $$props) $$invalidate(2, elem = $$props.elem);
    		if ("$hideSubmit" in $$props) hideSubmit.set($hideSubmit = $$props.$hideSubmit);
    		if ("$hideCountryPopup" in $$props) hideCountryPopup.set($hideCountryPopup = $$props.$hideCountryPopup);
    		if ("$countries" in $$props) countries.set($countries = $$props.$countries);
    	};

    	return [
    		submit,
    		loading,
    		elem,
    		$hideSubmit,
    		$hideCountryPopup,
    		$countries,
    		onCountryFocus,
    		onClickOutside,
    		keyHandler,
    		submitHandle,
    		form_binding,
    		div3_binding
    	];
    }

    class Login_form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login_form",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\ui-kit\inputs\input-code.svelte generated by Svelte v3.18.2 */
    const file$8 = "src\\components\\ui-kit\\inputs\\input-code.svelte";

    function create_fragment$8(ctx) {
    	let input;
    	let t0;
    	let label;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Code";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "code");
    			attr_dev(input, "id", "code");
    			input.required = true;
    			add_location(input, file$8, 12, 0, 215);
    			add_location(label, file$8, 13, 0, 313);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			/*input_binding*/ ctx[5](input);
    			set_input_value(input, /*$code*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);

    			dispose = [
    				listen_dev(input, "change", /*change_handler*/ ctx[4], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$code*/ 2 && input.value !== /*$code*/ ctx[1]) {
    				set_input_value(input, /*$code*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[5](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $focused;
    	let $code;
    	validate_store(focused, "focused");
    	component_subscribe($$self, focused, $$value => $$invalidate(2, $focused = $$value));
    	validate_store(code, "code");
    	component_subscribe($$self, code, $$value => $$invalidate(1, $code = $$value));
    	let elem;

    	const onFocus = () => {
    		focused.set("code");
    	};

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, elem = $$value);
    		});
    	}

    	function input_input_handler() {
    		$code = this.value;
    		code.set($code);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elem" in $$props) $$invalidate(0, elem = $$props.elem);
    		if ("$focused" in $$props) focused.set($focused = $$props.$focused);
    		if ("$code" in $$props) code.set($code = $$props.$code);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$focused, elem*/ 5) {
    			 $focused === "code" && elem.focus();
    		}
    	};

    	return [
    		elem,
    		$code,
    		$focused,
    		onFocus,
    		change_handler,
    		input_binding,
    		input_input_handler
    	];
    }

    class Input_code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_code",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\pages\login-code.svelte generated by Svelte v3.18.2 */
    const file$9 = "src\\pages\\login-code.svelte";

    function create_fragment$9(ctx) {
    	let form;
    	let h1;
    	let t0;
    	let t1;
    	let div0;
    	let t3;
    	let div1;
    	let current;
    	const inputcode = new Input_code({ $$inline: true });

    	const block = {
    		c: function create() {
    			form = element("form");
    			h1 = element("h1");
    			t0 = text(/*$phone*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "We have sent you an SMS with code";
    			t3 = space();
    			div1 = element("div");
    			create_component(inputcode.$$.fragment);
    			add_location(h1, file$9, 39, 4, 824);
    			attr_dev(div0, "class", "hint svelte-n8pwqz");
    			add_location(div0, file$9, 40, 4, 847);
    			attr_dev(div1, "class", "input-group");
    			add_location(div1, file$9, 41, 4, 910);
    			attr_dev(form, "action", "code");
    			attr_dev(form, "class", "svelte-n8pwqz");
    			add_location(form, file$9, 38, 0, 798);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h1);
    			append_dev(h1, t0);
    			append_dev(form, t1);
    			append_dev(form, div0);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			mount_component(inputcode, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$phone*/ 1) set_data_dev(t0, /*$phone*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputcode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputcode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(inputcode);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $phone;
    	validate_store(phone, "phone");
    	component_subscribe($$self, phone, $$value => $$invalidate(0, $phone = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				focused.set("code");
    			},
    			0
    		);
    	});

    	code.subscribe(code => {
    		if (code.length > 4) {
    			router.setRoute("login-password");
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$phone" in $$props) phone.set($phone = $$props.$phone);
    	};

    	return [$phone];
    }

    class Login_code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login_code",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\ui-kit\inputs\input-password.svelte generated by Svelte v3.18.2 */
    const file$a = "src\\components\\ui-kit\\inputs\\input-password.svelte";

    function create_fragment$a(ctx) {
    	let input;
    	let t0;
    	let label;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Password";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "password");
    			attr_dev(input, "id", "password");
    			input.required = true;
    			add_location(input, file$a, 12, 0, 227);
    			add_location(label, file$a, 13, 0, 337);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			/*input_binding*/ ctx[5](input);
    			set_input_value(input, /*$password*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);

    			dispose = [
    				listen_dev(input, "change", /*change_handler*/ ctx[4], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$password*/ 2 && input.value !== /*$password*/ ctx[1]) {
    				set_input_value(input, /*$password*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[5](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $focused;
    	let $password;
    	validate_store(focused, "focused");
    	component_subscribe($$self, focused, $$value => $$invalidate(2, $focused = $$value));
    	validate_store(password, "password");
    	component_subscribe($$self, password, $$value => $$invalidate(1, $password = $$value));
    	let elem;

    	const onFocus = () => {
    		focused.set("password");
    	};

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, elem = $$value);
    		});
    	}

    	function input_input_handler() {
    		$password = this.value;
    		password.set($password);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("elem" in $$props) $$invalidate(0, elem = $$props.elem);
    		if ("$focused" in $$props) focused.set($focused = $$props.$focused);
    		if ("$password" in $$props) password.set($password = $$props.$password);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$focused, elem*/ 5) {
    			 $focused === "password" && elem.focus();
    		}
    	};

    	return [
    		elem,
    		$password,
    		$focused,
    		onFocus,
    		change_handler,
    		input_binding,
    		input_input_handler
    	];
    }

    class Input_password extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_password",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\pages\login-password.svelte generated by Svelte v3.18.2 */
    const file$b = "src\\pages\\login-password.svelte";

    // (50:4) <Button type="submit" variant="primary" {loading}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("NEXT");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(50:4) <Button type=\\\"submit\\\" variant=\\\"primary\\\" {loading}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let form;
    	let h1;
    	let t1;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let current;
    	let dispose;
    	const inputpassword = new Input_password({ $$inline: true });

    	const button = new Button({
    			props: {
    				type: "submit",
    				variant: "primary",
    				loading: /*loading*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Enter a password";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "We have sent you an SMS with code";
    			t3 = space();
    			div1 = element("div");
    			create_component(inputpassword.$$.fragment);
    			t4 = space();
    			create_component(button.$$.fragment);
    			t5 = text("`");
    			add_location(h1, file$b, 44, 4, 986);
    			attr_dev(div0, "class", "hint svelte-1dh96m5");
    			add_location(div0, file$b, 45, 4, 1017);
    			attr_dev(div1, "class", "input-group svelte-1dh96m5");
    			add_location(div1, file$b, 46, 4, 1080);
    			attr_dev(form, "action", "password");
    			attr_dev(form, "class", "svelte-1dh96m5");
    			add_location(form, file$b, 43, 0, 931);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h1);
    			append_dev(form, t1);
    			append_dev(form, div0);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			mount_component(inputpassword, div1, null);
    			append_dev(form, t4);
    			mount_component(button, form, null);
    			append_dev(form, t5);
    			current = true;
    			dispose = listen_dev(form, "submit", /*submitHandle*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};
    			if (dirty & /*loading*/ 1) button_changes.loading = /*loading*/ ctx[0];

    			if (dirty & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputpassword.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputpassword.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(inputpassword);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let loading = false;

    	onMount(() => {
    		focused.set("password");
    	});

    	const submitHandle = event => {
    		event.preventDefault();
    		$$invalidate(0, loading = true);
    		router.setRoute("register-page");
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    	};

    	return [loading, submitHandle];
    }

    class Login_password extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login_password",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\ui-kit\inputs\input-name.svelte generated by Svelte v3.18.2 */
    const file$c = "src\\components\\ui-kit\\inputs\\input-name.svelte";

    function create_fragment$c(ctx) {
    	let input;
    	let t0;
    	let label;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Name";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "name");
    			attr_dev(input, "id", "name");
    			input.required = true;
    			toggle_class(input, "invalid", /*invalid*/ ctx[0]);
    			add_location(input, file$c, 16, 0, 261);
    			add_location(label, file$c, 17, 0, 383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			/*input_binding*/ ctx[6](input);
    			set_input_value(input, /*$name*/ ctx[2]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);

    			dispose = [
    				listen_dev(input, "change", /*change_handler*/ ctx[5], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$name*/ 4 && input.value !== /*$name*/ ctx[2]) {
    				set_input_value(input, /*$name*/ ctx[2]);
    			}

    			if (dirty & /*invalid*/ 1) {
    				toggle_class(input, "invalid", /*invalid*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[6](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $focused;
    	let $name;
    	validate_store(focused, "focused");
    	component_subscribe($$self, focused, $$value => $$invalidate(3, $focused = $$value));
    	validate_store(name, "name");
    	component_subscribe($$self, name, $$value => $$invalidate(2, $name = $$value));
    	let { invalid } = $$props;
    	let elem;

    	const onFocus = () => {
    		focused.set("name");
    	};

    	const writable_props = ["invalid"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input_name> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, elem = $$value);
    		});
    	}

    	function input_input_handler() {
    		$name = this.value;
    		name.set($name);
    	}

    	$$self.$set = $$props => {
    		if ("invalid" in $$props) $$invalidate(0, invalid = $$props.invalid);
    	};

    	$$self.$capture_state = () => {
    		return { invalid, elem, $focused, $name };
    	};

    	$$self.$inject_state = $$props => {
    		if ("invalid" in $$props) $$invalidate(0, invalid = $$props.invalid);
    		if ("elem" in $$props) $$invalidate(1, elem = $$props.elem);
    		if ("$focused" in $$props) focused.set($focused = $$props.$focused);
    		if ("$name" in $$props) name.set($name = $$props.$name);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$focused, elem*/ 10) {
    			 $focused === "name" && elem.focus();
    		}
    	};

    	return [
    		invalid,
    		elem,
    		$name,
    		$focused,
    		onFocus,
    		change_handler,
    		input_binding,
    		input_input_handler
    	];
    }

    class Input_name extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { invalid: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_name",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*invalid*/ ctx[0] === undefined && !("invalid" in props)) {
    			console.warn("<Input_name> was created without expected prop 'invalid'");
    		}
    	}

    	get invalid() {
    		throw new Error("<Input_name>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Input_name>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ui-kit\inputs\input-last-name.svelte generated by Svelte v3.18.2 */
    const file$d = "src\\components\\ui-kit\\inputs\\input-last-name.svelte";

    function create_fragment$d(ctx) {
    	let input;
    	let t0;
    	let label;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Last Name(optional)";
    			input.required = true;
    			attr_dev(input, "type", "text");
    			attr_dev(input, "lastname", "lastName");
    			attr_dev(input, "id", "lastName");
    			add_location(input, file$d, 4, 0, 87);
    			add_location(label, file$d, 5, 0, 184);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$lastName*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);

    			dispose = [
    				listen_dev(input, "change", /*change_handler*/ ctx[1], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[2])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$lastName*/ 1 && input.value !== /*$lastName*/ ctx[0]) {
    				set_input_value(input, /*$lastName*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $lastName;
    	validate_store(lastName, "lastName");
    	component_subscribe($$self, lastName, $$value => $$invalidate(0, $lastName = $$value));

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		$lastName = this.value;
    		lastName.set($lastName);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$lastName" in $$props) lastName.set($lastName = $$props.$lastName);
    	};

    	return [$lastName, change_handler, input_input_handler];
    }

    class Input_last_name extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input_last_name",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\pages\register-page.svelte generated by Svelte v3.18.2 */
    const file$e = "src\\pages\\register-page.svelte";

    // (111:4) <Button on:click={onSubmit} type="submit" variant="primary" {loading}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("START MESSAGING");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(111:4) <Button on:click={onSubmit} type=\\\"submit\\\" variant=\\\"primary\\\" {loading}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let form;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let input;
    	let t2;
    	let h1;
    	let t4;
    	let div2;
    	let t6;
    	let div3;
    	let t7;
    	let div4;
    	let t8;
    	let current;
    	let dispose;

    	const inputname = new Input_name({
    			props: { invalid: /*nameInvalid*/ ctx[2] },
    			$$inline: true
    		});

    	const inputlastname = new Input_last_name({ $$inline: true });

    	const button = new Button({
    			props: {
    				type: "submit",
    				variant: "primary",
    				loading: /*loading*/ ctx[1],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*onSubmit*/ ctx[5]);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "Your Name";
    			t4 = space();
    			div2 = element("div");
    			div2.textContent = "Enter your name and add a profile picture";
    			t6 = space();
    			div3 = element("div");
    			create_component(inputname.$$.fragment);
    			t7 = space();
    			div4 = element("div");
    			create_component(inputlastname.$$.fragment);
    			t8 = space();
    			create_component(button.$$.fragment);
    			if (img.src !== (img_src_value = /*url*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "photo");
    			attr_dev(img, "class", "svelte-qqb58d");
    			toggle_class(img, "hide", !/*url*/ ctx[0]);
    			add_location(img, file$e, 98, 8, 2200);
    			attr_dev(div0, "class", "icon_display svelte-qqb58d");
    			toggle_class(div0, "hide", /*url*/ ctx[0]);
    			add_location(div0, file$e, 99, 2, 2251);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "svelte-qqb58d");
    			add_location(input, file$e, 100, 2, 2304);
    			attr_dev(div1, "class", "icon svelte-qqb58d");
    			add_location(div1, file$e, 97, 1, 2155);
    			add_location(h1, file$e, 102, 1, 2362);
    			attr_dev(div2, "class", "hint svelte-qqb58d");
    			add_location(div2, file$e, 103, 1, 2383);
    			attr_dev(div3, "class", "input-group svelte-qqb58d");
    			add_location(div3, file$e, 104, 1, 2451);
    			attr_dev(div4, "class", "input-group svelte-qqb58d");
    			add_location(div4, file$e, 107, 1, 2527);
    			attr_dev(form, "class", "svelte-qqb58d");
    			add_location(form, file$e, 96, 0, 2124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			append_dev(form, t2);
    			append_dev(form, h1);
    			append_dev(form, t4);
    			append_dev(form, div2);
    			append_dev(form, t6);
    			append_dev(form, div3);
    			mount_component(inputname, div3, null);
    			append_dev(form, t7);
    			append_dev(form, div4);
    			mount_component(inputlastname, div4, null);
    			append_dev(form, t8);
    			mount_component(button, form, null);
    			current = true;

    			dispose = [
    				listen_dev(input, "change", /*onFileChange*/ ctx[3], false, false, false),
    				listen_dev(div1, "drop", /*onDrop*/ ctx[4], false, false, false),
    				listen_dev(form, "submit", /*onSubmit*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*url*/ 1 && img.src !== (img_src_value = /*url*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*url*/ 1) {
    				toggle_class(img, "hide", !/*url*/ ctx[0]);
    			}

    			if (dirty & /*url*/ 1) {
    				toggle_class(div0, "hide", /*url*/ ctx[0]);
    			}

    			const inputname_changes = {};
    			if (dirty & /*nameInvalid*/ 4) inputname_changes.invalid = /*nameInvalid*/ ctx[2];
    			inputname.$set(inputname_changes);
    			const button_changes = {};
    			if (dirty & /*loading*/ 2) button_changes.loading = /*loading*/ ctx[1];

    			if (dirty & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputname.$$.fragment, local);
    			transition_in(inputlastname.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputname.$$.fragment, local);
    			transition_out(inputlastname.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(inputname);
    			destroy_component(inputlastname);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $name;
    	validate_store(name, "name");
    	component_subscribe($$self, name, $$value => $$invalidate(6, $name = $$value));
    	let url;
    	let loading;
    	let nameInvalid = false;

    	const onFileChange = e => {
    		const file = e.srcElement.files[0];

    		if (file) {
    			$$invalidate(0, url = window.URL.createObjectURL(new Blob([file])));
    		}
    	};

    	const onDrop = e => {
    		const file = e.dataTransfer.files[0];

    		if (file) {
    			$$invalidate(0, url = window.URL.createObjectURL(new Blob([file])));
    		}
    	};

    	const onSubmit = e => {
    		e.preventDefault();

    		if ($name.length > 0) {
    			$$invalidate(1, loading = true);
    			router.setRoute("chat-page");
    		} else {
    			$$invalidate(2, nameInvalid = true);
    		}
    	};

    	name.subscribe(() => {
    		$$invalidate(2, nameInvalid = false);
    	});

    	lastName.subscribe(() => {
    		$$invalidate(2, nameInvalid = false);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("nameInvalid" in $$props) $$invalidate(2, nameInvalid = $$props.nameInvalid);
    		if ("$name" in $$props) name.set($name = $$props.$name);
    	};

    	return [url, loading, nameInvalid, onFileChange, onDrop, onSubmit];
    }

    class Register_page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register_page",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\components\ui-kit\sidebar\sidebar-header.svelte generated by Svelte v3.18.2 */

    const file$f = "src\\components\\ui-kit\\sidebar\\sidebar-header.svelte";

    // (12:4) {#if more}
    function create_if_block$3(ctx) {
    	let ul;
    	let li;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			div.textContent = "Log Out";
    			if (img.src !== (img_src_value = "./icons/logout.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "logout__img");
    			add_location(img, file$f, 14, 3, 474);
    			attr_dev(div, "class", "more-list__text");
    			add_location(div, file$f, 15, 3, 529);
    			attr_dev(li, "class", "more-list__logout popup-item");
    			add_location(li, file$f, 13, 2, 428);
    			attr_dev(ul, "class", "more-list popup popup_hidden");
    			add_location(ul, file$f, 12, 1, 383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, div);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(12:4) {#if more}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let t2;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let dispose;
    	let if_block = /*more*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			div1.textContent = `${/*headerText*/ ctx[1]}`;
    			t2 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t3 = space();
    			if (if_block) if_block.c();
    			if (img0.src !== (img0_src_value = "./icons/back.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$f, 7, 31, 172);
    			attr_dev(div0, "class", "header__back icon");
    			add_location(div0, file$f, 7, 0, 141);
    			attr_dev(div1, "class", "header__title svelte-19132au");
    			add_location(div1, file$f, 8, 0, 215);
    			if (img1.src !== (img1_src_value = "./icons/more.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "More");
    			add_location(img1, file$f, 9, 61, 323);
    			attr_dev(div2, "class", "header__more icon");
    			add_location(div2, file$f, 9, 0, 262);
    			attr_dev(div3, "class", "sidebar__header header svelte-19132au");
    			add_location(div3, file$f, 6, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div2, t3);
    			if (if_block) if_block.m(div2, null);
    			dispose = listen_dev(div2, "click", /*click_handler*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*more*/ ctx[0]) {
    				if (!if_block) {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let headerButton;
    	let headerText = "Settings";
    	let more = false;
    	const click_handler = () => $$invalidate(0, more = !more);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("headerButton" in $$props) headerButton = $$props.headerButton;
    		if ("headerText" in $$props) $$invalidate(1, headerText = $$props.headerText);
    		if ("more" in $$props) $$invalidate(0, more = $$props.more);
    	};

    	return [more, headerText, headerButton, click_handler];
    }

    class Sidebar_header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar_header",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\components\ui-kit\sidebar\sidebar-info.svelte generated by Svelte v3.18.2 */

    const file$g = "src\\components\\ui-kit\\sidebar\\sidebar-info.svelte";

    function create_fragment$g(ctx) {
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			if (img.src !== (img_src_value = "")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "avatar avatar_big info__avatar_img");
    			add_location(img, file$g, 8, 27, 146);
    			attr_dev(div0, "class", "info__avatar");
    			add_location(div0, file$g, 8, 1, 120);
    			attr_dev(div1, "class", "info__name");
    			add_location(div1, file$g, 9, 1, 212);
    			attr_dev(div2, "class", "info__phone");
    			add_location(div2, file$g, 10, 1, 245);
    			attr_dev(div3, "class", "sidebar__info info svelte-162hkyi");
    			add_location(div3, file$g, 7, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self) {
    	let avatar; //from store
    	let name;
    	let phone;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("avatar" in $$props) avatar = $$props.avatar;
    		if ("name" in $$props) name = $$props.name;
    		if ("phone" in $$props) phone = $$props.phone;
    	};

    	return [];
    }

    class Sidebar_info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar_info",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\settings.svelte generated by Svelte v3.18.2 */
    const file$h = "src\\components\\settings.svelte";

    function create_fragment$h(ctx) {
    	let div5;
    	let t0;
    	let t1;
    	let ul;
    	let li0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let div0;
    	let t4;
    	let li1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div1;
    	let t7;
    	let li2;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let div2;
    	let t10;
    	let li3;
    	let img3;
    	let img3_src_value;
    	let t11;
    	let div3;
    	let t13;
    	let li4;
    	let img4;
    	let img4_src_value;
    	let t14;
    	let div4;
    	let current;
    	const settingsheader = new Sidebar_header({ $$inline: true });
    	const settingsinfo = new Sidebar_info({ $$inline: true });

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			create_component(settingsheader.$$.fragment);
    			t0 = space();
    			create_component(settingsinfo.$$.fragment);
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			img0 = element("img");
    			t2 = space();
    			div0 = element("div");
    			div0.textContent = "Edit profile";
    			t4 = space();
    			li1 = element("li");
    			img1 = element("img");
    			t5 = space();
    			div1 = element("div");
    			div1.textContent = "General settings";
    			t7 = space();
    			li2 = element("li");
    			img2 = element("img");
    			t8 = space();
    			div2 = element("div");
    			div2.textContent = "Notifications";
    			t10 = space();
    			li3 = element("li");
    			img3 = element("img");
    			t11 = space();
    			div3 = element("div");
    			div3.textContent = "Privacy and security";
    			t13 = space();
    			li4 = element("li");
    			img4 = element("img");
    			t14 = space();
    			div4 = element("div");
    			div4.textContent = "Language";
    			if (img0.src !== (img0_src_value = "./icons/edit.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "svelte-xb1aop");
    			add_location(img0, file$h, 12, 2, 367);
    			attr_dev(div0, "class", "settings-list__text svelte-xb1aop");
    			add_location(div0, file$h, 13, 2, 406);
    			attr_dev(li0, "class", "settings-list__item settings-list__edit svelte-xb1aop");
    			add_location(li0, file$h, 11, 1, 311);
    			if (img1.src !== (img1_src_value = "./icons/settings.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "svelte-xb1aop");
    			add_location(img1, file$h, 16, 2, 536);
    			attr_dev(div1, "class", "settings-list__text svelte-xb1aop");
    			add_location(div1, file$h, 17, 2, 579);
    			attr_dev(li1, "class", "settings-list__item settings-list__general-settings svelte-xb1aop");
    			add_location(li1, file$h, 15, 1, 468);
    			if (img2.src !== (img2_src_value = "./icons/unmute.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "svelte-xb1aop");
    			add_location(img2, file$h, 20, 2, 710);
    			attr_dev(div2, "class", "settings-list__text svelte-xb1aop");
    			add_location(div2, file$h, 21, 2, 751);
    			attr_dev(li2, "class", "settings-list__item settings-list__notifications svelte-xb1aop");
    			add_location(li2, file$h, 19, 1, 645);
    			if (img3.src !== (img3_src_value = "./icons/lock.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			attr_dev(img3, "class", "svelte-xb1aop");
    			add_location(img3, file$h, 24, 2, 873);
    			attr_dev(div3, "class", "settings-list__text svelte-xb1aop");
    			add_location(div3, file$h, 25, 2, 912);
    			attr_dev(li3, "class", "settings-list__item settings-list__privacy svelte-xb1aop");
    			add_location(li3, file$h, 23, 1, 814);
    			if (img4.src !== (img4_src_value = "./icons/language.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			attr_dev(img4, "class", "svelte-xb1aop");
    			add_location(img4, file$h, 28, 2, 1042);
    			attr_dev(div4, "class", "settings-list__text svelte-xb1aop");
    			add_location(div4, file$h, 29, 2, 1085);
    			attr_dev(li4, "class", "settings-list__item settings-list__language svelte-xb1aop");
    			add_location(li4, file$h, 27, 1, 982);
    			attr_dev(ul, "class", "settings-list svelte-xb1aop");
    			add_location(ul, file$h, 10, 0, 282);
    			attr_dev(div5, "class", "sidebar sidebar_left settings svelte-xb1aop");
    			add_location(div5, file$h, 5, 0, 189);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			mount_component(settingsheader, div5, null);
    			append_dev(div5, t0);
    			mount_component(settingsinfo, div5, null);
    			append_dev(div5, t1);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(li0, img0);
    			append_dev(li0, t2);
    			append_dev(li0, div0);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, img1);
    			append_dev(li1, t5);
    			append_dev(li1, div1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, img2);
    			append_dev(li2, t8);
    			append_dev(li2, div2);
    			append_dev(ul, t10);
    			append_dev(ul, li3);
    			append_dev(li3, img3);
    			append_dev(li3, t11);
    			append_dev(li3, div3);
    			append_dev(ul, t13);
    			append_dev(ul, li4);
    			append_dev(li4, img4);
    			append_dev(li4, t14);
    			append_dev(li4, div4);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settingsheader.$$.fragment, local);
    			transition_in(settingsinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settingsheader.$$.fragment, local);
    			transition_out(settingsinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(settingsheader);
    			destroy_component(settingsinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\pages\chat-page.svelte generated by Svelte v3.18.2 */

    function create_fragment$i(ctx) {
    	let current;
    	const settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Chat_page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chat_page",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.2 */
    const file$i = "src\\App.svelte";

    function create_fragment$j(ctx) {
    	let main;
    	let current;
    	const switch_instance_spread_levels = [/*$router*/ ctx[0].props];
    	var switch_value = /*routes*/ ctx[1][/*$router*/ ctx[0].route];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "class", "svelte-1bevzhp");
    			add_location(main, file$i, 51, 0, 1170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*$router*/ 1)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*$router*/ ctx[0].props)])
    			: {};

    			if (switch_value !== (switch_value = /*routes*/ ctx[1][/*$router*/ ctx[0].route])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $router;
    	validate_store(router, "router");
    	component_subscribe($$self, router, $$value => $$invalidate(0, $router = $$value));

    	const routes = {
    		"login-form": Login_form,
    		"login-code": Login_code,
    		"register-page": Register_page,
    		"login-password": Login_password,
    		"chat-page": Chat_page
    	};

    	router.setRoute("chat-page");

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$router" in $$props) router.set($router = $$props.$router);
    	};

    	return [$router, routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
