(function() {
    var MAX_RESULTS = 20;

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
            };

        return {
            populate: function( people ) {
                people.forEach(function(p) {
                    var str = p.fuzzy || p.name;

                    _people.push([str, p])
                });
                _people_count = _people.length;
            },

            match: function( str ) {
                var results = [], cpt=0;

                reg = fuzzyCache( str );

                for (var i=0; i<_people_count; i++) {
                    if (reg.test(_people[i][0])) {
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
            root.innerHTML = Mustache.render(tpl, {
                people: fuzzy.match(query)
            });
        };
    })();

    loadPeopleJSON(function( data ) {
        var people = JSON.parse(data),
            q      = document.getElementById('q');

        fuzzy.populate(people);

        q.addEventListener('keypress', function() {
            updateSuggestions(q.value);
        }, false);

        // debug
        window._fuzzy = fuzzy;
        window._up = updateSuggestions;
    });

})();
