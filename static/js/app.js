var app = angular.module('pp', ['mgo-mousetrap']);

app.config(['$interpolateProvider', function($interpolateProvider) {
  $interpolateProvider.startSymbol('_{')
                      .endSymbol('}_');
}]);

app.controller('suggsCtrl', ['$scope', '$http', function ($scope, $http) {
    // just to set the focus
    var q = document.querySelector('input');

    $scope.people = $scope.results = [];
    $scope.query = '';
    $scope.cursor = 0;

    var _query_cache = {};
    function query() {
        if ($scope.query in _query_cache) {
            return _query_cache[$scope.query];
        }
        return (_query_cache[$scope.query] = new RegExp(
            $scope.query.replace(/^\s+|\s+$/, '')  // trailing spaces
                        .replace(/\s+/g, ' ')      // multiple spaces
                        .replace(/[^'\w -]/g, ''), // special chars
            'i'));
    }

    // filter
    $scope.matches = function(p) {
        return $scope.query && query().test(p.fuzzy || p.name);
    };

    // selection

    function eventListener(fn) {
        var that = this;
        return function(ev) {
            ev.preventDefault();
            return fn.call(that);
        };
    }

    function selection() {
        return $scope.results[$scope.cursor];
    }

    function go(step) {
        return eventListener(function(ev) {
            $scope.cursor += step;
            checkCursor();
        });
    }

    $scope.goUp = go(-1);
    $scope.goDown = go(1);

    function checkCursor() {
        var max = $scope.results.length - 1;
        if ($scope.cursor < 0) { $scope.cursor = 0; }
        else if ($scope.cursor > max) { $scope.cursor = max; }
    }

    $scope.$watch('results.length', checkCursor);

    $scope.complete = eventListener(function(ev) {
        var sel = selection();
        if (sel) {
            $scope.query = sel.name;
        } else {
            q.focus();
        }
    });

    $scope.open = eventListener(function() {
        var sel = selection();
        if (sel) {
            document.location = selection().url;
        }
    });

    $scope.openNewTab = eventListener(function() {
        var sel = selection();
        if (sel) {
            window.open(selection().url, '_blank');
        }
    });

    $scope.setCursor = function(c) {
        $scope.cursor = c;
        q.focus();
    };

    $http.get('/json').success(function(ppl) {
        var preloaded_icons = {}, i, img;

        for (var k in ppl) {
            $scope.people.push(ppl[k]);

            // preload icons
            i = ppl[k].icon;

            if (!(i in preloaded_icons)) {
                img = new Image();
                img.src = '/static/imgs/icons/' + (preloaded_icons[i] = i);
            }
        }
    });

    // DOM init
    q.focus();
    window.setTimeout(function() {
        // disable autocomplete again if it was enabled
        // by a browser extension in the meantime
        q.setAttribute('autocomplete', 'off');
    }, 500);
}]);
