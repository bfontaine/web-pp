(function() {
    var Mustache  = window.Mustache,
        Mousetrap = window.Mousetrap,
        //Fuse = window.Fuse,
        MAX_RESULTS = 8,

        // will be optimized by the minifier
        pp_tpl = "{{#people}}"
               + '<li class="people-container" data-n="{{n}}">'
                 + '<a href="{{{url}}}" class="people" data-id="{{id}}">'
                   + '<img src="/static/icons/{{icon}}" class="icon" />'
                     + '<p class="info"><b class="name">{{name}}</b>'
                               + '<span class="details">{{info}}</span>'
                     + '</p>'
                   + '</a>'
                 + '</li>'
               + '{{/people}}',

        // minify++
        document = window.document,

        suggs = [],
        suggs_cursor = -1,
        suggs_root = document.getElementById('suggs'),

        // dynamic array
        lis = document.getElementsByTagName('li');

    // pre-parse the template
    Mustache.parse(pp_tpl);

    var cleanQuery = function( str ) {
            if (!str) { return str; }

            return str.replace(/^\s+|\s+$/, '')  // trailing spaces
                      .replace(/\s+/g, ' ')      // multiple spaces
                      .replace(/[^'-\w ]/g, ''); // special chars
        },

    // fuzzy matching
        fuzzy = (function() {
            var _people = [],      // people list
                _people_count = 0, // people list count
                _cache = {},       // regex cache for each name
                //_fuse,
                _preloaded_icons = {};
                
            function fuzzyCache( str ) {
                var reg;

                if (_cache.hasOwnProperty(str)) {
                    return _cache[str];
                }

                return _cache[str] = new RegExp(str, 'i');
            }

            function addNumbers( ary ) {
                var i, l=ary.length;
                for (i=0; i<l; i++) {
                    ary[i] && (ary[i]['n'] = i);
                }

                return ary;
            }

            return {
                populate: function( people ) {
                    var opts = {}, i, icon, img;
                    _people = Object.keys(people).map(function(k) {
                        return people[k];
                    });
                    _people_count = _people.length;

                    //opts['keys'] = [ 'name' ];
                    //opts['distance'] = 12;
                    //opts['threshold'] = 0.0;
                    //
                    //_fuse = new Fuse(_people, opts);

                    // preload images
                    for (i=0; i<_people_count; i++) {
                        icon = _people[i]['icon'];
                        if (_preloaded_icons[icon]) {
                            continue;
                        }
                        img = new Image();
                        img.src = '/static/icons/' + icon;
                        _preloaded_icons[icon] = true;
                    }
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
                    //    return suggs = addNumbers(_fuse.search(str));
                    //}

                    return suggs = addNumbers(results);
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
        ajax({
            path: '/json',
            callback: cb
        });
    }

    loadPeopleJSON(function( data ) {
            updateSuggestions = function( query ) {
                var fields = {};

                query = cleanQuery( query );

                // using this prevents the 'people' key from being crushed
                // by Google Clojure Compiler
                fields['people'] = query ? fuzzy.match(query) : [];

                suggs_cursor = suggs.length ? 0 : -1;

                suggs_root.innerHTML = Mustache.render(pp_tpl, fields);

                window.setTimeout(updateSelectedElement, 5);
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

            if (l == 0 || suggs_cursor < 0 || suggs_cursor >= l) {
                return;
            }

            by = by || 0;

            if (suggs_cursor + by < 0
                || suggs_cursor + by >= l) { return; }

            suggs_cursor += by;

            // classList: IE 10+, iOS 5+, Android 3+, no Opera Mini

            [].forEach.call(lis, function(li) {
                li.classList.remove('selected');
            });

            lis[suggs_cursor].classList.add('selected');
        }

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
            var li = lis[suggs_cursor], a, link;

            if (!li) { return; }

            a = li.childNodes[0];
            if (!a) { return; }

            link = a.getAttribute('href');
            clickFeedback(a.getAttribute('data-id'));

            newTab ? window.open(link, '_blank') : document.location = link;
        }
        function completeResult( e ) {
            var li = lis[suggs_cursor], name;

            if ( li && (name = li.getElementsByClassName('name')[0]) ) {
                q.value = name.textContent || name.innerText;
            }

            e.preventDefault();
            return false;
        }

        // keyboard shortcuts
        Mousetrap.bind('up',   selectPreviousResult);
        Mousetrap.bind('down', selectNextResult);
        Mousetrap.bind('enter', function() { openResult(); });
        Mousetrap.bind(['mod+enter', 'shift+enter'], function() {
            openResult(true); });
        Mousetrap.bind('tab', function( e ) {
            if (document.activeElement == q) {
                completeResult( e );
            }
        });

        suggs_root.addEventListener('mouseover', function( e ) {
            var el = e.target || e.which, n;

            e.stopPropagation();

            while(!el.className || el.className.indexOf('people-container') == -1) {
                el = el.parentElement;

                if (!el || el.tagName == 'body') { return; }
            }

            n = +el.getAttribute('data-n');

            if (!isNaN(n)) {
                updateSelectedElement(n - suggs_cursor);
            }

        }, false);

        // click feedback
        function clickFeedback( key ) {
            ajax({
                path: '/click',
                method: 'POST',
                data: 'key='+key+'&query='+q.value
            });
        }
        suggs_root.addEventListener('mousedown', function( e ) {
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
