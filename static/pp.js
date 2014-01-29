(function() {
    var MAX_RESULTS = 20,
        MAX_LEVENSHTEIN = 2;

    // fuzzy matching
    var fuzzy = (function() {
        var _people = [],
            _people_count = 0,
            _cache = {},
            fuzzyCache = function( str ) {
                var reg;

                if (_cache.hasOwnProperty(str)) {
                    return _cache[str];
                }

                var reg = new RegExp(str.replace(/\W/, ''), 'i');

                return _cache[str] = reg;
            },
            // from http://bit.ly/levenshtein-wikipedia
            // the first string should be user input while the second should
            // be the compared string
            levenshtein = function( str1, str2 ) {
                var l1 = str1.length, l2 = str2.length,
                    v0, v1, i, j, cost;

                str1 = str1.toLocaleLowerCase();

                // we don't even try on little strings
                if (l1 < 4) { return 10; }

                if (str1 == str2) { return 0; }
                if (l1 == 0) { return l2; }
                if (l2 == 0) { return l1; }

                v0 = [];
                v1 = [];

                for (i=0; i<=l2; i++) {
                    v0[i] = i;
                }

                for (i=0; i<l1; i++) {
                    v1[0] = i + 1;

                    for (j=0; j<l2; j++) {
                        cost = str1[i] == str2[j] ? 0 : 1;
                        v1[j+1] = Math.min(v1[j] + 1, v0[j+1]+1, v0[j] + cost);
                    }

                    v0 = v1;
                }

                cost = v1[l2];

                // added because "foobarfoobar" should not match "foo"
                if (l1 > l2) {
                    cost += l1 - l2;
                }

                return cost;
            };

        return {
            populate: function( people ) {
                people.forEach(function(p) {
                    var str = p.fuzzy || p.name;

                    _people.push([str.toLocaleLowerCase(), p])
                });
                _people_count = _people.length;
            },

            match: function( str ) {
                var results = [], cpt=0, i, pstr;

                reg = fuzzyCache( str );

                for (i=0; i<_people_count; i++) {
                    pstr = _people[i][0];
                    if (reg.test(pstr)
                            || levenshtein(str, pstr) < MAX_LEVENSHTEIN) {
                        results.push(_people[i][1]);
                        if (++cpt >= MAX_RESULTS) {
                            break;
                        }
                    }
                }

                return results;
            },

            people: function() {
                return _people;
            }
        };
    })();

    // load people info
    function loadPeopleJSON( cb ) {

        function asyncLoad() {
            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    localStorage.setItem('pp.people', xmlhttp.responseText);
                    localStorage.setItem('pp.date', Date.now());
                    cb(xmlhttp.responseText);
                }
            }
            xmlhttp.open('GET', '/json', true);
            xmlhttp.send();
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
        var tpl  = document.getElementById('sgtpl').innerHTML,
            root = document.getElementById('suggs');

        Mustache.parse(tpl);

        return function( query ) {
            // inefficient but ok for now
            if (!query) { return root.innerHTML = ''; }
            root.innerHTML = Mustache.render(tpl, {
                people: fuzzy.match(query)
            });
        };
    })();

    loadPeopleJSON(function( data ) {
        var people = JSON.parse(data),
            q      = document.getElementById('q'),
            up     = function( e ) {

                var query = q.value +
                                String.fromCharCode(e.charCode || e.keyCode);

                updateSuggestions(query > 0 ? query : null);
            };

        fuzzy.populate(people);

        q.addEventListener('keypress', up, false);
        q.addEventListener('keydown', up, false);

        // debug
        window._fuzzy = fuzzy;
        window._up = updateSuggestions;
    });

})();
