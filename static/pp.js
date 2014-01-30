(function() {
    var Mustache  = window.Mustache,
        Mousetrap = window.Mousetrap,
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
               + '{{/people}}',

        suggs = [],
        suggs_cursor = -1,

        // dynamic array
        lis = document.getElementsByTagName('li');

    Mustache.parse(pp_tpl);

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
                //    return suggs = _fuse.search(str);
                //}

                return suggs = results;
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

    loadPeopleJSON(function( data ) {
        var root = document.getElementById('suggs'),
            updateSuggestions = function( query ) {
                var fields = {};

                // using this prevents the 'people' key from being crushed
                // by Google Clojure Compiler
                fields['people'] = query ? fuzzy.match(query) : [];

                suggs_cursor = suggs.length ? 0 : -1;

                root.innerHTML = Mustache.render(pp_tpl, fields);

                window.setTimeout(updateSelectedElement, 10);
            },
        
            people = JSON.parse(data),
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

        function updateSelectedElement( by ) {
            var l = lis.length;

            by = by || 0;

            if (by < 0 && suggs_cursor <= 0) {
                return;
            }

            if (by > 0 && suggs_cursor >= l-1) {
                return;
            }

            suggs_cursor += by;

            if (l == 0 || suggs_cursor < 0 || suggs_cursor >= l) {
                return;
            }

            // classList: IE 10+, iOS 5+, Android 3+, no Opera Mini

            [].forEach.call(lis, function(li) {
                li.classList.remove('selected');
            });

            lis[suggs_cursor].classList.add('selected');
        }

        // keyboard shortcuts
        function selectPreviousResult( e ) {
            updateSelectedElement(-1);
            e.preventDefault();
            return false;
        }
        function selectNextResult( e ) {
            updateSelectedElement(1);
            e.preventDefault();
            return false;
        }
        function openResult( newTab ) {
            // TODO
            console.log('open result' + (newTab ? ' in a new tab.' : ''));
        }
        function completeResult( e ) {
            var li = lis[suggs_cursor], name;

            if ( li && (name = li.getElementsByClassName('name')[0]) ) {
                q.value = name.textContent || name.innerText;
            }

            e.preventDefault();
            return false;
        }

        Mousetrap.bind('up',   selectPreviousResult);
        Mousetrap.bind('down', selectNextResult);
        Mousetrap.bind('enter', function() { openResult(); });
        Mousetrap.bind('mod+enter', function() { openResult(true); });
        Mousetrap.bind('tab', function( e ) {
            if (document.activeElement == q) {
                completeResult( e );
            }
        });

        // click feedback
        function clickFeedback( key ) {
            ajax({
                path: '/click',
                method: 'POST',
                data: 'key='+key+'&query='+q.value
            });
        }
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
                clickFeedback( key );
            }

        }, false);
    });

})();
