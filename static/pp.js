(function() {
    var Mustache = window.Mustache,
        //Fuse = window.Fuse,
        MAX_RESULTS = 10,

        // will be optimized by the minifier
        pp_tpl = "{{#people}}"
               + '<li class="people-container">'
                 + '<a href="{{{url}}}" class="people" data-id="{{id}}">'
                   + '<img src="/static/icons/{{icon}}" class="icon" />'
                     + '<p class="info"><b class="name">{{name}}</b>'
                               + '<span class="details">{{info}}</span>'
                     + '</p>'
                   + '</a>'
                 + '</li>'
               + '{{/people}}';

    // fuzzy matching
    var fuzzy = (function() {
        var _people = [],      // people list
            _people_count = 0, // people list count
            _cache = {},       // regex cache for each name
            _fuse,
            fuzzyCache = function( str ) {
                var reg;

                if (_cache.hasOwnProperty(str)) {
                    return _cache[str];
                }

                str = str.replace(/\s+/g, ' ')
                         .replace(/[^\w ]/g, '');

                var reg = new RegExp(str, 'i');

                return _cache[str] = reg;
            };

        return {
            populate: function( people ) {
                var opts = {};
                _people = Object.keys(people).map(function(k) {
                    return people[k];
                });
                _people_count = _people.length;

                //opts['keys'] = [ 'name' ];
                //opts['distance'] = 12;
                //opts['threshold'] = 0.0;
                //
                //_fuse = new Fuse(_people, opts);
            },

            match: function( str ) {
                var results = [], cpt=0, i, p;

                reg = fuzzyCache( str );

                for (i=0; i<_people_count; i++) {
                    p = _people[i];
                    if (reg.test(p['fuzzy'] || p['name'])) {
                        results.push(p);
                        if (++cpt >= MAX_RESULTS) {
                            break;
                        }
                    }
                }

                // if the regex test doesn't give any result, fallback to
                // fuzzy search
                //if (results.length == 0 && str.length < 32) {
                //    return _fuse.search(str);
                //}

                return results;
            }
        };
    })();

    function ajax(opts) {
        var xmlhttp = new XMLHttpRequest(),

            mth  = opts.method || 'GET',
            path = opts.path || '/',
            cb   = opts.callback || function(){},
            data = opts.data || null;

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                cb(xmlhttp.responseText);
            }
        }
        xmlhttp.open(mth, path, true);

        if (mth == 'POST') {
            xmlhttp.setRequestHeader('Content-type',
                                     'application/x-www-form-urlencoded');
        }
        xmlhttp.send(data);
    }

    // load people info
    function loadPeopleJSON( cb ) {

        function asyncLoad() {
            ajax({
                path: '/json',
                callback: function( data ) {
                    localStorage.setItem('pp.people', data);
                    localStorage.setItem('pp.date', Date.now());
                    cb(data);
                }
            });
        }

        if (!window.localStorage) { // no support for localStorage
            return asyncLoad();
        }

        var lastUpdate = localStorage.getItem('pp.date');

        // if field doesn't exist or we didn't update since 48 hours
        if (!lastUpdate || Date.now() > +lastUpdate + 172800000) {
            return asyncLoad();
        }

        return cb(localStorage.getItem('pp.people'));
    }

    var updateSuggestions = (function() {
        var root = document.getElementById('suggs');

        Mustache.parse(pp_tpl);

        return function( query ) {
            var fields = {};

            // inefficient but ok for now
            if (!query) { return root.innerHTML = ''; }

            // using this prevents the 'people' key from being crushed by
            // Google Clojure Compiler
            fields['people'] = fuzzy.match(query);

            root.innerHTML = Mustache.render(pp_tpl, fields);
        };
    })();

    loadPeopleJSON(function( data ) {
        var people = JSON.parse(data),
            q      = document.getElementById('q'),
            prev_q = '',
            up     = function( e ) {
                var query = q.value;
                if (query != prev_q) {
                    updateSuggestions(query ? query : null);
                }
                prev_q = query;
            };

        // init
        q.focus()
        fuzzy.populate(people);
        q.addEventListener('keyup', up, false);

        // click feedback
        document.body.addEventListener('mousedown', function( e ) {
            var el = e.target || e.srcElement,
                tag = el.tagName.toLocaleLowerCase();

            while (tag != 'a') {
                el = el.parentElement;

                if (!el) { return; }

                tag = el.tagName.toLocaleLowerCase();

                if (tag == 'body' || tag == 'html') {
                    return;
                }
            }

            var key = el.getAttribute('data-id');

            if (key) {
                ajax({
                    path: '/click',
                    method: 'POST',
                    data: 'key='+key+'&query='+q.value
                });
            }

        }, false);
    });

})();
