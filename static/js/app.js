var app = angular.module('pp', ['mgo-mousetrap']);

app.config(['$interpolateProvider', function($interpolateProvider) {
  $interpolateProvider.startSymbol('[')
                      .endSymbol(']');
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
                      //.replace(/[^'\w -]/g, '')  // special chars
                        // special regex chars
                        .replace(/([\.\[(){])/, '\\$1')
                        // accents
                        .replace(/a/g, '[aâäà]')
                        .replace(/e/g, '[eêëéè]')
                        .replace(/i/g, '[iîï]')
                        .replace(/o/g, '[oôö]')
                        .replace(/u/g, '[uûüù]')
                        .replace(/c/g, '[cç]'),
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
            var args = [].slice.call(arguments);
            ev.preventDefault();
            return fn.apply(that, args);
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

    $scope.open = eventListener(function(_, newTab) {
        var sel = selection();
        if (sel) {
            if (newTab === true) {
                window.open(selection().url, '_blank');
            } else {
                document.location = selection().url;
            }
        }
    });
    $scope.openNewTab = function(e) { $scope.open(e, true); };

    $scope.setCursor = function(c) {
        $scope.cursor = c;
        q.focus();
    };

    $http.get('/json').success(function(ppl) {
        for (var k in ppl) {
            $scope.people.push(ppl[k]);
        }
    });

    // DOM init
    q.focus();
    window.setTimeout(function() {
        // disable autocomplete again if it was enabled
        // by a browser extension in the meantime
        q.setAttribute('autocomplete', 'off');
    }, 500);

    // preload the sprites
    new Image().src = '/static/imgs/icons.png';
}]);
