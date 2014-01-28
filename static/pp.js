(function() {
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

                var reg = new RegExp(
                        str.split('').replace(/\W/, '').split('').join('\\w*'));

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
                var results = [];

                reg = fuzzyCache( str );

                for (var i=0; i<_people_count; i++) {
                    if (reg.test(_people[i][0])) {
                        results.push(_people[i][1]);
                    }
                }
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
            xmlhttp.open('GET', '/static/people.json', true);
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

        return localStorage.getItem('pp.people');
    }

    loadPeopleJSON(function( data ) {
        var people = JSON.parse(data);

        fuzzy.populate(people);

        // code here

        // debug
        window._people = people;
        window._fuzzy = fuzzy;
    });

})();