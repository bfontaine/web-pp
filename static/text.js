(function(){
    var a = document.getElementsByClassName('ascii')[0];

    if ( !a ) { return; }

    a.innerHTML = a.innerHTML.replace(/'/g, '’');

})();
